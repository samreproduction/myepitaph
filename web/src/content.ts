import { open, type Envelope } from '../../src/crypto.mjs';

export interface Memory {
  date: string;
  slug: string;
  text: string;
}

export interface Content {
  objects: Memory[];
  epitaph: string | null;
  history: Record<string, HistoryVersion[]>;
  deleted: DeletedMemory[];
}

export interface HistoryVersion { file: string; date: string }
export interface DeletedMemory { date: string; slug: string; deletedAt: string }

export class IncorrectPasswordError extends Error {
  constructor() {
    super('密碼不正確');
    this.name = 'IncorrectPasswordError';
  }
}

export class EmptyContentError extends Error {
  constructor() {
    super('目前還沒有內容');
    this.name = 'EmptyContentError';
  }
}

export function parseFilename(filename: string) {
  const match = /^(\d{4}-\d{2}-\d{2})-([^/\\]+)\.md\.enc\.json$/.exec(filename);
  const date = match ? new Date(`${match[1]}T00:00:00Z`) : null;
  if (!match || !date || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== match[1]) {
    console.warn('Skipping invalid content filename:', filename);
    return null;
  }
  return { date: match[1], slug: match[2] };
}

export async function decryptEnvelope(envelope: Envelope, password: string) {
  try {
    return await open(envelope, password);
  } catch {
    throw new IncorrectPasswordError();
  }
}

async function readJson(path: string) {
  const response = await fetch(`./content/${path}`);
  if (!response.ok) throw new Error('無法載入內容');
  return response.json();
}

export async function loadVersion(version: HistoryVersion, password: string) {
  return decryptEnvelope(await readJson(version.file.split('/').map(encodeURIComponent).join('/')), password);
}

export async function loadContent(password: string, onProgress?: (done: number, total: number) => void): Promise<Content> {
  const index: { epitaph: string | null; objects: string[]; history?: Content['history'];
    deleted?: { name: string; deletedAt: string }[] } = await readJson('index.json');
  const deleted = (index.deleted ?? []).flatMap(({ name, deletedAt }) => {
    const metadata = parseFilename(name);
    return metadata ? [{ ...metadata, deletedAt }] : [];
  });
  const entries = index.objects.flatMap((filename) => {
    const metadata = parseFilename(filename);
    return metadata ? [{ filename, ...metadata }] : [];
  });
  if (index.epitaph === null && entries.length === 0) throw new EmptyContentError();
  const total = 1 + entries.length + (index.epitaph === null ? 0 : 1);
  let done = 1;
  onProgress?.(done, total);
  const decrypt = async (filename: string) => {
    const text = await decryptEnvelope(await readJson(encodeURIComponent(filename)), password);
    onProgress?.(++done, total);
    return text;
  };
  const [objects, epitaph] = await Promise.all([
    Promise.all(entries.map(async ({ filename, ...metadata }) => ({
      ...metadata,
      text: await decrypt(filename),
    }))),
    index.epitaph === null ? null : decrypt(index.epitaph),
  ]);
  return { objects: objects.sort((a, b) => a.date.localeCompare(b.date) || a.slug.localeCompare(b.slug)),
    epitaph, history: index.history ?? {}, deleted };
}
