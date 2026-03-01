const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const config = require('./config');

// Инициализация БД (создаёт таблицы при первом запуске)
require('./db/connection');

const app = express();

app.use(express.json());
app.use(cookieParser());

// API-роуты
app.use('/api', require('./routes/public'));
app.use('/api', require('./routes/booking'));
app.use('/api/admin', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));

// Статика — все файлы из корня проекта
app.use(express.static(config.publicDir));

// SPA fallback для admin
app.get('/admin', (req, res) => {
  res.sendFile(path.join(config.publicDir, 'admin.html'));
});

app.listen(config.port, () => {
  console.log(`Барбершоп Теодор запущен: http://localhost:${config.port}`);
});
