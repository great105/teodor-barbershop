const express = require('express');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const path = require('path');
const config = require('./config');

// Инициализация БД (создаёт таблицы при первом запуске)
require('./db/connection');

const app = express();

// Gzip-сжатие всех ответов
app.use(compression());

app.use(express.json());
app.use(cookieParser());

// API-роуты
app.use('/api', require('./routes/public'));
app.use('/api', require('./routes/booking'));
app.use('/api/admin', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));

// Статика с кешированием
app.use(express.static(config.publicDir, {
  maxAge: '7d',
  etag: true,
  lastModified: true,
  setHeaders(res, filePath) {
    // HTML — не кешировать (чтобы обновления видели сразу)
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
    // Картинки и шрифты — долгий кеш
    if (/\.(png|jpg|jpeg|webp|svg|woff2?|ttf|eot)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
    }
  },
}));

// SPA fallback для admin
app.get('/admin', (req, res) => {
  res.sendFile(path.join(config.publicDir, 'admin.html'));
});

app.listen(config.port, () => {
  console.log(`Барбершоп Теодор запущен: http://localhost:${config.port}`);
});
