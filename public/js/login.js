(function () {
  if (document.body.dataset.page !== 'login') return;
  const form = document.querySelector('[data-login-form]');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = form.querySelector('[name="email"]').value.trim();
    const password = form.querySelector('[name="password"]').value;
    try {
      const res = await KostApi.post('/auth/login', { email, password });
      KostApi.setSession(res.token, res.user);
      window.location.href = 'main_menu.html';
    } catch (err) {
      alert(err.message || 'Login gagal');
    }
  });
})();
