# 回執 T4：瀏覽器編輯器（手機可用）

> 執行引擎：opencode opencode v2.0.29 / openai/gpt-6.1-sol
> 完成時間：2026-10-16 18:42
> 分支 / 提交 / PR：claude/project-thread-lrhwko / 無 / 無
> 工單：留在 _tickets/doing/ 等待驗收

## 1. 做了什麼
- 解鎖後可開啟全螢幕編輯面板，新增、修改、確認刪除物件及修改墓誌銘；完成後用已提交的新內容重新生長。
- 網站密碼僅在目前工作階段額外保留於記憶體，上鎖清除；GitHub 權杖以網站密碼 seal 後存入 `blacktomb.token`，開啟面板時解密，可移除。
- 新增 GitHub Contents API 客戶端：分段編碼路徑、UTF-8 base64、固定提交訊息、分支設定、GET sha、PUT / DELETE，以及 409 / 422 重新取 sha 後最多重試一次。只送密文，不顯示伺服器錯誤本文或網路錯誤中的敏感資訊。
- 新增物件使用本地今天日期，清理 slug 的斜線與前後空白，與目前清單重名時附加 `-2`、`-3`。
- 修正手機橫向密碼表單與地平線間距；勾選框改為深色自繪且保留 label 點選及聚焦。
- 新增單元及瀏覽器測試；所有新增瀏覽器測試均攔截 GitHub API，未呼叫真 GitHub，未 commit / push，未挪動工單。

## 2. 檔案清單
- `web/src/config.ts`（新增）
- `web/src/github.ts`（新增）
- `web/src/Editor.tsx`（新增）
- `web/src/App.tsx`
- `web/src/style.css`
- `web/tests/github.test.ts`（新增）
- `web/tests/editor.spec.ts`（新增）
- `web/tests/cemetery.spec.ts`（既有勾選框測試改驗證本單的新規格）
- `_receipts/T4-phone-editor.md`（本回執）

## 3. 驗收證據
以下三條驗收命令的執行目錄均為 `E:\My AI Project\myepitaph\.claude\worktrees\sleepy-yonath-8ed6b1\web`，等同由倉庫根目錄先 `cd web`。

### 3.1 建置
命令：`npm run build`
退出碼：0。原樣輸出：
```text

> myepitaph-prototype@0.0.0 build
> tsc --noEmit && vite build && node scripts/copy-content.mjs

vite v7.3.7 building client environment for production...
transforming...
node_modules/@remotion/player/dist/esm/index.mjs (1:0): Module level directives cause errors when bundled, "use client" in "node_modules/@remotion/player/dist/esm/index.mjs" was ignored.
✓ 40 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.45 kB │ gzip:   0.30 kB

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
dist/assets/index-B-if_3RI.css    5.39 kB │ gzip:   1.96 kB
dist/assets/index-D4wcJkQB.js   583.05 kB │ gzip: 186.09 kB
✓ built in 2.06s
```

### 3.2 單元測試
命令：`npm test`
退出碼：0。原樣輸出：
```text

> myepitaph-prototype@0.0.0 test
> vitest run


 RUN  v4.1.12 E:/My AI Project/myepitaph/.claude/worktrees/sleepy-yonath-8ed6b1/web


 Test Files  3 passed (3)
      Tests  25 passed (25)
   Start at  18:40:45
   Duration  828ms (transform 195ms, setup 0ms, import 285ms, tests 1.03s, environment 0ms)

```
新增測試包括中文 UTF-8 base64、中文路徑、404 新建、密文解開及 JSON 排版、409 / 422 重取 sha 與重試上限、DELETE sha、401 與網路例外不洩漏假權杖。

### 3.3 Playwright
命令：`npx playwright test`
退出碼：0。以下是修正舊勾選框測試後最後一次全套執行的原樣輸出：
```text
[WebServer] (node:33816) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] node_modules/@remotion/player/dist/esm/index.mjs (1:0): Module level directives cause errors when bundled, "use client" in "node_modules/@remotion/player/dist/esm/index.mjs" was ignored.
[WebServer] 
[WebServer] (!) Some chunks are larger than 500 kB after minification. Consider:
[WebServer] - Using dynamic import() to code-split the application
[WebServer] - Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
[WebServer] - Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
[WebServer] (node:24624) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)

Running 26 tests using 8 workers

(node:31040) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:28284) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:39000) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:19204) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:32412) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:34032) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:27308) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:29436) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
  ok  7 tests\cemetery.spec.ts:167:1 › 六種簡筆畫同頁展示（展示頁與截圖僅存 test-results） (1.0s)
  ok  1 tests\cemetery.spec.ts:65:1 › 不同日期同 slug 只隱去選中的物件 (3.8s)
  ok  8 tests\cemetery.spec.ts:150:1 › 出現時由底部部件往上描線，懸停不重播生長 (4.6s)
  ok  9 tests\editor.spec.ts:29:1 › 首次貼權杖，加密持久化，重整解鎖後不需重貼，移除後清除儲存 (4.0s)
模擬 PUT request body：
{
  "message": "更新內容",
  "branch": "main",
  "sha": "mock-sha",
  "content": "ewogICJ2IjogMSwKICAia2RmIjogIlBCS0RGMi1TSEEyNTYiLAogICJpdGVyIjogNjAwMDAwLAogICJzYWx0IjogIkVDTmhhMkdzczQvVG9hM0pvV1ZaNkE9PSIsCiAgIml2IjogInMvaHdNeEpwN3FmZVU1YVYiLAogICJjdCI6ICJGTlJqTm55Y2d6RktjVnJDQkZraDVYVVBKSDVYbUpQemJCMDNEM21sV3J3Q21ydW1JQUxTRVQyN2I5amUwZDNCOVMxMndldjVsTlpqM0hrc1UwYzdFajg9Igp9Cg=="
}
  ok 11 tests\editor.spec.ts:70:1 › 新增中文 slug，自動避開同名，新增為加密內容 (2.6s)
  ok  5 tests\cemetery.spec.ts:84:1 › 桌面懸停播放循環，移開回到靜止 (7.4s)
  ok 12 tests\editor.spec.ts:86:1 › 刪除必須確認，取消不發送，確認帶 sha 刪除；墓誌銘 PUT 正確路徑 (2.6s)
  ok  3 tests\cemetery.spec.ts:11:3 › 1440×900 墓園完整互動 (7.8s)
  ok  4 tests\cemetery.spec.ts:134:1 › 減少動態時懸停不播放循環 (8.1s)
  ok  6 tests\cemetery.spec.ts:101:1 › 觸控長按播放但不開面板，之後短按另一件物件開面板 (8.1s)
  ok 15 tests\editor.spec.ts:143:1 › 844×390 密碼表單位於地平線之外，勾選框可點可聚焦 (557ms)
  ok 19 tests\unlock.spec.ts:55:3 › 已記住記錄 expired 時清除並回到密碼閘 (452ms)
  ok  2 tests\cemetery.spec.ts:11:3 › 390×844 墓園完整互動 (9.2s)
  ok 20 tests\unlock.spec.ts:55:3 › 已記住記錄 incorrect 時清除並回到密碼閘 (559ms)
  ok 13 tests\editor.spec.ts:111:1 › 401 顯示狀態碼而不暴露權杖，提交中停用儲存 (2.3s)
  ok 21 tests\unlock.spec.ts:55:3 › 已記住記錄 malformed 時清除並回到密碼閘 (447ms)
  ok 14 tests\editor.spec.ts:128:1 › 390×844 編輯器無橫向捲動、文字框滿寬、按鈕至少 44px (2.3s)
  ok 22 tests\unlock.spec.ts:69:3 › 空內容送出任意密碼仍在密碼閘且不儲存（空索引） (633ms)
  ok 18 tests\unlock.spec.ts:45:1 › 不勾記住，重整回到密碼閘 (1.9s)
  ok 23 tests\unlock.spec.ts:69:3 › 空內容送出任意密碼仍在密碼閘且不儲存（不合格物件） (649ms)
  ok 10 tests\editor.spec.ts:44:1 › 修改物件只提交密文，完成後以新文字重新生長 (6.8s)
  ok 24 tests\unlock.spec.ts:88:3 › 只有一個epitaph仍以解密驗證密碼 (1.7s)
  ok 17 tests\unlock.spec.ts:28:1 › 記住三十天，重整直接解鎖；上鎖刪記錄，重整仍在密碼閘 (3.4s)
  ok 26 tests\unlock.spec.ts:104:1 › localStorage 不可用仍可解鎖與上鎖 (1.8s)
  ok 25 tests\unlock.spec.ts:88:3 › 只有一個object仍以解密驗證密碼 (2.2s)
  ok 16 tests\unlock.spec.ts:11:1 › 錯密碼顯示錯誤、清空與聚焦，沒有物件；正確密碼解出八件與面板 (6.4s)

  26 passed (22.3s)
```

新增 7 項瀏覽器測試涵蓋工單列出的權杖首次設定／重整／移除、PUT 標頭與 sha／訊息／密文解開、中文 slug 與重名、刪除確認與 DELETE sha、墓誌銘路徑、401 脫敏、390×844 編輯面板及 844×390 密碼表單。

### 3.4 一次模擬 PUT 的 request body
取得命令：同上 `npx playwright test`，由「修改物件只提交密文，完成後以新文字重新生長」測試擷取並輸出。原樣 body（亦在上段完整輸出中）：
```json
{
  "message": "更新內容",
  "branch": "main",
  "sha": "mock-sha",
  "content": "ewogICJ2IjogMSwKICAia2RmIjogIlBCS0RGMi1TSEEyNTYiLAogICJpdGVyIjogNjAwMDAwLAogICJzYWx0IjogIkVDTmhhMkdzczQvVG9hM0pvV1ZaNkE9PSIsCiAgIml2IjogInMvaHdNeEpwN3FmZVU1YVYiLAogICJjdCI6ICJGTlJqTm55Y2d6RktjVnJDQkZraDVYVVBKSDVYbUpQemJCMDNEM21sV3J3Q21ydW1JQUxTRVQyN2I5amUwZDNCOVMxMndldjVsTlpqM0hrc1UwYzdFajg9Igp9Cg=="
}
```
測試以共用 `src/crypto.mjs` 的 `open()` 及假密碼驗證解密結果，並斷言 body 不含新文字及假權杖。

### 3.5 後台進程收尾
Playwright 自動管理測試伺服器的啟停。另驗證其 4173 埠已關閉。
命令：`node C:\Users\User\AppData\Local\Temp\opencode\T4-check.cjs`
原樣輸出：
```text
Local time: 2026-10-16 18:42:25
PASS: port 4173 is closed
```
臨時腳本全文（只檢查時間及連線，不遍歷或修改倉庫）：
```js
const net = require('node:net');
console.log('Local time: ' + new Date().toLocaleString('sv-SE'));
const socket = net.connect(4173, '127.0.0.1');
socket.on('connect', () => {
  console.log('FAIL: port 4173 is still listening');
  socket.destroy();
  process.exitCode = 1;
});
socket.on('error', (error) => {
  console.log(error.code === 'ECONNREFUSED' ? 'PASS: port 4173 is closed' : error.message);
  if (error.code !== 'ECONNREFUSED') process.exitCode = 1;
});
```
曾嘗試 `node -e` 內嵌檢查，但 Windows 命令引號解析回報 `Unterminated string constant`，不作為成功證據；以上改用點名的臨時腳本實際重跑。

## 4. 風險與存疑
- 按工單禁止真 GitHub 請求，未實際驗證真權杖權限、真 repo 提交及 Actions 發佈耗時；僅模擬 API。「約一分鐘」為介面提示，非實測部署時間。
- 建置有既有 Remotion `use client` 與大於 500 kB 的 bundle 警告；本單未擴大範圍調整依賴或拆包。
- 第一輪 Playwright 為 24 通過、2 失敗，原因是既有兩個 viewport 測試仍驗證原生 `accent-color`。已改為驗證新規格的自繪深色底及灰框，最後全套 26 通過。
- 開始工作時已有 `_tickets/open/T4-phone-editor.md` 刪除及 `_tickets/doing/T4-phone-editor.md` 未追蹤的領單狀態；未處理、未移動。
- 本機內容在重新整理前保留本次成功提交的修改；重新整理仍讀取當時已發佈的密文，需等待 Actions 發佈。
