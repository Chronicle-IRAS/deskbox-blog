interface PagefindData {
  url: string;
  title?: string;
  excerpt: string;
  meta?: {
    title?: string;
    date?: string;
    tags?: string;
  };
}

interface PagefindResult {
  data(): Promise<PagefindData>;
}

interface PagefindModule {
  init?: () => Promise<void>;
  search(query: string): Promise<{ results: PagefindResult[] }>;
}

function initSearch(): void {
  const input = document.querySelector<HTMLInputElement>('#search-input');
  const status = document.querySelector<HTMLElement>('#search-status');
  const results = document.querySelector<HTMLOListElement>('#search-results');

  if (!input || !status || !results) return;

  let pagefindPromise: Promise<PagefindModule | null> | null = null;
  let timer: number | undefined;

  const setStatus = (message: string, isError = false) => {
    status.textContent = message;
    status.dataset.state = isError ? 'error' : 'idle';
  };

  const renderResults = (items: PagefindData[]) => {
    results.replaceChildren();

    for (const item of items) {
      const listItem = document.createElement('li');
      listItem.className = 'search-result';

      const link = document.createElement('a');
      link.href = item.url;
      link.textContent = item.meta?.title || item.title || '未命名';

      const metaText = [item.meta?.date, item.meta?.tags]
        .filter((value): value is string => Boolean(value))
        .join(' · ');

      const excerpt = document.createElement('p');
      excerpt.className = 'search-excerpt';

      const template = document.createElement('template');
      template.innerHTML = item.excerpt;
      template.content.querySelectorAll('*').forEach((element) => {
        if (element.tagName !== 'MARK') {
          element.replaceWith(...element.childNodes);
        }
      });
      excerpt.append(template.content);

      listItem.append(link);
      if (metaText) {
        const meta = document.createElement('p');
        meta.className = 'search-result__meta';
        meta.textContent = metaText;
        listItem.append(meta);
      }
      listItem.append(excerpt);
      results.append(listItem);
    }
  };

  const loadPagefind = (): Promise<PagefindModule | null> => {
    if (!pagefindPromise) {
      const pagefindPath = '/pagefind/pagefind.js';
      pagefindPromise = import(/* @vite-ignore */ pagefindPath)
        .then(async (module) => {
          const pagefind = module as unknown as PagefindModule;
          if (typeof pagefind.init === 'function') {
            await pagefind.init();
          }
          return pagefind;
        })
        .catch(() => null);
    }

    return pagefindPromise;
  };

  const runSearch = async (query: string) => {
    const value = query.trim();
    if (!value) {
      results.replaceChildren();
      setStatus('输入关键词开始搜索。');
      return;
    }

    setStatus('搜索中…');
    const pagefind = await loadPagefind();

    if (!pagefind) {
      results.replaceChildren();
      setStatus(
        '搜索索引尚未生成。请运行 npm run build && npm run preview。',
        true,
      );
      return;
    }

    try {
      const response = await pagefind.search(value);
      const items = await Promise.all(
        response.results.map((result) => result.data()),
      );
      renderResults(items);
      setStatus(
        items.length > 0
          ? `共 ${items.length} 条结果`
          : '没有找到匹配的内容。试试更短的关键词，或浏览归档。',
      );
    } catch {
      results.replaceChildren();
      setStatus('搜索暂时不可用，请稍后再试。', true);
    }
  };

  const updateQuery = (value: string) => {
    const url = new URL(location.href);
    if (value.trim()) url.searchParams.set('q', value.trim());
    else url.searchParams.delete('q');
    history.replaceState(null, '', `${url.pathname}${url.search}`);
  };

  input.addEventListener('input', () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      updateQuery(input.value);
      void runSearch(input.value);
    }, 200);
  });

  input.form?.addEventListener('submit', (event) => {
    event.preventDefault();
    updateQuery(input.value);
    void runSearch(input.value);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    const target = event.target;
    if (
      target instanceof HTMLElement &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable)
    ) {
      return;
    }

    event.preventDefault();
    input.focus();
    input.select();
  });

  const initial = new URL(location.href).searchParams.get('q') ?? '';
  input.value = initial;
  void runSearch(initial);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSearch, { once: true });
} else {
  initSearch();
}
