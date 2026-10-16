# 回執 T6：更換密碼

> 執行引擎：opencode opencode v2.0.29 / openai/gpt-6.1-sol
> 完成時間：2026-10-16 22:25
> 分支 / 提交 / PR：claude/project-thread-lrhwko / 無 / 無
> 工單：留在 _tickets/doing/ 等待驗收

## 1. 做了什麼
- 新增本機 rekey：環境變數或 raw mode 隱藏輸入、驗證新密碼、先解開全部、全部寫入同目錄暫存密文後逐一 rename。不執行 git，不輸出密碼或明文；不覆蓋既有暫存檔。
- 新增假內容測試：3 件物件及墓誌銘，驗證新密碼可解、舊密碼不可解、失敗時所有位元組不變、沒有殘留暫存檔、輸出不洩漏假文字及密碼。
- 歷史面板新增單版「舊密碼」解鎖，錯誤可重試；送出、切換及關閉會清除欄位，不存入瀏覽器儲存。保留非同步請求防競態處理。
- 確認現有 App 已清掉失效的記住密碼，Editor 已提示無法讀取舊權杖且可覆蓋；補上瀏覽器測試，無需改動這兩個元件。
- README 補上操作及各裝置重新登入／貼權杖說明。沒有對真正 objects 執行 rekey，沒有 commit、push、合併或移動工單。

## 2. 檔案清單
- `scripts/rekey.mjs`（新增）
- `test/rekey.mjs`（新增）
- `README.md`
- `web/src/History.tsx`
- `web/tests/history.spec.ts`
- `web/tests/unlock.spec.ts`
- `web/tests/editor.spec.ts`
- `_receipts/T6-change-password.md`（本回執）

## 3. 驗收證據（工單裡每條檢查對應一段）
命令均由 shell 工具實際執行。除 3.3、3.4 的工作目錄指定為倉庫根目錄下的 `web`，其他均以倉庫根目錄為工作目錄；沒有把僅回顯或空輸出當作驗收成功。以下為最終成功執行的原樣輸出。

### 3.1 加解密與換密碼測試
命令：`node test/roundtrip.mjs`
```text
ok: round-trip, wrong password, and tamper detection all pass
```
命令：`node test/rekey.mjs`
```text
ok: success
ok: wrong-old
ok: corrupt
ok: short
ok: same
ok: rekey checks pass; output contains no fake plaintext or passwords
```

### 3.2 不存在 objects 的暫存目錄
為避開此環境 shell 引號／內嵌程式處理問題，改用指定 TEMP 下的具名腳本建立全新空目錄，透過環境變數傳入兩個假密碼，再啟動真正的 rekey 命令。腳本僅移除自己建立且仍為空的目錄。

命令：`node C:/Users/User/AppData/Local/Temp/opencode/T6-empty-check.mjs`
```text
node scripts/rekey.mjs "C:/Users/User/AppData/Local/Temp/opencode/T6-empty-gSfeKj"
已重新加密 0 個檔案
請 commit 並 push，網站更新後用新密碼進入；各裝置需重新貼上權杖
exit code: 0
```

`C:/Users/User/AppData/Local/Temp/opencode/T6-empty-check.mjs` 完整內容：
```js
import { mkdtemp, rmdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const root = await mkdtemp('C:/Users/User/AppData/Local/Temp/opencode/T6-empty-');
try {
  console.log(`node scripts/rekey.mjs "${root}"`);
  const result = spawnSync(process.execPath, ['scripts/rekey.mjs', root], {
    encoding: 'utf8',
    env: { ...process.env, BLACKTOMB_PASSWORD: 'test-password', BLACKTOMB_NEW_PASSWORD: 'new-test-password' },
  });
  process.stdout.write(result.stdout ?? '');
  process.stderr.write(result.stderr ?? '');
  if (result.error) throw result.error;
  console.log(`exit code: ${result.status}`);
  process.exitCode = result.status ?? 1;
} finally { await rmdir(root); }
```

### 3.3 網站單元測試
工作目錄：`E:\My AI Project\myepitaph\.claude\worktrees\sleepy-yonath-8ed6b1\web`（等同從根目錄 `cd web`）。

命令：`npm test`
```text

> myepitaph-prototype@0.0.0 test
> vitest run


 RUN  v4.1.12 E:/My AI Project/myepitaph/.claude/worktrees/sleepy-yonath-8ed6b1/web


 Test Files  4 passed (4)
      Tests  53 passed (53)
   Start at  22:22:21
   Duration  8.39s (transform 220ms, setup 0ms, import 315ms, tests 12.64s, environment 0ms)

```

### 3.4 網站建置與完整瀏覽器測試
工作目錄：`E:\My AI Project\myepitaph\.claude\worktrees\sleepy-yonath-8ed6b1\web`（等同從根目錄 `cd web`）。

新增覆蓋：`{}` 密文出現舊密碼欄、另一密碼加密的版本可錯誤重試／正確解開、切換及關閉不保留密碼、不寫入 localStorage/sessionStorage、錯誤的記住密碼清除後不顯示內容、舊權杖解不開時提示並能以新權杖覆蓋。另一密碼使用工單允許的測試密碼 `new-test-password`。

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
✓ 41 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.45 kB │ gzip:   0.30 kB

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
dist/assets/index-BnvlZFW6.css    5.88 kB │ gzip:   2.09 kB
dist/assets/index-BoAfXr3q.js   587.16 kB │ gzip: 187.46 kB
✓ built in 2.00s
[WebServer] (node:31764) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] node_modules/@remotion/player/dist/esm/index.mjs (1:0): Module level directives cause errors when bundled, "use client" in "node_modules/@remotion/player/dist/esm/index.mjs" was ignored.
[WebServer] 
[WebServer] (!) Some chunks are larger than 500 kB after minification. Consider:
[WebServer] - Using dynamic import() to code-split the application
[WebServer] - Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
[WebServer] - Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
[WebServer] (node:30940) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)

Running 36 tests using 8 workers

(node:4556) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:35524) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:21616) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:42388) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:41228) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:3736) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:19284) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:31096) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
  ok  8 tests\cemetery.spec.ts:167:1 › 六種簡筆畫同頁展示（展示頁與截圖僅存 test-results） (1.1s)
  ok  5 tests\cemetery.spec.ts:150:1 › 出現時由底部部件往上描線，懸停不重播生長 (4.5s)
  ok  4 tests\cemetery.spec.ts:65:1 › 不同日期同 slug 只隱去選中的物件 (4.7s)
  ok  6 tests\cemetery.spec.ts:134:1 › 減少動態時懸停不播放循環 (7.7s)
  ok  9 tests\editor.spec.ts:43:1 › 首次貼權杖，加密持久化，重整解鎖後不需重貼，移除後清除儲存 (6.5s)
  ok  3 tests\cemetery.spec.ts:84:1 › 桌面懸停播放循環，移開回到靜止 (7.5s)
  ok  2 tests\cemetery.spec.ts:11:3 › 1440×900 墓園完整互動 (8.9s)
  ok  7 tests\cemetery.spec.ts:101:1 › 觸控長按播放但不開面板，之後短按另一件物件開面板 (9.2s)
  ok 10 tests\editor.spec.ts:58:1 › 換密碼後舊權杖無法解開，提示重新貼上並可覆蓋 (5.1s)
模擬 PUT request body：
{
  "message": "更新內容",
  "branch": "main",
  "sha": "mock-sha",
  "content": "ewogICJ2IjogMSwKICAia2RmIjogIlBCS0RGMi1TSEEyNTYiLAogICJpdGVyIjogNjAwMDAwLAogICJzYWx0IjogIjBiSlRhK0V5VEhLdXhoTjJwbTlBdnc9PSIsCiAgIml2IjogIlVJcmUwY2Mvamw5QXpvSWwiLAogICJjdCI6ICIzRXhybVF0cmNraDNqNFhIdVVSSFQ1SU55ZzR0OHJGdHZMRC9uQ2dXWE0wRlMxYUhZclB3dllVMy90MVFKOExLYnFaRjFNNzV5ajdZOVBRbWtBU2NiRFE9Igp9Cg=="
}
  ok  1 tests\cemetery.spec.ts:11:3 › 390×844 墓園完整互動 (10.8s)
  ok 13 tests\editor.spec.ts:101:1 › 新增中文 slug，自動避開同名，新增為加密內容 (5.3s)
  ok 16 tests\editor.spec.ts:172:1 › 刪除遇線上 404 視為成功並移除清單，不發出 DELETE (3.9s)
  ok 12 tests\editor.spec.ts:117:1 › 線上已更新時儲存顯示衝突，不發出 PUT (5.7s)
  ok 20 tests\editor.spec.ts:241:1 › 844×390 密碼表單位於地平線之外，勾選框可點可聚焦 (661ms)
  ok 11 tests\editor.spec.ts:75:1 › 修改物件只提交密文，完成後以新文字重新生長 (9.6s)
  ok 18 tests\editor.spec.ts:209:1 › 401 顯示狀態碼而不暴露權杖，提交中停用儲存 (4.7s)
  ok 15 tests\editor.spec.ts:149:1 › 新增避開網站清單尚未出現的線上同名，清單使用實際路徑 (6.6s)
  ok 17 tests\editor.spec.ts:184:1 › 刪除必須確認，取消不發送，確認帶 sha 刪除；墓誌銘 PUT 正確路徑 (6.4s)
  ok 14 tests\editor.spec.ts:129:1 › 物件與墓誌銘儲存後更新原文，可連續修改，物件也可接著刪除 (7.9s)
  ok 19 tests\editor.spec.ts:226:1 › 390×844 編輯器無橫向捲動、文字框滿寬、按鈕至少 44px (3.6s)
  ok 28 tests\unlock.spec.ts:45:1 › 不勾記住，重整回到密碼閘 (1.8s)
  ok 29 tests\unlock.spec.ts:55:3 › 已記住記錄 expired 時清除並回到密碼閘 (326ms)
  ok 30 tests\unlock.spec.ts:55:3 › 已記住記錄 incorrect 時清除並回到密碼閘 (549ms)
  ok 27 tests\unlock.spec.ts:28:1 › 記住三十天，重整直接解鎖；上鎖刪記錄，重整仍在密碼閘 (3.4s)
  ok 31 tests\unlock.spec.ts:55:3 › 已記住記錄 malformed 時清除並回到密碼閘 (444ms)
  ok 32 tests\unlock.spec.ts:72:3 › 空內容送出任意密碼仍在密碼閘且不儲存（空索引） (576ms)
  ok 33 tests\unlock.spec.ts:72:3 › 空內容送出任意密碼仍在密碼閘且不儲存（不合格物件） (527ms)
  ok 22 tests\history.spec.ts:34:1 › 墓誌銘使用同一面板列出兩版並解開舊版 (6.5s)
  ok 21 tests\history.spec.ts:13:1 › 第一件歷史三版，最新標目前，按需解開最舊版本 (7.2s)
  ok 23 tests\history.spec.ts:45:1 › 空缺按日期排列，不是按鈕、不播放、不開面板，仍有八件物件 (6.3s)
  ok 26 tests\unlock.spec.ts:11:1 › 錯密碼顯示錯誤、清空與聚焦，沒有物件；正確密碼解出八件與面板 (6.2s)
  ok 36 tests\unlock.spec.ts:107:1 › localStorage 不可用仍可解鎖與上鎖 (1.3s)
  ok 34 tests\unlock.spec.ts:91:3 › 只有一個epitaph仍以解密驗證密碼 (1.7s)
  ok 35 tests\unlock.spec.ts:91:3 › 只有一個object仍以解密驗證密碼 (2.3s)
  ok 25 tests\history.spec.ts:82:1 › 歷史單版用舊密碼解開，錯誤可重試，切換及關閉不保留舊密碼 (7.7s)
  ok 24 tests\history.spec.ts:60:1 › 歷史密文解不開時顯示指定錯誤，沒有歷史時顯示空狀態 (8.2s)

  36 passed (35.3s)
```

### 3.5 Git 範圍檢查
命令：`git status --short`（寫入本回執前）
```text
 M README.md
 D _tickets/open/T6-change-password.md
 M web/src/History.tsx
 M web/tests/editor.spec.ts
 M web/tests/history.spec.ts
 M web/tests/unlock.spec.ts
?? _tickets/doing/T6-change-password.md
?? scripts/rekey.mjs
?? test/rekey.mjs
```
開始作業時同一命令的原樣輸出：
```text
 D _tickets/open/T6-change-password.md
?? _tickets/doing/T6-change-password.md
```
因此「所有 Git 變動只有邊界內檔案」按字面並不成立：工單搬移是接手前既有狀態，另有使用者要求新增的本回執。實作變動均在工單允許範圍內；未還原或移動既有工單。

命令：`git status --short`（本回執寫入後）
```text
 M README.md
 D _tickets/open/T6-change-password.md
 M web/src/History.tsx
 M web/tests/editor.spec.ts
 M web/tests/history.spec.ts
 M web/tests/unlock.spec.ts
?? _receipts/T6-change-password.md
?? _tickets/doing/T6-change-password.md
?? scripts/rekey.mjs
?? test/rekey.mjs
```

### 3.6 環境與自檢服務收尾
命令：`node --version`
```text
v24.18.0
```
命令：`git branch --show-current`
```text
claude/project-thread-lrhwko
```
命令：`node C:/Users/User/AppData/Local/Temp/opencode/T6-finish-check.mjs`
```text
No listener on 127.0.0.1:4173; Playwright webServer has stopped.
Local completion time: 2026-10-16 22:25
```
`C:/Users/User/AppData/Local/Temp/opencode/T6-finish-check.mjs` 完整內容：
```js
import { spawnSync } from 'node:child_process';
const result = spawnSync('netstat', ['-ano', '-p', 'tcp'], { encoding: 'utf8' });
if (result.error || result.status !== 0) throw result.error ?? new Error('netstat failed');
const listeners = result.stdout.split(/\r?\n/).filter((line) => /127\.0\.0\.1:4173\s/.test(line) && line.includes('LISTENING'));
console.log(listeners.length ? listeners.join('\n') : 'No listener on 127.0.0.1:4173; Playwright webServer has stopped.');
const now = new Date();
console.log(`Local completion time: ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
if (listeners.length) process.exitCode = 1;
```

## 4. 風險與存疑
- 本機只有已確認的 Node v24.18.0；程式僅使用 Node 22 已有的內建 API 及共用 crypto，但未以 Node 22 實機執行。
- 無頭環境未實測互動終端機 raw mode 輸入（含兩次新密碼不同）；已實作此分支，正式驗收測試走環境變數。
- 按工單要求逐一 rename，並非跨檔案交易：若 rename 階段斷電或 I/O 失敗，可能有部分檔案已換新密碼。未增加超出工單的自動回滾／備份操作。
- 首次 rekey 測試的「錯舊密碼」安排誤令新舊密碼相同，先被驗證攔下；已改為兩個不同假密碼後通過。首次瀏覽器測試 35 過／1 失敗，原因為新增測試定位到兩個 status；已限縮至權杖區域後完整重跑 36 項通過。
- 初次空目錄檢查使用 `node -e` 無輸出，未當作成功；首次有引號的 TEMP 腳本命令也因 shell 保留引號而找不到模組。改為本回執所附的無空白絕對路徑腳本命令，取得真正 0 檔案與退出碼 0 證據。
- 建置有既存 Remotion `use client`、bundle 大小及 NO_COLOR/FORCE_COLOR 警告，未越界調整。
- Git 範圍的接手前工單狀態差異見 3.5；未更動該狀態。測試產出的截圖留在既有忽略的 test-results，不納入版本控制。Playwright 自行啟停服務，收尾確認 4173 無監聽。
