document.addEventListener('DOMContentLoaded', () => {
  const loginScreen = document.getElementById('login-screen');
  const adminPanel = document.getElementById('admin-panel');
  const content = document.getElementById('admin-content');
  const sidebar = document.getElementById('admin-nav');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  let currentTab = 'bookings';

  // ==================== MOBILE SIDEBAR ====================
  function openSidebar() {
    sidebar.classList.remove('-translate-x-full');
    sidebar.classList.add('translate-x-0');
    sidebarOverlay.classList.remove('hidden');
  }
  function closeSidebar() {
    sidebar.classList.add('-translate-x-full');
    sidebar.classList.remove('translate-x-0');
    sidebarOverlay.classList.add('hidden');
  }
  document.getElementById('sidebar-toggle').addEventListener('click', openSidebar);
  sidebarOverlay.addEventListener('click', closeSidebar);

  // ==================== AUTH ====================
  checkAuth();

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const pw = document.getElementById('login-password').value;
    const errEl = document.getElementById('login-error');
    try {
      const res = await TheodorAPI.post('/api/admin/login', { password: pw });
      if (res.ok) {
        showPanel();
      } else {
        errEl.textContent = res.error || 'Ошибка';
        errEl.classList.remove('hidden');
      }
    } catch (e) {
      errEl.textContent = 'Ошибка соединения';
      errEl.classList.remove('hidden');
    }
  });

  document.getElementById('logout-btn').addEventListener('click', async () => {
    await TheodorAPI.post('/api/admin/logout', {});
    loginScreen.classList.remove('hidden');
    adminPanel.classList.add('hidden');
  });

  async function checkAuth() {
    try {
      const res = await TheodorAPI.get('/api/admin/check');
      if (res.ok) showPanel();
    } catch (e) { /* not logged in */ }
  }

  function showPanel() {
    loginScreen.classList.add('hidden');
    adminPanel.classList.remove('hidden');
    switchTab('bookings');
  }

  // ==================== TABS ====================
  document.getElementById('admin-nav').addEventListener('click', (e) => {
    const btn = e.target.closest('.admin-tab');
    if (!btn) return;
    switchTab(btn.dataset.tab);
    closeSidebar();
  });

  function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.admin-tab').forEach(b => {
      b.classList.remove('bg-primary/10', 'text-primary');
      b.classList.add('text-slate-400', 'hover:text-white', 'hover:bg-white/5');
    });
    const active = document.querySelector(`.admin-tab[data-tab="${tab}"]`);
    if (active) {
      active.classList.add('bg-primary/10', 'text-primary');
      active.classList.remove('text-slate-400', 'hover:text-white', 'hover:bg-white/5');
    }

    if (tab === 'bookings') loadBookings();
    else if (tab === 'services') loadServices();
    else if (tab === 'team') loadTeam();
    else if (tab === 'gallery') loadGallery();
    else if (tab === 'messages') loadMessages();
    else if (tab === 'settings') loadSettings();
  }

  // ==================== BOOKINGS ====================
  async function loadBookings() {
    content.innerHTML = '<p class="text-slate-400">Загрузка...</p>';
    try {
      const bookings = await TheodorAPI.get('/api/admin/bookings');
      const statusLabels = { new: 'Новая', confirmed: 'Подтверждена', completed: 'Завершена', cancelled: 'Отменена' };
      const statusColors = { new: 'bg-blue-500/10 text-blue-400', confirmed: 'bg-green-500/10 text-green-400', completed: 'bg-slate-500/10 text-slate-400', cancelled: 'bg-red-500/10 text-red-400' };

      content.innerHTML = `
        <div class="flex items-center justify-between mb-4 sm:mb-6">
          <h2 class="text-xl sm:text-2xl font-bold">Записи</h2>
          <span class="text-xs sm:text-sm text-slate-400">${bookings.length} записей</span>
        </div>
        ${bookings.length === 0 ? '<p class="text-slate-500 text-center py-12">Записей пока нет</p>' : `
          <div class="space-y-3 sm:space-y-4">
            ${bookings.map(b => `
              <div class="bg-surface-dark rounded-xl p-4 sm:p-5 border border-white/5">
                <div class="flex flex-wrap items-start justify-between gap-2 sm:gap-4 mb-3">
                  <div class="min-w-0">
                    <p class="font-bold text-base sm:text-lg truncate">${b.client_name}</p>
                    <p class="text-sm text-slate-400">${b.client_phone}</p>
                  </div>
                  <span class="px-3 py-1 rounded-full text-xs font-bold shrink-0 ${statusColors[b.status] || ''}">${statusLabels[b.status] || b.status}</span>
                </div>
                <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-300 mb-3">
                  <span class="flex items-center gap-1"><span class="material-symbols-outlined text-sm text-primary">event</span>${b.booking_date}</span>
                  <span class="flex items-center gap-1"><span class="material-symbols-outlined text-sm text-primary">schedule</span>${b.booking_time}</span>
                  <span class="flex items-center gap-1"><span class="material-symbols-outlined text-sm text-primary">person</span>${b.master_name || 'Любой мастер'}</span>
                  <span class="font-bold text-primary">${(b.total_price || 0).toLocaleString('ru-RU')} \u20BD</span>
                </div>
                ${b.services?.length ? `<p class="text-xs text-slate-500 mb-3">Услуги: ${b.services.map(s => s.name).join(', ')}</p>` : ''}
                ${b.client_comment ? `<p class="text-xs text-slate-500 mb-3">Комментарий: ${b.client_comment}</p>` : ''}
                <div class="flex flex-wrap gap-2 pt-3 border-t border-white/5">
                  ${b.status === 'new' ? `<button onclick="adminAction('confirmBooking', ${b.id})" class="text-xs px-3 py-2 rounded bg-green-500/10 text-green-400 active:bg-green-500/30">Подтвердить</button>` : ''}
                  ${b.status === 'confirmed' ? `<button onclick="adminAction('completeBooking', ${b.id})" class="text-xs px-3 py-2 rounded bg-blue-500/10 text-blue-400 active:bg-blue-500/30">Завершить</button>` : ''}
                  ${b.status !== 'cancelled' ? `<button onclick="adminAction('cancelBooking', ${b.id})" class="text-xs px-3 py-2 rounded bg-red-500/10 text-red-400 active:bg-red-500/30">Отменить</button>` : ''}
                  <button onclick="adminAction('deleteBooking', ${b.id})" class="text-xs px-3 py-2 rounded bg-white/5 text-slate-400 active:bg-white/10 ml-auto">Удалить</button>
                </div>
              </div>
            `).join('')}
          </div>`}`;
    } catch (e) {
      content.innerHTML = '<p class="text-red-400">Ошибка загрузки</p>';
    }
  }

  // ==================== SERVICES ====================
  async function loadServices() {
    content.innerHTML = '<p class="text-slate-400">Загрузка...</p>';
    try {
      const { categories, services } = await TheodorAPI.get('/api/admin/services');
      content.innerHTML = `
        <div class="flex items-center justify-between mb-4 sm:mb-6 gap-3">
          <h2 class="text-xl sm:text-2xl font-bold">Услуги</h2>
          <button onclick="adminAction('addService')" class="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-primary text-white rounded-lg text-xs sm:text-sm font-bold active:bg-primary/80 transition-colors shrink-0">
            <span class="material-symbols-outlined text-lg">add</span> <span class="hidden sm:inline">Добавить</span><span class="sm:hidden">Новая</span>
          </button>
        </div>
        ${categories.map(cat => `
          <div class="mb-6 sm:mb-8">
            <h3 class="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">${cat.icon}</span> ${cat.name}
            </h3>
            <div class="space-y-2">
              ${services.filter(s => s.category_id === cat.id).map(svc => `
                <div class="p-3 sm:p-4 bg-surface-dark rounded-xl border border-white/5">
                  <div class="flex items-center justify-between gap-3">
                    <div class="flex-1 min-w-0">
                      <p class="font-bold text-sm ${svc.active ? '' : 'text-slate-500 line-through'} truncate">${svc.name}</p>
                      <p class="text-xs text-slate-500 truncate hidden sm:block">${svc.description || ''}</p>
                    </div>
                    <div class="text-xs sm:text-sm font-bold text-right whitespace-nowrap text-primary">
                      ${formatAdminPrice(svc)}
                    </div>
                    <div class="flex gap-0.5 shrink-0">
                      <button onclick='adminAction("editService", ${JSON.stringify(svc).replace(/'/g, "&#39;")})' class="p-2 active:bg-white/10 rounded-lg transition-colors"><span class="material-symbols-outlined text-lg">edit</span></button>
                      <button onclick="adminAction('deleteService', ${svc.id})" class="p-2 active:bg-red-500/10 rounded-lg transition-colors text-red-400"><span class="material-symbols-outlined text-lg">delete</span></button>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}`;
    } catch (e) {
      content.innerHTML = '<p class="text-red-400">Ошибка загрузки</p>';
    }
  }

  function formatAdminPrice(svc) {
    if (svc.price_type === 'split') return `${svc.price_top} / ${svc.price_brand} \u20BD`;
    if (svc.price_type === 'flat') return `${svc.price_top} \u20BD`;
    if (svc.price_type === 'range') return `${svc.price_min}–${svc.price_max} \u20BD`;
    if (svc.price_type === 'promo') return svc.promo_text || '';
    return '';
  }

  // ==================== TEAM ====================
  async function loadTeam() {
    content.innerHTML = '<p class="text-slate-400">Загрузка...</p>';
    try {
      const members = await TheodorAPI.get('/api/admin/team');
      content.innerHTML = `
        <div class="flex items-center justify-between mb-4 sm:mb-6 gap-3">
          <h2 class="text-xl sm:text-2xl font-bold">Мастера</h2>
          <button onclick="adminAction('addTeamMember')" class="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-primary text-white rounded-lg text-xs sm:text-sm font-bold active:bg-primary/80 transition-colors shrink-0">
            <span class="material-symbols-outlined text-lg">add</span> <span class="hidden sm:inline">Добавить мастера</span><span class="sm:hidden">Новый</span>
          </button>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          ${members.map(m => `
            <div class="bg-surface-dark rounded-xl p-3 sm:p-4 border border-white/5 ${m.active ? '' : 'opacity-50'}">
              <div class="aspect-[3/4] rounded-lg overflow-hidden mb-3 sm:mb-4 bg-white/5">
                ${m.photo_url ? `<img src="${m.photo_url}" class="w-full h-full object-cover" loading="lazy"/>` : '<div class="w-full h-full flex items-center justify-center"><span class="material-symbols-outlined text-4xl text-slate-600">person</span></div>'}
              </div>
              <h3 class="font-bold text-sm sm:text-lg truncate">${m.name}</h3>
              <p class="text-primary text-xs sm:text-sm font-bold uppercase">${m.role_label}</p>
              <div class="flex gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/5">
                <button onclick='adminAction("editTeamMember", ${JSON.stringify(m).replace(/'/g, "&#39;")})' class="flex-1 text-xs py-2 rounded bg-white/5 active:bg-white/10 transition-colors">Изменить</button>
                <button onclick="adminAction('deleteTeamMember', ${m.id})" class="text-xs py-2 px-2 sm:px-3 rounded bg-red-500/10 text-red-400 active:bg-red-500/20 transition-colors">
                  <span class="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
          `).join('')}
        </div>`;
    } catch (e) {
      content.innerHTML = '<p class="text-red-400">Ошибка загрузки</p>';
    }
  }

  // ==================== GALLERY ====================
  async function loadGallery() {
    content.innerHTML = '<p class="text-slate-400">Загрузка...</p>';
    try {
      const images = await TheodorAPI.get('/api/admin/gallery');
      content.innerHTML = `
        <div class="flex items-center justify-between mb-4 sm:mb-6 gap-3">
          <h2 class="text-xl sm:text-2xl font-bold">Галерея</h2>
          <button onclick="adminAction('addGalleryImage')" class="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-primary text-white rounded-lg text-xs sm:text-sm font-bold active:bg-primary/80 transition-colors shrink-0">
            <span class="material-symbols-outlined text-lg">add</span> <span class="hidden sm:inline">Добавить фото</span><span class="sm:hidden">Фото</span>
          </button>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          ${images.map(img => `
            <div class="bg-surface-dark rounded-xl overflow-hidden border border-white/5">
              <div class="relative group">
                <img src="${img.url}" class="w-full aspect-square object-cover" loading="lazy"/>
                <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex flex-col items-center justify-center gap-2">
                  <p class="text-white text-sm font-bold">${img.title || ''}</p>
                  <p class="text-primary text-xs font-bold uppercase">${img.category}</p>
                  <div class="flex gap-2 mt-2">
                    <button onclick='adminAction("editGalleryImage", ${JSON.stringify(img).replace(/'/g, "&#39;")})' class="p-2 bg-white/10 rounded-lg hover:bg-white/20"><span class="material-symbols-outlined text-sm">edit</span></button>
                    <button onclick="adminAction('deleteGalleryImage', ${img.id})" class="p-2 bg-red-500/10 rounded-lg hover:bg-red-500/20 text-red-400"><span class="material-symbols-outlined text-sm">delete</span></button>
                  </div>
                </div>
              </div>
              <div class="p-2 sm:hidden">
                <p class="text-xs font-bold truncate">${img.title || img.category}</p>
                <div class="flex gap-1 mt-1">
                  <button onclick='adminAction("editGalleryImage", ${JSON.stringify(img).replace(/'/g, "&#39;")})' class="flex-1 text-xs py-1.5 rounded bg-white/5 active:bg-white/10 text-center">Изменить</button>
                  <button onclick="adminAction('deleteGalleryImage', ${img.id})" class="p-1.5 rounded bg-red-500/10 text-red-400 active:bg-red-500/20"><span class="material-symbols-outlined text-sm">delete</span></button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>`;
    } catch (e) {
      content.innerHTML = '<p class="text-red-400">Ошибка загрузки</p>';
    }
  }

  // ==================== MESSAGES ====================
  async function loadMessages() {
    content.innerHTML = '<p class="text-slate-400">Загрузка...</p>';
    try {
      const messages = await TheodorAPI.get('/api/admin/messages');
      content.innerHTML = `
        <div class="flex items-center justify-between mb-4 sm:mb-6">
          <h2 class="text-xl sm:text-2xl font-bold">Сообщения</h2>
          <span class="text-xs sm:text-sm text-slate-400">${messages.length} сообщений</span>
        </div>
        ${messages.length === 0 ? '<p class="text-slate-500 text-center py-12">Сообщений нет</p>' : `
          <div class="space-y-3">
            ${messages.map(m => `
              <div class="bg-surface-dark rounded-xl p-4 sm:p-5 border ${m.is_read ? 'border-white/5' : 'border-primary/30'}">
                <div class="flex items-start justify-between gap-2 sm:gap-4 mb-2">
                  <div class="min-w-0">
                    <p class="font-bold truncate ${m.is_read ? 'text-slate-400' : 'text-white'}">${m.name}</p>
                    <p class="text-sm text-slate-500">${m.phone}</p>
                  </div>
                  <span class="text-xs text-slate-500 whitespace-nowrap shrink-0">${new Date(m.created_at).toLocaleDateString('ru-RU')}</span>
                </div>
                ${m.message ? `<p class="text-sm text-slate-300 mb-3">${m.message}</p>` : ''}
                <div class="flex gap-2">
                  ${!m.is_read ? `<button onclick="adminAction('readMessage', ${m.id})" class="text-xs px-3 py-2 rounded bg-primary/10 text-primary active:bg-primary/20">Прочитано</button>` : ''}
                  <button onclick="adminAction('deleteMessage', ${m.id})" class="text-xs px-3 py-2 rounded bg-white/5 text-slate-400 active:bg-white/10 ml-auto">Удалить</button>
                </div>
              </div>
            `).join('')}
          </div>`}`;
    } catch (e) {
      content.innerHTML = '<p class="text-red-400">Ошибка загрузки</p>';
    }
  }

  // ==================== SETTINGS ====================
  async function loadSettings() {
    content.innerHTML = '<p class="text-slate-400">Загрузка...</p>';
    try {
      const [settings, timeslots] = await Promise.all([
        TheodorAPI.get('/api/admin/settings'),
        TheodorAPI.get('/api/admin/timeslots'),
      ]);
      content.innerHTML = `
        <h2 class="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Настройки</h2>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-surface-dark rounded-xl p-6 border border-white/5">
            <h3 class="font-bold text-lg mb-4">Контактная информация</h3>
            <form id="settings-form" class="space-y-4">
              <div class="space-y-1">
                <label class="text-xs font-bold text-slate-400 uppercase">Телефон</label>
                <input name="phone" value="${settings.phone || ''}" class="w-full bg-background-dark border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary"/>
              </div>
              <div class="space-y-1">
                <label class="text-xs font-bold text-slate-400 uppercase">Email</label>
                <input name="email" value="${settings.email || ''}" class="w-full bg-background-dark border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary"/>
              </div>
              <div class="space-y-1">
                <label class="text-xs font-bold text-slate-400 uppercase">Адрес</label>
                <input name="address" value="${settings.address || ''}" class="w-full bg-background-dark border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary"/>
              </div>
              <div class="space-y-1">
                <label class="text-xs font-bold text-slate-400 uppercase">Часы работы</label>
                <input name="hours" value="${settings.hours || ''}" class="w-full bg-background-dark border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary"/>
              </div>
              <button type="submit" class="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary/90 transition-colors">Сохранить</button>
            </form>
          </div>
          <div class="space-y-6">
            <div class="bg-surface-dark rounded-xl p-6 border border-white/5">
              <h3 class="font-bold text-lg mb-4">Тайм-слоты</h3>
              <div class="flex flex-wrap gap-2 mb-4">
                ${timeslots.map(ts => `
                  <div class="flex items-center gap-1 px-3 py-2 bg-white/5 rounded-lg text-sm">
                    <span>${ts.time}</span>
                    <button onclick="adminAction('deleteTimeslot', ${ts.id})" class="text-red-400 hover:text-red-300 ml-1"><span class="material-symbols-outlined text-sm">close</span></button>
                  </div>
                `).join('')}
              </div>
              <div class="flex gap-2">
                <input id="new-timeslot" type="time" class="bg-background-dark border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary"/>
                <button onclick="adminAction('addTimeslot')" class="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90">Добавить</button>
              </div>
            </div>
            <div class="bg-surface-dark rounded-xl p-6 border border-white/5">
              <h3 class="font-bold text-lg mb-4">Сменить пароль</h3>
              <form id="password-form" class="space-y-4">
                <input name="current" type="password" placeholder="Текущий пароль" class="w-full bg-background-dark border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 focus:border-primary focus:ring-1 focus:ring-primary"/>
                <input name="newPassword" type="password" placeholder="Новый пароль" class="w-full bg-background-dark border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 focus:border-primary focus:ring-1 focus:ring-primary"/>
                <button type="submit" class="w-full bg-white/10 text-white py-3 rounded-lg font-bold hover:bg-white/20 transition-colors">Обновить пароль</button>
              </form>
            </div>
          </div>
        </div>`;

      document.getElementById('settings-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const data = Object.fromEntries(new FormData(form));
        await TheodorAPI.put('/api/admin/settings', data);
        showToast('Настройки сохранены');
      });

      document.getElementById('password-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const data = Object.fromEntries(new FormData(form));
        const res = await TheodorAPI.put('/api/admin/password', data);
        if (res.ok) { showToast('Пароль обновлён'); form.reset(); }
        else showToast(res.error || 'Ошибка', true);
      });
    } catch (e) {
      content.innerHTML = '<p class="text-red-400">Ошибка загрузки</p>';
    }
  }

  // ==================== MODAL HELPER ====================
  function showModal(title, fields, onSave) {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4';
    overlay.innerHTML = `
      <div class="bg-surface-dark rounded-2xl p-6 border border-white/10 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 class="text-xl font-bold mb-4">${title}</h3>
        <form id="modal-form" class="space-y-4">
          ${fields.map(f => {
            if (f.type === 'select') {
              return `<div class="space-y-1">
                <label class="text-xs font-bold text-slate-400 uppercase">${f.label}</label>
                <select name="${f.name}" class="w-full bg-background-dark border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary">
                  ${f.options.map(o => `<option value="${o.value}" ${o.value == f.value ? 'selected' : ''}>${o.label}</option>`).join('')}
                </select>
              </div>`;
            }
            return `<div class="space-y-1">
              <label class="text-xs font-bold text-slate-400 uppercase">${f.label}</label>
              <input name="${f.name}" type="${f.type || 'text'}" value="${f.value || ''}" placeholder="${f.placeholder || ''}" class="w-full bg-background-dark border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 focus:border-primary focus:ring-1 focus:ring-primary"/>
            </div>`;
          }).join('')}
          <div class="flex gap-3 pt-2">
            <button type="button" id="modal-cancel" class="flex-1 py-3 rounded-lg border border-white/10 font-bold hover:bg-white/5 transition-colors">Отмена</button>
            <button type="submit" class="flex-1 py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-colors">Сохранить</button>
          </div>
        </form>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    overlay.querySelector('#modal-cancel').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#modal-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target));
      onSave(data);
      overlay.remove();
    });
  }

  function showToast(msg, isError) {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 px-5 py-3 rounded-xl font-bold text-sm shadow-xl text-center sm:text-left ${isError ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // ==================== ACTIONS ====================
  window.adminAction = async function (action, data) {
    try {
      if (action === 'confirmBooking') {
        await TheodorAPI.patch(`/api/admin/bookings/${data}`, { status: 'confirmed' });
        loadBookings();
      } else if (action === 'completeBooking') {
        await TheodorAPI.patch(`/api/admin/bookings/${data}`, { status: 'completed' });
        loadBookings();
      } else if (action === 'cancelBooking') {
        await TheodorAPI.patch(`/api/admin/bookings/${data}`, { status: 'cancelled' });
        loadBookings();
      } else if (action === 'deleteBooking') {
        if (confirm('Удалить запись?')) { await TheodorAPI.del(`/api/admin/bookings/${data}`); loadBookings(); }
      }
      // Services
      else if (action === 'addService') {
        const cats = (await TheodorAPI.get('/api/admin/services')).categories;
        showModal('Новая услуга', [
          { name: 'category_id', label: 'Категория', type: 'select', options: cats.map(c => ({ value: c.id, label: c.name })) },
          { name: 'name', label: 'Название', placeholder: 'Мужская стрижка' },
          { name: 'description', label: 'Описание' },
          { name: 'price_type', label: 'Тип цены', type: 'select', options: [
            { value: 'flat', label: 'Фиксированная' }, { value: 'split', label: 'Топ/Бренд' },
            { value: 'range', label: 'Диапазон' }, { value: 'promo', label: 'Акция' }
          ]},
          { name: 'price_top', label: 'Цена (Топ)', type: 'number' },
          { name: 'price_brand', label: 'Цена (Бренд)', type: 'number' },
          { name: 'price_min', label: 'Мин. цена', type: 'number' },
          { name: 'price_max', label: 'Макс. цена', type: 'number' },
          { name: 'promo_text', label: 'Текст акции' },
        ], async (d) => {
          d.price_top = d.price_top ? Number(d.price_top) : null;
          d.price_brand = d.price_brand ? Number(d.price_brand) : null;
          d.price_min = d.price_min ? Number(d.price_min) : null;
          d.price_max = d.price_max ? Number(d.price_max) : null;
          d.category_id = Number(d.category_id);
          await TheodorAPI.post('/api/admin/services', d);
          loadServices();
        });
      } else if (action === 'editService') {
        const svc = typeof data === 'string' ? JSON.parse(data) : data;
        const cats = (await TheodorAPI.get('/api/admin/services')).categories;
        showModal('Редактировать услугу', [
          { name: 'category_id', label: 'Категория', type: 'select', value: svc.category_id, options: cats.map(c => ({ value: c.id, label: c.name })) },
          { name: 'name', label: 'Название', value: svc.name },
          { name: 'description', label: 'Описание', value: svc.description },
          { name: 'price_type', label: 'Тип цены', type: 'select', value: svc.price_type, options: [
            { value: 'flat', label: 'Фиксированная' }, { value: 'split', label: 'Топ/Бренд' },
            { value: 'range', label: 'Диапазон' }, { value: 'promo', label: 'Акция' }
          ]},
          { name: 'price_top', label: 'Цена (Топ)', type: 'number', value: svc.price_top || '' },
          { name: 'price_brand', label: 'Цена (Бренд)', type: 'number', value: svc.price_brand || '' },
          { name: 'price_min', label: 'Мин. цена', type: 'number', value: svc.price_min || '' },
          { name: 'price_max', label: 'Макс. цена', type: 'number', value: svc.price_max || '' },
          { name: 'promo_text', label: 'Текст акции', value: svc.promo_text || '' },
        ], async (d) => {
          d.price_top = d.price_top ? Number(d.price_top) : null;
          d.price_brand = d.price_brand ? Number(d.price_brand) : null;
          d.price_min = d.price_min ? Number(d.price_min) : null;
          d.price_max = d.price_max ? Number(d.price_max) : null;
          d.category_id = Number(d.category_id);
          d.active = svc.active;
          await TheodorAPI.put(`/api/admin/services/${svc.id}`, d);
          loadServices();
        });
      } else if (action === 'deleteService') {
        if (confirm('Удалить услугу?')) { await TheodorAPI.del(`/api/admin/services/${data}`); loadServices(); }
      }
      // Team
      else if (action === 'addTeamMember') {
        showModal('Новый мастер', [
          { name: 'name', label: 'Имя', placeholder: 'Имя мастера' },
          { name: 'role_key', label: 'Роль (ключ)', type: 'select', options: [{ value: 'top', label: 'top' }, { value: 'brand', label: 'brand' }] },
          { name: 'role_label', label: 'Роль (отображение)', placeholder: 'Топ-барбер' },
          { name: 'photo_url', label: 'URL фото', placeholder: 'https://...' },
        ], async (d) => { await TheodorAPI.post('/api/admin/team', d); loadTeam(); });
      } else if (action === 'editTeamMember') {
        const m = typeof data === 'string' ? JSON.parse(data) : data;
        showModal('Редактировать мастера', [
          { name: 'name', label: 'Имя', value: m.name },
          { name: 'role_key', label: 'Роль (ключ)', type: 'select', value: m.role_key, options: [{ value: 'top', label: 'top' }, { value: 'brand', label: 'brand' }] },
          { name: 'role_label', label: 'Роль (отображение)', value: m.role_label },
          { name: 'photo_url', label: 'URL фото', value: m.photo_url },
        ], async (d) => { d.active = m.active; await TheodorAPI.put(`/api/admin/team/${m.id}`, d); loadTeam(); });
      } else if (action === 'deleteTeamMember') {
        if (confirm('Удалить мастера?')) { await TheodorAPI.del(`/api/admin/team/${data}`); loadTeam(); }
      }
      // Gallery
      else if (action === 'addGalleryImage') {
        showModal('Новое фото', [
          { name: 'url', label: 'URL изображения', placeholder: 'https://...' },
          { name: 'title', label: 'Название' },
          { name: 'alt', label: 'Alt-текст' },
          { name: 'category', label: 'Категория', type: 'select', options: [
            { value: 'Интерьер', label: 'Интерьер' }, { value: 'Мерч', label: 'Мерч' },
            { value: 'Косметика', label: 'Косметика' }, { value: 'Детали', label: 'Детали' }
          ]},
        ], async (d) => { await TheodorAPI.post('/api/admin/gallery', d); loadGallery(); });
      } else if (action === 'editGalleryImage') {
        const img = typeof data === 'string' ? JSON.parse(data) : data;
        showModal('Редактировать фото', [
          { name: 'url', label: 'URL', value: img.url },
          { name: 'title', label: 'Название', value: img.title },
          { name: 'alt', label: 'Alt-текст', value: img.alt },
          { name: 'category', label: 'Категория', type: 'select', value: img.category, options: [
            { value: 'Интерьер', label: 'Интерьер' }, { value: 'Мерч', label: 'Мерч' },
            { value: 'Косметика', label: 'Косметика' }, { value: 'Детали', label: 'Детали' }
          ]},
        ], async (d) => { await TheodorAPI.put(`/api/admin/gallery/${img.id}`, d); loadGallery(); });
      } else if (action === 'deleteGalleryImage') {
        if (confirm('Удалить фото?')) { await TheodorAPI.del(`/api/admin/gallery/${data}`); loadGallery(); }
      }
      // Messages
      else if (action === 'readMessage') {
        await TheodorAPI.patch(`/api/admin/messages/${data}`, {});
        loadMessages();
      } else if (action === 'deleteMessage') {
        if (confirm('Удалить сообщение?')) { await TheodorAPI.del(`/api/admin/messages/${data}`); loadMessages(); }
      }
      // Timeslots
      else if (action === 'addTimeslot') {
        const input = document.getElementById('new-timeslot');
        if (input?.value) {
          await TheodorAPI.post('/api/admin/timeslots', { time: input.value });
          loadSettings();
        }
      } else if (action === 'deleteTimeslot') {
        await TheodorAPI.del(`/api/admin/timeslots/${data}`);
        loadSettings();
      }
    } catch (e) {
      showToast('Ошибка: ' + e.message, true);
    }
  };
});
