# 回執 T1b：地平線對齊、減少動態與互動測試

> 執行引擎：opencode opencode v2.0.29 / openai/gpt-6.1-sol
> 完成時間：2026-10-16 17:08
> 分支 / 提交 / PR：claude/project-thread-lrhwko / 無 / 無
> 工單：留在 _tickets/doing/ 等待驗收

## 1. 做了什麼
- 墓園背景改為純黑色，獨立的 `aria-hidden` 地面承載灰階漸層，與地平線共用 `top: 43svh` 並延伸到底部。
- 使用 `matchMedia` 及變更監聽判斷減少動態偏好；啟用時 Remotion 暫停並回到第 0 幀，懸停／長按不播放，其他互動保留。
- 加入雙尺寸地平線／地面頂端誤差 ≤ 1px、懸停 600ms／移開 300ms、CDP 觸控長按 1200ms／放開不開面板／另件短按開面板，以及減少動態懸停不變的測試。
- 未提交、推送或移動工單；原有工單已領取的 Git 狀態未變動。

## 2. 檔案清單
- `web/src/style.css`
- `web/src/App.tsx`
- `web/src/Object.tsx`
- `web/tests/cemetery.spec.ts`
- `_receipts/T1b-horizon-motion-fixes.md`（本回執）

## 3. 驗收證據（工單裡每條檢查對應一段）
以下三條命令均以倉庫根目錄 `E:\My AI Project\myepitaph\.claude\worktrees\sleepy-yonath-8ed6b1` 執行；輸出原樣貼錄。

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
dist/index.html                   0.47 kB │ gzip:   0.32 kB
dist/assets/index-Bs8mBJrZ.css    3.23 kB │ gzip:   1.38 kB

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
dist/assets/index-Bt82i8sP.js   571.81 kB │ gzip: 181.58 kB
✓ built in 1.89s
```

### 3.2 單元測試全過
命令：`cd web && npm test`
```text

> myepitaph-prototype@0.0.0 test
> vitest run


 RUN  v4.1.12 E:/My AI Project/myepitaph/.claude/worktrees/sleepy-yonath-8ed6b1/web


 Test Files  1 passed (1)
      Tests  4 passed (4)
   Start at  17:08:06
   Duration  208ms (transform 36ms, setup 0ms, import 57ms, tests 4ms, environment 0ms)

```

### 3.3 Playwright 全過（msedge，未下載瀏覽器）
沿用現有 `playwright.config.ts` 的 `channel: 'msedge'`，未修改設定。

命令：`cd web && npx playwright test`
```text
[WebServer] (node:26116) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)

Running 5 tests using 5 workers

(node:27000) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:452) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:30200) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:21792) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:3132) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
  ok 2 tests\cemetery.spec.ts:5:3 › 390×844 墓園完整互動 (5.5s)
  ok 3 tests\cemetery.spec.ts:90:1 › 減少動態時懸停不播放循環 (5.4s)
  ok 5 tests\cemetery.spec.ts:5:3 › 1440×900 墓園完整互動 (5.4s)
  ok 1 tests\cemetery.spec.ts:42:1 › 桌面懸停播放循環，移開回到靜止 (5.7s)
  ok 4 tests\cemetery.spec.ts:58:1 › 觸控長按播放但不開面板，之後短按另一件物件開面板 (6.5s)

  5 passed (9.0s)
```

### 3.4 收尾：預覽服務已退出
首次使用 `node -e` 的單行命令因 shell 引號解析失敗（`SyntaxError: Invalid or unexpected token`），不作為證據。改用明確點名的暫存腳本執行；腳本不遍歷或修改任何檔案。

腳本：`C:\Users\User\AppData\Local\Temp\opencode\T1b-check-preview.cjs`
```javascript
const net = require('node:net');
console.log('Local completion time: ' + new Date().toLocaleString('sv-SE'));
const socket = net.connect(4173, '127.0.0.1');
socket.on('connect', () => {
  console.log('127.0.0.1:4173 is still listening');
  socket.destroy();
  process.exitCode = 1;
});
socket.on('error', (error) => {
  console.log('127.0.0.1:4173 ' + error.code);
  if (error.code !== 'ECONNREFUSED') process.exitCode = 1;
});
```
命令：`node C:\Users\User\AppData\Local\Temp\opencode\T1b-check-preview.cjs`
```text
Local completion time: 2026-10-16 17:08:43
127.0.0.1:4173 ECONNREFUSED
```
未另起後台服務；測試預覽服務由 Playwright 管理並已退出。

## 4. 風險與存疑
- 建置仍有 Remotion 的 `use client` 忽略警告及單一 JS chunk 超過 500 kB 警告；依審查意見不在本工單處理。Playwright 有色彩環境變數警告，不影響通過。
- 減少動態的長按與執行中偏好切換由同一播放條件涵蓋，但沒有另外新增自動化測試；本工單指定的減少動態懸停案例已通過。
- 未做未授權的資料／目錄刪除、強推或對外發消息，無需猜測的待決事項。
