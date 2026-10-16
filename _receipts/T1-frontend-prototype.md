# 回執 T1：墓園前端假內容原型

> 執行引擎：opencode opencode v2.0.29 / openai/gpt-6.1-sol
> 完成時間：2026-10-16 17:01
> 分支 / 提交 / PR：claude/project-thread-lrhwko / 無 / 無
> 工單：留在 _tickets/doing/ 等待驗收

## 1. 做了什麼
- 建立 Vite + React + TypeScript 原型，使用 Remotion Player 在瀏覽器內播放抽象線條，不渲染影片。
- 8 件明顯假內容依日期逐件生長；黑底、灰色地平線與地面，中央獨立純文字墓誌銘。
- 完成進入閘、生長中、靜止、滑鼠停留與約 500ms 長按播放／離開或放開停止、物件溶解與文字面板、關閉、歷史「尚未接入」。
- 物件為具 aria-label 的原生按鈕；支援 Enter、Esc、原生模態焦點限制與關閉後焦點返回。
- shapeFor 為確定性純函式，支援 kind 覆寫；未呼叫加密模組，未讀取真實內容，未引入外部資源。
- 設定相對 base、忽略依賴／建置／測試產物，新增單元及雙尺寸瀏覽器驗收測試與截圖。

## 2. 檔案清單
- `web/package.json`
- `web/package-lock.json`
- `web/.gitignore`
- `web/index.html`
- `web/tsconfig.json`
- `web/vite.config.ts`
- `web/vitest.config.ts`
- `web/playwright.config.ts`
- `web/src/main.tsx`
- `web/src/App.tsx`
- `web/src/Object.tsx`
- `web/src/style.css`
- `web/src/fixtures.ts`
- `web/src/shape.ts`
- `web/tests/shape.test.ts`
- `web/tests/cemetery.spec.ts`
- `_receipts/T1-frontend-prototype.md`（按派單要求建立的回執；實作均在 web/）

未納入版本控制的產物：`web/node_modules/`、`web/dist/`、`web/test-results/`。截圖為 `web/test-results/cemetery-390×844-墓園完整互動/{cemetery-390,panel-390}.png` 與 `web/test-results/cemetery-1440×900-墓園完整互動/{cemetery-1440,panel-1440}.png`；只生成與列出路徑，未開啟圖片。

## 3. 驗收證據（工單裡每條檢查對應一段）
以下相對路徑命令均從倉庫根目錄執行；原型工作目錄為 web/。以下為最後一次驗收的實際輸出，未省略警告。

### 3.1 安裝與 production build
命令：`cd web && npm ci && npm run build`
```text

added 56 packages, and audited 57 packages in 15s

14 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
npm warn allow-scripts 1 package has install scripts not yet covered by allowScripts:
npm warn allow-scripts   esbuild@0.28.2 (postinstall: node install.js)
npm warn allow-scripts
npm warn allow-scripts Run `npm approve-scripts --allow-scripts-pending` to review, or `npm approve-scripts <pkg>` to allow.

> myepitaph-prototype@0.0.0 build
> tsc --noEmit && vite build

vite v7.3.7 building client environment for production...
transforming...
node_modules/@remotion/player/dist/esm/index.mjs (1:0): Module level directives cause errors when bundled, "use client" in "node_modules/@remotion/player/dist/esm/index.mjs" was ignored.
✓ 36 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.47 kB │ gzip:   0.32 kB

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
dist/assets/index-BUoelWkv.css    3.19 kB │ gzip:   1.37 kB
dist/assets/index-DRxbVEU6.js   571.48 kB │ gzip: 181.49 kB
✓ built in 1.89s
```

### 3.2 單元測試
命令：`cd web && npm test`
```text

> myepitaph-prototype@0.0.0 test
> vitest run


 RUN  v4.1.12 E:/My AI Project/myepitaph/.claude/worktrees/sleepy-yonath-8ed6b1/web


 Test Files  1 passed (1)
      Tests  4 passed (4)
   Start at  17:01:12
   Duration  206ms (transform 44ms, setup 0ms, import 65ms, tests 4ms, environment 0ms)

```
覆蓋同一文字深度相等、不同假文字形狀不同、kind 覆寫及空字串／Unicode。

### 3.3 dist 中沒有 .md
直接執行原工單命令時，shell 引號解析失敗，未當作通過證據。改以具名批次檔執行相同 Node 檢查。

命令：`C:\Users\User\AppData\Local\Temp\opencode\T1-check-dist.cmd`
```text
0
```
批次檔完整內容：
```bat
@echo off
cd /d "E:\My AI Project\myepitaph\.claude\worktrees\sleepy-yonath-8ed6b1"
node -e "const fs=require('fs');const w=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?w(d+'/'+e.name):[d+'/'+e.name]);console.log(w('web/dist').filter(f=>f.endsWith('.md')).length)"
```
此腳本僅檢查建置檔案路徑，不讀取或修改檔案內容。

### 3.4 Playwright：390×844 與 1440×900
命令：`cd web && npx playwright test`
```text
[WebServer] (node:31056) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)

Running 2 tests using 2 workers

(node:30856) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:30852) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
  ok 1 tests\cemetery.spec.ts:5:3 › 390×844 墓園完整互動 (5.1s)
  ok 2 tests\cemetery.spec.ts:5:3 › 1440×900 墓園完整互動 (5.1s)

  2 passed (7.3s)
```
測試透過 Playwright webServer 啟動 `npm run preview`；未執行 playwright install，未下載瀏覽器。配置在 PW_EXECUTABLE_PATH 存在時使用該路徑，否則使用 msedge。

每個尺寸均檢查鎖定時只有背景／進入、無物件／標題；進入後等待「生長完成」，按鈕數量等於 8；檢查無橫向捲動；逐件點擊全部物件並比對完整假文字；第一件驗證歷史提示；Esc 關閉；另驗證 Enter 開啟、關閉按鈕及焦點返回。各尺寸生成墓園與文字面板截圖。

### 3.5 Windows shell 與收尾
有實際輸出的命令才列為通過。過程中最初安裝與測試併行造成 EPERM／依賴暫時缺失，改為安裝完成後再跑測試，最後通過結果見 3.1、3.2。初次 build 的 MouseEvent 型別錯誤已改為 PointerEvent 處理，最終 tsc 通過。`node -e` 引號失敗後改用 3.3 的批次檔。未使用只回顯命令或空輸出充當證據。

命令：`git branch --show-current && git status --short && git check-ignore web/node_modules web/dist web/test-results`
```text
claude/project-thread-lrhwko
 D _tickets/open/T1-frontend-prototype.md
?? _tickets/doing/T1-frontend-prototype.md
?? web/
web/node_modules
web/dist
web/test-results
```
此輸出擷取於寫入本回執前。工單 open/doing 狀態為執行前已有的領單變更，未挪動或還原。

命令：`powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:\Users\User\AppData\Local\Temp\opencode\T1-check-cleanup.ps1`
```text
2026-10-16 17:01
Port 4173 listening count: 0
Vite preview process count: 0
```
收尾檢查腳本完整內容：
```powershell
$ErrorActionPreference = 'Stop'
Get-Date -Format 'yyyy-MM-dd HH:mm'
$listeners = @(Get-NetTCPConnection -LocalPort 4173 -State Listen -ErrorAction SilentlyContinue)
Write-Output "Port 4173 listening count: $($listeners.Count)"
$previewProcesses = @(Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'node_modules[\\/]\.bin[\\/]\.\.[\\/]vite[\\/]bin[\\/]vite\.js.*preview|vite[\\/]bin[\\/]vite\.js.*preview' })
Write-Output "Vite preview process count: $($previewProcesses.Count)"
if ($listeners.Count -gt 0 -or $previewProcesses.Count -gt 0) { $previewProcesses | Select-Object ProcessId, CommandLine | Format-List; exit 1 }
```
Playwright 啟動的 preview 已退出，無殘留的 preview 進程或 4173 監聽。

## 4. 風險與存疑
- Build 成功但有 Remotion 的 use client 被忽略、JS chunk 超過 500kB 的非阻斷警告；保留原始輸出，未隱藏警告。
- npm 有 esbuild 安裝腳本待批准提示；本次 npm ci、build 與測試均成功，未修改全域批准設定。
- 雙尺寸為本機瀏覽器 viewport 自動測試，未進行實體手機或人工視覺驗收；長按及滑鼠循環動效已實作，但未納入本次端對端自動斷言。
- 宋體採指定本機字體堆疊，未下載字體；實際字型取決於裝置已安裝字體。
- 無刪資料／目錄、強推、對外發消息、提交或合併操作。未改 README、根目錄 src、scripts、test、objects 或 .github；未碰資料庫、壓縮包或真實內容。
