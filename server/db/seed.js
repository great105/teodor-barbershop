const db = require('./connection');

console.log('Seeding database...');

const tx = db.transaction(() => {
  // Очистка
  db.exec(`
    DELETE FROM booking_services;
    DELETE FROM bookings;
    DELETE FROM services;
    DELETE FROM categories;
    DELETE FROM team_members;
    DELETE FROM gallery_images;
    DELETE FROM settings;
    DELETE FROM time_slots;
    DELETE FROM contact_messages;
    DELETE FROM admin_sessions;
  `);

  // === Категории ===
  const insertCat = db.prepare('INSERT INTO categories (name, icon, sort_order) VALUES (?, ?, ?)');
  insertCat.run('Комплексные', 'workspace_premium', 1);
  insertCat.run('Стрижки', 'content_cut', 2);
  insertCat.run('Борода и усы', 'face_3', 3);
  insertCat.run('Уход и доп. услуги', 'spa', 4);
  insertCat.run('Акции', 'local_offer', 5);

  // === Услуги ===
  const insertSvc = db.prepare(`
    INSERT INTO services (category_id, name, description, price_type, price_top, price_brand, price_min, price_max, promo_text, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Комплексные (cat 1)
  insertSvc.run(1, 'Стрижка + борода и усы', 'Комплексный уход за волосами и бородой.', 'flat', 3600, null, null, null, null, 1);
  insertSvc.run(1, 'Папа + сын (5-15 лет)', 'Стрижка для взрослого и ребёнка.', 'flat', 3900, null, null, null, null, 2);

  // Стрижки (cat 2)
  insertSvc.run(2, 'Стрижка ножницами', 'Классическая стрижка ножницами с укладкой.', 'split', 2500, 2900, null, null, null, 1);
  insertSvc.run(2, 'Мужская стрижка', 'Индивидуальный подбор формы, мытье головы, укладка.', 'split', 2100, 2500, null, null, null, 2);
  insertSvc.run(2, 'Fade', 'Плавный переход с использованием машинки.', 'split', 1500, 1900, null, null, null, 3);
  insertSvc.run(2, 'Женский Fade', 'Fade-стрижка для женщин.', 'split', 2200, 2500, null, null, null, 4);
  insertSvc.run(2, 'Две насадки', 'Стрижка с использованием двух насадок машинки.', 'split', 1000, 1300, null, null, null, 5);
  insertSvc.run(2, 'Экспресс (10-15 мин)', 'Быстрая стрижка для тех, кто ценит время.', 'split', 900, 1100, null, null, null, 6);
  insertSvc.run(2, 'Кудрявые волосы', 'Специальная техника для кудрявых и вьющихся волос.', 'split', 3900, 4200, null, null, null, 7);

  // Борода и усы (cat 3)
  insertSvc.run(3, 'Стрижка без окантовки', 'Придание формы бороде без окантовки.', 'split', 1100, 1400, null, null, null, 1);
  insertSvc.run(3, 'Моделирование GH (простое)', 'Моделирование бороды без окантовки.', 'split', 1600, 1900, null, null, null, 2);
  insertSvc.run(3, 'Моделирование GH (окантованное)', 'Моделирование бороды с полной окантовкой.', 'split', 1900, 2200, null, null, null, 3);

  // Уход (cat 4)
  insertSvc.run(4, 'Уход за лицом London Grooming', 'Профессиональный уход за кожей лица.', 'flat', 2600, null, null, null, null, 1);
  insertSvc.run(4, 'Detox кожи головы', 'Глубокое очищение кожи головы.', 'flat', 900, null, null, null, null, 2);
  insertSvc.run(4, 'Коррекция (брови/уши/нос)', 'Аккуратная коррекция нежелательных волос.', 'flat', 400, null, null, null, null, 3);
  insertSvc.run(4, 'Камуфляж', 'Тонирование для скрытия седины.', 'range', null, null, 1800, 2500, null, 4);
  insertSvc.run(4, 'Патчи для глаз', 'Увлажняющие патчи для зоны вокруг глаз.', 'flat', 500, null, null, null, null, 5);
  insertSvc.run(4, 'Массаж головы и плеч', 'Расслабляющий массаж для снятия напряжения.', 'flat', 700, null, null, null, null, 6);

  // Акции (cat 5)
  insertSvc.run(5, 'Студентам и школьникам (до 18 лет)', 'При предъявлении студенческого билета или справки из школы.', 'promo', null, null, null, null, 'Скидка 15%', 1);
  insertSvc.run(5, 'День рождения', 'Действует 3 дня до и 3 дня после дня рождения.', 'promo', null, null, null, null, 'Скидка 20%', 2);

  // === Мастера ===
  const insertTeam = db.prepare('INSERT INTO team_members (name, role_key, role_label, photo_url, sort_order) VALUES (?, ?, ?, ?, ?)');
  insertTeam.run('Карина', 'top', 'Топ-Барбер', 'https://theodore-barbershop.com/5bb675dca7293c95aa61.png', 1);
  insertTeam.run('Александр', 'brand', 'Бренд-Барбер', 'https://theodore-barbershop.com/43731cd736e2252c974f.png', 2);
  insertTeam.run('Денис', 'top', 'Топ-Барбер', 'https://theodore-barbershop.com/6131d5b469de362b4a26.png', 3);

  // === Галерея ===
  const insertImg = db.prepare('INSERT INTO gallery_images (url, alt, title, category, sort_order) VALUES (?, ?, ?, ?, ?)');
  insertImg.run('https://theodore-barbershop.com/95eb313923869e3db38a.png', 'Интерьер барбершопа', 'Основной зал', 'Интерьер', 1);
  insertImg.run('https://theodore-barbershop.com/4998d73941955c6cefe5.png', 'Мерч: футболка Теодор', 'Футболка Теодор', 'Мерч', 2);
  insertImg.run('https://theodore-barbershop.com/3c06c45d8600112683e5.png', 'Косметика для ухода', 'Средства для ухода', 'Косметика', 3);
  insertImg.run('https://theodore-barbershop.com/aea07591843b11797a45.png', 'Интерьер зала', 'Рабочая зона', 'Интерьер', 4);
  insertImg.run('https://theodore-barbershop.com/dd4bfc563a0e07c85969.png', 'Бритва', 'Бритва', 'Детали', 5);
  insertImg.run('https://theodore-barbershop.com/ab03d9ae92db6cab75a5.png', 'Мерч: футболка', 'Фирменная футболка', 'Мерч', 6);
  insertImg.run('https://theodore-barbershop.com/39c5c35cce94a8326a1e.png', 'Визитки барбершопа', 'Визитные карточки', 'Мерч', 7);
  insertImg.run('https://theodore-barbershop.com/becbf4332510f9e6c305.png', 'Рабочее место барбера', 'Рабочее место', 'Интерьер', 8);
  insertImg.run('https://theodore-barbershop.com/3f9c55ce5adcf6b36b3f.png', 'Профессиональная косметика', 'Профессиональная косметика', 'Косметика', 9);
  insertImg.run('https://theodore-barbershop.com/f4694bbab467ace8683a.png', 'Фирменная сумка', 'Фирменная сумка', 'Мерч', 10);

  // === Тайм-слоты ===
  const insertSlot = db.prepare('INSERT INTO time_slots (time, sort_order) VALUES (?, ?)');
  const times = ['10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'];
  times.forEach((t, i) => insertSlot.run(t, i + 1));

  // === Настройки ===
  const insertSet = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
  insertSet.run('phone', '8 (968) 997-66-77');
  insertSet.run('email', 'Theodore-Barbershop@yandex.ru');
  insertSet.run('address', 'Ул. Бакунинская 72С.2, Москва');
  insertSet.run('hours', 'Ежедневно 10:00 — 22:00');
  insertSet.run('vk_url', 'https://vk.com/theodore_barbershop');
});

tx();
console.log('Database seeded successfully!');
process.exit(0);
