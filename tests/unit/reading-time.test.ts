import { describe, expect, it } from 'vitest';
import { readingTime } from '../../src/lib/reading-time';

describe('readingTime', () => {
  it('空内容返回 1 分钟', () => {
    expect(readingTime('')).toBe(1);
    expect(readingTime('   \n  ')).toBe(1);
  });

  it('中文按 300 字/分钟向上取整', () => {
    expect(readingTime('字'.repeat(300))).toBe(1);
    expect(readingTime('字'.repeat(301))).toBe(2);
    expect(readingTime('字'.repeat(600))).toBe(2);
  });

  it('英文按 200 词/分钟向上取整', () => {
    expect(readingTime('word '.repeat(200))).toBe(1);
    expect(readingTime('word '.repeat(201))).toBe(2);
  });

  it('代码块与图片不计入阅读时间', () => {
    const content = ['```ts', 'const value = 1;', '```', '![示意图](./diagram.png)'].join('\n');

    expect(readingTime(content)).toBe(1);
  });

  it('中英文混排分别计数', () => {
    const content = `${'字'.repeat(300)} ${'word '.repeat(200)}`;

    expect(readingTime(content)).toBe(2);
  });
});
