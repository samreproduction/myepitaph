import { open, seal } from '../../src/crypto.mjs';
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

type Operation = { mode: 'create'; text: string }
  | { mode: 'update'; originalText: string | null; text: string }
  | { mode: 'remove'; originalText: string };
const changed = () => new GitHubError('此內容已在別處更新，請按完成後重新整理再改');

export async function commitContent(path: string, operation: Operation, password: string, token: string) {
  const urlFor = (target: string) => `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${target.split('/').map(encodeURIComponent).join('/')}`;
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' };
  try {
    const content = operation.mode === 'remove' ? undefined : encodeContent(JSON.stringify(await seal(operation.text, password), null, 2) + '\n');
    const fixedCreate = operation.mode === 'update' && operation.originalText === null;
    if (fixedCreate && path !== 'epitaph.md.enc.json') throw changed();
    const creating = operation.mode === 'create' || fixedCreate;
    const nextPath = (target: string) => {
      const match = /^(objects\/\d{4}-\d{2}-\d{2}-)(.+)(\.md\.enc\.json)$/.exec(target);
      if (!match) throw new GitHubError('無法辨識物件路徑');
      const suffix = /-(\d+)$/.exec(match[2]);
      const slug = suffix ? `${match[2].slice(0, suffix.index)}-${Number(suffix[1]) + 1}` : `${match[2]}-2`;
      return `${match[1]}${slug}${match[3]}`;
    };
    for (let attempt = 0; attempt < (creating && !fixedCreate ? 20 : 2); attempt++) {
      const url = urlFor(path);
      const current = await fetch(`${url}?ref=${encodeURIComponent(config.branch)}`, { headers, cache: 'no-store' });
      if (!current.ok && current.status !== 404) throw failure(current.status);
      let sha: string | undefined;
      if (creating) {
        if (current.ok) {
          if (fixedCreate) throw changed();
          path = nextPath(path);
          continue;
        }
      } else {
        if (current.status === 404) {
          if (operation.mode === 'remove') return path;
          throw new GitHubError('此物件已在別處刪除');
        }
        const remote = await current.json();
        const envelope = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(atob(remote.content), (character) => character.charCodeAt(0))));
        if (await open(envelope, password) !== operation.originalText) throw changed();
        if (typeof remote.sha !== 'string' || !remote.sha) throw new GitHubError('GitHub：無法確認線上版本，請重試');
        sha = remote.sha;
      }
      const response = await fetch(url, {
        method: operation.mode === 'remove' ? 'DELETE' : 'PUT', headers,
        body: JSON.stringify({ message: '更新內容', branch: config.branch, ...(sha ? { sha } : {}), ...(content ? { content } : {}) }),
      });
      if (response.ok) return path;
      if (operation.mode === 'remove' && response.status === 404) return path;
      if (creating) {
        if (response.status === 422) {
          if (fixedCreate) throw changed();
          path = nextPath(path);
          continue;
        }
        throw failure(response.status);
      }
      if (attempt === 0 && (response.status === 409 || response.status === 422)) continue;
      throw failure(response.status);
    }
    throw new GitHubError('同名物件過多，請更換短名後重試');
  } catch (cause) {
    // Never display server bodies or fetch errors: they may contain credentials.
    if (cause instanceof GitHubError) throw cause;
    throw new Error('GitHub：網路連線失敗，請重試');
  }
}
