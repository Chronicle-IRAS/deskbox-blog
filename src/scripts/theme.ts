import { $, reduced } from './util';

export function setTheme(next: 'light' | 'dark') {
  const d = document.documentElement;
  if (d.dataset.theme === next) return;
  const apply = () => {
    d.dataset.theme = next;
    try { localStorage.setItem('db-theme', next); } catch {}
    syncThemeUI();
  };
  const vt = (document as any).startViewTransition;
  if (!vt || reduced()) return apply();
  d.classList.add('theme-swap');
  vt.call(document, apply).finished.finally(() => d.classList.remove('theme-swap'));
}

export function syncThemeUI() {
  const dark = document.documentElement.dataset.theme === 'dark';
  $('[data-theme-toggle]')?.setAttribute('aria-checked', String(dark));
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((m) => (m.content = dark ? '#171614' : '#f4f1e9'));
}

let ready = false;
export function initThemeControls() {
  syncThemeUI();
  if (ready) return; // 导航是 transition:persist，只绑定一次
  ready = true;
  $('[data-theme-toggle]')?.addEventListener('click', () =>
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'),
  );
}
