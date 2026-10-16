import { describe, expect, it } from 'vitest';
import { shapeFor, shapeKinds } from '../src/shape';
import { fixtures } from '../src/fixtures';

describe('shapeFor', () => {
  it('同一文字兩次結果深度相等', () => {
    expect(shapeFor(fixtures[0].text)).toEqual(shapeFor(fixtures[0].text));
  });
  it('不同假文字產生不同形狀', () => {
    expect(shapeFor(fixtures[0].text)).not.toEqual(shapeFor(fixtures[1].text));
  });
  it('手動覆寫 kind 生效且改變幾何', () => {
    expect(shapeFor('測試', { kind: 'tree' }).kind).toBe('tree');
    expect(shapeFor('測試', { kind: 'tree' }).paths).not.toEqual(shapeFor('測試', { kind: 'flower' }).paths);
  });
  it('空字串與 Unicode 也有確定且有限的參數', () => {
    for (const text of ['', '假文字🌱\n第二段！']) {
      expect(shapeFor(text)).toEqual(shapeFor(text));
      expect(Number.isFinite(shapeFor(text).rotation)).toBe(true);
    }
  });
  for (const kind of shapeKinds) {
    it(`${kind} 可覆寫、座標有邊距，且文字決定細節`, () => {
      for (const text of ['', '測試。', '第一段！\n第二段，\n第三段。', '長'.repeat(1000) + '\n段落！'.repeat(100)]) {
        const shape = shapeFor(text, { kind });
        expect(shape.kind).toBe(kind);
        expect(shape.paths.length).toBeGreaterThan(0);
        expect(shape.parts).toHaveLength(shape.paths.length);
        for (const path of shape.paths) {
          for (const value of path.match(/-?\d+(?:\.\d+)?/g) ?? []) {
            expect(Number(value)).toBeGreaterThanOrEqual(4);
            expect(Number(value)).toBeLessThanOrEqual(96);
          }
        }
        for (const dot of shape.fills) {
          expect(dot.cx - dot.r).toBeGreaterThanOrEqual(4);
          expect(dot.cy - dot.r).toBeGreaterThanOrEqual(4);
          expect(dot.cx + dot.r).toBeLessThanOrEqual(96);
          expect(dot.cy + dot.r).toBeLessThanOrEqual(96);
        }
        expect(shapeFor(text, { kind })).toEqual(shape);
      }
      expect(shapeFor('同文', { kind }).paths).not.toEqual(shapeFor('同文\n另一段！', { kind }).paths);
    });
  }
  it('樹有樹幹、至少兩層分枝、樹冠與地面', () => {
    const tree = shapeFor('', { kind: 'tree' });
    expect(tree.parts).toContain('trunk');
    expect(tree.parts.filter((part) => part === 'branch').length).toBeGreaterThanOrEqual(2);
    expect(tree.parts).toContain('crown');
    expect(tree.parts).toContain('ground');
  });
  it('八件原有假內容至少三種類，未知覆寫退回雜湊', () => {
    expect(new Set(fixtures.map((item) => shapeFor(item.text).kind)).size).toBeGreaterThanOrEqual(3);
    expect(shapeFor('測試', { kind: 'unknown' })).toEqual(shapeFor('測試'));
  });
});
