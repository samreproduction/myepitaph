// Only fake content in a fresh temporary directory; never touches repository content.
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, readdir, unlink, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { seal, open } from '../src/crypto.mjs';

const password = 'test-password';
const nextPassword = 'new-test-password';
const script = fileURLToPath(new URL('../scripts/rekey.mjs', import.meta.url));
const files = ['objects/one.md.enc.json', 'objects/two.md.enc.json', 'objects/three.md.enc.json', 'epitaph.md.enc.json'];
const texts = files.map((_, index) => `第 ${index + 1} 件換密碼測試假文字`);
const originals = await Promise.all(texts.map(async (text) => JSON.stringify(await seal(text, password), null, 2) + '\n'));

for (const mode of ['success', 'wrong-old', 'corrupt', 'short', 'same']) {
  const root = await mkdtemp(join(tmpdir(), 'blacktomb-rekey-'));
  await mkdir(join(root, 'objects'));
  try {
    const before = originals.map((data, index) => mode === 'corrupt' && index === 1 ? '{}' : data);
    for (const [index, file] of files.entries()) await writeFile(join(root, file), before[index]);
    const oldPassword = mode === 'wrong-old' ? nextPassword : password;
    const newPassword = mode === 'same' || mode === 'wrong-old' ? password : mode === 'short' ? nextPassword.slice(0, 7) : nextPassword;
    const result = spawnSync(process.execPath, [script, root], {
      encoding: 'utf8', env: { ...process.env, BLACKTOMB_PASSWORD: oldPassword, BLACKTOMB_NEW_PASSWORD: newPassword },
    });
    assert.ifError(result.error);
    const output = result.stdout + result.stderr;
    for (const secret of [...texts, password, nextPassword, newPassword]) assert.equal(output.includes(secret), false, 'output must not contain secrets');
    assert.equal(result.signal, null);
    if (mode === 'success') {
      assert.equal(result.status, 0);
      assert.match(output, /已重新加密 4 個檔案/);
      for (const [index, file] of files.entries()) {
        const raw = await readFile(join(root, file), 'utf8');
        const envelope = JSON.parse(raw);
        assert.equal(raw, JSON.stringify(envelope, null, 2) + '\n');
        assert.equal(await open(envelope, nextPassword), texts[index]);
        await assert.rejects(open(envelope, password));
      }
    } else {
      assert.notEqual(result.status, 0);
      for (const [index, file] of files.entries()) assert.deepEqual(await readFile(join(root, file)), Buffer.from(before[index]));
      if (mode === 'corrupt') assert.ok(output.includes('two.md.enc.json'));
      if (mode === 'wrong-old') for (const file of files) assert.ok(output.includes(file.replaceAll('/', '\\')) || output.includes(file));
    }
    for (const directory of [root, join(root, 'objects')]) {
      assert.equal((await readdir(directory)).some((name) => name.endsWith('.rekey-tmp')), false);
    }
    console.log(`ok: ${mode}`);
  } finally {
    // Remove only the specifically named test files created above.
    for (const file of files) await unlink(join(root, file));
    await rmdir(join(root, 'objects'));
    await rmdir(root);
  }
}
console.log('ok: rekey checks pass; output contains no fake plaintext or passwords');
