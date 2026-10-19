import { describe, expect, it } from 'vitest';
import { dayKey, formatDate } from '../../src/lib/format';

describe('formatDate', () => {
  it('按 Asia/Shanghai 显示为点分日期', () => {
    expect(formatDate(new Date('2026-10-18T00:00:00Z'))).toBe('2026.10.18');
  });

  it('不因构建机时区回退一天', () => {
    expect(dayKey(new Date('2026-10-17T15:59:59Z'))).toBe('2026-10-17');
    expect(dayKey(new Date('2026-10-17T16:00:00Z'))).toBe('2026-10-18');
  });

  it('跨年边界正确', () => {
    expect(formatDate(new Date('2025-12-31T16:00:00Z'))).toBe('2026.01.01');
  });
});
