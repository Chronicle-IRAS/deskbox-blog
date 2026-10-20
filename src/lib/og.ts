export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

const CJK = /[㐀-䶿一-鿿豈-﫿]/;

export interface OgImageInput {
  title: string;
  description: string;
  date: string;
  minutes: number;
  tags: string[];
}

export function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function glyphWidth(char: string, fontSize: number): number {
  if (char === ' ') return fontSize * 0.3;
  if (CJK.test(char)) return fontSize;
  return fontSize * 0.58;
}

function textWidth(value: string, fontSize: number): number {
  return [...value].reduce((sum, char) => sum + glyphWidth(char, fontSize), 0);
}

export function wrapText(
  value: string,
  maxWidth: number,
  fontSize: number,
  maxLines: number,
): string[] {
  const text = value.replace(/\s+/g, ' ').trim();

  if (!text) return [];

  const tokens = text.match(/[㐀-䶿一-鿿豈-﫿]|[^\s]+|\s+/g) ?? [];
  const lines: string[] = [];
  let current = '';

  for (const token of tokens) {
    const candidate = `${current}${token}`;

    if (current && textWidth(candidate, fontSize) > maxWidth) {
      lines.push(current.trim());
      current = token.trimStart();

      if (lines.length === maxLines) break;
    } else {
      current = candidate;
    }
  }

  if (lines.length < maxLines && current.trim()) {
    lines.push(current.trim());
  }

  if (textWidth(text, fontSize) > maxWidth * maxLines) {
    const last = lines[maxLines - 1] ?? '';
    lines[maxLines - 1] = `${last.trimEnd()}…`;
  }

  return lines.slice(0, maxLines);
}

function textLines(
  lines: string[],
  x: number,
  y: number,
  lineHeight: number,
  attributes: string,
): string {
  if (lines.length === 0) return '';

  const spans = lines
    .map(
      (line, index) =>
        `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`,
    )
    .join('');

  return `<text x="${x}" y="${y}" ${attributes}>${spans}</text>`;
}

export function renderOgSvg(input: OgImageInput): string {
  const titleLines = wrapText(input.title, 1040, 60, 2);
  const descriptionLines = wrapText(input.description, 1040, 26, 2);
  const tagLine = wrapText(
    input.tags.map((tag) => `#${tag}`).join('   '),
    760,
    20,
    1,
  )[0] ?? '';
  const timeLabel = `${input.date} · 约 ${input.minutes} 分钟`;
  const label = escapeXml(`${input.title} · DeskBox`);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}" role="img" aria-label="${label}">
  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="#09090B"/>
  <rect x="0" y="0" width="${OG_WIDTH}" height="8" fill="#EC4899"/>
  <rect x="48" y="48" width="1104" height="534" fill="none" stroke="#27272A" stroke-width="2"/>
  <line x1="48" y1="132" x2="1152" y2="132" stroke="#27272A" stroke-width="2"/>
  <line x1="48" y1="498" x2="1152" y2="498" stroke="#27272A" stroke-width="2"/>
  <rect x="84" y="78" width="10" height="24" fill="#EC4899"/>
  <text x="108" y="97" fill="#FAFAFA" font-family="'JetBrains Mono', Consolas, monospace" font-size="20" font-weight="600" letter-spacing="2">DESKBOX · ARTICLE</text>
  <text x="1116" y="97" text-anchor="end" fill="#A1A1AA" font-family="'JetBrains Mono', Consolas, monospace" font-size="20">${escapeXml(timeLabel)}</text>
  ${textLines(
    titleLines,
    84,
    214,
    72,
    'fill="#FAFAFA" font-family="\'Songti SC\', \'STSong\', \'SimSun\', \'Noto Serif CJK SC\', \'Noto Serif SC\', Georgia, serif" font-size="60" font-weight="700"',
  )}
  ${textLines(
    descriptionLines,
    84,
    360,
    46,
    'fill="#A1A1AA" font-family="\'PingFang SC\', \'Microsoft YaHei\', \'Noto Sans CJK SC\', \'Noto Sans SC\', system-ui, sans-serif" font-size="26"',
  )}
  <rect x="84" y="452" width="120" height="4" fill="#EC4899"/>
  <text x="84" y="548" fill="#F9A8D4" font-family="'JetBrains Mono', Consolas, monospace" font-size="20" font-weight="600">${escapeXml(tagLine)}</text>
  <text x="1116" y="548" text-anchor="end" fill="#A1A1AA" font-family="'JetBrains Mono', Consolas, monospace" font-size="18">DeskBox · Blog</text>
</svg>`;
}
