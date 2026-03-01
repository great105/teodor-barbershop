const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// GET /api/timeslots?date=2026-03-05&team_member_id=2
router.get('/timeslots', (req, res) => {
  const { date, team_member_id } = req.query;
  if (!date) return res.status(400).json({ error: 'Параметр date обязателен' });

  const allSlots = db.prepare('SELECT * FROM time_slots WHERE active = 1 ORDER BY sort_order').all();

  // Найти занятые слоты
  let bookedQuery = `SELECT booking_time FROM bookings WHERE booking_date = ? AND status != 'cancelled'`;
  const params = [date];

  if (team_member_id) {
    bookedQuery += ' AND team_member_id = ?';
    params.push(team_member_id);
  }

  const booked = db.prepare(bookedQuery).all(...params).map(r => r.booking_time);

  const result = allSlots.map(slot => ({
    ...slot,
    available: !booked.includes(slot.time),
  }));

  res.json(result);
});

// POST /api/bookings — создать запись
router.post('/bookings', (req, res) => {
  const { client_name, client_phone, client_comment, team_member_id, booking_date, booking_time, service_ids } = req.body;

  if (!client_name || !client_phone || !booking_date || !booking_time || !service_ids || !service_ids.length) {
    return res.status(400).json({ error: 'Заполните все обязательные поля' });
  }

  const result = db.transaction(() => {
    // Проверяем доступность слота
    const conflict = db.prepare(
      "SELECT id FROM bookings WHERE booking_date = ? AND booking_time = ? AND team_member_id = ? AND status != 'cancelled'"
    ).get(booking_date, booking_time, team_member_id || null);

    if (conflict && team_member_id) {
      return { error: 'Это время уже занято' };
    }

    // Получаем мастера для расчёта цен
    let roleKey = 'top';
    if (team_member_id) {
      const member = db.prepare('SELECT role_key FROM team_members WHERE id = ?').get(team_member_id);
      if (member) roleKey = member.role_key;
    }

    // Рассчитываем итоговую цену
    let totalPrice = 0;
    const servicePrices = [];
    for (const sid of service_ids) {
      const svc = db.prepare('SELECT * FROM services WHERE id = ?').get(sid);
      if (!svc) continue;

      let price = 0;
      if (svc.price_type === 'flat') {
        price = svc.price_top || 0;
      } else if (svc.price_type === 'split') {
        price = roleKey === 'brand' ? (svc.price_brand || svc.price_top || 0) : (svc.price_top || 0);
      } else if (svc.price_type === 'range') {
        price = svc.price_min || 0;
      }
      totalPrice += price;
      servicePrices.push({ service_id: sid, price });
    }

    // Создаём запись
    const ins = db.prepare(
      'INSERT INTO bookings (client_name, client_phone, client_comment, team_member_id, booking_date, booking_time, total_price) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    const info = ins.run(client_name, client_phone, client_comment || '', team_member_id || null, booking_date, booking_time, totalPrice);
    const bookingId = info.lastInsertRowid;

    // Связываем с услугами
    const insSvc = db.prepare('INSERT INTO booking_services (booking_id, service_id, price) VALUES (?, ?, ?)');
    for (const sp of servicePrices) {
      insSvc.run(bookingId, sp.service_id, sp.price);
    }

    return { ok: true, booking_id: bookingId, total_price: totalPrice };
  })();

  if (result.error) return res.status(409).json(result);
  res.json(result);
});

module.exports = router;
