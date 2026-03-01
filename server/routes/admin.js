const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const config = require('../config');
const { requireAdmin } = require('../middleware/auth');

router.use(requireAdmin);

// ===================== ЗАПИСИ =====================

// GET /api/admin/bookings?status=new
router.get('/bookings', (req, res) => {
  const { status } = req.query;
  let query = `
    SELECT b.*, tm.name as master_name, tm.role_label as master_role
    FROM bookings b
    LEFT JOIN team_members tm ON b.team_member_id = tm.id
  `;
  const params = [];
  if (status) {
    query += ' WHERE b.status = ?';
    params.push(status);
  }
  query += ' ORDER BY b.created_at DESC';

  const bookings = db.prepare(query).all(...params);

  // Добавляем услуги к каждой записи
  const getServices = db.prepare(`
    SELECT bs.price, s.name FROM booking_services bs
    JOIN services s ON bs.service_id = s.id
    WHERE bs.booking_id = ?
  `);
  bookings.forEach(b => {
    b.services = getServices.all(b.id);
  });

  res.json(bookings);
});

// PATCH /api/admin/bookings/:id — обновить статус
router.patch('/bookings/:id', (req, res) => {
  const { status } = req.body;
  if (!['new', 'confirmed', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Некорректный статус' });
  }
  db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ ok: true });
});

// DELETE /api/admin/bookings/:id
router.delete('/bookings/:id', (req, res) => {
  db.prepare('DELETE FROM bookings WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ===================== УСЛУГИ =====================

// GET /api/admin/services
router.get('/services', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order').all();
  const services = db.prepare('SELECT * FROM services ORDER BY sort_order').all();
  res.json({ categories, services });
});

// POST /api/admin/services — создать услугу
router.post('/services', (req, res) => {
  const { category_id, name, description, price_type, price_top, price_brand, price_min, price_max, promo_text } = req.body;
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM services WHERE category_id = ?').get(category_id);
  const info = db.prepare(
    'INSERT INTO services (category_id, name, description, price_type, price_top, price_brand, price_min, price_max, promo_text, sort_order) VALUES (?,?,?,?,?,?,?,?,?,?)'
  ).run(category_id, name, description || '', price_type || 'flat', price_top || null, price_brand || null, price_min || null, price_max || null, promo_text || null, (maxOrder?.m || 0) + 1);
  res.json({ ok: true, id: info.lastInsertRowid });
});

// PUT /api/admin/services/:id — обновить услугу
router.put('/services/:id', (req, res) => {
  const { category_id, name, description, price_type, price_top, price_brand, price_min, price_max, promo_text, active } = req.body;
  db.prepare(
    'UPDATE services SET category_id=?, name=?, description=?, price_type=?, price_top=?, price_brand=?, price_min=?, price_max=?, promo_text=?, active=? WHERE id=?'
  ).run(category_id, name, description || '', price_type, price_top || null, price_brand || null, price_min || null, price_max || null, promo_text || null, active ?? 1, req.params.id);
  res.json({ ok: true });
});

// DELETE /api/admin/services/:id
router.delete('/services/:id', (req, res) => {
  db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// POST /api/admin/categories
router.post('/categories', (req, res) => {
  const { name, icon } = req.body;
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM categories').get();
  const info = db.prepare('INSERT INTO categories (name, icon, sort_order) VALUES (?, ?, ?)').run(name, icon || 'category', (maxOrder?.m || 0) + 1);
  res.json({ ok: true, id: info.lastInsertRowid });
});

// PUT /api/admin/categories/:id
router.put('/categories/:id', (req, res) => {
  const { name, icon } = req.body;
  db.prepare('UPDATE categories SET name=?, icon=? WHERE id=?').run(name, icon, req.params.id);
  res.json({ ok: true });
});

// DELETE /api/admin/categories/:id
router.delete('/categories/:id', (req, res) => {
  db.prepare('DELETE FROM services WHERE category_id = ?').run(req.params.id);
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ===================== МАСТЕРА =====================

// GET /api/admin/team
router.get('/team', (req, res) => {
  res.json(db.prepare('SELECT * FROM team_members ORDER BY sort_order').all());
});

// POST /api/admin/team
router.post('/team', (req, res) => {
  const { name, role_key, role_label, photo_url } = req.body;
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM team_members').get();
  const info = db.prepare(
    'INSERT INTO team_members (name, role_key, role_label, photo_url, sort_order) VALUES (?,?,?,?,?)'
  ).run(name, role_key || 'top', role_label || 'Топ-Барбер', photo_url || '', (maxOrder?.m || 0) + 1);
  res.json({ ok: true, id: info.lastInsertRowid });
});

// PUT /api/admin/team/:id
router.put('/team/:id', (req, res) => {
  const { name, role_key, role_label, photo_url, active } = req.body;
  db.prepare(
    'UPDATE team_members SET name=?, role_key=?, role_label=?, photo_url=?, active=? WHERE id=?'
  ).run(name, role_key, role_label, photo_url, active ?? 1, req.params.id);
  res.json({ ok: true });
});

// DELETE /api/admin/team/:id
router.delete('/team/:id', (req, res) => {
  db.prepare('DELETE FROM team_members WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ===================== ГАЛЕРЕЯ =====================

// GET /api/admin/gallery
router.get('/gallery', (req, res) => {
  res.json(db.prepare('SELECT * FROM gallery_images ORDER BY sort_order').all());
});

// POST /api/admin/gallery
router.post('/gallery', (req, res) => {
  const { url, alt, title, category } = req.body;
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM gallery_images').get();
  const info = db.prepare(
    'INSERT INTO gallery_images (url, alt, title, category, sort_order) VALUES (?,?,?,?,?)'
  ).run(url, alt || '', title || '', category || 'Интерьер', (maxOrder?.m || 0) + 1);
  res.json({ ok: true, id: info.lastInsertRowid });
});

// PUT /api/admin/gallery/:id
router.put('/gallery/:id', (req, res) => {
  const { url, alt, title, category } = req.body;
  db.prepare('UPDATE gallery_images SET url=?, alt=?, title=?, category=? WHERE id=?').run(url, alt, title, category, req.params.id);
  res.json({ ok: true });
});

// DELETE /api/admin/gallery/:id
router.delete('/gallery/:id', (req, res) => {
  db.prepare('DELETE FROM gallery_images WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ===================== НАСТРОЙКИ =====================

// GET /api/admin/settings
router.get('/settings', (req, res) => {
  const rows = db.prepare('SELECT * FROM settings').all();
  const settings = {};
  rows.forEach(r => { settings[r.key] = r.value; });
  res.json(settings);
});

// PUT /api/admin/settings
router.put('/settings', (req, res) => {
  const upsert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  const tx = db.transaction((data) => {
    for (const [key, value] of Object.entries(data)) {
      upsert.run(key, value);
    }
  });
  tx(req.body);
  res.json({ ok: true });
});

// PUT /api/admin/password
router.put('/password', (req, res) => {
  const { current, newPassword } = req.body;
  if (current !== config.adminPassword) {
    return res.status(400).json({ error: 'Текущий пароль неверный' });
  }
  // В реальном приложении сохраняли бы в файл/env
  config.adminPassword = newPassword;
  res.json({ ok: true });
});

// ===================== ТАЙМ-СЛОТЫ =====================

// GET /api/admin/timeslots
router.get('/timeslots', (req, res) => {
  res.json(db.prepare('SELECT * FROM time_slots ORDER BY sort_order').all());
});

// POST /api/admin/timeslots
router.post('/timeslots', (req, res) => {
  const { time } = req.body;
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM time_slots').get();
  const info = db.prepare('INSERT INTO time_slots (time, sort_order) VALUES (?, ?)').run(time, (maxOrder?.m || 0) + 1);
  res.json({ ok: true, id: info.lastInsertRowid });
});

// DELETE /api/admin/timeslots/:id
router.delete('/timeslots/:id', (req, res) => {
  db.prepare('DELETE FROM time_slots WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ===================== СООБЩЕНИЯ =====================

// GET /api/admin/messages
router.get('/messages', (req, res) => {
  res.json(db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC').all());
});

// PATCH /api/admin/messages/:id
router.patch('/messages/:id', (req, res) => {
  db.prepare('UPDATE contact_messages SET is_read = 1 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// DELETE /api/admin/messages/:id
router.delete('/messages/:id', (req, res) => {
  db.prepare('DELETE FROM contact_messages WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
