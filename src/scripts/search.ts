import { $, $$ } from './util';

type Item = { t: string; d: string; u: string; date: string; tags?: string[]; body?: string };
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
function hl(s: string, q: string) {
  if (!q) return esc(s);
  const i = s.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return esc(s);
  return esc(s.slice(0, i)) + '<mark>' + esc(s.slice(i, i + q.length)) + '</mark>' + esc(s.slice(i + q.length));
}

let bound = false;
export function initSearch() {
  const dlg = $<HTMLDialogElement>('[data-search]');
  if (!dlg) return;
  const input = $<HTMLInputElement>('[data-search-input]', dlg)!;
  const list = $('[data-search-list]', dlg)!;
  const status = $('[data-search-status]', dlg)!;
  const tagsBox = $('[data-search-tags]', dlg)!;
  let index: Item[] = JSON.parse($('[data-search-index]', dlg)?.textContent || '[]');
  let loaded = false;
  let pending: Promise<void> | undefined;
  const load = () => {
    if (loaded) return Promise.resolve();
    if (!pending) {
      pending = fetch(dlg.dataset.searchSrc!, { headers: { Accept: 'application/json' } })
        .then(async (response) => {
          if (!response.ok) throw new Error('Search index unavailable');
          const data: Item[] = await response.json();
          index = data;
          loaded = true;
        })
        .finally(() => { pending = undefined; });
    }
    return pending;
  };
  let sel = 0;
  let seq = 0;

  const render = (items: { t: string; d: string; u: string; date?: string }[], q: string, raw = false) => {
    sel = 0;
    list.innerHTML = items
      .map((r, i) => `<li><a href="${r.u}" role="option" aria-selected="${i === 0}"><span class="r-t">${raw ? r.t : hl(r.t, q)}</span><span class="r-date">${r.date ?? ''}</span><span class="r-d">${raw ? r.d : hl(r.d, q)}</span></a></li>`)
      .join('');
  };
  const empty = () => {
    status.textContent = '最近文章';
    tagsBox.hidden = false;
    render(index.slice(0, 5), '');
  };
  const run = async () => {
    const q = input.value.trim();
    const my = ++seq;
    if (!q) return empty();
    tagsBox.hidden = true;
    status.innerHTML = '<span class="tw">检索中……</span>';
    try { await load(); } catch {
      if (my === seq) status.textContent = '搜索暂时不可用，请稍后重试';
      return;
    }
    if (my !== seq || !dlg.open) return;
    const lq = q.toLowerCase();
    const results = index.filter((x) => (x.t + x.d + (x.tags || []).join(' ') + (x.body || '')).toLowerCase().includes(lq));
    status.textContent = results.length ? results.length + ' 篇相关' : '没有找到，换个词试试';
    render(results.slice(0, 12), q);

  };
  input.oninput = run;
  input.onkeydown = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); dlg.close(); return; }
    const items = $$<HTMLAnchorElement>('a', list);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!items.length) return;
      items[sel]?.setAttribute('aria-selected', 'false');
      sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items[sel].setAttribute('aria-selected', 'true');
      items[sel].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      const a = items[sel];
      if (a) { e.preventDefault(); dlg.close(); a.click(); }
    }
  };
  dlg.addEventListener('close', () => { ++seq; });
  dlg.onclick = (e) => {
    if (e.target === dlg) dlg.close();
    if ((e.target as Element).closest('a')) dlg.close();
  };
  const open = () => {
    if (dlg.open) return;
    ++seq;
    dlg.showModal();
    empty();
    input.value = '';
    input.focus();
    // Recent titles are available immediately; full text stays off the critical path.
    void load().then(() => {
      if (dlg.open && !input.value.trim()) empty();
    }).catch(() => {
      if (dlg.open && !input.value.trim()) status.textContent = '搜索暂时不可用，请稍后重试';
    });

  };
  $$('[data-search-open]').forEach((b) => (b.onclick = open));
  const closeBtn = $('[data-search-close]', dlg);
  if (closeBtn) closeBtn.onclick = () => dlg.close();
  if (!bound) {
    bound = true;
    addEventListener('keydown', (e) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !/INPUT|TEXTAREA/.test(tag))) {
        e.preventDefault();
        $$('[data-search-open]')[0]?.click();
      }
    });
  }
}
