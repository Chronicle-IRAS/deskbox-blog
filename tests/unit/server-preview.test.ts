import { describe, expect, it } from 'vitest';
import { renderMarkdown } from '../../src/server/render';

describe('renderMarkdown', () => {
  it('renders GFM headings and computes reading time', async () => {
    const rendered = await renderMarkdown('## 标题\n\n正文内容。');

    expect(rendered.headings[0]).toMatchObject({ depth: 2, text: '标题' });
    expect(rendered.html).toContain('<h2');
    expect(rendered.readingMinutes).toBeGreaterThanOrEqual(1);
  });

  it('removes scripts and event attributes', async () => {
    const rendered = await renderMarkdown(
      '<script>alert(1)</script>\n\n<img src="x" onerror="alert(1)">\n\n正文',
    );

    expect(rendered.html).not.toContain('<script');
    expect(rendered.html).not.toContain('onerror');
  });
});
