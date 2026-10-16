import { mkdir, writeFile } from 'node:fs/promises';
import { seal } from '../../src/crypto.mjs';
import { epitaph, fixtures } from '../src/fixtures.ts';

const root = new URL('../tests/content/', import.meta.url);
await mkdir(new URL('objects/', root), { recursive: true });
await Promise.all([
  ...fixtures.map(async ({ date, slug, text }) => {
    const envelope = await seal(text, 'test-password');
    await writeFile(new URL(`objects/${date}-${slug}.md.enc.json`, root), JSON.stringify(envelope) + '\n');
  }),
  (async () => {
    const envelope = await seal(epitaph, 'test-password');
    await writeFile(new URL('epitaph.md.enc.json', root), JSON.stringify(envelope) + '\n');
  })(),
]);
console.log('Created 8 encrypted objects and encrypted epitaph (no plaintext files).');
