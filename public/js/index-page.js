document.addEventListener('DOMContentLoaded', async () => {
  // Превью услуг на главной
  const servicesPreview = document.getElementById('services-preview');
  if (servicesPreview) {
    try {
      const categories = await TheodorAPI.getServices();
      // Показываем 3 ключевые услуги: Мужская стрижка, Моделирование GH, Стрижка+борода
      const highlights = [];
      for (const cat of categories) {
        for (const svc of cat.services) {
          if (svc.name === 'Мужская стрижка') highlights[0] = { svc, iconImg: 'public/icons/icon-scissors.png', features: ['Консультация', 'Мытье головы', 'Укладка'] };
          if (svc.name === 'Моделирование GH (простое)') highlights[1] = { svc, iconImg: 'public/icons/icon-beard.png', features: ['Придание формы', 'Окантовка', 'Уход маслом'] };
          if (svc.name === 'Стрижка + борода и усы') highlights[2] = { svc, iconImg: 'public/icons/icon-combo.png', features: ['Стрижка', 'Борода и усы', 'Комплексная цена'] };
        }
      }

      servicesPreview.innerHTML = highlights.filter(Boolean).map(h => {
        const priceLabel = h.svc.price_type === 'split'
          ? `от ${(h.svc.price_top || 0).toLocaleString('ru-RU')}\u20BD`
          : `${(h.svc.price_top || 0).toLocaleString('ru-RU')}\u20BD`;
        return `
          <div class="group flex flex-col bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-8 rounded-xl transition-all hover:border-primary/50">
            <div class="flex justify-between items-start mb-6">
              <img src="${h.iconImg}" alt="" class="w-14 h-14 rounded-lg object-cover" loading="lazy"/>
              <span class="text-3xl font-black text-slate-900 dark:text-white">${priceLabel}</span>
            </div>
            <h4 class="text-xl font-bold mb-4 uppercase tracking-tight text-slate-900 dark:text-white">${h.svc.name}</h4>
            <p class="text-slate-500 dark:text-slate-400 mb-8 text-sm leading-relaxed">${h.svc.description || ''}</p>
            <ul class="space-y-3 mb-8 flex-1">
              ${h.features.map(f => `
                <li class="flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-slate-700 dark:text-slate-300">
                  <span class="material-symbols-outlined text-primary text-sm">check_circle</span> ${f}
                </li>`).join('')}
            </ul>
            <a href="booking.html" class="w-full bg-slate-900 dark:bg-white/10 text-white py-3 rounded font-bold uppercase tracking-widest text-xs hover:bg-primary transition-colors text-center block">Забронировать</a>
          </div>`;
      }).join('');
    } catch (e) {
      // Не показываем ошибку, оставляем пустой контейнер
    }
  }
});
