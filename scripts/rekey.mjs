#!/usr/bin/env node
import { readFile, open as openFile, readdir, stat, rename, unlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { emitKeypressEvents } from 'node:readline';
import { seal, open } from '../src/crypto.mjs';

function hiddenPassword(label) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error('請在終端機輸入密碼，或設定兩個密碼環境變數');
  return new Promise((resolve, reject) => {
    let value = '';
    const wasRaw = process.stdin.isRaw;
    emitKeypressEvents(process.stdin);
    process.stdout.write(`${label}：`);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    const finish = (error) => {
      process.stdin.removeListener('keypress', keypress);
      process.stdin.setRawMode(wasRaw);
      process.stdin.pause();
      process.stdout.write('\n');
      if (error) reject(error); else resolve(value);
      value = '';
    };
    const keypress = (text, key = {}) => {
      if (key.ctrl && key.name === 'c') finish(new Error('已取消'));
      else if (key.name === 'return' || key.name === 'enter') finish();
      else if (key.name === 'backspace') value = Array.from(value).slice(0, -1).join('');
      else if (!key.ctrl && !key.meta && text && !/[\x00-\x1f\x7f]/.test(text)) value += text;
    };
    process.stdin.on('keypress', keypress);
  });
}

async function main() {
  let oldPassword, newPassword, confirmation;
  if (process.env.BLACKTOMB_PASSWORD !== undefined && process.env.BLACKTOMB_NEW_PASSWORD !== undefined) {
    oldPassword = process.env.BLACKTOMB_PASSWORD;
    newPassword = confirmation = process.env.BLACKTOMB_NEW_PASSWORD;
  } else {
    oldPassword = await hiddenPassword('舊密碼');
    newPassword = await hiddenPassword('新密碼');
    confirmation = await hiddenPassword('再輸入一次新密碼');
  }
  if (newPassword !== confirmation) throw new Error('新密碼兩次輸入不同');
  if (newPassword === oldPassword) throw new Error('新密碼不得與舊密碼相同');
  if (Array.from(newPassword).length < 8) throw new Error('新密碼至少需要 8 個字元');

  const root = resolve(process.argv[2] ?? '.');
  let entries = [];
  try { entries = await readdir(join(root, 'objects'), { withFileTypes: true }); }
  catch (error) { if (error.code !== 'ENOENT') throw new Error('無法讀取 objects'); }
  const files = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.md.enc.json'))
    .map((entry) => join('objects', entry.name)).sort();
  try { if ((await stat(join(root, 'epitaph.md.enc.json'))).isFile()) files.push('epitaph.md.enc.json'); }
  catch (error) { if (error.code !== 'ENOENT') throw new Error('無法讀取 epitaph.md.enc.json'); }

  const decrypted = [];
  const failed = [];
  for (const file of files) {
    try { decrypted.push({ file, text: await open(JSON.parse(await readFile(join(root, file), 'utf8')), oldPassword) }); }
    catch { failed.push(file); }
  }
  if (failed.length) {
    for (const file of failed) console.error(file);
    throw new Error(`無法解開 ${failed.length} 個檔案；未寫入任何檔案`);
  }

  const temporary = new Set();
  try {
    for (const { file, text } of decrypted) {
      const data = JSON.stringify(await seal(text, newPassword), null, 2) + '\n';
      const path = join(root, file + '.rekey-tmp');
      // Do not overwrite a temporary file left by an earlier run.
      const handle = await openFile(path, 'wx');
      temporary.add(path);
      try { await handle.writeFile(data); } finally { await handle.close(); }
    }
    for (const file of files) {
      const path = join(root, file + '.rekey-tmp');
      await rename(path, join(root, file));
      temporary.delete(path);
      console.log(file);
    }
  } catch {
    throw new Error('重新加密或替換檔案失敗；部分檔案可能已換成新密碼。請先用 git checkout -- objects epitaph.md.enc.json 還原，再重試');
  } finally {
    for (const path of temporary) {
      try { await unlink(path); } catch { console.error('無法清除暫存檔'); }
    }
  }
  console.log(`已重新加密 ${files.length} 個檔案`);
  console.log('請 commit 並 push，網站更新後用新密碼進入；各裝置需重新貼上權杖');
}

try { await main(); }
catch (error) { console.error(error.message); process.exitCode = 1; }
