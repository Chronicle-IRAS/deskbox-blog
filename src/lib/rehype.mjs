// 自写的几个轻量 rehype 插件：标题锚点、代码块外框、外链属性
import GithubSlugger from 'github-slugger';

function walk(node, fn, parent = null, index = 0) {
  fn(node, parent, index);
  if (node.children) {
    for (let i = 0; i < node.children.length; i++) walk(node.children[i], fn, node, i);
  }
}

function text(node) {
  if (node.type === 'text') return node.value;
  return (node.children || []).map(text).join('');
}

const el = (tagName, properties = {}, children = []) => ({ type: 'element', tagName, properties, children });

/** h2/h3：生成稳定 id，并在末尾加一个可聚焦的 # 锚点 */
export function rehypeHeadingAnchors() {
  return (tree) => {
    const slugger = new GithubSlugger();
    walk(tree, (node) => {
      if (node.type !== 'element' || !/^h[2-4]$/.test(node.tagName)) return;
      const label = text(node).trim();
      const id = node.properties.id || slugger.slug(label);
      node.properties.id = id;
      node.children.push(
        el('a', { className: ['h-anchor'], href: `#${id}`, ariaLabel: `链接到“${label}”` }, [
          { type: 'text', value: '#' },
        ]),
      );
    });
  };
}

/** 代码块：包一层 figure，顶部显示语言与复制按钮（按钮由客户端脚本激活） */
export function rehypeCodeFrame() {
  return (tree) => {
    walk(tree, (node, parent, index) => {
      if (!parent || node.type !== 'element' || node.tagName !== 'pre') return;
      if (parent.tagName === 'figure' && (parent.properties.className || []).includes('code')) return;
      const lang = node.properties.dataLanguage || 'text';
      const lines = text(node).replace(/\n$/, '').split('\n').length;
      const frame = el('figure', { className: ['code'], dataLang: lang }, [
        el('figcaption', { className: ['code__bar'] }, [
          el('span', { className: ['code__lang'] }, [{ type: 'text', value: lang }]),
          el('span', { className: ['code__lines'] }, [{ type: 'text', value: `${lines} 行` }]),
          el('button', { type: 'button', className: ['code__copy'], ariaLabel: '复制代码', dataCopy: '' }, [
            el('span', { className: ['code__copy-label'] }, [{ type: 'text', value: '复制' }]),
          ]),
        ]),
        node,
      ]);
      parent.children[index] = frame;
    });
  };
}

/** 外链：新标签打开 */
export function rehypeExternalLinks() {
  return (tree) => {
    walk(tree, (node) => {
      if (node.type !== 'element' || node.tagName !== 'a') return;
      const href = String(node.properties.href || '');
      if (/^https?:\/\//.test(href)) {
        node.properties.target = '_blank';
        node.properties.rel = ['noopener', 'noreferrer'];
      }
    });
  };
}

/** 表格：包一层可横向滚动的容器 */
export function rehypeTableWrap() {
  return (tree) => {
    walk(tree, (node, parent, index) => {
      if (!parent || node.type !== 'element' || node.tagName !== 'table') return;
      if (parent.tagName === 'div' && (parent.properties.className || []).includes('table-wrap')) return;
      parent.children[index] = el('div', { className: ['table-wrap'], tabIndex: 0, role: 'region', ariaLabel: '表格（可横向滚动）' }, [node]);
    });
  };
}

/**
 * 图片：
 * - 段落里只有一张图 → <figure class="fig">，Markdown 的 title（![alt](src "说明")）变成 <figcaption>
 * - 段落里连续多张图 → <div class="gallery">，两张就是左右并排，三张及以上是网格
 * - 本地图片：外面包一层 .fig__frame，并在构建期生成模糊占位图
 * - 外链图片：懒加载、不发送 referrer；地址末尾写 #1200x630 可声明宽高，避免布局跳动
 */
import { dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { blurDataURI } from './blur.mjs';

const isImg = (n) => n.type === 'element' && n.tagName === 'img';
const isBlank = (n) => (n.type === 'text' && !n.value.trim()) || (n.type === 'element' && n.tagName === 'br');

export function rehypeFigures() {
  return async (tree, file) => {
    const jobs = [];
    const frame = (img, n = 1) => {
      img.properties.sizes = n > 1 ? `(min-width: 780px) ${Math.round(700 / n)}px, ${Math.round(100 / Math.min(n, 2))}vw` : '(min-width: 780px) 700px, 100vw';
      const src = String(img.properties.src || '');
      const title = img.properties.title;
      delete img.properties.title;
      const frameProps = { className: ['fig__frame'] };
      if (/^https?:\/\//.test(src)) {
        const m = src.match(/#(\d+)x(\d+)$/);
        if (m) {
          img.properties.src = src.slice(0, -m[0].length);
          img.properties.width = Number(m[1]);
          img.properties.height = Number(m[2]);
        }
        img.properties.loading = 'lazy';
        img.properties.decoding = 'async';
        img.properties.referrerPolicy = 'no-referrer';
        img.properties.dataExternal = '';
      } else if (file.path && !src.startsWith('/')) {
        const fsPath = resolve(dirname(file.path), decodeURI(src));
        if (existsSync(fsPath)) {
          jobs.push(blurDataURI(fsPath).then((uri) => { if (uri) frameProps.style = `--ph:url(${uri})`; }));
          frameProps.dataPh = '';
        }
      }
      const kids = [el('span', frameProps, [img])];
      if (title) kids.push(el('figcaption', {}, [{ type: 'text', value: String(title) }]));
      return el('figure', { className: ['fig'] }, kids);
    };
    walk(tree, (node, parent, index) => {
      if (!parent || node.type !== 'element' || node.tagName !== 'p') return;
      const imgs = node.children.filter(isImg);
      if (!imgs.length || !node.children.every((c) => isImg(c) || isBlank(c))) return;
      if (imgs.length === 1) {
        parent.children[index] = frame(imgs[0]);
      } else {
        parent.children[index] = el('div', { className: ['gallery'], dataCols: String(Math.min(imgs.length, 3)) }, imgs.map((im) => frame(im, Math.min(imgs.length, 3))));
      }
    });
    await Promise.all(jobs);
  };
}
