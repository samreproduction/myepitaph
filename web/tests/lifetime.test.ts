import { describe, expect, it } from 'vitest';
import { lifetime, livingText } from '../src/Lifetime';

const at = (iso: string) => Date.parse(iso);

describe('lifetime', () => {
  it('從生日香港時間零時起算小時與秒', () => {
    expect(lifetime('2001-03-02', at('2001-03-01T16:00:00Z'))).toBe('0 小時 0 秒');
    expect(lifetime('2001-03-02', at('2001-03-01T17:00:01Z'))).toBe('1 小時 1 秒');
    expect(lifetime('2001-03-02', at('2026-10-17T05:37:40Z'))).toBe('224,653 小時 2,260 秒');
  });
  it('生日之前不出現負數', () => {
    expect(lifetime('2001-03-02', at('2000-01-01T00:00:00Z'))).toBe('0 小時 0 秒');
  });
});

describe('livingText', () => {
  it('替換標記，其他文字不變', () => {
    expect(livingText('我已存在世上 {{存在:2001-03-02}}', at('2001-03-01T16:00:59Z'))).toBe('我已存在世上 0 小時 59 秒');
    expect(livingText('思想是殺不死的', 0)).toBe('思想是殺不死的');
  });
});
