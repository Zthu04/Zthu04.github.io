(() => {
  const root = document.documentElement;
  const storageKey = 'zin-win-thu-theme';
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  const isTheme = value => value === 'light' || value === 'dark';
  let preference;
  try { preference = localStorage.getItem(storageKey); } catch {}

  const applyTheme = theme => {
    root.dataset.theme = theme;
    const dark = theme === 'dark';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0b0c0e' : '#ffffff');
    const toggle = document.querySelector('[data-theme-toggle]');
    if (!toggle) return;
    toggle.setAttribute('aria-checked', String(dark));
    toggle.setAttribute('title', `Switch to ${dark ? 'white' : 'black'} background`);
    toggle.querySelector('[data-theme-label]').textContent = dark ? 'Black' : 'White';
  };
  const preferredTheme = () => isTheme(preference) ? preference : systemTheme.matches ? 'dark' : 'light';

  // Run before styles load so a saved black background does not flash white.
  applyTheme(preferredTheme());
  const initializeToggle = () => {
    const toggle = document.querySelector('[data-theme-toggle]');
    if (!toggle) return;
    applyTheme(preferredTheme());
    toggle.addEventListener('click', () => {
      preference = root.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(preference);
      try { localStorage.setItem(storageKey, preference); } catch {}
    });
    toggle.hidden = false;
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeToggle, { once: true });
  else initializeToggle();

  systemTheme.addEventListener('change', () => {
    if (!isTheme(preference)) applyTheme(preferredTheme());
  });
  window.addEventListener('storage', event => {
    if (event.key !== storageKey && event.key !== null) return;
    preference = event.newValue;
    applyTheme(preferredTheme());
  });
})();
