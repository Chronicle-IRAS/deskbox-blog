import { $, $$, reduced, pageSignal } from './util';

/* ---------- 滚动入场（一次） ---------- */
export function initReveal() {
  const els = $$('.rise:not(.in)');
  if (!('IntersectionObserver' in window) || reduced()) return els.forEach((e) => e.classList.add('in'));
  const io = new IntersectionObserver(
    (entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }),
    { rootMargin: '0px 0px -6% 0px', threshold: 0.05 },
  );
  els.forEach((e) => io.observe(e));
  pageSignal().addEventListener('abort', () => io.disconnect());
}

/* ---------- 报头里的日期与时间（访客本地时间） ---------- */
export function initClock() {
  const t = $('[data-clock]');
  const g = $('[data-greet]');
  if (!t && !g) return;
  const f = new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
  const greet = (h: number) => (h < 5 ? '夜深了' : h < 9 ? '早上好' : h < 12 ? '上午好' : h < 14 ? '中午好' : h < 18 ? '下午好' : h < 23 ? '晚上好' : '夜深了');
  const tick = () => {
    const now = new Date();
    if (t) t.textContent = f.format(now);
    if (g) g.textContent = greet(now.getHours());
  };
  tick();
  const id = setInterval(tick, 15000);
  pageSignal().addEventListener('abort', () => clearInterval(id));
}
