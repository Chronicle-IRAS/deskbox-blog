(() => {
  const root = document.documentElement;
  let stored = null;

  try {
    stored = localStorage.getItem('theme');
  } catch {
    stored = null;
  }

  const theme =
    stored === 'light' || stored === 'dark'
      ? stored
      : window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';

  root.dataset.theme = theme;
  root.style.colorScheme = theme;
})();
