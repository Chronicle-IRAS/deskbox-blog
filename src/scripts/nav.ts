import { $, $$ } from './util';

function activeKey() {
  const base = document.documentElement.dataset.base || '';
  const p = location.pathname.slice(base.length) || '/';
  if (p === '/' || p === '') return 'home';
  for (const k of ['blog', 'tags', 'archive', 'about']) if (p.startsWith('/' + k)) return k;
  return '';
}

function setMenu(open: boolean) {
  const menu = $('[data-menu]');
  const btn = $('[data-menu-toggle]');
  if (!menu || !btn) return;
  menu.hidden = !open;
  btn.setAttribute('aria-expanded', String(open));
  document.documentElement.style.overflow = open ? 'hidden' : '';
}

let bound = false;
export function initNav() {
  const key = activeKey();
  $$<HTMLAnchorElement>('[data-nav-link]').forEach((a) => {
    if (a.dataset.key === key) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  setMenu(false);
  if (bound) return;
  bound = true;

  $('[data-menu-toggle]')?.addEventListener('click', () => setMenu(Boolean($('[data-menu]')?.hidden)));
  $('[data-menu]')?.addEventListener('click', (e) => { if ((e.target as Element).closest('a')) setMenu(false); });
  addEventListener('keydown', (e) => e.key === 'Escape' && setMenu(false));

  // 实体键帽：按下 ⌘/Ctrl 和 K 时，导航里的键帽一起"按下去"
  const keyEl = (k: string) => $(`[data-k="${k}"]`);
  addEventListener('keydown', (e) => {
    if (e.key === 'Meta' || e.key === 'Control') keyEl('meta')?.classList.add('down');
    if (e.key.toLowerCase() === 'k') keyEl('k')?.classList.add('down');
  });
  addEventListener('keyup', () => $$('.key.down').forEach((k) => k.classList.remove('down')));
  addEventListener('blur', () => $$('.key.down').forEach((k) => k.classList.remove('down')));

  // 下滚收起、上滚出现；更新阅读进度
  const nav = $('[data-nav]')!;
  let lastY = scrollY, ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = scrollY;
      if (Math.abs(y - lastY) > 6) {
        const menuOpen = !$('[data-menu]')?.hidden;
        nav.classList.toggle('is-hidden', y > lastY && y > 200 && !menuOpen && !document.querySelector('dialog[open]'));
        lastY = y;
      }
      const art = $('[data-article]');
      let p = 0;
      if (art) {
        const r = art.getBoundingClientRect();
        p = Math.min(1, Math.max(0, (innerHeight * 0.35 - r.top) / (r.height - innerHeight * 0.35)));
      } else {
        const max = document.documentElement.scrollHeight - innerHeight;
        p = max > 0 ? y / max : 0;
      }
      document.documentElement.style.setProperty('--read', p.toFixed(4));
      ticking = false;
    });
  }, { passive: true });

  // 页面切换时顶部的红色加载条
  document.addEventListener('astro:before-preparation', () => {
    const b = document.querySelector('.loadbar');
    if (!b) return;
    b.classList.remove('done');
    void (b as HTMLElement).offsetWidth;
    b.classList.add('go');
  });
  document.addEventListener('astro:page-load', () => {
    const b = document.querySelector('.loadbar');
    if (b?.classList.contains('go')) { b.classList.remove('go'); b.classList.add('done'); }
  });
}
