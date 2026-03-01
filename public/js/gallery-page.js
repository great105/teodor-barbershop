document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('gallery-grid');
  const filtersContainer = document.getElementById('gallery-filters');
  if (!grid) return;

  let allImages = [];
  let activeFilter = 'Все фото';

  try {
    allImages = await TheodorAPI.getGallery();
    // Генерируем уникальные категории
    const cats = ['Все фото', ...new Set(allImages.map(i => i.category))];

    if (filtersContainer) {
      filtersContainer.innerHTML = cats.map(c => `
        <button data-filter="${c}" class="gallery-filter-btn px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${c === 'Все фото' ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-surface-dark text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-white/10'}">
          ${c}
        </button>
      `).join('');

      filtersContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.gallery-filter-btn');
        if (!btn) return;
        activeFilter = btn.dataset.filter;
        filtersContainer.querySelectorAll('.gallery-filter-btn').forEach(b => {
          b.className = b.className.replace(/bg-primary text-white|bg-slate-200 dark:bg-surface-dark text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-white\/10/g, '');
          if (b.dataset.filter === activeFilter) {
            b.classList.add('bg-primary', 'text-white');
          } else {
            b.classList.add('bg-slate-200', 'dark:bg-surface-dark', 'text-slate-700', 'dark:text-slate-300', 'hover:bg-slate-300', 'dark:hover:bg-white/10');
          }
        });
        renderGallery();
      });
    }

    renderGallery();
  } catch (e) {
    grid.innerHTML = '<p class="text-center text-slate-400">Ошибка загрузки галереи</p>';
  }

  function renderGallery() {
    const filtered = activeFilter === 'Все фото' ? allImages : allImages.filter(i => i.category === activeFilter);
    grid.innerHTML = filtered.map(img => `
      <div class="break-inside-avoid relative group/image overflow-hidden rounded-xl bg-slate-800">
        <img alt="${img.alt || ''}" class="w-full h-auto object-cover transform transition-transform duration-500 group-hover/image:scale-105 transform-gpu" loading="lazy" decoding="async" src="${img.url}"/>
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
          <span class="text-primary text-xs font-bold uppercase tracking-wider mb-1">${img.category}</span>
          <h3 class="text-white text-lg font-bold">${img.title || ''}</h3>
        </div>
      </div>
    `).join('');
  }
});
