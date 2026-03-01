const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const db = require('../db/connection');
const config = require('../config');
const { requireAdmin } = require('../middleware/auth');

// POST /api/admin/login
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (password !== config.adminPassword) {
    return res.status(401).json({ error: 'Неверный пароль' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + config.sessionMaxAge).toISOString();

  db.prepare('INSERT INTO admin_sessions (token, expires_at) VALUES (?, ?)').run(token, expiresAt);

  // Чистим просроченные сессии
  db.prepare("DELETE FROM admin_sessions WHERE expires_at < datetime('now')").run();

  res.cookie('admin_token', token, {
    httpOnly: true,
    maxAge: config.sessionMaxAge,
    sameSite: 'lax',
  });
  res.json({ ok: true });
});

// POST /api/admin/logout
router.post('/logout', (req, res) => {
  const token = req.cookies.admin_token;
  if (token) {
    db.prepare('DELETE FROM admin_sessions WHERE token = ?').run(token);
  }
  res.clearCookie('admin_token');
  res.json({ ok: true });
});

// GET /api/admin/check
router.get('/check', requireAdmin, (req, res) => {
  res.json({ ok: true });
});

module.exports = router;
