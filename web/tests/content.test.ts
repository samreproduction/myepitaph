import { readFile } from 'node:fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { decryptEnvelope, EmptyContentError, IncorrectPasswordError, loadContent, parseFilename } from '../src/content';
import { epitaph, fixtures } from '../src/fixtures';

afterEach(() => vi.unstubAllGlobals());

describe('encrypted content', () => {
  it('合格檔名取出日期和 slug', () => {
    expect(parseFilename('2026-01-03-test-one.md.enc.json')).toEqual({ date: '2026-01-03', slug: 'test-one' });
    expect(parseFilename('2026-10-16-我的想法.md.enc.json')).toEqual({ date: '2026-10-16', slug: '我的想法' });
    expect(parseFilename('2026-10-16-My Thoughts.md.enc.json')).toEqual({ date: '2026-10-16', slug: 'My Thoughts' });
  });
  it('不合格檔名跳過並警告，非法日期也不拋例外', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const filenames = ['invalid.json', '../2026-01-03-test.md.enc.json', '2026-02-30-test.md.enc.json',
      '2026-99-99-test.md.enc.json', '2026-10-16-a/b.md.enc.json', '2026-10-16-a\\b.md.enc.json', '2026-10-16-.md.enc.json'];
    for (const filename of filenames) {
      expect(parseFilename(filename)).toBeNull();
    }
    expect(warn).toHaveBeenCalledTimes(filenames.length);
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
    expect(await loadContent('test-password')).toEqual({ objects: fixtures, epitaph, history: {}, deleted: [] });
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
  it('空 objects 和 null epitaph 不可驗證密碼', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ epitaph: null, objects: [] }) })));
    await expect(loadContent('unused')).rejects.toBeInstanceOf(EmptyContentError);
  });
  it.each([true, false])('逐檔回報真實解密進度（墓誌銘：%s）', async (withEpitaph) => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const filename = decodeURIComponent(url.replace('./content/', ''));
      if (filename === 'index.json') return { ok: true, json: async () => ({
        epitaph: withEpitaph ? 'epitaph.md.enc.json' : null,
        objects: fixtures.map(({ date, slug }) => `${date}-${slug}.md.enc.json`),
      }) };
      const relative = filename === 'epitaph.md.enc.json' ? filename : `objects/${filename}`;
      return { ok: true, json: async () => JSON.parse(await readFile(new URL(`./content/${relative}`, import.meta.url), 'utf8')) };
    }));
    const progress = vi.fn();
    await loadContent('test-password', progress);
    const total = 1 + fixtures.length + Number(withEpitaph);
    expect(progress.mock.calls).toEqual(Array.from({ length: total }, (_, i) => [i + 1, total]));
    expect(progress).toHaveBeenLastCalledWith(total, total);
  });
  it('載入歷史索引但不讀歷史密文，刪除檔名解析並略過非法日期', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const history = { 'epitaph.md.enc.json': [{ file: 'history/1.enc.json', date: '2026-10-01T12:00:00Z' }] };
    const fetcher = vi.fn(async (url: string) => {
      if (url.endsWith('index.json')) return { ok: true, json: async () => ({
        epitaph: 'epitaph.md.enc.json', objects: [], history,
        deleted: [
          { name: '2026-09-10-test-gone.md.enc.json', deletedAt: '2026-10-06T12:00:00Z' },
          { name: '2026-02-30-invalid.md.enc.json', deletedAt: '2026-10-06T12:00:00Z' },
        ],
      }) };
      expect(url).toBe('./content/epitaph.md.enc.json');
      return { ok: true, json: async () => JSON.parse(await readFile(new URL('./content/epitaph.md.enc.json', import.meta.url), 'utf8')) };
    });
    vi.stubGlobal('fetch', fetcher);
    expect(await loadContent('test-password')).toEqual({ objects: [], epitaph, history,
      deleted: [{ date: '2026-09-10', slug: 'test-gone', deletedAt: '2026-10-06T12:00:00Z' }] });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
  it('只有不合格物件也視為空內容，不嘗試載入密文', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetch = vi.fn(async () => ({ ok: true, json: async () => ({ epitaph: null, objects: ['bad.json'] }) }));
    vi.stubGlobal('fetch', fetch);
    await expect(loadContent('unused')).rejects.toBeInstanceOf(EmptyContentError);
    expect(fetch).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
});
