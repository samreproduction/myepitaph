import { readFile } from 'node:fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { decryptEnvelope, IncorrectPasswordError, loadContent, parseFilename } from '../src/content';
import { epitaph, fixtures } from '../src/fixtures';

afterEach(() => vi.unstubAllGlobals());

describe('encrypted content', () => {
  it('合格檔名取出日期和 slug', () => {
    expect(parseFilename('2026-01-03-test-one.md.enc.json')).toEqual({ date: '2026-01-03', slug: 'test-one' });
  });
  it('不合格檔名跳過並警告，非法日期也不拋例外', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    for (const filename of ['invalid.json', '../2026-01-03-test.md.enc.json', '2026-02-30-test.md.enc.json', '2026-99-99-test.md.enc.json']) {
      expect(parseFilename(filename)).toBeNull();
    }
    expect(warn).toHaveBeenCalledTimes(4);
    warn.mockRestore();
  });
  it('測試密文可解開對應假文字，錯密碼丟出可辨識錯誤', async () => {
    const envelope = JSON.parse(await readFile(new URL('./content/objects/2026-01-03-test-one.md.enc.json', import.meta.url), 'utf8'));
    expect(await decryptEnvelope(envelope, 'test-password')).toBe(fixtures[0].text);
    await expect(decryptEnvelope(envelope, 'incorrect')).rejects.toBeInstanceOf(IncorrectPasswordError);
  });
  it('並行載入全部密文、按日期排序，略過不合格檔名', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const filename = decodeURIComponent(url.replace('./content/', ''));
      if (filename === 'index.json') return { ok: true, json: async () => ({
        epitaph: 'epitaph.md.enc.json',
        objects: [...fixtures].reverse().map(({ date, slug }) => `${date}-${slug}.md.enc.json`).concat('bad.json'),
      }) };
      const relative = filename === 'epitaph.md.enc.json' ? filename : `objects/${filename}`;
      return { ok: true, json: async () => JSON.parse(await readFile(new URL(`./content/${relative}`, import.meta.url), 'utf8')) };
    }));
    expect(await loadContent('test-password')).toEqual({ objects: fixtures, epitaph });
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
  it('空 objects 和 null epitaph 正常回傳', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ epitaph: null, objects: [] }) })));
    expect(await loadContent('unused')).toEqual({ epitaph: null, objects: [] });
  });
});
