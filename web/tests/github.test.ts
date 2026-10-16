import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { open, seal } from '../../src/crypto.mjs';
import { commitContent, encodeContent } from '../src/github';

const path = 'objects/2026-10-16-entry.md.enc.json';
const password = 'test-password';
const token = 'test-token-not-real';
const changed = '此內容已在別處更新，請按完成後重新整理再改';
const update = { mode: 'update' as const, originalText: '原文 🌙\n', text: '新文字' };
async function remote(text = update.originalText, sha = 'old') {
  return Response.json({ sha, content: encodeContent(JSON.stringify(await seal(text, password))) });
}
// Fail closed: even an unexpectedly added test must never reach the real API.
beforeEach(() => vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('未模擬的請求'))));
afterEach(() => vi.unstubAllGlobals());
describe('GitHub 加密提交', () => {
  it('UTF-8 base64 保留中文及換行', () => {
    const text = '中文、想法 🌙\n';
    expect(Buffer.from(encodeContent(text), 'base64').toString('utf8')).toBe(text);
  });
  it('中文 path 分段編碼，提交只有可解密 envelope，404 建立新檔', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response('', { status: 404 }))
      .mockResolvedValueOnce(new Response('{}', { status: 201 }));
    vi.stubGlobal('fetch', fetcher);
    expect(await commitContent('objects/2026-10-16-新的想法.md.enc.json', { mode: 'create', text: '新文字' }, password, token)).toBe('objects/2026-10-16-新的想法.md.enc.json');
    expect(fetcher.mock.calls[0][0]).toContain('/objects/2026-10-16-%E6%96%B0%E7%9A%84%E6%83%B3%E6%B3%95.md.enc.json?ref=main');
    const request = fetcher.mock.calls[1][1];
    expect(request.headers.Authorization).toBe('Bearer test-token-not-real');
    expect(request.body).not.toContain('新文字');
    const body = JSON.parse(request.body);
    expect(body.message).toBe('更新內容');
    expect(body.sha).toBeUndefined();
    const json = Buffer.from(body.content, 'base64').toString('utf8');
    expect(json).toBe(JSON.stringify(JSON.parse(json), null, 2) + '\n');
    expect(await open(JSON.parse(json), 'test-password')).toBe('新文字');
  });
  it('新增遇 200 依序換成 -2、-3，不覆蓋線上內容', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json({ sha: 'one' }))
      .mockResolvedValueOnce(Response.json({ sha: 'two' }))
      .mockResolvedValueOnce(new Response('', { status: 404 }))
      .mockResolvedValueOnce(Response.json({}));
    vi.stubGlobal('fetch', fetcher);
    expect(await commitContent(path, { mode: 'create', text: '新增' }, password, token)).toBe(path.replace('entry.', 'entry-3.'));
    expect(fetcher.mock.calls[1][0]).toContain('entry-2.md.enc.json?ref=main');
    expect(fetcher.mock.calls[2][0]).toContain('entry-3.md.enc.json?ref=main');
    expect(fetcher.mock.calls.filter(([, options]) => options.method === 'PUT')).toHaveLength(1);
    expect(JSON.parse(fetcher.mock.calls[3][1].body).sha).toBeUndefined();
  });
  it('新增 PUT 422 後遞增已有 -N，換名後重新 GET', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response('', { status: 404 }))
      .mockResolvedValueOnce(new Response('', { status: 422 }))
      .mockResolvedValueOnce(new Response('', { status: 404 }))
      .mockResolvedValueOnce(Response.json({}));
    vi.stubGlobal('fetch', fetcher);
    expect(await commitContent(path.replace('entry.', 'entry-9.'), { mode: 'create', text: '新增' }, password, token)).toContain('entry-10.');
    expect(fetcher.mock.calls[2][0]).toContain('entry-10.md.enc.json?ref=main');
    expect(fetcher.mock.calls[2][1].method).toBeUndefined();
    expect(JSON.parse(fetcher.mock.calls[3][1].body).sha).toBeUndefined();
  });
  it('新增最多嘗試 20 個名字', async () => {
    const fetcher = vi.fn().mockImplementation(async () => Response.json({ sha: 'exists' }));
    vi.stubGlobal('fetch', fetcher);
    await expect(commitContent(path, { mode: 'create', text: '新增' }, password, token)).rejects.toThrow('同名物件過多');
    expect(fetcher).toHaveBeenCalledTimes(20);
    expect(fetcher.mock.calls[19][0]).toContain('entry-20.md.enc.json');
  });
  it('純數字 slug 不把日期分隔符當成後綴', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json({ sha: 'exists' }))
      .mockResolvedValueOnce(new Response('', { status: 404 })).mockResolvedValueOnce(Response.json({}));
    vi.stubGlobal('fetch', fetcher);
    await expect(commitContent(path.replace('entry.', '123.'), { mode: 'create', text: '新增' }, password, token)).resolves.toContain('-123-2.md.enc.json');
  });
  it('比對後別處先刪除，DELETE 404 仍視為成功', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(await remote()).mockResolvedValueOnce(new Response('', { status: 404 }));
    vi.stubGlobal('fetch', fetcher);
    await expect(commitContent(path, { mode: 'remove', originalText: update.originalText }, password, token)).resolves.toBe(path);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  for (const mode of ['update', 'remove'] as const) {
    it(`${mode} 線上原文不同就停止，不發出寫入`, async () => {
      const fetcher = vi.fn().mockResolvedValueOnce(await remote('已在另一台改過'));
      vi.stubGlobal('fetch', fetcher);
      await expect(commitContent(path, { ...update, mode }, password, token)).rejects.toThrow(changed);
      expect(fetcher).toHaveBeenCalledTimes(1);
    });
    it(`${mode} 原文相同才帶 sha 寫入`, async () => {
      const fetcher = vi.fn().mockResolvedValueOnce(await remote()).mockResolvedValueOnce(Response.json({}));
      vi.stubGlobal('fetch', fetcher);
      await commitContent(path, { ...update, mode }, password, token);
      expect(fetcher.mock.calls[1][1].method).toBe(mode === 'update' ? 'PUT' : 'DELETE');
      expect(JSON.parse(fetcher.mock.calls[1][1].body).sha).toBe('old');
    });
    it(`${mode} GET 404 不發出寫入，刪除視為成功`, async () => {
      const fetcher = vi.fn().mockResolvedValueOnce(new Response('', { status: 404 }));
      vi.stubGlobal('fetch', fetcher);
      const result = commitContent(path, { ...update, mode }, password, token);
      if (mode === 'remove') await expect(result).resolves.toBe(path);
      else await expect(result).rejects.toThrow('此物件已在別處刪除');
      expect(fetcher).toHaveBeenCalledTimes(1);
    });
    for (const status of [409, 422]) {
      for (const same of [true, false]) {
        it(`${mode} ${status} 後重新解密比對，${same ? '相同才重試' : '不同就停止'}`, async () => {
          const fetcher = vi.fn().mockResolvedValueOnce(await remote())
            .mockResolvedValueOnce(new Response('', { status }))
            .mockResolvedValueOnce(await remote(same ? update.originalText : '別處更新', 'new'))
            .mockResolvedValueOnce(Response.json({}));
          vi.stubGlobal('fetch', fetcher);
          const result = commitContent(path, { ...update, mode }, password, token);
          if (same) {
            await expect(result).resolves.toBe(path);
            expect(fetcher).toHaveBeenCalledTimes(4);
            expect(JSON.parse(fetcher.mock.calls[3][1].body).sha).toBe('new');
          } else {
            await expect(result).rejects.toThrow(changed);
            expect(fetcher).toHaveBeenCalledTimes(3);
          }
        });
      }
    }
  }
  for (const status of [409, 422]) {
    it(`${status} 重取 sha 並只重試一次`, async () => {
      const fetcher = vi.fn()
        .mockResolvedValueOnce(await remote())
        .mockResolvedValueOnce(new Response('', { status }))
        .mockResolvedValueOnce(await remote(update.originalText, 'new'))
        .mockResolvedValueOnce(new Response('', { status }));
      vi.stubGlobal('fetch', fetcher);
      await expect(commitContent('epitaph.md.enc.json', update, password, token)).rejects.toThrow(String(status));
      expect(fetcher).toHaveBeenCalledTimes(4);
      expect(JSON.parse(fetcher.mock.calls[1][1].body).sha).toBe('old');
      expect(JSON.parse(fetcher.mock.calls[3][1].body).sha).toBe('new');
    });
  }
  it('墓誌銘原本 null 且線上 404 才建立固定路徑', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response('', { status: 404 })).mockResolvedValueOnce(Response.json({}));
    vi.stubGlobal('fetch', fetcher);
    await expect(commitContent('epitaph.md.enc.json', { ...update, originalText: null }, password, token)).resolves.toBe('epitaph.md.enc.json');
    expect(JSON.parse(fetcher.mock.calls[1][1].body).sha).toBeUndefined();
  });
  for (const exists of [true, false]) {
    it(`墓誌銘固定路徑遇 ${exists ? 'GET 200' : 'PUT 422'} 不換名、不覆蓋`, async () => {
      const fetcher = vi.fn().mockResolvedValueOnce(exists ? await remote() : new Response('', { status: 404 }))
        .mockResolvedValueOnce(new Response('', { status: 422 }));
      vi.stubGlobal('fetch', fetcher);
      await expect(commitContent('epitaph.md.enc.json', { ...update, originalText: null }, password, token)).rejects.toThrow(changed);
      expect(fetcher).toHaveBeenCalledTimes(exists ? 1 : 2);
    });
  }
  it('無法解密或缺少 sha 時不寫入，也不洩露回應', async () => {
    for (const response of [Response.json({ sha: token, content: encodeContent(token) }), await remote()]) {
      const json = await response.json();
      delete json.sha;
      const fetcher = vi.fn().mockResolvedValueOnce(Response.json(json));
      vi.stubGlobal('fetch', fetcher);
      const error = await commitContent(path, update, password, token).catch((cause) => cause);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).not.toContain(token);
      expect(fetcher).toHaveBeenCalledTimes(1);
    }
  });
  for (const network of [false, true]) {
    it(`錯誤不含權杖（${network ? '網路錯誤' : 'GitHub 回應'}）`, async () => {
      vi.stubGlobal('fetch', network ? vi.fn().mockRejectedValue(new Error('GitHub 401：test-token-not-real'))
        : vi.fn().mockResolvedValue(new Response('test-token-not-real', { status: 401 })));
      const error = await commitContent('epitaph.md.enc.json', update, password, token).catch((cause) => cause);
      expect(error.message).not.toContain('test-token-not-real');
      expect(error.message).toContain(network ? '網路' : '401');
    });
  }
});
