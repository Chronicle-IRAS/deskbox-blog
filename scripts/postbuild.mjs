// 构建后处理：
// 1. 把页面里所有"标题字"收集起来，用系统里的 Noto Serif CJK SC Bold 子集化成 display-sc.woff2
//    （只含实际出现的汉字，通常几十 KB；构建机没有该字体时跳过，沿用仓库里已提交的版本）
// 2. 用 Pagefind 生成全文搜索索引
import { readFileSync, readdirSync, statSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { parse } from 'node-html-parser';

const DIST = 'dist/client';
const TTC = '/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc';

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? htmlFiles(p) : p.endsWith('.html') ? [p] : [];
  });
}

// 用到 --f-display 的元素：h1–h4、.display 以及少数指定类名
const SEL = 'h1, h2, h3, h4, .display, .row__title, .row__no, .pv__title, .brand__name, .rocker__body, .menu a, .sp__label, .stamp__d, .lead__desc, .ic__n, .idx h3, .about__big, .lib__h, .series__name, .pn__t, .r-t, blockquote, .foot__word, .foot__say';
let chars = new Set('0123456789：，。、？！“”‘’（）《》·—…%#');
const files = htmlFiles(DIST);
for (const f of files) {
  const root = parse(readFileSync(f, 'utf8'));
  for (const el of root.querySelectorAll(SEL)) for (const c of el.textContent) if (c.charCodeAt(0) > 0x2e7f) chars.add(c);
  // 列表悬停预览会显示任意文章标题
  for (const el of root.querySelectorAll('[data-title]')) for (const c of el.getAttribute('data-title')) if (c.charCodeAt(0) > 0x2e7f) chars.add(c);
}
// 运行时脚本里会出现的问候语
for (const c of '早上好上午好中午好下午好晚上好夜深了你好') chars.add(c);
const text = [...chars].join('');

if (existsSync(TTC)) {
  // 找到 TTC 里的 SC 子字体
  const idx = execFileSync('python3', ['-c', `
from fontTools.ttLib import TTCollection
c = TTCollection('${TTC}')
for i, f in enumerate(c.fonts):
    if 'SC' in f['name'].getDebugName(1): print(i); break
`]).toString().trim();
  writeFileSync('/tmp/display-chars.txt', text);
  execFileSync('python3', ['-m', 'fontTools.subset', TTC, `--font-number=${idx}`, '--text-file=/tmp/display-chars.txt',
    '--output-file=public/fonts/display-sc.woff2', '--flavor=woff2', '--layout-features=kern,palt,vpal', '--no-hinting', '--desubroutinize'], { stdio: 'inherit' });
  copyFileSync('public/fonts/display-sc.woff2', join(DIST, 'fonts/display-sc.woff2'));
  console.log(`[fonts] display-sc.woff2: ${chars.size} 字, ${(statSync('public/fonts/display-sc.woff2').size / 1024).toFixed(1)} KB`);
} else {
  console.warn('[fonts] 未找到 Noto Serif CJK，跳过子集化，沿用已提交的 display-sc.woff2');
}

execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['pagefind', '--site', DIST, '--force-language', 'zh'], { stdio: 'inherit' });
