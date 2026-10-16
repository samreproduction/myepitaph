import { execFileSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { beforeAll, describe, expect, it } from 'vitest';

const script = resolve('scripts/copy-content.mjs');
const historyRoot = resolve('tests/.history-repo');
let temporary: string;
beforeAll(async () => {
  const base = join(tmpdir(), 'opencode');
  await mkdir(base, { recursive: true });
  temporary = await mkdtemp(join(base, 'T5-copy-'));
  execFileSync(process.execPath, ['scripts/make-history-fixture.mjs'], { stdio: 'pipe' });
}, 30000);

async function copy(root: string, name: string, withoutGit = false) {
  const cwd = join(temporary, name);
  await mkdir(cwd, { recursive: true });
  execFileSync(process.execPath, [script], { cwd, env: {
    ...process.env, CONTENT_ROOT: root, ...(withoutGit ? { PATH: '' } : {}),
  }, stdio: 'pipe' });
  return { cwd, index: JSON.parse(await readFile(join(cwd, 'dist/content/index.json'), 'utf8')) };
}

describe('copy-content Git 密文歷史', () => {
  it('第一件三版、墓誌銘兩版，僅發布現存物件的密文歷史與刪除索引', async () => {
    const { cwd, index } = await copy(historyRoot, 'history');
    expect(index.objects).toHaveLength(8);
    const versions = index.history['2026-01-03-test-one.md.enc.json'];
    expect(versions).toHaveLength(3);
    expect(versions.map((version: { date: string }) => new Date(version.date).toISOString())).toEqual([
      '2026-10-03T12:00:00.000Z', '2026-10-02T12:00:00.000Z', '2026-10-01T12:00:00.000Z',
    ]);
    expect(index.history['epitaph.md.enc.json']).toHaveLength(2);
    expect(index.deleted).toHaveLength(1);
    expect(index.deleted[0].name).toBe('2026-09-10-test-gone.md.enc.json');
    expect(new Date(index.deleted[0].deletedAt).toISOString()).toBe('2026-10-06T12:00:00.000Z');
    expect(index.history['2026-09-10-test-gone.md.enc.json']).toBeUndefined();
    const files = Object.values(index.history).flat() as { file: string }[];
    expect(new Set(files.map(({ file }) => file)).size).toBe(12);
    for (const { file } of files) {
      expect(file).toMatch(/^history\/\d+\.enc\.json$/);
      expect(JSON.parse(await readFile(join(cwd, 'dist/content', file), 'utf8'))).toHaveProperty('ct');
    }
  });
  it('非 Git 目錄照常建置，history 與 deleted 為空', async () => {
    const root = join(temporary, 'plain-source');
    await mkdir(join(root, 'objects'), { recursive: true });
    const name = '2026-01-03-test-one.md.enc.json';
    await copyFile(join(historyRoot, 'objects', name), join(root, 'objects', name));
    const empty = await copy(root, 'non-git');
    expect(empty.index).toEqual({ epitaph: null, objects: [name], history: {}, deleted: [] });
  });
  it('Git 不可用仍成功打包密文', async () => {
    const { index } = await copy(historyRoot, 'no-git', true);
    expect(index.objects).toHaveLength(8);
    expect(index.history).toEqual({});
    expect(index.deleted).toEqual([]);
  });
});
