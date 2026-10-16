import { copyFile, mkdir, readdir, writeFile } from 'node:fs/promises';
import { resolve, join, relative } from 'node:path';
import { execFileSync } from 'node:child_process';

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
const history = {};
const deleted = [];
let cwd = root;
const git = (args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
let prefix;
try {
  const top = git(['rev-parse', '--show-toplevel']).trim();
  prefix = relative(top, root).split('\\').join('/');
  cwd = top;
} catch { /* Git is optional; ordinary ciphertext builds still work. */ }
if (prefix !== undefined) {
  const pathFor = (path) => prefix ? `${prefix}/${path}` : path;
  let serial = 0;
  await mkdir(join(destination, 'history'), { recursive: true });
  for (const name of [...objects, ...(epitaph ? [epitaph] : [])]) {
    const path = pathFor(name === epitaph ? name : `objects/${name}`);
    history[name] = [];
    for (const line of git(['--literal-pathspecs', 'log', '--format=%H%x09%cI', '--', path]).trim().split('\n').filter(Boolean)) {
      const [sha, date] = line.trim().split('\t');
      let ciphertext;
      try { ciphertext = git(['show', `${sha}:${path}`]); }
      catch { continue; } // Deletion commits do not have a file to publish.
      const file = `history/${++serial}.enc.json`;
      await writeFile(join(destination, file), ciphertext);
      history[name].push({ file, date });
    }
  }
  const seen = new Set();
  const directory = pathFor('objects/');
  const removals = git(['-c', 'core.quotepath=false', 'log', '--diff-filter=D', '--name-only', '--format=%x00%cI', '--', directory]);
  for (const block of removals.split('\0').slice(1)) {
    const [date, ...paths] = block.trim().split('\n');
    for (const path of paths.map((value) => value.trim()).filter(Boolean)) {
      if (!path.startsWith(directory)) continue;
      const name = path.slice(directory.length);
      if (!/^[^/\\]+\.md\.enc\.json$/.test(name) || objects.includes(name) || seen.has(name)) continue;
      seen.add(name);
      deleted.push({ name, deletedAt: date.trim() });
    }
  }
}
await writeFile(join(destination, 'index.json'), JSON.stringify({ epitaph, objects, history, deleted }) + '\n');
