import { resetPage } from './util';
import { initThemeControls } from './theme';
import { initNav } from './nav';
import { initReveal, initClock } from './fx';
import { initSearch } from './search';
import { initPost } from './post';
import { initPreview, initFilter, initTimeline } from './lists';

function initPage() {
  resetPage();
  initThemeControls();
  initNav();
  initReveal();
  initClock();
  initSearch();
  initPost();
  initPreview();
  initFilter();
  initTimeline();
}

// Server-rendered pages use native navigation; initialize on every document load.
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initPage, { once: true });
else initPage();
