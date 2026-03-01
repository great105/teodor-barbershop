document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('team-grid');
  if (!container) return;

  try {
    const members = await TheodorAPI.getTeam();
    container.innerHTML = members.map(m => `
      <div class="group flex flex-col gap-4 bg-white/5 p-4 rounded-xl border border-transparent hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20">
        <div class="relative w-full aspect-[3/4] overflow-hidden rounded-lg">
          <div class="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors z-10"></div>
          <div class="w-full h-full bg-center bg-cover transition-transform duration-500 group-hover:scale-105 transform-gpu" style='background-image: url("${m.photo_url}");'></div>
        </div>
        <div class="flex flex-col gap-1 px-1">
          <h3 class="text-xl font-bold leading-tight group-hover:text-primary transition-colors">${m.name}</h3>
          <p class="text-primary text-sm font-bold uppercase tracking-wide">${m.role_label}</p>
          <div class="mt-4 pt-4 border-t border-white/10 flex justify-end items-center">
            <a href="booking.html" class="text-primary hover:text-white transition-colors"><span class="material-symbols-outlined text-xl">calendar_month</span></a>
          </div>
        </div>
      </div>
    `).join('') + `
      <div class="group flex flex-col justify-center items-center gap-4 bg-transparent border-2 border-dashed border-slate-600 hover:border-primary p-8 rounded-xl transition-all duration-300 min-h-[400px]">
        <div class="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-primary transition-colors">
          <span class="material-symbols-outlined text-3xl text-slate-400 group-hover:text-white">person_add</span>
        </div>
        <div class="text-center">
          <h3 class="text-xl font-bold leading-tight mb-2">Стать частью команды</h3>
          <p class="text-slate-500 dark:text-slate-400 text-sm mb-6">Мы всегда ищем талантливых мастеров</p>
          <a class="text-primary font-bold hover:underline" href="contacts.html">Отправить резюме &rarr;</a>
        </div>
      </div>`;
  } catch (e) {
    container.innerHTML = '<p class="text-center text-slate-400 col-span-4">Ошибка загрузки</p>';
  }
});
