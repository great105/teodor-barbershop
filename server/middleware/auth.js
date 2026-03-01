const db = require('../db/connection');

function requireAdmin(req, res, next) {
  const token = req.cookies.admin_token;
  if (!token) return res.status(401).json({ error: 'Не авторизован' });

  const session = db.prepare(
    "SELECT * FROM admin_sessions WHERE token = ? AND expires_at > datetime('now')"
  ).get(token);

  if (!session) {
    res.clearCookie('admin_token');
    return res.status(401).json({ error: 'Сессия истекла' });
  }
  next();
}

module.exports = { requireAdmin };
