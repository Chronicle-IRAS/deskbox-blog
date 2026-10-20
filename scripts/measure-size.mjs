import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST = 'dist';

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function bytes(path) {
  return statSync(path).size;
}

function gzipBytes(path) {
  return gzipSync(readFileSync(path), { level: 9 }).length;
}

function format(size) {
  return `${(size / 1024).toFixed(1)} KB`;
}

function categoryFor(file) {
  const path = relative(DIST, file).replaceAll('\\', '/');

  if (path.startsWith('pagefind/')) return 'pagefind';
  if (path.endsWith('.html')) return 'html';
  if (path.endsWith('.css')) return 'css';
  if (path.endsWith('.js')) return 'js';
  if (/\.(png|jpe?g|webp|avif|gif|svg|ico)$/i.test(path)) return 'image';
  if (/\.(woff2?|ttf|otf)$/i.test(path)) return 'font';
  return 'other';
}

const files = walk(DIST);
const categories = new Map();

for (const file of files) {
  const category = categoryFor(file);
  const entry = categories.get(category) ?? { count: 0, raw: 0, gzip: 0 };
  entry.count += 1;
  entry.raw += bytes(file);
  entry.gzip += gzipBytes(file);
  categories.set(category, entry);
}

console.log('Build size report');
console.log('=================');
console.log('');

for (const [name, entry] of [...categories.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  console.log(
    `${name.padEnd(8)} ${String(entry.count).padStart(3)} files  raw ${format(entry.raw).padStart(9)}  gzip ${format(entry.gzip).padStart(9)}`,
  );
}

function linkedBytes(html, pattern) {
  let total = 0;

  for (const match of html.matchAll(pattern)) {
    const asset = join(DIST, match[1].replace(/^\//, ''));
    if (statSync(asset, { throwIfNoEntry: false })) total += gzipBytes(asset);
  }

  return total;
}

console.log('');
console.log('Key HTML pages (gzip)');
console.log('---------------------');

const pages = [
  'index.html',
  'blog/index.html',
  'blog/page/2/index.html',
  'blog/astro-content-collections/index.html',
  'tags/index.html',
  'tags/frontend/index.html',
  'archive/index.html',
  'search/index.html',
  'about/index.html',
  '404.html',
  'styleguide/index.html',
];

for (const page of pages) {
  const file = join(DIST, page);

  if (!statSync(file, { throwIfNoEntry: false })) continue;

  const html = readFileSync(file, 'utf8');
  const css = linkedBytes(html, /<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g);
  const js = linkedBytes(html, /<script[^>]*src="([^"]+)"/g);

  console.log(
    `${page.padEnd(52)} html ${format(gzipBytes(file)).padStart(9)}  css ${format(css).padStart(8)}  js ${format(js).padStart(7)}`,
  );
}

console.log('');
console.log('Initial JS assets (gzip)');
console.log('------------------------');

const jsFiles = files.filter((file) => categoryFor(file) === 'js');

for (const file of jsFiles) {
  console.log(`${relative(DIST, file).padEnd(52)} ${format(gzipBytes(file)).padStart(9)}`);
}

if (jsFiles.length === 0) console.log('(none outside Pagefind)');
