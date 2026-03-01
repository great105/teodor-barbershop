document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('services-list');
  if (!container) return;

  try {
    const categories = await TheodorAPI.getServices();
    container.innerHTML = categories.map(cat => {
      const isPromo = cat.name === 'Акции';
      const iconColor = isPromo ? 'text-accent-gold' : 'text-primary';
      const borderColor = isPromo ? 'border-accent-gold' : 'border-primary';

      return `
        <div class="reveal visible mb-12">
          <div class="flex items-center gap-4 mb-6">
            <div class="p-2 rounded-full bg-surface-dark border border-white/10 ${iconColor}">
              <span class="material-symbols-outlined">${cat.icon}</span>
            </div>
            <h2 class="text-2xl font-bold text-slate-900 dark:text-white">${cat.name}</h2>
          </div>
          <div class="space-y-4">
            ${cat.services.map(svc => renderService(svc, cat, isPromo, borderColor)).join('')}
          </div>
        </div>`;
    }).join('');
  } catch (e) {
    container.innerHTML = '<p class="text-center text-slate-400">Ошибка загрузки услуг</p>';
  }
});

function renderService(svc, cat, isPromo, borderColor) {
  // Определяем стиль в зависимости от типа
  if (isPromo) {
    return `
      <div class="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-5 rounded-xl bg-gradient-to-r from-accent-gold/10 to-transparent border border-accent-gold/30 hover:border-accent-gold transition-all duration-300 shadow-sm">
        <div class="flex-1">
          <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-1">${svc.name}</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400">${svc.description || ''}</p>
        </div>
        <div class="flex items-center gap-2 min-w-[120px] justify-end">
          <span class="text-lg font-bold text-accent-gold">${svc.promo_text}</span>
        </div>
      </div>`;
  }

  if (cat.name === 'Комплексные') {
    return `
      <div class="group relative flex flex-col sm:flex-row sm:items-end justify-between gap-2 p-5 rounded-xl bg-gradient-to-r from-surface-dark to-surface-dark/50 border border-primary/20 hover:border-primary transition-all duration-300 shadow-sm">
        <div class="flex-1">
          <h3 class="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors mb-1">${svc.name}</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400">${svc.description || ''}</p>
        </div>
        <div class="flex items-center gap-2 min-w-[120px] justify-end">
          <span class="text-lg font-bold text-primary">${(svc.price_top || 0).toLocaleString('ru-RU')} \u20BD</span>
        </div>
      </div>`;
  }

  // split / flat / range
  const priceHtml = renderPriceBlock(svc);
  return `
    <div class="group relative flex flex-col sm:flex-row sm:items-end justify-between gap-2 p-5 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/5 hover:border-primary/50 transition-all duration-300 shadow-sm">
      <div class="flex-1">
        <h3 class="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors mb-1">${svc.name}</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400">${svc.description || ''}</p>
      </div>
      ${priceHtml}
    </div>`;
}

function renderPriceBlock(svc) {
  if (svc.price_type === 'split') {
    return `
      <div class="flex items-center gap-4 min-w-[220px] justify-end">
        <div class="flex flex-col items-center">
          <span class="text-base font-bold text-slate-600 dark:text-slate-300">${(svc.price_top || 0).toLocaleString('ru-RU')} \u20BD</span>
          <span class="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Топ-Барбер</span>
        </div>
        <span class="text-slate-300 dark:text-slate-600">/</span>
        <div class="flex flex-col items-center">
          <span class="text-base font-bold text-primary">${(svc.price_brand || 0).toLocaleString('ru-RU')} \u20BD</span>
          <span class="text-[10px] uppercase tracking-wider text-primary/70 font-medium">Бренд-Барбер</span>
        </div>
      </div>`;
  }
  if (svc.price_type === 'range') {
    return `
      <div class="flex items-center gap-2 min-w-[120px] justify-end">
        <span class="text-lg font-bold text-slate-900 dark:text-white">${(svc.price_min || 0).toLocaleString('ru-RU')} – ${(svc.price_max || 0).toLocaleString('ru-RU')} \u20BD</span>
      </div>`;
  }
  // flat
  return `
    <div class="flex items-center gap-2 min-w-[120px] justify-end">
      <span class="text-lg font-bold text-slate-900 dark:text-white">${(svc.price_top || 0).toLocaleString('ru-RU')} \u20BD</span>
    </div>`;
}
