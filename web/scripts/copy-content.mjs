import { copyFile, mkdir, readdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const root = resolve(process.env.CONTENT_ROOT ?? '..');
const destination = resolve('dist/content');
await mkdir(destination, { recursive: true });
let entries;
try {
  entries = await readdir(join(root, 'objects'), { withFileTypes: true });
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  entries = [];
}
const objects = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.enc.json'))
  .map((entry) => entry.name).sort();
await Promise.all(objects.map((name) => copyFile(join(root, 'objects', name), join(destination, name))));
let epitaph = 'epitaph.md.enc.json';
try {
  await copyFile(join(root, epitaph), join(destination, epitaph));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  epitaph = null;
}
await writeFile(join(destination, 'index.json'), JSON.stringify({ epitaph, objects }) + '\n');
