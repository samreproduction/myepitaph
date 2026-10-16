# 回執 T4b：編輯器不得默默覆蓋內容

> 執行引擎：opencode opencode v2.0.29 / openai/gpt-6.1-sol
> 完成時間：2026-10-16 18:51
> 分支 / 提交 / PR：claude/project-thread-lrhwko / 無 / 無
> 工單：留在 _tickets/doing/ 等待驗收

## 1. 做了什麼
- `commitContent` 以 `mode` 明確區分 create、update、remove。新增只在 GET 404 後不帶 sha 建立；GET 200 或 PUT 422 遞增 slug 後綴，最多試 20 個名稱，回傳實際 path。純數字短名不會誤改日期分隔符。
- 修改、刪除先將 GitHub content 由 base64 解碼成 UTF-8 JSON，使用網站密碼解密並比對開啟編輯器時記住的原文；不同即停止，顯示工單指定訊息。409/422 僅在重新 GET、解密比對仍相同時重試一次；修改 GET 404 停止，刪除 404 視為成功。
- 墓誌銘原文為 null 時只能建立固定路徑；已有線上版本或建立遇 422 都提示衝突，不換名、不覆蓋。
- Editor 保存每件物件與墓誌銘的原文，成功儲存後更新原文；新增清單使用實際寫入 path。
- 單元測試使用 `seal(text, 'test-password')` 建立線上 envelope，預設 fetch 為拒絕連線的 mock。端到端測試攔截 GitHub API，提供真的加密 envelope，並維護模擬線上版本；涵蓋儲存衝突不發 PUT、連續修改、線上撞名與刪除 404。
- 未提交、推送、合併、移動工單，未連線真實 GitHub API；未開啟資料庫、圖片或壓縮檔。沒有自行啟動額外後台進程，Playwright 管理的伺服器已停止。

## 2. 檔案清單
- `web/src/github.ts`
- `web/src/Editor.tsx`
- `web/tests/github.test.ts`
- `web/tests/editor.spec.ts`
- `_receipts/T4b-no-silent-overwrite.md`（本回執）

## 3. 驗收證據（工單裡每條檢查對應一段）

以下三條命令的 shell 工作目錄均為 `E:\My AI Project\myepitaph\.claude\worktrees\sleepy-yonath-8ed6b1\web`，等同工單從倉庫根目錄執行 `cd web` 後的命令。記錄的是最後一輪完整驗收的原樣輸出。

### 3.1 建置成功
命令：`npm run build`
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
dist/assets/index-ByzU36Ox.js   584.45 kB │ gzip: 186.70 kB
✓ built in 1.98s
```
退出碼：0。

### 3.2 單元測試全過
命令：`npm test`
```text

> myepitaph-prototype@0.0.0 test
> vitest run


 RUN  v4.1.12 E:/My AI Project/myepitaph/.claude/worktrees/sleepy-yonath-8ed6b1/web


 Test Files  3 passed (3)
      Tests  47 passed (47)
   Start at  18:50:54
   Duration  8.00s (transform 129ms, setup 0ms, import 240ms, tests 8.25s, environment 0ms)

```
退出碼：0。新增測試包括 GET 200 依序改為 -2/-3、PUT 422 改名、20 次上限、已有 -N 遞增、線上原文不同不寫入、相同才帶 sha、修改/刪除 404、409/422 重取並重新比對、固定墓誌銘建立競態、無法解密或缺少 sha 時不寫入，以及錯誤不洩漏權杖。

### 3.3 端到端測試全過
命令：`npx playwright test`
```text
[WebServer] (node:30476) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] node_modules/@remotion/player/dist/esm/index.mjs (1:0): Module level directives cause errors when bundled, "use client" in "node_modules/@remotion/player/dist/esm/index.mjs" was ignored.
[WebServer] 
[WebServer] (!) Some chunks are larger than 500 kB after minification. Consider:
[WebServer] - Using dynamic import() to code-split the application
[WebServer] - Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
[WebServer] - Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
[WebServer] (node:15480) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)

Running 30 tests using 8 workers

(node:34452) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:7052) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:13088) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:42088) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:30940) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:31928) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:39412) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:41968) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
  ok  5 tests\cemetery.spec.ts:167:1 › 六種簡筆畫同頁展示（展示頁與截圖僅存 test-results） (1.4s)
  ok  6 tests\cemetery.spec.ts:65:1 › 不同日期同 slug 只隱去選中的物件 (4.3s)
  ok  7 tests\cemetery.spec.ts:150:1 › 出現時由底部部件往上描線，懸停不重播生長 (4.8s)
  ok  2 tests\cemetery.spec.ts:134:1 › 減少動態時懸停不播放循環 (7.1s)
  ok  9 tests\editor.spec.ts:43:1 › 首次貼權杖，加密持久化，重整解鎖後不需重貼，移除後清除儲存 (6.2s)
  ok  4 tests\cemetery.spec.ts:84:1 › 桌面懸停播放循環，移開回到靜止 (8.1s)
模擬 PUT request body：
{
  "message": "更新內容",
  "branch": "main",
  "sha": "mock-sha",
  "content": "ewogICJ2IjogMSwKICAia2RmIjogIlBCS0RGMi1TSEEyNTYiLAogICJpdGVyIjogNjAwMDAwLAogICJzYWx0IjogIm1uRWVuNlMwWjNteDlkUklTQldTVHc9PSIsCiAgIml2IjogInJValUyTDIxdnJ5LzR6TFQiLAogICJjdCI6ICJ3aUpYOWwzbEd1UmwzVEIwR0p1YVJRM3JYNWFvWjRoelNrSnBZVnRldUdhNnArUGRFRnBpcjEyQkdLUXQxWFRXMEMyQXJha1V0akZ6L05VRTZTS2J5dDA9Igp9Cg=="
}
  ok  8 tests\cemetery.spec.ts:11:3 › 1440×900 墓園完整互動 (8.4s)
  ok 11 tests\editor.spec.ts:84:1 › 新增中文 slug，自動避開同名，新增為加密內容 (3.7s)
  ok 12 tests\editor.spec.ts:100:1 › 線上已更新時儲存顯示衝突，不發出 PUT (3.0s)
  ok 15 tests\editor.spec.ts:155:1 › 刪除遇線上 404 視為成功並移除清單，不發出 DELETE (2.6s)
  ok 14 tests\editor.spec.ts:132:1 › 新增避開網站清單尚未出現的線上同名，清單使用實際路徑 (3.3s)
  ok  1 tests\cemetery.spec.ts:11:3 › 390×844 墓園完整互動 (12.4s)
  ok  3 tests\cemetery.spec.ts:101:1 › 觸控長按播放但不開面板，之後短按另一件物件開面板 (11.8s)
  ok 13 tests\editor.spec.ts:112:1 › 物件與墓誌銘儲存後更新原文，可連續修改，物件也可接著刪除 (4.5s)
  ok 19 tests\editor.spec.ts:224:1 › 844×390 密碼表單位於地平線之外，勾選框可點可聚焦 (791ms)
  ok 16 tests\editor.spec.ts:167:1 › 刪除必須確認，取消不發送，確認帶 sha 刪除；墓誌銘 PUT 正確路徑 (3.6s)
  ok 10 tests\editor.spec.ts:58:1 › 修改物件只提交密文，完成後以新文字重新生長 (7.8s)
  ok 23 tests\unlock.spec.ts:55:3 › 已記住記錄 expired 時清除並回到密碼閘 (527ms)
  ok 25 tests\unlock.spec.ts:55:3 › 已記住記錄 malformed 時清除並回到密碼閘 (488ms)
  ok 24 tests\unlock.spec.ts:55:3 › 已記住記錄 incorrect 時清除並回到密碼閘 (748ms)
  ok 17 tests\editor.spec.ts:192:1 › 401 顯示狀態碼而不暴露權杖，提交中停用儲存 (3.4s)
  ok 26 tests\unlock.spec.ts:69:3 › 空內容送出任意密碼仍在密碼閘且不儲存（空索引） (706ms)
  ok 27 tests\unlock.spec.ts:69:3 › 空內容送出任意密碼仍在密碼閘且不儲存（不合格物件） (710ms)
  ok 22 tests\unlock.spec.ts:45:1 › 不勾記住，重整回到密碼閘 (2.0s)
  ok 18 tests\editor.spec.ts:209:1 › 390×844 編輯器無橫向捲動、文字框滿寬、按鈕至少 44px (3.0s)
  ok 28 tests\unlock.spec.ts:88:3 › 只有一個epitaph仍以解密驗證密碼 (1.8s)
  ok 30 tests\unlock.spec.ts:104:1 › localStorage 不可用仍可解鎖與上鎖 (1.8s)
  ok 29 tests\unlock.spec.ts:88:3 › 只有一個object仍以解密驗證密碼 (2.3s)
  ok 21 tests\unlock.spec.ts:28:1 › 記住三十天，重整直接解鎖；上鎖刪記錄，重整仍在密碼閘 (3.7s)
  ok 20 tests\unlock.spec.ts:11:1 › 錯密碼顯示錯誤、清空與聚焦，沒有物件；正確密碼解出八件與面板 (6.2s)

  30 passed (26.4s)
```
退出碼：0。首輪相同命令曾為 29 passed / 1 failed，失敗是新測試的 `getByLabel(..., { exact: true })` 等待逾時；改成 `getByRole('textbox', { name: label, exact: true })` 後，上述全套重跑通過。未增加逾時或跳過測試。

### 3.4 收尾：測試伺服器已停止
原先嘗試的兩條 `node -e` 命令受到 Windows 引號解析影響而失敗，沒有當作時間或收尾證據；已改成下列明確點名的暫存腳本執行。

腳本：`C:\Users\User\AppData\Local\Temp\opencode\T4b-final-check.cjs`
```javascript
const net = require('node:net');
const date = new Date();
console.log('Local time: ' + date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0') + ' ' + String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0'));
const server = net.createServer();
server.once('error', (error) => {
  console.error('127.0.0.1:4173 check failed: ' + error.code);
  process.exitCode = 1;
});
server.listen(4173, '127.0.0.1', () => server.close(() => console.log('127.0.0.1:4173 is free; Playwright web server is stopped')));
```
命令：`node C:\Users\User\AppData\Local\Temp\opencode\T4b-final-check.cjs`
```text
Local time: 2026-10-16 18:51
127.0.0.1:4173 is free; Playwright web server is stopped
```
退出碼：0。腳本只讀時間並暫時綁定後立即關閉埠，沒有遍歷或修改任何檔案。

## 4. 風險與存疑
- 建置保留既有第三方 `use client`、500 kB bundle 警告；測試環境另有 NO_COLOR/FORCE_COLOR 警告。不在本工單範圍內，未改設定。
- 真實 GitHub 權限、寫入與發佈未做驗證，依工單全程模擬，不對外寫入或發消息。
- 開始前 git 已顯示 `_tickets/open/T4b-no-silent-overwrite.md` 刪除與 `_tickets/doing/T4b-no-silent-overwrite.md` 未追蹤狀態；這是既有領單狀態，本次未更動或還原。
- 無未完成的工單驗收項。
