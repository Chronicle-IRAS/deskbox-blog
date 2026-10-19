function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }

  const { promise, resolve, reject } = Promise.withResolvers<void>();
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();

  try {
    const ok = document.execCommand('copy');
    if (ok) resolve();
    else reject(new Error('copy failed'));
  } catch (error) {
    reject(error);
  } finally {
    textarea.remove();
  }

  return promise;
}

function initCodeCopy(): void {
  const blocks = document.querySelectorAll<HTMLPreElement>('.prose pre');

  blocks.forEach((pre) => {
    if (pre.dataset.copyReady === 'true') return;
    pre.dataset.copyReady = 'true';
    pre.tabIndex = 0;
    if (!pre.hasAttribute('aria-label')) {
      pre.setAttribute('aria-label', '代码块');
    }

    const parent = pre.parentNode;
    if (!parent) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'code-block';

    const status = document.createElement('span');
    status.className = 'code-copy__status';
    status.setAttribute('aria-live', 'polite');

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'code-copy';
    button.setAttribute('aria-label', '复制代码');
    button.textContent = '复制';

    const language = pre.dataset.language;
    if (language) {
      const label = document.createElement('span');
      label.className = 'code-lang';
      label.textContent = language;
      wrapper.appendChild(label);
    }

    parent.insertBefore(wrapper, pre);
    wrapper.appendChild(button);
    wrapper.appendChild(status);
    wrapper.appendChild(pre);

    button.addEventListener('click', async () => {
      const code =
        pre.querySelector('code')?.textContent ?? pre.textContent ?? '';

      try {
        await copyText(code);
        button.textContent = '已复制';
        button.dataset.state = 'copied';
        status.textContent = '已复制';
      } catch {
        button.textContent = '复制失败';
        button.dataset.state = 'error';
        status.textContent = '复制失败';
      }

      window.setTimeout(() => {
        button.textContent = '复制';
        delete button.dataset.state;
        status.textContent = '';
      }, 2000);
    });
  });

  const tables = document.querySelectorAll<HTMLTableElement>('.prose table');
  tables.forEach((table) => {
    if (!table.hasAttribute('tabindex')) {
      table.tabIndex = 0;
    }
    if (!table.hasAttribute('aria-label')) {
      table.setAttribute('aria-label', '数据表格');
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCodeCopy, { once: true });
} else {
  initCodeCopy();
}
