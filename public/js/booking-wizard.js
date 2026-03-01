document.addEventListener('DOMContentLoaded', async () => {
  const wizard = document.getElementById('booking-wizard');
  const sidebar = document.getElementById('booking-sidebar');
  if (!wizard) return;

  // Состояние
  const state = {
    step: 1,
    services: [],       // выбранные услуги [{id, name, price_type, price_top, price_brand, ...}]
    allCategories: [],   // все категории с услугами
    teamMembers: [],     // все мастера
    selectedMember: null, // выбранный мастер или null (любой)
    selectedDate: null,  // "2026-03-05"
    selectedTime: null,  // "14:30"
    clientName: '',
    clientPhone: '',
    clientComment: '',
  };

  // Загружаем данные
  try {
    const [categories, members] = await Promise.all([
      TheodorAPI.getServices(),
      TheodorAPI.getTeam(),
    ]);
    state.allCategories = categories;
    state.teamMembers = members;
  } catch (e) {
    wizard.innerHTML = '<p class="text-center text-red-400 py-20">Ошибка загрузки данных. Попробуйте обновить страницу.</p>';
    return;
  }

  renderStep();
  updateSidebar();

  function getRoleKey() {
    if (!state.selectedMember) return 'top';
    return state.selectedMember.role_key;
  }

  function getTotalPrice() {
    const role = getRoleKey();
    return state.services.reduce((sum, svc) => sum + TheodorAPI.getPrice(svc, role), 0);
  }

  // ==================== SIDEBAR ====================
  function updateSidebar() {
    if (!sidebar) return;
    const role = getRoleKey();
    const total = getTotalPrice();

    sidebar.innerHTML = `
      <div class="rounded-2xl bg-white dark:bg-surface-dark p-6 border border-slate-200 dark:border-white/10 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-lg">Ваш заказ</h3>
          ${state.services.length ? `<button onclick="document.dispatchEvent(new CustomEvent('wizard-goto', {detail:1}))" class="text-xs font-medium text-primary hover:underline">Изменить</button>` : ''}
        </div>
        <div class="space-y-4">
          ${state.services.length === 0 ? '<p class="text-sm text-slate-400">Услуги не выбраны</p>' :
            state.services.map(svc => `
              <div class="flex items-start gap-3 pb-4 border-b border-slate-100 dark:border-white/10">
                <div class="size-10 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400">
                  <span class="material-symbols-outlined text-xl">content_cut</span>
                </div>
                <div class="flex-1">
                  <p class="text-sm font-bold">${svc.name}</p>
                  <p class="text-xs text-slate-500 dark:text-slate-400">${state.selectedMember ? state.selectedMember.role_label : 'Мастер не выбран'}</p>
                </div>
                <p class="text-sm font-bold">${TheodorAPI.formatPrice(svc, role)}</p>
              </div>
            `).join('')}
          ${state.selectedMember ? `
            <div class="flex items-center gap-3 pt-2">
              <div class="size-10 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden relative">
                <img alt="" class="absolute inset-0 size-full object-cover" src="${state.selectedMember.photo_url}"/>
              </div>
              <div>
                <p class="text-xs text-slate-500 dark:text-slate-400">Мастер</p>
                <p class="text-sm font-bold">${state.selectedMember.name}</p>
              </div>
            </div>` : ''}
          ${state.selectedDate ? `
            <div class="flex items-center gap-3 pt-2">
              <span class="material-symbols-outlined text-primary">event</span>
              <div>
                <p class="text-xs text-slate-500 dark:text-slate-400">Дата и время</p>
                <p class="text-sm font-bold">${formatDateRu(state.selectedDate)}${state.selectedTime ? ', ' + state.selectedTime : ''}</p>
              </div>
            </div>` : ''}
        </div>
        ${state.services.length ? `
          <div class="mt-6 pt-4 border-t border-slate-100 dark:border-white/10 flex justify-between items-center">
            <p class="text-sm text-slate-500 dark:text-slate-400">Итого</p>
            <p class="text-xl font-bold text-primary">${total.toLocaleString('ru-RU')} \u20BD</p>
          </div>` : ''}
      </div>
      <div class="rounded-2xl bg-white dark:bg-surface-dark p-6 border border-slate-200 dark:border-white/10 shadow-sm">
        <h3 class="font-bold text-lg mb-4">Контакты</h3>
        <div class="space-y-3">
          <div class="flex items-center gap-3 text-sm">
            <span class="material-symbols-outlined text-primary">location_on</span>
            <span class="text-slate-600 dark:text-slate-300">Москва, Ул. Бакунинская 72С.2</span>
          </div>
          <div class="flex items-center gap-3 text-sm">
            <span class="material-symbols-outlined text-primary">call</span>
            <a href="tel:89689976677" class="text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">8 (968) 997-66-77</a>
          </div>
        </div>
      </div>`;
  }

  // ==================== PROGRESS BAR ====================
  function renderProgress() {
    const steps = ['Услуги', 'Мастер', 'Дата и время', 'Контакты'];
    const pct = Math.round((state.step / 4) * 100);
    return `
      <div class="rounded-2xl bg-white dark:bg-surface-dark p-6 border border-slate-200 dark:border-white/10 shadow-sm mb-6">
        <div class="flex justify-between items-end mb-3">
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Шаг ${state.step} из 4</p>
            <p class="text-lg font-bold text-slate-900 dark:text-white">${steps[state.step - 1]}</p>
          </div>
          <span class="text-2xl font-bold text-primary">${pct}%</span>
        </div>
        <div class="h-2 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
          <div class="h-full bg-primary rounded-full transition-all duration-300" style="width:${pct}%"></div>
        </div>
      </div>`;
  }

  // ==================== NAV BUTTONS ====================
  function renderNav(canNext) {
    return `
      <div class="flex flex-col-reverse sm:flex-row justify-between gap-4 mt-6">
        ${state.step > 1 ? `
          <button onclick="document.dispatchEvent(new CustomEvent('wizard-goto', {detail:${state.step - 1}}))" class="flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent px-8 py-4 text-base font-bold text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
            <span class="material-symbols-outlined text-xl">arrow_back</span> Назад
          </button>` : '<div></div>'}
        <button id="wizard-next" ${canNext ? '' : 'disabled'} class="flex items-center justify-center gap-2 rounded-xl bg-primary px-10 py-4 text-base font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
          ${state.step === 4 ? 'Подтвердить запись' : 'Продолжить'} <span class="material-symbols-outlined text-xl">${state.step === 4 ? 'check' : 'arrow_forward'}</span>
        </button>
      </div>`;
  }

  // ==================== STEP RENDERERS ====================

  function renderStep() {
    if (state.step === 1) renderStep1();
    else if (state.step === 2) renderStep2();
    else if (state.step === 3) renderStep3();
    else if (state.step === 4) renderStep4();
    else if (state.step === 5) renderConfirmation();
    updateSidebar();
  }

  // ---- STEP 1: Выбор услуг ----
  function renderStep1() {
    const bookable = state.allCategories.filter(c => c.name !== 'Акции');
    wizard.innerHTML = renderProgress() + `
      <div class="space-y-8">
        ${bookable.map(cat => `
          <div>
            <div class="flex items-center gap-3 mb-4">
              <span class="material-symbols-outlined text-primary">${cat.icon}</span>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white">${cat.name}</h3>
            </div>
            <div class="space-y-3">
              ${cat.services.filter(s => s.price_type !== 'promo').map(svc => {
                const checked = state.services.some(s => s.id === svc.id);
                return `
                  <label class="flex items-center gap-4 p-4 rounded-xl border ${checked ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-white/10'} hover:border-primary/50 transition-all cursor-pointer">
                    <input type="checkbox" data-svc-id="${svc.id}" ${checked ? 'checked' : ''} class="svc-checkbox w-5 h-5 rounded border-slate-300 dark:border-white/20 text-primary focus:ring-primary bg-transparent"/>
                    <div class="flex-1">
                      <p class="font-bold text-sm text-slate-900 dark:text-white">${svc.name}</p>
                      <p class="text-xs text-slate-500 dark:text-slate-400">${svc.description || ''}</p>
                    </div>
                    <span class="text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap">${renderInlinePrice(svc)}</span>
                  </label>`;
              }).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    ` + renderNav(state.services.length > 0);

    // Events
    wizard.querySelectorAll('.svc-checkbox').forEach(cb => {
      cb.addEventListener('change', () => {
        const id = Number(cb.dataset.svcId);
        if (cb.checked) {
          const svc = findService(id);
          if (svc) state.services.push(svc);
        } else {
          state.services = state.services.filter(s => s.id !== id);
        }
        renderStep1();
      });
    });

    attachNav();
  }

  function renderInlinePrice(svc) {
    if (svc.price_type === 'flat') return `${(svc.price_top||0).toLocaleString('ru-RU')} \u20BD`;
    if (svc.price_type === 'split') return `<span class="text-slate-500">${(svc.price_top||0).toLocaleString('ru-RU')}</span> / <span class="text-primary">${(svc.price_brand||0).toLocaleString('ru-RU')} \u20BD</span>`;
    if (svc.price_type === 'range') return `${(svc.price_min||0).toLocaleString('ru-RU')}–${(svc.price_max||0).toLocaleString('ru-RU')} \u20BD`;
    return '';
  }

  // ---- STEP 2: Выбор мастера ----
  function renderStep2() {
    wizard.innerHTML = renderProgress() + `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label class="group cursor-pointer">
          <input type="radio" name="master" value="" ${!state.selectedMember ? 'checked' : ''} class="master-radio sr-only peer"/>
          <div class="flex items-center gap-4 p-5 rounded-xl border-2 transition-all peer-checked:border-primary peer-checked:bg-primary/5 border-slate-200 dark:border-white/10 hover:border-primary/50">
            <div class="size-14 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center">
              <span class="material-symbols-outlined text-2xl text-slate-400">shuffle</span>
            </div>
            <div>
              <p class="font-bold text-slate-900 dark:text-white">Любой мастер</p>
              <p class="text-xs text-slate-500 dark:text-slate-400">Мы подберём свободного</p>
            </div>
          </div>
        </label>
        ${state.teamMembers.map(m => `
          <label class="group cursor-pointer">
            <input type="radio" name="master" value="${m.id}" ${state.selectedMember?.id === m.id ? 'checked' : ''} class="master-radio sr-only peer"/>
            <div class="flex items-center gap-4 p-5 rounded-xl border-2 transition-all peer-checked:border-primary peer-checked:bg-primary/5 border-slate-200 dark:border-white/10 hover:border-primary/50">
              <div class="size-14 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                <img src="${m.photo_url}" alt="${m.name}" class="size-full object-cover"/>
              </div>
              <div>
                <p class="font-bold text-slate-900 dark:text-white">${m.name}</p>
                <p class="text-xs text-primary font-bold uppercase">${m.role_label}</p>
              </div>
            </div>
          </label>
        `).join('')}
      </div>
    ` + renderNav(true);

    wizard.querySelectorAll('.master-radio').forEach(r => {
      r.addEventListener('change', () => {
        const val = r.value;
        state.selectedMember = val ? state.teamMembers.find(m => m.id === Number(val)) : null;
        updateSidebar();
      });
    });

    attachNav();
  }

  // ---- STEP 3: Дата и время ----
  function renderStep3() {
    const today = new Date();
    const baseDate = state.selectedDate ? new Date(state.selectedDate + 'T00:00:00') : today;
    const viewMonth = baseDate.getMonth();
    const viewYear = baseDate.getFullYear();

    wizard.innerHTML = renderProgress() + `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="rounded-2xl bg-white dark:bg-surface-dark p-6 border border-slate-200 dark:border-white/10 shadow-sm">
          <div class="flex items-center justify-between mb-6">
            <button id="cal-prev" class="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors">
              <span class="material-symbols-outlined text-slate-600 dark:text-slate-300">chevron_left</span>
            </button>
            <span id="cal-title" class="text-base font-bold text-slate-900 dark:text-white capitalize">${getMonthName(viewMonth)} ${viewYear}</span>
            <button id="cal-next" class="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors">
              <span class="material-symbols-outlined text-slate-600 dark:text-slate-300">chevron_right</span>
            </button>
          </div>
          <div class="grid grid-cols-7 mb-2 text-center">
            ${['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d => `<div class="text-xs font-medium text-slate-400 py-2">${d}</div>`).join('')}
          </div>
          <div id="cal-grid" class="grid grid-cols-7 gap-1 text-center">
            ${renderCalendarDays(viewYear, viewMonth, today)}
          </div>
        </div>
        <div class="flex flex-col gap-4">
          <div id="timeslots-container" class="rounded-2xl bg-white dark:bg-surface-dark p-6 border border-slate-200 dark:border-white/10 shadow-sm flex-1">
            <h3 class="font-bold text-lg mb-4 text-slate-900 dark:text-white">Доступное время</h3>
            <div id="timeslots-grid" class="grid grid-cols-2 gap-3">
              ${state.selectedDate ? '<p class="text-sm text-slate-400 col-span-2">Загрузка...</p>' : '<p class="text-sm text-slate-400 col-span-2">Выберите дату</p>'}
            </div>
          </div>
        </div>
      </div>
    ` + renderNav(state.selectedDate && state.selectedTime);

    // Calendar nav
    let currentMonth = viewMonth;
    let currentYear = viewYear;

    document.getElementById('cal-prev')?.addEventListener('click', () => {
      currentMonth--;
      if (currentMonth < 0) { currentMonth = 11; currentYear--; }
      refreshCalendar();
    });
    document.getElementById('cal-next')?.addEventListener('click', () => {
      currentMonth++;
      if (currentMonth > 11) { currentMonth = 0; currentYear++; }
      refreshCalendar();
    });

    function refreshCalendar() {
      document.getElementById('cal-title').textContent = `${getMonthName(currentMonth)} ${currentYear}`;
      document.getElementById('cal-grid').innerHTML = renderCalendarDays(currentYear, currentMonth, today);
      attachCalendarClicks();
    }

    attachCalendarClicks();
    if (state.selectedDate) loadTimeslots();

    function attachCalendarClicks() {
      document.querySelectorAll('.cal-day').forEach(btn => {
        btn.addEventListener('click', () => {
          const d = btn.dataset.date;
          state.selectedDate = d;
          state.selectedTime = null;
          document.querySelectorAll('.cal-day').forEach(b => {
            b.className = b.className.replace(/bg-primary text-white shadow-lg shadow-primary\/30 font-bold/g, '');
            b.classList.add('text-slate-600', 'dark:text-slate-300', 'hover:bg-slate-100', 'dark:hover:bg-white/10');
          });
          btn.classList.remove('text-slate-600', 'dark:text-slate-300', 'hover:bg-slate-100', 'dark:hover:bg-white/10');
          btn.classList.add('bg-primary', 'text-white', 'shadow-lg', 'shadow-primary/30', 'font-bold');
          loadTimeslots();
          updateSidebar();
        });
      });
    }

    async function loadTimeslots() {
      const grid = document.getElementById('timeslots-grid');
      grid.innerHTML = '<p class="text-sm text-slate-400 col-span-2 text-center py-4">Загрузка...</p>';
      try {
        const slots = await TheodorAPI.getTimeslots(state.selectedDate, state.selectedMember?.id);
        if (!slots.length) {
          grid.innerHTML = '<p class="text-sm text-slate-400 col-span-2">Нет доступных слотов</p>';
          return;
        }
        grid.innerHTML = slots.map(slot => {
          const isSelected = state.selectedTime === slot.time;
          if (!slot.available) {
            return `
              <div class="flex items-center justify-center rounded-xl border-2 border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 px-4 py-3 text-sm font-medium text-slate-400 dark:text-slate-600 opacity-50 cursor-not-allowed">${slot.time}</div>`;
          }
          return `
            <button data-time="${slot.time}" class="time-slot-btn flex items-center justify-center rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all ${isSelected ? 'border-primary text-primary bg-primary/5' : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-primary/50'}">${slot.time}</button>`;
        }).join('');

        grid.querySelectorAll('.time-slot-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            state.selectedTime = btn.dataset.time;
            grid.querySelectorAll('.time-slot-btn').forEach(b => {
              b.className = 'time-slot-btn flex items-center justify-center rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-primary/50';
            });
            btn.className = 'time-slot-btn flex items-center justify-center rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all border-primary text-primary bg-primary/5';
            updateSidebar();
            const nextBtn = document.getElementById('wizard-next');
            if (nextBtn) nextBtn.disabled = false;
          });
        });
      } catch (e) {
        grid.innerHTML = '<p class="text-sm text-red-400 col-span-2">Ошибка загрузки</p>';
      }
    }

    attachNav();
  }

  // ---- STEP 4: Контакты ----
  function renderStep4() {
    wizard.innerHTML = renderProgress() + `
      <div class="rounded-2xl bg-white dark:bg-surface-dark p-6 border border-slate-200 dark:border-white/10 shadow-sm">
        <h3 class="text-xl font-bold mb-6 text-slate-900 dark:text-white">Контактные данные</h3>
        <div class="space-y-5">
          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Имя *</label>
            <input id="b-name" type="text" value="${state.clientName}" placeholder="Иван Иванов" class="w-full bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-white/10 rounded-lg px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"/>
          </div>
          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Телефон *</label>
            <input id="b-phone" type="tel" value="${state.clientPhone}" placeholder="+7 (___) ___-__-__" class="w-full bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-white/10 rounded-lg px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"/>
          </div>
          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Комментарий</label>
            <textarea id="b-comment" rows="3" placeholder="Пожелания к мастеру..." class="w-full bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-white/10 rounded-lg px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none">${state.clientComment}</textarea>
          </div>
        </div>
        <div id="booking-error" class="hidden mt-4 p-4 rounded-lg bg-red-500/10 text-red-400 text-sm text-center"></div>
      </div>
    ` + renderNav(false);

    const nameInput = document.getElementById('b-name');
    const phoneInput = document.getElementById('b-phone');
    const commentInput = document.getElementById('b-comment');

    function validateStep4() {
      state.clientName = nameInput.value.trim();
      state.clientPhone = phoneInput.value.trim();
      state.clientComment = commentInput.value.trim();
      const nextBtn = document.getElementById('wizard-next');
      if (nextBtn) nextBtn.disabled = !(state.clientName && state.clientPhone);
    }

    nameInput.addEventListener('input', validateStep4);
    phoneInput.addEventListener('input', validateStep4);
    commentInput.addEventListener('input', () => { state.clientComment = commentInput.value.trim(); });
    validateStep4();

    // Override next button for submit
    const nextBtn = document.getElementById('wizard-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (!state.clientName || !state.clientPhone) return;

        nextBtn.disabled = true;
        nextBtn.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span> Отправка...';

        try {
          const res = await TheodorAPI.createBooking({
            client_name: state.clientName,
            client_phone: state.clientPhone,
            client_comment: state.clientComment,
            team_member_id: state.selectedMember?.id || null,
            booking_date: state.selectedDate,
            booking_time: state.selectedTime,
            service_ids: state.services.map(s => s.id),
          });

          if (res.ok) {
            state.step = 5;
            state.bookingId = res.booking_id;
            renderStep();
          } else {
            const errDiv = document.getElementById('booking-error');
            errDiv.textContent = res.error || 'Ошибка создания записи';
            errDiv.classList.remove('hidden');
            nextBtn.disabled = false;
            nextBtn.innerHTML = 'Подтвердить запись <span class="material-symbols-outlined text-xl">check</span>';
          }
        } catch (e) {
          const errDiv = document.getElementById('booking-error');
          errDiv.textContent = 'Ошибка соединения';
          errDiv.classList.remove('hidden');
          nextBtn.disabled = false;
          nextBtn.innerHTML = 'Подтвердить запись <span class="material-symbols-outlined text-xl">check</span>';
        }
      });
    }
  }

  // ---- STEP 5: Подтверждение ----
  function renderConfirmation() {
    const role = getRoleKey();
    wizard.innerHTML = `
      <div class="flex flex-col items-center text-center py-12">
        <div class="size-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
          <span class="material-symbols-outlined text-5xl text-green-500">check_circle</span>
        </div>
        <h2 class="text-3xl font-black text-slate-900 dark:text-white mb-3">Запись подтверждена!</h2>
        <p class="text-slate-500 dark:text-slate-400 mb-8 max-w-md">
          Спасибо, ${state.clientName}! Мы ждём вас ${formatDateRu(state.selectedDate)} в ${state.selectedTime}.
          ${state.selectedMember ? `Ваш мастер — ${state.selectedMember.name}.` : ''}
        </p>
        <div class="rounded-2xl bg-white dark:bg-surface-dark p-6 border border-slate-200 dark:border-white/10 shadow-sm w-full max-w-md text-left mb-8">
          <h3 class="font-bold mb-4">Детали записи #${state.bookingId || ''}</h3>
          ${state.services.map(svc => `
            <div class="flex justify-between py-2 border-b border-slate-100 dark:border-white/5 text-sm">
              <span>${svc.name}</span>
              <span class="font-bold">${TheodorAPI.formatPrice(svc, role)}</span>
            </div>`).join('')}
          <div class="flex justify-between pt-4 text-lg font-bold">
            <span>Итого</span>
            <span class="text-primary">${getTotalPrice().toLocaleString('ru-RU')} \u20BD</span>
          </div>
        </div>
        <div class="flex gap-4">
          <a href="index.html" class="px-8 py-3 rounded-xl border border-slate-200 dark:border-white/10 font-bold hover:bg-slate-100 dark:hover:bg-white/10 transition-all">На главную</a>
          <a href="booking.html" class="px-8 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all">Новая запись</a>
        </div>
      </div>`;

    if (sidebar) {
      sidebar.innerHTML = `
        <div class="rounded-2xl bg-green-500/5 border border-green-500/20 p-6 text-center">
          <span class="material-symbols-outlined text-green-500 text-4xl mb-2">verified</span>
          <p class="font-bold text-green-400">Запись создана</p>
        </div>`;
    }
  }

  // ==================== HELPERS ====================

  function attachNav() {
    const nextBtn = document.getElementById('wizard-next');
    if (nextBtn && state.step < 4) {
      nextBtn.addEventListener('click', () => {
        state.step++;
        renderStep();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  document.addEventListener('wizard-goto', (e) => {
    state.step = e.detail;
    renderStep();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  function findService(id) {
    for (const cat of state.allCategories) {
      const found = cat.services.find(s => s.id === id);
      if (found) return found;
    }
    return null;
  }

  function renderCalendarDays(year, month, today) {
    const firstDay = new Date(year, month, 1);
    let startDow = firstDay.getDay(); // 0=Sun
    startDow = startDow === 0 ? 6 : startDow - 1; // convert to Mon=0
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let html = '';
    for (let i = 0; i < startDow; i++) html += '<div class="aspect-square"></div>';

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dateObj = new Date(year, month, d);
      const isPast = dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const isSelected = state.selectedDate === dateStr;

      if (isPast) {
        html += `<button class="aspect-square flex items-center justify-center rounded-full text-sm text-slate-400 cursor-not-allowed" disabled>${d}</button>`;
      } else if (isSelected) {
        html += `<button data-date="${dateStr}" class="cal-day aspect-square flex items-center justify-center rounded-full text-sm bg-primary text-white shadow-lg shadow-primary/30 font-bold">${d}</button>`;
      } else {
        html += `<button data-date="${dateStr}" class="cal-day aspect-square flex items-center justify-center rounded-full text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10">${d}</button>`;
      }
    }
    return html;
  }

  function getMonthName(m) {
    return ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'][m];
  }

  function formatDateRu(dateStr) {
    const [y, m, d] = dateStr.split('-');
    const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
    return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
  }
});
