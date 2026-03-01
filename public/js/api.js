// Общий API-клиент
window.TheodorAPI = {
  async get(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  async post(url, data) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async put(url, data) {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async patch(url, data) {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async del(url) {
    const res = await fetch(url, { method: 'DELETE' });
    return res.json();
  },

  // Публичные
  getServices() { return this.get('/api/services'); },
  getTeam() { return this.get('/api/team'); },
  getGallery() { return this.get('/api/gallery'); },
  getSettings() { return this.get('/api/settings'); },
  getTimeslots(date, teamMemberId) {
    let url = `/api/timeslots?date=${date}`;
    if (teamMemberId) url += `&team_member_id=${teamMemberId}`;
    return this.get(url);
  },
  createBooking(data) { return this.post('/api/bookings', data); },
  sendContact(data) { return this.post('/api/contact', data); },

  // Форматирование цены
  formatPrice(svc, roleKey) {
    if (svc.price_type === 'promo') return svc.promo_text;
    if (svc.price_type === 'range') return `${svc.price_min?.toLocaleString('ru-RU')} – ${svc.price_max?.toLocaleString('ru-RU')} \u20BD`;
    if (svc.price_type === 'flat') return `${(svc.price_top || 0).toLocaleString('ru-RU')} \u20BD`;
    // split
    if (roleKey === 'brand') return `${(svc.price_brand || svc.price_top || 0).toLocaleString('ru-RU')} \u20BD`;
    return `${(svc.price_top || 0).toLocaleString('ru-RU')} \u20BD`;
  },
  getPrice(svc, roleKey) {
    if (svc.price_type === 'flat') return svc.price_top || 0;
    if (svc.price_type === 'split') return roleKey === 'brand' ? (svc.price_brand || svc.price_top || 0) : (svc.price_top || 0);
    if (svc.price_type === 'range') return svc.price_min || 0;
    return 0;
  },
};
