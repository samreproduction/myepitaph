import { describe, expect, it } from 'vitest';
import { shapeFor } from '../src/shape';
import { fixtures } from '../src/fixtures';

describe('shapeFor', () => {
  it('同一文字兩次結果深度相等', () => {
    expect(shapeFor(fixtures[0].text)).toEqual(shapeFor(fixtures[0].text));
  });
  it('不同假文字產生不同形狀', () => {
    expect(shapeFor(fixtures[0].text)).not.toEqual(shapeFor(fixtures[1].text));
  });
  it('手動覆寫 kind 生效且改變幾何', () => {
    expect(shapeFor('測試', { kind: 'orbit' }).kind).toBe('orbit');
    expect(shapeFor('測試', { kind: 'orbit' }).paths).not.toEqual(shapeFor('測試', { kind: 'fold' }).paths);
  });
  it('空字串與 Unicode 也有確定且有限的參數', () => {
    for (const text of ['', '假文字🌱\n第二段！']) {
      expect(shapeFor(text)).toEqual(shapeFor(text));
      expect(Number.isFinite(shapeFor(text).rotation)).toBe(true);
    }
  });
});
