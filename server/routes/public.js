const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// GET /api/services — услуги с категориями
router.get('/services', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order').all();
  const services = db.prepare('SELECT * FROM services WHERE active = 1 ORDER BY sort_order').all();

  const result = categories.map(cat => ({
    ...cat,
    services: services.filter(s => s.category_id === cat.id),
  }));
  res.json(result);
});

// GET /api/team — мастера
router.get('/team', (req, res) => {
  const members = db.prepare('SELECT * FROM team_members WHERE active = 1 ORDER BY sort_order').all();
  res.json(members);
});

// GET /api/gallery — галерея
router.get('/gallery', (req, res) => {
  const images = db.prepare('SELECT * FROM gallery_images ORDER BY sort_order').all();
  res.json(images);
});

// GET /api/settings — настройки
router.get('/settings', (req, res) => {
  const rows = db.prepare('SELECT * FROM settings').all();
  const settings = {};
  rows.forEach(r => { settings[r.key] = r.value; });
  res.json(settings);
});

// POST /api/contact — обратная связь
router.post('/contact', (req, res) => {
  const { name, phone, message } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Имя и телефон обязательны' });
  }
  db.prepare('INSERT INTO contact_messages (name, phone, message) VALUES (?, ?, ?)').run(name, phone, message || '');
  res.json({ ok: true });
});

module.exports = router;
