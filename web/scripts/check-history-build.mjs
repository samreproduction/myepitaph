import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { firstVersions } from '../tests/history-fixtures.ts';

const index = JSON.parse(await readFile('dist/content/index.json', 'utf8'));
console.log(JSON.stringify({ history: {
  '2026-01-03-test-one.md.enc.json': index.history['2026-01-03-test-one.md.enc.json'],
  'epitaph.md.enc.json': index.history['epitaph.md.enc.json'],
}, deleted: index.deleted }, null, 2));

const counts = [0, 0, 0];
let markdown = 0;
const unexpected = [];
// Read-only scan of the build output, explicitly required by acceptance check 3.
async function scan(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) { await scan(path); continue; }
    const bytes = await readFile(path);
    for (const [index, text] of firstVersions.entries()) {
      const needle = Buffer.from(text.split('\n')[0]);
      let offset = 0;
      while ((offset = bytes.indexOf(needle, offset)) !== -1) { counts[index]++; offset += needle.length; }
    }
    if (entry.name.endsWith('.md')) markdown++;
    if (path.startsWith(join('dist', 'content')) && entry.name !== 'index.json' && !entry.name.endsWith('.enc.json')) unexpected.push(path);
  }
}
await scan('dist');
console.log(JSON.stringify({ plaintextSentenceOccurrences: counts, markdownFiles: markdown, unexpectedContentFiles: unexpected }, null, 2));
if (counts.some(Boolean) || markdown || unexpected.length) process.exitCode = 1;
