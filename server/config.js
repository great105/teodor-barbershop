const path = require('path');

module.exports = {
  port: process.env.PORT || 3000,
  adminPassword: process.env.ADMIN_PASSWORD || 'teodor2024',
  dbPath: path.join(__dirname, 'db', 'teodor.db'),
  sessionMaxAge: 24 * 60 * 60 * 1000, // 24 часа
  publicDir: path.join(__dirname, '..'),
};
