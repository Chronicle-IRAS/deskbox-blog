function initComments(): void {
  const root = document.querySelector<HTMLElement>('[data-comments]');
  if (!root) return;

  const button = root.querySelector<HTMLButtonElement>('[data-comments-load]');
  const status = root.querySelector<HTMLElement>('[data-comments-status]');
  const mount = root.querySelector<HTMLElement>('#comments-mount');

  if (!button || !status || !mount) return;

  let loaded = false;

  const currentTheme = () => {
    const explicit = document.documentElement.dataset.theme;
    if (explicit === 'light' || explicit === 'dark') return explicit;
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  };

  const setStatus = (message: string, isError = false) => {
    status.textContent = message;
    status.dataset.state = isError ? 'error' : 'idle';
  };

  const postTheme = () => {
    const iframe = mount.querySelector('iframe');
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage(
      { giscus: { setConfig: { theme: currentTheme() } } },
      'https://giscus.app',
    );
  };

  new MutationObserver(postTheme).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });

  button.addEventListener('click', () => {
    if (loaded) return;

    button.disabled = true;
    button.textContent = '正在加载…';
    setStatus('正在加载评论…');

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.setAttribute('data-repo', root.dataset.repo ?? '');
    script.setAttribute('data-repo-id', root.dataset.repoId ?? '');
    script.setAttribute('data-category', root.dataset.category ?? '');
    script.setAttribute('data-category-id', root.dataset.categoryId ?? '');
    script.setAttribute('data-mapping', root.dataset.mapping ?? 'pathname');
    script.setAttribute(
      'data-reactions-enabled',
      root.dataset.reactionsEnabled ?? '1',
    );
    script.setAttribute(
      'data-input-position',
      root.dataset.inputPosition ?? 'top',
    );
    script.setAttribute('data-lang', root.dataset.lang ?? 'zh-CN');
    script.setAttribute('data-theme', currentTheme());
    script.setAttribute('data-loading', 'lazy');

    script.addEventListener('load', () => {
      loaded = true;
      button.hidden = true;
      setStatus('');
    });

    script.addEventListener('error', () => {
      button.disabled = false;
      button.textContent = '重试加载评论';
      setStatus('评论加载失败，请稍后再试。', true);
    });

    mount.append(script);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initComments, { once: true });
} else {
  initComments();
}
