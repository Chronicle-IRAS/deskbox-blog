import { describe, expect, it } from 'vitest';
import {
  escapeXml,
  OG_HEIGHT,
  OG_WIDTH,
  renderOgSvg,
  wrapText,
} from '../../src/lib/og';

describe('escapeXml', () => {
  it('escapes XML special characters', () => {
    expect(escapeXml(`<A & "B" 'C'>`)).toBe(
      '&lt;A &amp; &quot;B&quot; &apos;C&apos;&gt;',
    );
  });
});

describe('wrapText', () => {
  it('returns no lines for empty text', () => {
    expect(wrapText('   ', 100, 20, 2)).toEqual([]);
  });

  it('wraps CJK text within the line limit', () => {
    const lines = wrapText('内容集合与构建期校验', 60, 60, 2);

    expect(lines.length).toBeLessThanOrEqual(2);
    expect(lines.join('')).toContain('内容');
  });

  it('adds an ellipsis when the text exceeds the line budget', () => {
    const lines = wrapText('很长的标题'.repeat(20), 60, 60, 2);

    expect(lines).toHaveLength(2);
    expect(lines[1].endsWith('…')).toBe(true);
  });
});

describe('renderOgSvg', () => {
  it('renders a 1200×630 SVG with escaped content', () => {
    const svg = renderOgSvg({
      title: 'A & B <C>',
      description: '示例摘要',
      date: '2026.10.18',
      minutes: 3,
      tags: ['前端', '工程实践'],
    });

    expect(svg).toContain(`width="${OG_WIDTH}"`);
    expect(svg).toContain(`height="${OG_HEIGHT}"`);
    expect(svg).toContain('A &amp; B &lt;C&gt;');
    expect(svg).toContain('2026.10.18 · 约 3 分钟');
    expect(svg).toContain('#前端');
  });
});
