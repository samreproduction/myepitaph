import { afterEach, describe, expect, it, vi } from 'vitest';
import { open } from '../../src/crypto.mjs';
import { commitContent, encodeContent } from '../src/github';

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
    await commitContent('objects/2026-10-16-新的想法.md.enc.json', '新文字', 'test-password', 'test-token-not-real');
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
  for (const status of [409, 422]) {
    it(`${status} 重取 sha 並只重試一次`, async () => {
      const fetcher = vi.fn()
        .mockResolvedValueOnce(Response.json({ sha: 'old' }))
        .mockResolvedValueOnce(new Response('', { status }))
        .mockResolvedValueOnce(Response.json({ sha: 'new' }))
        .mockResolvedValueOnce(new Response('', { status }));
      vi.stubGlobal('fetch', fetcher);
      await expect(commitContent('epitaph.md.enc.json', '文字', 'test-password', 'test-token-not-real')).rejects.toThrow(String(status));
      expect(fetcher).toHaveBeenCalledTimes(4);
      expect(JSON.parse(fetcher.mock.calls[1][1].body).sha).toBe('old');
      expect(JSON.parse(fetcher.mock.calls[3][1].body).sha).toBe('new');
    });
  }
  it('409 後成功重試；DELETE 使用最新 sha', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(Response.json({ sha: 'old' }))
      .mockResolvedValueOnce(new Response('', { status: 409 }))
      .mockResolvedValueOnce(Response.json({ sha: 'new' }))
      .mockResolvedValueOnce(Response.json({}));
    vi.stubGlobal('fetch', fetcher);
    await commitContent('objects/entry.md.enc.json', null, 'test-password', 'test-token-not-real');
    expect(fetcher.mock.calls[3][1].method).toBe('DELETE');
    expect(JSON.parse(fetcher.mock.calls[3][1].body)).toEqual({ message: '更新內容', branch: 'main', sha: 'new' });
  });
  for (const network of [false, true]) {
    it(`錯誤不含權杖（${network ? '網路錯誤' : 'GitHub 回應'}）`, async () => {
      vi.stubGlobal('fetch', network ? vi.fn().mockRejectedValue(new Error('GitHub 401：test-token-not-real'))
        : vi.fn().mockResolvedValue(new Response('test-token-not-real', { status: 401 })));
      const error = await commitContent('epitaph.md.enc.json', null, 'test-password', 'test-token-not-real').catch((cause) => cause);
      expect(error.message).not.toContain('test-token-not-real');
      expect(error.message).toContain(network ? '網路' : '401');
    });
  }
});
