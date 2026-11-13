import { $, $$, reduced, finePointer, pageSignal } from './util';

/* ---------- 文章列表：跟随鼠标的预览卡 ---------- */
export function initPreview() {
  const pv = $('[data-preview]');
  const rows = $$('[data-row]');
  if (!pv || !rows.length || !finePointer()) return;
  const title = $('[data-pv-title]', pv)!, desc = $('[data-pv-desc]', pv)!, meta = $('[data-pv-meta]', pv)!;
  const img = $<HTMLImageElement>('[data-pv-img]', pv)!;
  let x = 0, y = 0, tx = 0, ty = 0, raf = 0, vx = 0;
  const loop = () => {
    const nx = x + (tx - x) * 0.16;
    vx = nx - x;
    x = nx;
    y += (ty - y) * 0.16;
    pv.style.transform = `translate(${x}px, ${y}px) rotate(${Math.max(-6, Math.min(6, vx * 0.5))}deg)`;
    raf = requestAnimationFrame(loop);
  };
  const sig = pageSignal();
  rows.forEach((r) => {
    r.addEventListener('pointerenter', (e) => {
      title.textContent = r.dataset.title || '';
      desc.textContent = r.dataset.desc || '';
      meta.textContent = r.dataset.meta || '';
      if (r.dataset.cover) { img.src = r.dataset.cover; pv.classList.add('has-img'); } else pv.classList.remove('has-img');
      if (!pv.classList.contains('on')) { x = tx = e.clientX; y = ty = e.clientY; }
      pv.classList.add('on');
      if (!raf && !reduced()) raf = requestAnimationFrame(loop);
    }, { signal: sig });
    r.addEventListener('pointerleave', () => pv.classList.remove('on'), { signal: sig });
  });
  addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; if (reduced()) pv.style.transform = `translate(${tx}px, ${ty}px)`; }, { passive: true, signal: sig });
  sig.addEventListener('abort', () => cancelAnimationFrame(raf));
}

/* ---------- 标签筛选：滑动指示 + FLIP 重排 ---------- */
export function initFilter() {
  const bar = $('[data-filter]');
  if (!bar) return;
  const ind = $('[data-filter-ind]', bar)!;
  const btns = $$<HTMLButtonElement>('button[data-tag]', bar);
  const items = $$('[data-item]');
  const count = $('[data-filter-count]');
  const empty = $('[data-filter-empty]');
  const place = (b: HTMLElement) => {
    ind.style.width = `${b.offsetWidth}px`;
    ind.style.transform = `translateX(${b.offsetLeft}px)`;
  };
  const apply = (tag: string, push = true) => {
    const before = new Map(items.map((i) => [i, i.getBoundingClientRect()]));
    let n = 0;
    items.forEach((i) => {
      const show = tag === 'all' || (i.dataset.tags || '').split('|').includes(tag);
      i.hidden = !show;
      if (show) n++;
    });
    if (count) count.textContent = String(n);
    if (empty) empty.hidden = n > 0;
    btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tag === tag)));
    const cur = btns.find((b) => b.dataset.tag === tag);
    if (cur) place(cur);
    if (!reduced()) {
      items.forEach((i, k) => {
        if (i.hidden) return;
        const a = before.get(i)!, b = i.getBoundingClientRect();
        if (a.height === 0) {
          i.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 500, delay: k * 30, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
        } else if (Math.abs(a.top - b.top) > 1) {
          i.animate([{ transform: `translateY(${a.top - b.top}px)` }, { transform: 'none' }], { duration: 600, easing: 'cubic-bezier(.22,1,.36,1)' });
        }
      });
    }
    if (push) {
      const u = new URL(location.href);
      if (tag === 'all') u.searchParams.delete('tag'); else u.searchParams.set('tag', tag);
      history.replaceState(history.state, '', u);
    }
  };
  btns.forEach((b) => b.addEventListener('click', () => apply(b.dataset.tag!)));
  const initial = new URL(location.href).searchParams.get('tag');
  const start = btns.find((b) => b.dataset.tag === initial) ? initial! : 'all';
  requestAnimationFrame(() => apply(start, false));
  addEventListener('resize', () => { const c = btns.find((b) => b.getAttribute('aria-pressed') === 'true'); if (c) place(c); }, { signal: pageSignal() });
}

/* ---------- 归档：时间线随滚动绘制 ---------- */
export function initTimeline() {
  // 写作日历在窄屏上横向滚动，默认滚到最近
  const cal = $('[data-cal-scroll]');
  if (cal) cal.scrollLeft = cal.scrollWidth;
  const tl = $('[data-timeline]');
  if (!tl) return;
  const onScroll = () => {
    const r = tl.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * 0.6 - r.top) / r.height));
    tl.style.setProperty('--draw', p.toFixed(4));
    $$('[data-tl-item]', tl).forEach((it) => {
      it.classList.toggle('passed', it.getBoundingClientRect().top < innerHeight * 0.6);
    });
  };
  addEventListener('scroll', () => requestAnimationFrame(onScroll), { passive: true, signal: pageSignal() });
  onScroll();
}
