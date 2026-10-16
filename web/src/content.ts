import { open, type Envelope } from '../../src/crypto.mjs';

export interface Memory {
  date: string;
  slug: string;
  text: string;
}

export interface Content {
  objects: Memory[];
  epitaph: string | null;
}

export class IncorrectPasswordError extends Error {
  constructor() {
    super('密碼不正確');
    this.name = 'IncorrectPasswordError';
  }
}

export function parseFilename(filename: string) {
  const match = /^(\d{4}-\d{2}-\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)\.md\.enc\.json$/.exec(filename);
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

export async function loadContent(password: string): Promise<Content> {
  const index: { epitaph: string | null; objects: string[] } = await readJson('index.json');
  const entries = index.objects.flatMap((filename) => {
    const metadata = parseFilename(filename);
    return metadata ? [{ filename, ...metadata }] : [];
  });
  const [objects, epitaph] = await Promise.all([
    Promise.all(entries.map(async ({ filename, ...metadata }) => ({
      ...metadata,
      text: await decryptEnvelope(await readJson(encodeURIComponent(filename)), password),
    }))),
    index.epitaph === null ? null : readJson(encodeURIComponent(index.epitaph))
      .then((envelope) => decryptEnvelope(envelope, password)),
  ]);
  return { objects: objects.sort((a, b) => a.date.localeCompare(b.date) || a.slug.localeCompare(b.slug)), epitaph };
}
