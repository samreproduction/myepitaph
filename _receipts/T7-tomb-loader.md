# 回執 T7：墓碑堆砌載入動畫與進度條

> 執行引擎：opencode opencode v2.0.29 / openai/gpt-6.1-sol
> 完成時間：2026-10-17 11:49（UTC+8）
> 分支 / 提交 / PR：claude/project-thread-d66o21 / 無 / 無
> 工單：留在 _tickets/doing/ 等待驗收

## 1. 做了什麼
- 新增 30fps Remotion 墓碑載入畫面：15 塊石、虛線軌道、逐塊落下、刻線、停留、淡出；依實際解密進度暫停／續播，未使用 seekTo；支援減弱動效與無障礙進度數值。
- `loadContent` 增加選用進度回呼，索引與每個成功解開的內容各回報一次；保留並行解密、錯誤類型與無效檔名略過行為。
- 手動及記住裝置解鎖均隱藏表單、顯示墓碑，動畫完成後才生長；錯誤立即恢復表單、清空並聚焦；保留 attempt 防競態檢查，上鎖時清除動畫待完成狀態。
- 新增有／無墓誌銘的進度單元測試及延遲回應、石數單調增加、錯密碼、減弱動效瀏覽器測試。既有測試未改寬鬆。
- 自檢命令全過，但「額外等待不得超過 900ms」無法同時滿足固定正常速度逐塊補播，列於第 4 節，不能視為全部規格已完成。

## 2. 檔案清單
- `web/src/TombLoader.tsx`（新增）
- `web/src/App.tsx`
- `web/src/content.ts`
- `web/src/style.css`
- `web/tests/content.test.ts`
- `web/tests/loader.spec.ts`（新增）
- `_receipts/T7-tomb-loader.md`（本回執）

## 3. 驗收證據（工單裡每條檢查對應一段）

以下命令的工作目錄由 shell 工具指定，沒有依賴 shell 的 cd。3.1–3.4 工作目錄為 `E:\My AI Project\myepitaph\.claude\worktrees\nice-fermat-4fb0b3\web`；3.5 為倉庫根目錄。輸出按工具實際返回內容貼出。

### 3.1 TypeScript
直接執行 `npx tsc --noEmit` 回傳空輸出，依要求不作證據。另一次 `node -e` 包裝因 Windows 引號解析失敗，改成臨時腳本重跑，顯式輸出實際子程序退出碼。

命令：`node C:\Users\User\AppData\Local\Temp\opencode\t7-check.cjs`
```text
tsc exit code: 0
```

### 3.2 單元測試
命令：`npm test`
```text

> myepitaph-prototype@0.0.0 test
> vitest run


 RUN  v4.1.12 E:/My AI Project/myepitaph/.claude/worktrees/nice-fermat-4fb0b3/web


 Test Files  4 passed (4)
      Tests  55 passed (55)
   Start at  11:45:42
   Duration  7.20s (transform 227ms, setup 0ms, import 308ms, tests 12.69s, environment 0ms)
```

### 3.3 瀏覽器驗收
首次執行新增的三項測試失敗：進度條容器只有絕對定位子元素，本身高度為零，被 Playwright 判為 hidden。已修正容器高寬比與定位，以下為重跑完整命令的原樣輸出。

命令：`npm run build:test && npx playwright test`
```text

> myepitaph-prototype@0.0.0 build:test
> node scripts/build-test.mjs

Created isolated history repo: 8 objects, 3 first-object versions, 2 epitaph versions, 1 deletion.

> myepitaph-prototype@0.0.0 build
> tsc --noEmit && vite build && node scripts/copy-content.mjs

vite v7.3.7 building client environment for production...
transforming...
node_modules/@remotion/player/dist/esm/index.mjs (1:0): Module level directives cause errors when bundled, "use client" in "node_modules/@remotion/player/dist/esm/index.mjs" was ignored.
✓ 42 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.46 kB │ gzip:   0.31 kB

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
dist/assets/index-B6u_2Uke.css    6.79 kB │ gzip:   2.29 kB
dist/assets/index-CiWu5oPD.js   590.05 kB │ gzip: 188.50 kB
✓ built in 1.95s
[WebServer] (node:10884) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] node_modules/@remotion/player/dist/esm/index.mjs (1:0): Module level directives cause errors when bundled, "use client" in "node_modules/@remotion/player/dist/esm/index.mjs" was ignored.
[WebServer] 
[WebServer] (!) Some chunks are larger than 500 kB after minification. Consider:
[WebServer] - Using dynamic import() to code-split the application
[WebServer] - Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
[WebServer] - Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
[WebServer] (node:31168) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)

Running 39 tests using 8 workers

(node:16392) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:22204) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:14172) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:26532) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:22900) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:16680) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:5104) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:17236) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
  ok  6 tests\cemetery.spec.ts:167:1 › 六種簡筆畫同頁展示（展示頁與截圖僅存 test-results） (1.2s)
  ok  8 tests\cemetery.spec.ts:65:1 › 不同日期同 slug 只隱去選中的物件 (6.3s)
  ok  7 tests\cemetery.spec.ts:150:1 › 出現時由底部部件往上描線，懸停不重播生長 (6.2s)
  ok  4 tests\cemetery.spec.ts:134:1 › 減少動態時懸停不播放循環 (9.0s)
  ok  2 tests\cemetery.spec.ts:84:1 › 桌面懸停播放循環，移開回到靜止 (11.2s)
  ok  1 tests\cemetery.spec.ts:101:1 › 觸控長按播放但不開面板，之後短按另一件物件開面板 (11.7s)
  ok  3 tests\cemetery.spec.ts:11:3 › 390×844 墓園完整互動 (12.3s)
  ok  5 tests\cemetery.spec.ts:11:3 › 1440×900 墓園完整互動 (12.7s)
模擬 PUT request body：
{
  "message": "更新內容",
  "branch": "main",
  "sha": "mock-sha",
  "content": "ewogICJ2IjogMSwKICAia2RmIjogIlBCS0RGMi1TSEEyNTYiLAogICJpdGVyIjogNjAwMDAwLAogICJzYWx0IjogImNXSHNDaUs1dE0yR1JFY2tQd28zeUE9PSIsCiAgIml2IjogIjNTQm0zYVVnbnpKRm5kNzEiLAogICJjdCI6ICJjdEo1d3cvc2tNTFYrYzBlNWxiV3BUUWE5ZkNuMWFUV2htc1ZrYzlnSksza3JZWGYrWXZ3TDNGYXZlRWE3OWFROHRpbndVWTBSUHg2VysrWmhjVGtqeFk9Igp9Cg=="
}
  ok 10 tests\editor.spec.ts:58:1 › 換密碼後舊權杖無法解開，提示重新貼上並可覆蓋 (6.7s)
  ok  9 tests\editor.spec.ts:43:1 › 首次貼權杖，加密持久化，重整解鎖後不需重貼，移除後清除儲存 (12.4s)
  ok 12 tests\editor.spec.ts:101:1 › 新增中文 slug，自動避開同名，新增為加密內容 (6.5s)
  ok 13 tests\editor.spec.ts:117:1 › 線上已更新時儲存顯示衝突，不發出 PUT (5.2s)
  ok 20 tests\editor.spec.ts:241:1 › 844×390 密碼表單位於地平線之外，勾選框可點可聚焦 (426ms)
  ok 11 tests\editor.spec.ts:75:1 › 修改物件只提交密文，完成後以新文字重新生長 (11.3s)
  ok 16 tests\editor.spec.ts:172:1 › 刪除遇線上 404 視為成功並移除清單，不發出 DELETE (4.7s)
  ok 15 tests\editor.spec.ts:149:1 › 新增避開網站清單尚未出現的線上同名，清單使用實際路徑 (5.5s)
  ok 14 tests\editor.spec.ts:129:1 › 物件與墓誌銘儲存後更新原文，可連續修改，物件也可接著刪除 (6.6s)
  ok 18 tests\editor.spec.ts:209:1 › 401 顯示狀態碼而不暴露權杖，提交中停用儲存 (4.8s)
  ok 17 tests\editor.spec.ts:184:1 › 刪除必須確認，取消不發送，確認帶 sha 刪除；墓誌銘 PUT 正確路徑 (5.5s)
  ok 27 tests\loader.spec.ts:39:1 › 錯密碼立即撤掉墓碑，清空並聚焦密碼欄 (1.2s)
  ok 19 tests\editor.spec.ts:226:1 › 390×844 編輯器無橫向捲動、文字框滿寬、按鈕至少 44px (4.5s)
  ok 28 tests\loader.spec.ts:52:1 › 減弱動效直接填石，仍能進入墓園 (1.7s)
  ok 26 tests\loader.spec.ts:11:1 › 逐塊墓碑跟隨解密進度，完成後才進入墓園 (4.0s)
  ok 21 tests\history.spec.ts:13:1 › 第一件歷史三版，最新標目前，按需解開最舊版本 (8.8s)
  ok 22 tests\history.spec.ts:34:1 › 墓誌銘使用同一面板列出兩版並解開舊版 (8.3s)
  ok 23 tests\history.spec.ts:45:1 › 空缺按日期排列，不是按鈕、不播放、不開面板，仍有八件物件 (8.3s)
  ok 31 tests\unlock.spec.ts:45:1 › 不勾記住，重整回到密碼閘 (3.8s)
  ok 32 tests\unlock.spec.ts:55:3 › 已記住記錄 expired 時清除並回到密碼閘 (456ms)
  ok 34 tests\unlock.spec.ts:55:3 › 已記住記錄 malformed 時清除並回到密碼閘 (446ms)
  ok 33 tests\unlock.spec.ts:55:3 › 已記住記錄 incorrect 時清除並回到密碼閘 (688ms)
  ok 35 tests\unlock.spec.ts:72:3 › 空內容送出任意密碼仍在密碼閘且不儲存（空索引） (598ms)
  ok 36 tests\unlock.spec.ts:72:3 › 空內容送出任意密碼仍在密碼閘且不儲存（不合格物件） (551ms)
  ok 25 tests\history.spec.ts:82:1 › 歷史單版用舊密碼解開，錯誤可重試，切換及關閉不保留舊密碼 (9.6s)
  ok 29 tests\unlock.spec.ts:11:1 › 錯密碼顯示錯誤、清空與聚焦，沒有物件；正確密碼解出八件與面板 (7.8s)
  ok 30 tests\unlock.spec.ts:28:1 › 記住三十天，重整直接解鎖；上鎖刪記錄，重整仍在密碼閘 (7.3s)
  ok 24 tests\history.spec.ts:60:1 › 歷史密文解不開時顯示指定錯誤，沒有歷史時顯示空狀態 (12.5s)
  ok 39 tests\unlock.spec.ts:107:1 › localStorage 不可用仍可解鎖與上鎖 (3.8s)
  ok 37 tests\unlock.spec.ts:91:3 › 只有一個epitaph仍以解密驗證密碼 (4.9s)
  ok 38 tests\unlock.spec.ts:91:3 › 只有一個object仍以解密驗證密碼 (4.9s)

  39 passed (42.7s)
```

### 3.4 正式建置與主 JS gzip
命令：`npm run build`
```text

> myepitaph-prototype@0.0.0 build
> tsc --noEmit && vite build && node scripts/copy-content.mjs

vite v7.3.7 building client environment for production...
transforming...
node_modules/@remotion/player/dist/esm/index.mjs (1:0): Module level directives cause errors when bundled, "use client" in "node_modules/@remotion/player/dist/esm/index.mjs" was ignored.
✓ 42 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.46 kB │ gzip:   0.31 kB

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
dist/assets/index-B6u_2Uke.css    6.79 kB │ gzip:   2.29 kB
dist/assets/index-CiWu5oPD.js   590.05 kB │ gzip: 188.50 kB
✓ built in 1.99s
```
命令：`node C:\Users\User\AppData\Local\Temp\opencode\t7-check.cjs gzip`
```text
188502
```
188502 ≤ 190692，相對工單基準 186692 增加 1810 bytes，未新增依賴與媒體資產。

### 3.5 Git 範圍
開始作業時執行 `git status --short`，原樣輸出：
```text
 D _tickets/open/T7-tomb-loader.md
?? _tickets/doing/T7-tomb-loader.md
```
以下為回執建立前的實際檢查；這兩個工單路徑差異屬已存在的領取狀態，沒有移動或改寫工單。

命令：`git status --short`
```text
 D _tickets/open/T7-tomb-loader.md
 M web/src/App.tsx
 M web/src/content.ts
 M web/src/style.css
 M web/tests/content.test.ts
?? _tickets/doing/T7-tomb-loader.md
?? web/src/TombLoader.tsx
?? web/tests/loader.spec.ts
```

回執寫入後再檢查，命令：`git status --short`
```text
 D _tickets/open/T7-tomb-loader.md
 M web/src/App.tsx
 M web/src/content.ts
 M web/src/style.css
 M web/tests/content.test.ts
?? _receipts/T7-tomb-loader.md
?? _tickets/doing/T7-tomb-loader.md
?? web/src/TombLoader.tsx
?? web/tests/loader.spec.ts
```

### 3.6 收尾：測試服務停止與臨時腳本
Playwright 管理的測試服務已隨命令結束；沒有另外起後台服務。確認其 4173 埠沒有監聽。

命令：`node C:\Users\User\AppData\Local\Temp\opencode\t7-check.cjs shutdown`
```text
127.0.0.1:4173 ECONNREFUSED
Checked at: 2026-10-17T03:48:56.488Z
```

臨時腳本 `C:\Users\User\AppData\Local\Temp\opencode\t7-check.cjs` 完整內容（僅檢查，無遍歷改檔）：
```javascript
const { spawnSync } = require('node:child_process');
const { readFileSync, readdirSync } = require('node:fs');
const { gzipSync } = require('node:zlib');
if (process.argv[2] === 'shutdown') {
  const socket = require('node:net').connect(4173, '127.0.0.1');
  socket.on('connect', () => {
    console.log('127.0.0.1:4173 is still listening');
    socket.destroy();
    process.exitCode = 1;
  });
  socket.on('error', (error) => {
    console.log(`127.0.0.1:4173 ${error.code}`);
    console.log(`Checked at: ${new Date().toISOString()}`);
    if (error.code !== 'ECONNREFUSED') process.exitCode = 1;
  });
} else if (process.argv[2] === 'gzip') {
  const files = readdirSync('dist/assets').filter((name) => /^index-.*\.js$/.test(name));
  if (files.length !== 1) throw new Error('Expected exactly one main JS asset');
  console.log(gzipSync(readFileSync(`dist/assets/${files[0]}`)).length);
} else {
  const result = spawnSync('npx tsc --noEmit', { shell: true, stdio: 'inherit' });
  console.log(`tsc exit code: ${result.status}`);
  process.exit(result.status ?? 1);
}
```

## 4. 風險與存疑
- **未滿足 900ms 額外等待上限。** 依工單，最後一石於第 `14*4+8=64` 幀放完，刻線 8 幀、停留 9 幀、淡出 6 幀，最後為第 87 幀（duration 88）。若九個內容並行解密，進度可由 1/10 很快跳到 10/10；在只准正常速度、不准 seek、不准假進度的條件下，補播剩餘石塊加收尾可能超過 900ms。保留逐塊正常播放，沒有偷偷加速或提前填石；需派單方決定放寬上限或調整動畫規格。現有工單命令雖全過，不能證明此上限成立。
- `total` 以實際通過檔名驗證、會嘗試解開的物件數計算，而不是把既有邏輯會略過的非法檔名納入；否則最後回報無法等於 total。這個邊界解讀請驗收方確認。
- 上鎖維持 attempt 防競態並清除待完成狀態；locked/busy 本身按工單隱藏表單、不提供「上鎖」按鈕，沒有新增其他取消入口或針對程式內部強制上鎖的測試。
- 建置保留 Remotion `use client`、大區塊及 NO_COLOR 警告，沒有越界調整套件或建置設定。
- Git 原有工單領取差異與要求新增的回執不屬程式修改邊界；均保留，不為了讓 status 看起來乾淨而還原或搬動。沒有 commit、push、合併、對外發消息；未開啟圖片、資料庫或壓縮包。測試依既有腳本產生的截圖與假內容未加入版本控制。
