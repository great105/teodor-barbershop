-- Категории услуг
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'content_cut',
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Услуги
CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price_type TEXT NOT NULL DEFAULT 'split', -- flat | split | range | promo
  price_top INTEGER, -- цена Топ-Барбер (в рублях)
  price_brand INTEGER, -- цена Бренд-Барбер
  price_min INTEGER, -- для range
  price_max INTEGER, -- для range
  promo_text TEXT, -- для promo (например "Скидка 15%")
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Мастера
CREATE TABLE IF NOT EXISTS team_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role_key TEXT NOT NULL DEFAULT 'top', -- top | brand
  role_label TEXT NOT NULL DEFAULT 'Топ-Барбер',
  photo_url TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Галерея
CREATE TABLE IF NOT EXISTS gallery_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  alt TEXT,
  title TEXT,
  category TEXT NOT NULL DEFAULT 'Интерьер',
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Записи клиентов
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_comment TEXT,
  team_member_id INTEGER,
  booking_date TEXT NOT NULL,
  booking_time TEXT NOT NULL,
  total_price INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new', -- new | confirmed | completed | cancelled
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (team_member_id) REFERENCES team_members(id)
);

-- Связь записей с услугами (многие-ко-многим)
CREATE TABLE IF NOT EXISTS booking_services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL,
  service_id INTEGER NOT NULL,
  price INTEGER NOT NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id)
);

-- Сессии админа
CREATE TABLE IF NOT EXISTS admin_sessions (
  token TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

-- Настройки сайта
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Тайм-слоты
CREATE TABLE IF NOT EXISTS time_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  time TEXT NOT NULL UNIQUE,
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Сообщения обратной связи
CREATE TABLE IF NOT EXISTS contact_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  is_read INTEGER NOT NULL DEFAULT 0
);
