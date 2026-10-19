(function () {
  const page = document.body && document.body.dataset.page;
  if (page === 'login') return;
  if (!window.KostApi || !KostApi.getToken()) {
    window.location.href = 'login.html';
    return;
  }
  const user = KostApi.getUser();
  document.querySelectorAll('.user span').forEach((el) => {
    if (user.displayName) el.textContent = user.displayName;
  });
  if (user.displayName) {
    const initials = user.displayName
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    document.querySelectorAll('.avatar').forEach((el) => {
      el.textContent = initials;
    });
  }
})();
