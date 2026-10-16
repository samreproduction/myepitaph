# 回執 T3：物件改為具體簡筆畫

> 執行引擎：opencode opencode v2.0.29 / openai/gpt-6.1-sol
> 完成時間：2026-10-16 18:06
> 分支 / 提交 / PR：claude/project-thread-lrhwko / 無 / 無
> 工單：留在 _tickets/doing/ 等待驗收

## 1. 做了什麼
- 將抽象線條換成 tree、flower、grass、bird、lantern、mountain 六種單色具體簡筆畫；樹有樹幹、至少兩層分枝、樹冠與地面，其餘種類具備工單指定部件。
- 保留純函式與既有雜湊，以字數、段落、標點、雜湊決定尺寸、結構、細節與傾斜；未知 override 回退雜湊。新增具名 parts 與小實心圓 fills，保留原有必要欄位。控制點限制於 4～96，底部約 y=88。
- 由底部部件往上分批描線，最晚約 0.9 秒完成；懸停／長按依種類小幅擺動，遠山只讓月亮升降。減少動態直接顯示完整線條，不播放循環。
- 保留全部既有瀏覽器互動測試；調整動態部件選擇器並新增生長、減少動態與六種類展示驗收。沒有改假內容、沒有提交／推送、沒有移動工單。

## 2. 檔案清單
- `web/src/shape.ts`
- `web/src/Object.tsx`
- `web/src/style.css`
- `web/tests/shape.test.ts`
- `web/tests/cemetery.spec.ts`
- `_receipts/T3-stick-figure-objects.md`
- 不進版本控制的產物：`web/test-results/cemetery-六種簡筆畫同頁展示（展示頁與截圖僅存-test-results）/six-kinds.html`、同目錄 `six-kinds.png`。

## 3. 驗收證據

以下三條命令均由倉庫根目錄 `E:\My AI Project\myepitaph\.claude\worktrees\sleepy-yonath-8ed6b1` 執行。

### 3.1 建置成功，無 TypeScript 錯誤
命令：`cd web && npm run build`
```text

> myepitaph-prototype@0.0.0 build
> tsc --noEmit && vite build

vite v7.3.7 building client environment for production...
transforming...
node_modules/@remotion/player/dist/esm/index.mjs (1:0): Module level directives cause errors when bundled, "use client" in "node_modules/@remotion/player/dist/esm/index.mjs" was ignored.
✓ 36 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.47 kB │ gzip:   0.33 kB

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
dist/assets/index-BcjEejI2.css    3.50 kB │ gzip:   1.44 kB
dist/assets/index-FHLAD7br.js   574.59 kB │ gzip: 182.97 kB
✓ built in 1.93s
```

### 3.2 單元測試全過
涵蓋六種類 override、非空 paths、控制點 4～96、小圓邊界、樹部件、確定性、同種類不同文字、八件既有假內容至少三種類、未知種類回退；包含空字串、Unicode、長文字與大量段落。

命令：`cd web && npm test`
```text

> myepitaph-prototype@0.0.0 test
> vitest run


 RUN  v4.1.12 E:/My AI Project/myepitaph/.claude/worktrees/sleepy-yonath-8ed6b1/web


 Test Files  1 passed (1)
      Tests  12 passed (12)
   Start at  18:04:38
   Duration  240ms (transform 42ms, setup 0ms, import 62ms, tests 39ms, environment 0ms)

```

### 3.3 Playwright 全過
首輪 3 過、4 失敗：舊測試觀察整體旋轉，但首件遠山的動態改在月亮；另有 CSS 零值實際為 `0px`。已依實際動態部件與瀏覽器回傳值修正斷言，沒有刪除既有測試。以下為重跑的完整原樣輸出。

命令：`cd web && npx playwright test`
```text
[WebServer] (node:23812) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)

Running 7 tests using 7 workers

(node:13500) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:35832) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:34768) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:30252) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:29300) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:10664) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:28068) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
  ok 7 tests\cemetery.spec.ts:127:1 › 六種簡筆畫同頁展示（展示頁與截圖僅存 test-results） (1.0s)
  ok 3 tests\cemetery.spec.ts:111:1 › 出現時由底部部件往上描線，懸停不重播生長 (3.1s)
  ok 4 tests\cemetery.spec.ts:11:3 › 1440×900 墓園完整互動 (5.8s)
  ok 5 tests\cemetery.spec.ts:96:1 › 減少動態時懸停不播放循環 (6.2s)
  ok 2 tests\cemetery.spec.ts:48:1 › 桌面懸停播放循環，移開回到靜止 (6.4s)
  ok 1 tests\cemetery.spec.ts:11:3 › 390×844 墓園完整互動 (6.3s)
  ok 6 tests\cemetery.spec.ts:64:1 › 觸控長按播放但不開面板，之後短按另一件物件開面板 (7.1s)

  7 passed (9.9s)
```

### 3.4 六種類同頁展示與截圖
命令同 3.3：`cd web && npx playwright test`，原樣輸出見上一節，包含六種類展示測試通過紀錄。該測試產生展示頁、斷言同頁六個 SVG，並截圖。

- 展示頁：`web/test-results/cemetery-六種簡筆畫同頁展示（展示頁與截圖僅存-test-results）/six-kinds.html`
- 截圖：`web/test-results/cemetery-六種簡筆畫同頁展示（展示頁與截圖僅存-test-results）/six-kinds.png`
- 遵守工單，不打開圖片；沒有做人工看圖的主觀驗收。

確認產物不進版本控制，命令：`git check-ignore web/test-results/`
```text
web/test-results/
```

### 3.5 補充自檢與後台清理
最初嘗試 `node -e` 的行內腳本遭 Windows 引號解析錯誤，未當成成功證據。改用以下明確點名的臨時腳本執行；腳本沒有遍歷目錄或修改倉庫檔案，只檢查 diff、兩個產物的檔案大小與預覽埠。

腳本：`C:\Users\User\AppData\Local\Temp\opencode\t3-selfcheck.cjs`
```javascript
const cp = require('node:child_process');
const fs = require('node:fs');
const net = require('node:net');
const result = cp.spawnSync('git', ['diff', '--check'], { encoding: 'utf8' });
process.stdout.write(result.stdout || '');
process.stderr.write(result.stderr || '');
console.log('git diff --check exit code: ' + result.status);
process.exitCode = result.status ?? 1;
const folder = 'web/test-results/cemetery-六種簡筆畫同頁展示（展示頁與截圖僅存-test-results）/';
for (const name of ['six-kinds.html', 'six-kinds.png']) {
  const path = folder + name;
  console.log(path + ': ' + fs.statSync(path).size + ' bytes');
}
const socket = net.createConnection({ host: '127.0.0.1', port: 4173 });
socket.on('connect', () => {
  console.log('Preview port 4173: STILL LISTENING');
  process.exitCode = 1;
  socket.destroy();
});
socket.on('error', (error) => console.log('Preview port 4173: ' + error.code));
console.log('Local time: ' + new Date().toLocaleString('sv-SE'));
```

命令：`node C:\Users\User\AppData\Local\Temp\opencode\t3-selfcheck.cjs`
```text
warning: in the working copy of 'web/src/Object.tsx', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'web/src/shape.ts', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'web/src/style.css', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'web/tests/cemetery.spec.ts', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'web/tests/shape.test.ts', LF will be replaced by CRLF the next time Git touches it
git diff --check exit code: 0
web/test-results/cemetery-六種簡筆畫同頁展示（展示頁與截圖僅存-test-results）/six-kinds.html: 5352 bytes
web/test-results/cemetery-六種簡筆畫同頁展示（展示頁與截圖僅存-test-results）/six-kinds.png: 33971 bytes
Local time: 2026-10-16 18:06:09
Preview port 4173: ECONNREFUSED
```

Playwright 自行管理並停止預覽伺服器；未另起持續後台進程。

## 4. 風險與存疑
- 建置仍有 Remotion 的 `use client` 被忽略、產物超過 500 kB 警告；沒有 TypeScript 錯誤。依工單範圍未調整打包設定或套件。
- Playwright 有 NO_COLOR／FORCE_COLOR 環境警告，不影響七項測試通過。
- 沒有打開圖片，具體圖像的主觀辨識品質仍待主 AI／使用者看圖驗收；自動驗收已確認六種類同頁輸出。
- 開工時 Git 已顯示 `_tickets/open/T3-stick-figure-objects.md` 刪除與 `_tickets/doing/T3-stick-figure-objects.md` 未追蹤，屬既有領單狀態；未更動它們。
- 無額外刪除、強推、對外發訊、提交、合併或資料庫操作。
