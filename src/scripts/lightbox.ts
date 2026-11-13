import { $$, reduced, pageSignal } from './util';

/* ---------- 图片：模糊占位淡出 ---------- */
export function initFigures() {
  $$<HTMLImageElement>('.fig__frame[data-ph] img').forEach((img) => {
    const done = () => img.closest('.fig__frame')?.classList.add('is-loaded');
    if (img.complete && img.naturalWidth) done();
    else img.addEventListener('load', done, { once: true });
  });
}

/** 选一张最清晰的：data-full > srcset 里最宽的 > src */
function bestSrc(img: HTMLImageElement) {
  if (img.dataset.full) return img.dataset.full;
  const set = img.srcset
    .split(',')
    .map((s) => s.trim().split(/\s+/))
    .filter((p) => p[0])
    .map(([u, w]) => ({ u, w: parseInt(w) || 0 }))
    .sort((a, b) => b.w - a.w);
  return set[0]?.u || img.currentSrc || img.src;
}
function captionOf(img: HTMLImageElement) {
  const fig = img.closest('figure');
  const cap = fig && !fig.classList.contains('post__cover') ? fig.querySelector(':scope > figcaption')?.textContent?.trim() : '';
  return cap || img.alt || '';
}

let dlg: HTMLDialogElement | null = null;
function build() {
  const d = document.createElement('dialog');
  d.className = 'lb';
  d.setAttribute('aria-label', '图片查看');
  d.innerHTML = `
    <p class="lb__hint" aria-hidden="true"><kbd>←</kbd> <kbd>→</kbd> 切换　<kbd>Esc</kbd> 关闭</p>
    <div class="lb__stage" data-lb-stage><img class="lb__img" alt="" data-lb-img draggable="false" /></div>
    <button type="button" class="lb__btn lb__close" data-lb-close aria-label="关闭">✕</button>
    <div class="lb__bar">
      <span class="lb__count" data-lb-count></span>
      <p class="lb__cap" data-lb-cap aria-live="polite"></p>
      <div class="lb__nav">
        <button type="button" class="lb__btn" data-lb-prev aria-label="上一张">←</button>
        <button type="button" class="lb__btn" data-lb-next aria-label="下一张">→</button>
      </div>
    </div>`;
  document.body.appendChild(d);
  return d;
}

export function initLightbox() {
  const imgs = $$<HTMLImageElement>('[data-cover] img, [data-article] img').filter((i) => !i.closest('a'));
  if (!imgs.length) return;
  const sig = pageSignal();
  if (!dlg || !dlg.isConnected) dlg = build();
  const d = dlg;
  const big = d.querySelector<HTMLImageElement>('[data-lb-img]')!;
  const stage = d.querySelector<HTMLElement>('[data-lb-stage]')!;
  const cap = d.querySelector<HTMLElement>('[data-lb-cap]')!;
  const count = d.querySelector<HTMLElement>('[data-lb-count]')!;
  const prev = d.querySelector<HTMLButtonElement>('[data-lb-prev]')!;
  const next = d.querySelector<HTMLButtonElement>('[data-lb-next]')!;
  let cur = 0;

  const show = (i: number, dir: 0 | 1 | -1 = 0) => {
    cur = i;
    const img = imgs[i];
    const apply = () => {
      big.src = img.currentSrc || img.src; // 先用已加载的小图，立刻出现
      big.alt = img.alt;
      big.width = img.naturalWidth || img.width;
      big.height = img.naturalHeight || img.height;
      const full = bestSrc(img);
      if (full && full !== big.src) {
        const pre = new Image();
        pre.onload = () => { if (cur === i) big.src = full; };
        pre.src = full;
      }
      cap.textContent = captionOf(img);
      count.textContent = `${i + 1} / ${imgs.length}`;
      prev.disabled = i === 0;
      next.disabled = i === imgs.length - 1;
      big.className = 'lb__img' + (dir && !reduced() ? (dir > 0 ? ' is-in-l' : ' is-in-r') : '');
    };
    if (dir && !reduced() && d.open) {
      big.className = 'lb__img ' + (dir > 0 ? 'is-out-l' : 'is-out-r');
      setTimeout(apply, 200);
    } else apply();
  };
  const go = (dir: 1 | -1) => {
    const n = cur + dir;
    if (n >= 0 && n < imgs.length) show(n, dir);
  };

  const open = (i: number) => {
    d.classList.toggle('is-single', imgs.length === 1);
    show(i);
    d.showModal();
    document.documentElement.style.overflow = 'hidden';
    if (reduced()) return;
    // FLIP：从正文里的位置放大出来
    const from = imgs[i].getBoundingClientRect();
    requestAnimationFrame(() => {
      const to = big.getBoundingClientRect();
      if (!to.width) return;
      const s = from.width / to.width;
      big.animate(
        [
          { transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${s})`, transformOrigin: '0 0' },
          { transform: 'none', transformOrigin: '0 0' },
        ],
        { duration: 420, easing: 'cubic-bezier(.22,1,.36,1)' },
      );
    });
  };
  const close = () => {
    if (!d.open) return;
    document.documentElement.style.overflow = '';
    const thumb = imgs[cur];
    const finish = () => { d.close(); thumb.focus({ preventScroll: true }); };
    const r = thumb.getBoundingClientRect();
    const to = big.getBoundingClientRect();
    const visible = r.bottom > 0 && r.top < innerHeight;
    if (reduced() || !visible || !to.width) return finish();
    big.animate(
      [
        { transform: 'none', transformOrigin: '0 0' },
        { transform: `translate(${r.left - to.left}px, ${r.top - to.top}px) scale(${r.width / to.width})`, transformOrigin: '0 0' },
      ],
      { duration: 320, easing: 'cubic-bezier(.22,1,.36,1)' },
    ).finished.then(finish, finish);
  };

  imgs.forEach((img, i) => {
    img.classList.add('zoomable');
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    img.setAttribute('aria-haspopup', 'dialog');
    img.setAttribute('aria-label', `查看大图：${img.alt || '图片'}`);
    img.addEventListener('click', () => open(i), { signal: sig });
    img.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
    }, { signal: sig });
  });

  d.onkeydown = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    else if (e.key === 'Home') { e.preventDefault(); if (cur) show(0, -1); }
    else if (e.key === 'End') { e.preventDefault(); if (cur < imgs.length - 1) show(imgs.length - 1, 1); }
  };
  d.oncancel = (e) => { e.preventDefault(); close(); };
  // 触屏上用 pointerup 直接触发（滑动之后浏览器偶尔会吞掉下一次 click），并忽略随后补发的 click
  let lastTouch = 0;
  const press = (btn: HTMLElement, fn: () => void) => {
    btn.onpointerup = (e) => { if (e.pointerType === 'touch') { lastTouch = Date.now(); fn(); } };
    btn.onclick = () => { if (Date.now() - lastTouch > 600) fn(); };
  };
  press(prev, () => go(-1));
  press(next, () => go(1));
  press(d.querySelector<HTMLButtonElement>('[data-lb-close]')!, close);
  d.onclick = (e) => { if (e.target === d) close(); };

  // 点图片以外的地方关闭；手机上左右滑动切换
  let x0 = 0, y0 = 0, dx = 0, drag = false, moved = false;
  stage.onpointerdown = (e) => {
    x0 = e.clientX; y0 = e.clientY; dx = 0; moved = false;
    drag = e.pointerType !== 'mouse';
  };
  stage.onpointermove = (e) => {
    if (!drag) return;
    dx = e.clientX - x0;
    if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(e.clientY - y0)) {
      moved = true;
      big.style.transform = `translateX(${dx}px) rotate(${dx / 60}deg)`;
    }
  };
  stage.onpointerup = (e) => {
    const wasDrag = drag && moved;
    drag = false;
    big.style.transform = '';
    if (wasDrag) {
      if (dx < -60) go(1);
      else if (dx > 60) go(-1);
      return;
    }
    if (e.target !== big) close();
  };
  stage.onpointercancel = () => { drag = false; big.style.transform = ''; };

  sig.addEventListener('abort', () => { if (d.open) { d.close(); document.documentElement.style.overflow = ''; } });
}
