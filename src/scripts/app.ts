import { resetPage } from './util';
import { initThemeControls } from './theme';
import { initNav } from './nav';
import { initReveal, initClock } from './fx';
import { initSearch } from './search';
import { initPost } from './post';
import { initPreview, initFilter, initTimeline } from './lists';

document.addEventListener('astro:page-load', () => {
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
});
