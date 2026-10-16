# 回執 T2b：空內容阻擋、檔名與密碼閘修正

> 執行引擎：opencode opencode v2.0.29 / openai/gpt-6.1-sol
> 完成時間：2026-10-16 18:27
> 分支 / 提交 / PR：claude/project-thread-lrhwko / 無 / 無
> 工單：留在 _tickets/doing/ 等待驗收

## 1. 做了什麼
- 無墓誌銘且無合格物件時拋出獨立空內容錯誤；送出後留在密碼閘、顯示「目前還沒有內容」，不儲存解鎖記錄。只有墓誌銘或只有一個物件時仍以解密驗證密碼。
- slug 放寬為任何不含 `/`、`\` 的非空字串，保留合法日期驗證。
- 移除石碑上方測試字樣與無用樣式；物件區標籤改為「依日期排列的物件」，面板標題顯示日期，網頁標題改為「黑墓」。選中比對同時使用日期與 slug。
- 密碼表單移到地平線上方；輸入焦點使用 1px 淺灰外框，勾選框採灰色 accent-color。
- 補上中文／大寫空格檔名、非法路徑與日期、空索引／僅不合格物件、單檔解密、同 slug 不同日期、兩種視窗尺寸的間距、焦點與正式文字回歸測試。
- 未提交、推送、合併或搬動工單；截圖僅由既有測試寫入已忽略的 test-results，未開啟圖片。

## 2. 檔案清單
- `web/src/content.ts`
- `web/src/App.tsx`
- `web/src/style.css`
- `web/index.html`
- `web/tests/content.test.ts`
- `web/tests/unlock.spec.ts`
- `web/tests/cemetery.spec.ts`
- `_receipts/T2b-gate-fixes.md`（本回執）

## 3. 驗收證據（工單裡每條檢查對應一段）
以下 3.1–3.3 命令皆從倉庫根目錄 `E:\My AI Project\myepitaph\.claude\worktrees\sleepy-yonath-8ed6b1` 執行；輸出照錄。

### 3.1 正式建置
命令：`cd web && npm run build`
```text

> myepitaph-prototype@0.0.0 build
> tsc --noEmit && vite build && node scripts/copy-content.mjs

vite v7.3.7 building client environment for production...
transforming...
node_modules/@remotion/player/dist/esm/index.mjs (1:0): Module level directives cause errors when bundled, "use client" in "node_modules/@remotion/player/dist/esm/index.mjs" was ignored.
✓ 37 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.45 kB │ gzip:   0.30 kB

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
dist/assets/index-B0eH7Irh.css    3.94 kB │ gzip:   1.57 kB
dist/assets/index-ihpMp4Qa.js   576.88 kB │ gzip: 183.70 kB
✓ built in 2.01s
```

### 3.2 單元測試
命令：`cd web && npm test`
```text

> myepitaph-prototype@0.0.0 test
> vitest run


 RUN  v4.1.12 E:/My AI Project/myepitaph/.claude/worktrees/sleepy-yonath-8ed6b1/web


 Test Files  2 passed (2)
      Tests  18 passed (18)
   Start at  18:26:42
   Duration  731ms (transform 104ms, setup 0ms, import 152ms, tests 526ms, environment 0ms)

```

### 3.3 Playwright
命令：`cd web && npx playwright test`
```text
[WebServer] (node:42688) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] node_modules/@remotion/player/dist/esm/index.mjs (1:0): Module level directives cause errors when bundled, "use client" in "node_modules/@remotion/player/dist/esm/index.mjs" was ignored.
[WebServer] 
[WebServer] (!) Some chunks are larger than 500 kB after minification. Consider:
[WebServer] - Using dynamic import() to code-split the application
[WebServer] - Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
[WebServer] - Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
[WebServer] (node:29508) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)

Running 19 tests using 8 workers

(node:29680) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:38068) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:23380) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:33864) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:37892) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:34208) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:31084) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:37636) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
  ok  6 tests\cemetery.spec.ts:164:1 › 六種簡筆畫同頁展示（展示頁與截圖僅存 test-results） (2.0s)
  ok  1 tests\cemetery.spec.ts:62:1 › 不同日期同 slug 只隱去選中的物件 (4.3s)
  ok  5 tests\cemetery.spec.ts:147:1 › 出現時由底部部件往上描線，懸停不重播生長 (5.9s)
  ok  4 tests\cemetery.spec.ts:131:1 › 減少動態時懸停不播放循環 (7.5s)
  ok  9 tests\unlock.spec.ts:11:1 › 錯密碼顯示錯誤、清空與聚焦，沒有物件；正確密碼解出八件與面板 (6.4s)
  ok 11 tests\unlock.spec.ts:45:1 › 不勾記住，重整回到密碼閘 (2.5s)
  ok 10 tests\unlock.spec.ts:28:1 › 記住三十天，重整直接解鎖；上鎖刪記錄，重整仍在密碼閘 (5.0s)
  ok 12 tests\unlock.spec.ts:55:3 › 已記住記錄 expired 時清除並回到密碼閘 (1.5s)
  ok  7 tests\cemetery.spec.ts:81:1 › 桌面懸停播放循環，移開回到靜止 (10.1s)
  ok 13 tests\unlock.spec.ts:55:3 › 已記住記錄 incorrect 時清除並回到密碼閘 (1.9s)
  ok  8 tests\cemetery.spec.ts:98:1 › 觸控長按播放但不開面板，之後短按另一件物件開面板 (11.2s)
  ok 14 tests\unlock.spec.ts:55:3 › 已記住記錄 malformed 時清除並回到密碼閘 (2.4s)
  ok 16 tests\unlock.spec.ts:69:3 › 空內容送出任意密碼仍在密碼閘且不儲存（不合格物件） (3.1s)
  ok  3 tests\cemetery.spec.ts:11:3 › 1440×900 墓園完整互動 (12.8s)
  ok 15 tests\unlock.spec.ts:69:3 › 空內容送出任意密碼仍在密碼閘且不儲存（空索引） (3.4s)
  ok  2 tests\cemetery.spec.ts:11:3 › 390×844 墓園完整互動 (13.5s)
  ok 19 tests\unlock.spec.ts:104:1 › localStorage 不可用仍可解鎖與上鎖 (2.3s)
  ok 17 tests\unlock.spec.ts:88:3 › 只有一個epitaph仍以解密驗證密碼 (3.0s)
  ok 18 tests\unlock.spec.ts:88:3 › 只有一個object仍以解密驗證密碼 (3.4s)

  19 passed (24.2s)
```

### 3.4 build:test 後重跑
依工單允許省略額外重跑：`web/playwright.config.ts` 的 `webServer.command` 已是 `npm run build:test && npm run preview -- --port 4173 --strictPort`，且 `reuseExistingServer: false`。因此 3.3 的實際命令會先自動完成 build:test，再跑全部 19 項測試；原樣輸出見 3.3，未宣稱另有執行。

### 3.5 測試伺服器收尾與 shell 引號問題
一次直接 `node -e` 檢查因 shell 引號解析失敗，未當作成功證據。失敗命令如下：
```text
node -e "const net=require('node:net');const s=net.connect(4173,'127.0.0.1');s.on('connect',()=>{console.log('FAIL: test server still listening on 127.0.0.1:4173');s.destroy();process.exitCode=1});s.on('error',e=>{console.log(e.code==='ECONNREFUSED'?'PASS: no test server listening on 127.0.0.1:4173':e.message);if(e.code!=='ECONNREFUSED')process.exitCode=1});console.log('Completed at '+new Date().toLocaleString('sv-SE'));"
```
原樣輸出：
```text
[eval]:1
"const
^^^^^^
Unterminated string constant

SyntaxError: Invalid or unexpected token
    at makeContextifyScript (node:internal/vm:194:14)
    at compileScript (node:internal/process/execution:388:10)
    at evalTypeScript (node:internal/process/execution:260:22)
    at node:internal/main/eval_string:71:3

Node.js v24.18.0
```
改用倉庫外臨時腳本 `C:\Users\User\AppData\Local\Temp\opencode\T2b-check-server.cjs`，內容如下（不遍歷或修改任何檔案）：
```javascript
const net = require('node:net');
console.log('Completed at ' + new Date().toLocaleString('sv-SE'));
const socket = net.connect(4173, '127.0.0.1');
socket.on('connect', () => {
  console.log('FAIL: test server still listening on 127.0.0.1:4173');
  socket.destroy();
  process.exitCode = 1;
});
socket.on('error', (error) => {
  console.log(error.code === 'ECONNREFUSED'
    ? 'PASS: no test server listening on 127.0.0.1:4173'
    : error.message);
  if (error.code !== 'ECONNREFUSED') process.exitCode = 1;
});
```
命令：`node C:\Users\User\AppData\Local\Temp\opencode\T2b-check-server.cjs`
```text
Completed at 2026-10-16 18:27:38
PASS: no test server listening on 127.0.0.1:4173
```
測試伺服器由 Playwright 自動停止，未另起背景進程。

## 4. 風險與存疑
- 無未完成的工單驗收項目。建置仍有 Remotion 的 `use client` 與超過 500 kB 的 bundle 警告；測試另有 NO_COLOR／FORCE_COLOR 警告，皆未阻擋成功，未越界處理。
- 初始 `git status --short` 已有 `_tickets/open/T2b-gate-fixes.md` 刪除與 `_tickets/doing/T2b-gate-fixes.md` 未追蹤狀態，符合派單已領取情境；本次未動這些檔案。
- 未更動既有記住密碼設計；審查第 6 條明定不改。
