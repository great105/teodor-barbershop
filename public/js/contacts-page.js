document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const btn = form.querySelector('button[type="button"], button[type="submit"]');
  if (!btn) return;

  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    const name = form.querySelector('#name')?.value?.trim();
    const phone = form.querySelector('#phone')?.value?.trim();
    const message = form.querySelector('#message')?.value?.trim();

    if (!name || !phone) {
      showFormMessage(form, 'Заполните имя и телефон', true);
      return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-sm">progress_activity</span> Отправка...';

    try {
      const res = await TheodorAPI.sendContact({ name, phone, message });
      if (res.ok) {
        showFormMessage(form, 'Сообщение отправлено! Мы свяжемся с вами.', false);
        form.reset();
      } else {
        showFormMessage(form, res.error || 'Ошибка отправки', true);
      }
    } catch (e) {
      showFormMessage(form, 'Ошибка соединения', true);
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<span>Отправить сообщение</span><span class="material-symbols-outlined text-sm">send</span>';
    }
  });
});

function showFormMessage(form, text, isError) {
  let msg = form.querySelector('.form-message');
  if (!msg) {
    msg = document.createElement('div');
    msg.className = 'form-message mt-4 p-4 rounded-lg text-center text-sm font-medium';
    form.appendChild(msg);
  }
  msg.className = `form-message mt-4 p-4 rounded-lg text-center text-sm font-medium ${isError ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`;
  msg.textContent = text;
  setTimeout(() => msg.remove(), 5000);
}
