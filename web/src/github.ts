import { seal } from '../../src/crypto.mjs';
import { config } from './config';

export function encodeContent(text: string) {
  return btoa(Array.from(new TextEncoder().encode(text), (byte) => String.fromCharCode(byte)).join(''));
}

class GitHubError extends Error {}
function failure(status: number) {
  const reason = status === 401 ? '權杖無效或已到期' : status === 403 ? '沒有寫入權限'
    : status === 404 ? '找不到檔案或儲存庫' : status === 409 || status === 422 ? '內容衝突，請重試' : '請求失敗';
  return new GitHubError(`GitHub ${status}：${reason}`);
}

export async function commitContent(path: string, text: string | null, password: string, token: string) {
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path.split('/').map(encodeURIComponent).join('/')}`;
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' };
  const content = text === null ? undefined : encodeContent(JSON.stringify(await seal(text, password), null, 2) + '\n');
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      const current = await fetch(`${url}?ref=${encodeURIComponent(config.branch)}`, { headers, cache: 'no-store' });
      if (!current.ok && current.status !== 404) throw failure(current.status);
      const sha = current.ok ? (await current.json()).sha : undefined;
      if (text === null && !sha) throw failure(404);
      const response = await fetch(url, {
        method: text === null ? 'DELETE' : 'PUT', headers,
        body: JSON.stringify({ message: '更新內容', branch: config.branch, ...(sha ? { sha } : {}), ...(content ? { content } : {}) }),
      });
      if (response.ok) return;
      if (attempt === 0 && (response.status === 409 || response.status === 422)) continue;
      throw failure(response.status);
    }
  } catch (cause) {
    // Never display server bodies or fetch errors: they may contain credentials.
    if (cause instanceof GitHubError) throw cause;
    throw new Error('GitHub：網路連線失敗，請重試');
  }
}
