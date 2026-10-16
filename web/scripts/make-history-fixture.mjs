import { mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { seal } from '../../src/crypto.mjs';
import { epitaph, fixtures } from '../src/fixtures.ts';
import { firstVersions, epitaphFirst } from '../tests/history-fixtures.ts';

const root = new URL('../tests/.history-repo/', import.meta.url);
// The ticket explicitly requires rebuilding only this disposable fixture repository.
await rm(root, { recursive: true, force: true });
await mkdir(new URL('objects/', root), { recursive: true });
const git = (args, env = process.env) => execFileSync('git', args, {
  cwd: fileURLToPath(root), env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
});
git(['init']);
git(['config', 'user.name', 'History Fixture']);
git(['config', 'user.email', 'fixture@example.invalid']);
git(['config', 'commit.gpgsign', 'false']);
git(['config', 'core.autocrlf', 'false']);
async function encrypted(path, text) {
  await writeFile(new URL(path, root), JSON.stringify(await seal(text, 'test-password')) + '\n');
}
function commit(day, message) {
  git(['add', '--all']);
  const date = `2026-10-${day}T12:00:00+00:00`;
  git(['commit', '-m', message], { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date });
}
const first = `objects/${fixtures[0].date}-${fixtures[0].slug}.md.enc.json`;
for (const [index, item] of fixtures.entries()) {
  await encrypted(`objects/${item.date}-${item.slug}.md.enc.json`, index === 0 ? firstVersions[0] : item.text);
}
await encrypted('epitaph.md.enc.json', epitaphFirst);
commit('01', 'Initial encrypted fixtures');
await encrypted(first, firstVersions[1]);
commit('02', 'Second object version');
await encrypted(first, firstVersions[2]);
commit('03', 'Third object version');
await encrypted('epitaph.md.enc.json', epitaph);
commit('04', 'Second epitaph version');
const gone = new URL('objects/2026-09-10-test-gone.md.enc.json', root);
await encrypted('objects/2026-09-10-test-gone.md.enc.json', '已刪除的測試假文字。');
commit('05', 'Add disposable object');
await rm(gone);
commit('06', 'Delete disposable object');
console.log('Created isolated history repo: 8 objects, 3 first-object versions, 2 epitaph versions, 1 deletion.');
