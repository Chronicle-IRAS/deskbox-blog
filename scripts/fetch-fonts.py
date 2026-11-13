#!/usr/bin/env python3
"""下载拉丁字体并裁剪为 woff2，输出到 public/fonts/（一次性运行，产物已提交）。

依赖：python3 -m pip install fonttools brotli
中文标题字体（Noto Serif SC）不在这里处理：它在每次 build 后按页面实际用到的字重新子集化，见 scripts/postbuild.mjs。
"""
import re, subprocess, sys, urllib.request, tempfile
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / 'public/fonts'
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
LATIN = 'U+0020-007E,U+00A0-00FF,U+2013,U+2014,U+2018,U+2019,U+201C,U+201D,U+2022,U+2026,U+2190-2193,U+2197,U+2318,U+21B5,U+2212,U+00B7'

FAMILIES = {
    # 文件名: (Google Fonts css2 family 参数, 样式)
    'geist': ('Geist:wght@300..700', 'normal'),
    'geist-mono': ('Geist+Mono:wght@400..600', 'normal'),
    'fraunces': ('Fraunces:ital,opsz,wght@0,9..144,300..700', 'normal'),
    'fraunces-italic': ('Fraunces:ital,opsz,wght@1,9..144,300..700', 'italic'),
}

def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()

def pin(path):
    from fontTools.ttLib import TTFont
    from fontTools.varLib import instancer
    f = TTFont(path)
    lim = {'opsz': 120}
    for a in f['fvar'].axes:
        if a.axisTag == 'SOFT': lim['SOFT'] = 50
        if a.axisTag == 'WONK': lim['WONK'] = a.defaultValue
    f = instancer.instantiateVariableFont(f, lim)
    f.flavor = 'woff2'
    f.save(path)

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, (fam, style) in FAMILIES.items():
        css = get(f'https://fonts.googleapis.com/css2?family={fam}&display=swap').decode()
        blocks = re.findall(r'/\* latin \*/\s*@font-face\s*{([^}]*)}', css)
        block = next(b for b in blocks if f'font-style: {style}' in b)
        url = re.search(r'url\((https://[^)]+)\)', block).group(1)
        with tempfile.NamedTemporaryFile(suffix='.woff2', delete=False) as t:
            t.write(get(url))
        dst = OUT / f'{name}.woff2'
        subprocess.run([sys.executable, '-m', 'fontTools.subset', t.name, f'--output-file={dst}',
                        '--flavor=woff2', '--layout-features=*', '--no-hinting', f'--unicodes={LATIN}'], check=True)
        if name.startswith('fraunces'):
            pin(dst)  # 只在大字号用，固定光学尺寸与 SOFT 轴，体积减半
        print(name, dst.stat().st_size // 1024, 'KB')

if __name__ == '__main__':
    main()
