# 回執 T5：歷史版本與刪除留空缺

> 執行引擎：opencode opencode v2.0.29 / openai/gpt-6.1-sol
> 完成時間：2026-10-16 19:13
> 分支 / 提交 / PR：claude/project-thread-lrhwko / 無 / 無
> 工單：留在 _tickets/doing/ 等待驗收

## 1. 做了什麼
- 建置時從 Git 取得現存物件與墓誌銘的歷代密文，使用全站流水號發布，並產生 history、deleted 索引；非 Git 或無 Git 可照常建置。
- 新增可重建的獨立歷史測試倉庫；固定提交時間，第一件物件三版、墓誌銘兩版、刪除一件物件。正式發佈 checkout 取得完整歷史。
- 物件與墓誌銘共用文字面板；歷史清單按提交日期顯示，點選後才讀取並解密，包含載入、解密失敗與空清單狀態。
- 已刪除物件依原日期排序、逐一生長為淡灰虛線空缺，不可開啟、不播放懸停循環。編輯器當次刪除後也保留空缺。
- 線上版本無法解密時停止 update/remove 並顯示指定訊息；新增建置、載入、GitHub 與瀏覽器測試。

## 2. 檔案清單
- `.github/workflows/pages.yml`
- `web/.gitignore`
- `web/scripts/copy-content.mjs`
- `web/scripts/make-history-fixture.mjs`
- `web/scripts/build-test.mjs`
- `web/scripts/check-history-build.mjs`
- `web/src/content.ts`
- `web/src/App.tsx`
- `web/src/Object.tsx`
- `web/src/History.tsx`
- `web/src/Editor.tsx`
- `web/src/github.ts`
- `web/src/style.css`
- `web/tests/copy-content.test.ts`
- `web/tests/content.test.ts`
- `web/tests/github.test.ts`
- `web/tests/cemetery.spec.ts`
- `web/tests/history-fixtures.ts`
- `web/tests/history.spec.ts`
- `_receipts/T5-history-and-gaps.md`（本回執）

## 3. 驗收證據

以下命令的工作目錄均為 `E:\My AI Project\myepitaph\.claude\worktrees\sleepy-yonath-8ed6b1\web`，因此沒有再次 `cd web`。使用 cmd 重導向保存 stdout/stderr，成功後 `type` 原樣顯示；下列輸出均為實際命令輸出。

### 3.1 正式建置及空內容索引
命令：`npm run build > C:\Users\User\AppData\Local\Temp\opencode\T5-build.log 2>&1 && type C:\Users\User\AppData\Local\Temp\opencode\T5-build.log`
```text

> myepitaph-prototype@0.0.0 build
> tsc --noEmit && vite build && node scripts/copy-content.mjs

vite v7.3.7 building client environment for production...
transforming...
node_modules/@remotion/player/dist/esm/index.mjs (1:0): Module level directives cause errors when bundled, "use client" in "node_modules/@remotion/player/dist/esm/index.mjs" was ignored.
✓ 41 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.45 kB │ gzip:   0.30 kB
dist/assets/index-BnvlZFW6.css    5.88 kB │ gzip:   2.09 kB
dist/assets/index-4AXhJ_av.js   586.64 kB │ gzip: 187.32 kB

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
✓ built in 1.95s
```
命令：`type dist\content\index.json > C:\Users\User\AppData\Local\Temp\opencode\T5-index.log && type C:\Users\User\AppData\Local\Temp\opencode\T5-index.log`
```text
{"epitaph":null,"objects":[],"history":{},"deleted":[]}
```

### 3.2 歷史測試建置及索引
命令：`npm run build:test > C:\Users\User\AppData\Local\Temp\opencode\T5-build-test.log 2>&1 && type C:\Users\User\AppData\Local\Temp\opencode\T5-build-test.log`
```text

> myepitaph-prototype@0.0.0 build:test
> node scripts/build-test.mjs

Created isolated history repo: 8 objects, 3 first-object versions, 2 epitaph versions, 1 deletion.

> myepitaph-prototype@0.0.0 build
> tsc --noEmit && vite build && node scripts/copy-content.mjs

vite v7.3.7 building client environment for production...
transforming...
node_modules/@remotion/player/dist/esm/index.mjs (1:0): Module level directives cause errors when bundled, "use client" in "node_modules/@remotion/player/dist/esm/index.mjs" was ignored.
✓ 41 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.45 kB │ gzip:   0.30 kB
dist/assets/index-BnvlZFW6.css    5.88 kB │ gzip:   2.09 kB
dist/assets/index-4AXhJ_av.js   586.64 kB │ gzip: 187.32 kB

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
✓ built in 1.98s
```

### 3.3 密文發布掃描（同時列出 3.2 要求的索引節錄）
命令：`node scripts/check-history-build.mjs > C:\Users\User\AppData\Local\Temp\opencode\T5-history-scan.log 2>&1 && type C:\Users\User\AppData\Local\Temp\opencode\T5-history-scan.log`
```text
{
  "history": {
    "2026-01-03-test-one.md.enc.json": [
      {
        "file": "history/1.enc.json",
        "date": "2026-10-03T12:00:00Z"
      },
      {
        "file": "history/2.enc.json",
        "date": "2026-10-02T12:00:00Z"
      },
      {
        "file": "history/3.enc.json",
        "date": "2026-10-01T12:00:00Z"
      }
    ],
    "epitaph.md.enc.json": [
      {
        "file": "history/11.enc.json",
        "date": "2026-10-04T12:00:00Z"
      },
      {
        "file": "history/12.enc.json",
        "date": "2026-10-01T12:00:00Z"
      }
    ]
  },
  "deleted": [
    {
      "name": "2026-09-10-test-gone.md.enc.json",
      "deletedAt": "2026-10-06T12:00:00Z"
    }
  ]
}
{
  "plaintextSentenceOccurrences": [
    0,
    0,
    0
  ],
  "markdownFiles": 0,
  "unexpectedContentFiles": []
}
```

腳本內容（`web/scripts/check-history-build.mjs`；只讀掃描，沒有遍歷修改檔案）：
```js
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
```

掃描的三句依序為第一版、第二版、目前版的首行：`第一版的假記憶，留在最初的地方。`、`第二版的假記憶，經過一次修改。`、`測試物件一。`。

### 3.4 單元測試
命令：`npm test > C:\Users\User\AppData\Local\Temp\opencode\T5-unit.log 2>&1 && type C:\Users\User\AppData\Local\Temp\opencode\T5-unit.log`
```text

> myepitaph-prototype@0.0.0 test
> vitest run


 RUN  v4.1.12 E:/My AI Project/myepitaph/.claude/worktrees/sleepy-yonath-8ed6b1/web


 Test Files  4 passed (4)
      Tests  53 passed (53)
   Start at  19:11:00
   Duration  8.22s (transform 210ms, setup 0ms, import 307ms, tests 13.33s, environment 0ms)

```

新增測試包括真實歷史 repo 的筆數、日期與密文檔案、獨立非 Git 來源、有 Git repo 但 PATH 無 Git、載入時不取歷史密文、非法刪除檔名略過，以及 update/remove 密碼不符時僅 GET、不寫入。

### 3.5 瀏覽器測試
命令：`npx playwright test > C:\Users\User\AppData\Local\Temp\opencode\T5-playwright.log 2>&1 && type C:\Users\User\AppData\Local\Temp\opencode\T5-playwright.log`
```text
[WebServer] (node:37636) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] node_modules/@remotion/player/dist/esm/index.mjs (1:0): Module level directives cause errors when bundled, "use client" in "node_modules/@remotion/player/dist/esm/index.mjs" was ignored.
[WebServer] 
[WebServer] (!) Some chunks are larger than 500 kB after minification. Consider:
[WebServer] - Using dynamic import() to code-split the application
[WebServer] - Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
[WebServer] - Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
[WebServer] (node:33064) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)

Running 34 tests using 8 workers

(node:42844) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:26892) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:42892) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:32672) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:6968) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:32136) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:37440) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:40652) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
  ok  7 tests\cemetery.spec.ts:167:1 › 六種簡筆畫同頁展示（展示頁與截圖僅存 test-results） (1.9s)
  ok  1 tests\cemetery.spec.ts:65:1 › 不同日期同 slug 只隱去選中的物件 (4.4s)
  ok  6 tests\cemetery.spec.ts:150:1 › 出現時由底部部件往上描線，懸停不重播生長 (4.6s)
  ok  9 tests\editor.spec.ts:43:1 › 首次貼權杖，加密持久化，重整解鎖後不需重貼，移除後清除儲存 (6.3s)
  ok  8 tests\cemetery.spec.ts:134:1 › 減少動態時懸停不播放循環 (8.6s)
  ok  2 tests\cemetery.spec.ts:84:1 › 桌面懸停播放循環，移開回到靜止 (9.0s)
  ok  5 tests\cemetery.spec.ts:11:3 › 390×844 墓園完整互動 (9.2s)
  ok  3 tests\cemetery.spec.ts:11:3 › 1440×900 墓園完整互動 (9.2s)
模擬 PUT request body：
{
  "message": "更新內容",
  "branch": "main",
  "sha": "mock-sha",
  "content": "ewogICJ2IjogMSwKICAia2RmIjogIlBCS0RGMi1TSEEyNTYiLAogICJpdGVyIjogNjAwMDAwLAogICJzYWx0IjogIkU3Qk1uNXBSM0lZT25PQXYyQWtWZ3c9PSIsCiAgIml2IjogImIyamFoeE56SXJGNldyRzgiLAogICJjdCI6ICJIcitIQ0lYUTZsMUU3STVWd1poWWZQd1M4Ukd1T2g5YmtvUHdCM1RLMTFxckRJMUl0V2kvQVhIQ1pCNjR2czhXMHd2Zm1rQlE1b09XVThKdEVsbkVEN3c9Igp9Cg=="
}
  ok 11 tests\editor.spec.ts:84:1 › 新增中文 slug，自動避開同名，新增為加密內容 (5.7s)
  ok  4 tests\cemetery.spec.ts:101:1 › 觸控長按播放但不開面板，之後短按另一件物件開面板 (13.2s)
  ok 17 tests\editor.spec.ts:192:1 › 401 顯示狀態碼而不暴露權杖，提交中停用儲存 (3.6s)
  ok 14 tests\editor.spec.ts:155:1 › 刪除遇線上 404 視為成功並移除清單，不發出 DELETE (5.4s)
  ok 19 tests\editor.spec.ts:224:1 › 844×390 密碼表單位於地平線之外，勾選框可點可聚焦 (573ms)
  ok 10 tests\editor.spec.ts:58:1 › 修改物件只提交密文，完成後以新文字重新生長 (10.7s)
  ok 12 tests\editor.spec.ts:100:1 › 線上已更新時儲存顯示衝突，不發出 PUT (7.3s)
  ok 16 tests\editor.spec.ts:167:1 › 刪除必須確認，取消不發送，確認帶 sha 刪除；墓誌銘 PUT 正確路徑 (7.1s)
  ok 15 tests\editor.spec.ts:132:1 › 新增避開網站清單尚未出現的線上同名，清單使用實際路徑 (7.2s)
  ok 18 tests\editor.spec.ts:209:1 › 390×844 編輯器無橫向捲動、文字框滿寬、按鈕至少 44px (3.8s)
  ok 13 tests\editor.spec.ts:112:1 › 物件與墓誌銘儲存後更新原文，可連續修改，物件也可接著刪除 (9.6s)
  ok 27 tests\unlock.spec.ts:55:3 › 已記住記錄 expired 時清除並回到密碼閘 (411ms)
  ok 26 tests\unlock.spec.ts:45:1 › 不勾記住，重整回到密碼閘 (1.8s)
  ok 28 tests\unlock.spec.ts:55:3 › 已記住記錄 incorrect 時清除並回到密碼閘 (590ms)
  ok 29 tests\unlock.spec.ts:55:3 › 已記住記錄 malformed 時清除並回到密碼閘 (360ms)
  ok 30 tests\unlock.spec.ts:69:3 › 空內容送出任意密碼仍在密碼閘且不儲存（空索引） (573ms)
  ok 25 tests\unlock.spec.ts:28:1 › 記住三十天，重整直接解鎖；上鎖刪記錄，重整仍在密碼閘 (3.4s)
  ok 31 tests\unlock.spec.ts:69:3 › 空內容送出任意密碼仍在密碼閘且不儲存（不合格物件） (550ms)
  ok 21 tests\history.spec.ts:33:1 › 墓誌銘使用同一面板列出兩版並解開舊版 (6.3s)
  ok 22 tests\history.spec.ts:44:1 › 空缺按日期排列，不是按鈕、不播放、不開面板，仍有八件物件 (6.4s)
  ok 20 tests\history.spec.ts:12:1 › 第一件歷史三版，最新標目前，按需解開最舊版本 (6.9s)
  ok 33 tests\unlock.spec.ts:88:3 › 只有一個epitaph仍以解密驗證密碼 (1.7s)
  ok 34 tests\unlock.spec.ts:104:1 › localStorage 不可用仍可解鎖與上鎖 (1.8s)
  ok 32 tests\unlock.spec.ts:88:3 › 只有一個object仍以解密驗證密碼 (2.2s)
  ok 24 tests\unlock.spec.ts:11:1 › 錯密碼顯示錯誤、清空與聚焦，沒有物件；正確密碼解出八件與面板 (5.9s)
  ok 23 tests\history.spec.ts:59:1 › 歷史密文解不開時顯示指定錯誤，沒有歷史時顯示空狀態 (8.2s)

  34 passed (37.3s)
```

截圖僅在已忽略的 `web/test-results/`，沒有加入版本控制。

### 3.6 收尾：測試伺服器已關閉
Playwright 管理的 webServer 隨測試結束退出，未另外啟動常駐背景程序。

命令：`node C:\Users\User\AppData\Local\Temp\opencode\T5-check-server.mjs`
```text
Local completion time: 2026-10-16 19:13:27
127.0.0.1:4173: ECONNREFUSED
```
臨時腳本內容：
```js
import { createConnection } from 'node:net';

const socket = createConnection({ host: '127.0.0.1', port: 4173 });
socket.setTimeout(2000);
socket.on('connect', () => {
  console.log('FAIL: 127.0.0.1:4173 is still listening');
  socket.destroy();
  process.exitCode = 1;
});
socket.on('error', (error) => {
  console.log(`127.0.0.1:4173: ${error.code}`);
  if (error.code !== 'ECONNREFUSED') process.exitCode = 1;
});
socket.on('timeout', () => {
  console.log('FAIL: port check timed out');
  socket.destroy();
  process.exitCode = 1;
});
console.log(`Local completion time: ${new Date().toLocaleString('sv-SE')}`);
```

### 3.7 回執輸出與實際日誌核對
命令：`node C:\Users\User\AppData\Local\Temp\opencode\T5-check-receipt.mjs`
```text
T5-build: verbatim output matched
T5-index: verbatim output matched
T5-build-test: verbatim output matched
T5-history-scan: verbatim output matched
T5-unit: verbatim output matched
T5-playwright: verbatim output matched
```
臨時腳本內容（僅統一 Windows 換行後比對完整輸出，沒有修改檔案）：
```js
import { readFile } from 'node:fs/promises';
const receipt = (await readFile('../_receipts/T5-history-and-gaps.md', 'utf8')).replaceAll('\r\n', '\n');
for (const name of ['T5-build', 'T5-index', 'T5-build-test', 'T5-history-scan', 'T5-unit', 'T5-playwright']) {
  const output = (await readFile(`C:/Users/User/AppData/Local/Temp/opencode/${name}.log`, 'utf8')).replaceAll('\r\n', '\n');
  const matches = receipt.includes(output);
  console.log(`${name}: ${matches ? 'verbatim output matched' : 'MISMATCH'}`);
  if (!matches) process.exitCode = 1;
}
```

## 4. 風險與存疑
- 無未完成的工單驗收項。未執行對外發佈、GitHub 真實寫入、提交、推送或合併；GitHub 寫入行為以模擬請求驗證，實際 Git 提交僅發生於規格指定的 `web/tests/.history-repo/`。
- 建置仍有 Remotion `use client`、產物大於 500 kB 警告；Playwright 有 NO_COLOR/FORCE_COLOR 警告，均未阻止驗收。
- 初次測試建置因 Node 不接受測試輔助檔內無副檔名的 import 而失敗，已移除該 import 並重跑成功；初次單元測試因 Git 的 UTC 輸出是 `Z` 而非 `+00:00` 失敗，已改為比較等價 ISO 時間並重跑 53 項全過。
- 曾嘗試 `node -e` 輸出索引，但 shell 引號解析失敗，未作為證據；已改用具名的 `web/scripts/check-history-build.mjs` 重跑，完整內容與有效輸出見 3.3。
- 單元測試的臨時建置資料保留於 `C:\Users\User\AppData\Local\Temp\opencode\T5-copy-*`，驗收日誌與埠檢查腳本亦保留於核准的臨時目錄；未執行工單未授權的清理刪除。
- 開始時已有 `_tickets/open/T5-history-and-gaps.md` 刪除及 `_tickets/doing/T5-history-and-gaps.md` 未追蹤狀態（預先領單），本次未移動或更改工單。
