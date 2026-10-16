# T1：前端原型（假內容，暫不接加密）

> 派單：Claude Code (Opus) | 日期：2026-10-16 | 工人：opencode:openai/gpt-6.1-sol
> workdir: web
> claimed-by: opencode opencode v2.0.29 / openai/gpt-6.1-sol @ 2026-10-16 16:54:41

## 目標
在 `web/` 做出可在手機與電腦瀏覽器運行的墓園畫面原型：假內容的物件依日期逐件生長，墓誌銘石碑居中，點擊物件看文字。

## 動手前先讀
1. `README.md`
2. 本單「規格」一節（摘自設計架構圖，已定案）。
3. `src/crypto.mjs`（只讀，了解之後如何接入；本單不呼叫它）

## 規格
- 技術：Vite + React + TypeScript；動效用 `@remotion/player`（Remotion 在瀏覽器內播放，不渲染影片檔）。
- 假內容：`web/src/fixtures.ts` 內 6～10 件物件 `{ date, slug, text }` 與一段墓誌銘文字，全部是明顯的假文字（例如「測試物件一」）。不建立任何 `.md` 檔。
- 形狀生成：`web/src/shape.ts` 匯出純函式 `shapeFor(text: string): ShapeSpec`，由確定性特徵（字數、段落數、標點數等）產生抽象線條 SVG 參數。同一段文字永遠得到同一形狀；不用 `Math.random`。支援可選的手動覆寫 `{ kind?: string }`。
- 畫面：黑底、灰色地平線、灰階地面；墓誌銘為中心純文字石碑版式（不經形狀生成）；物件沿時間排列。
- 互動狀態：未解鎖（只見背景，畫面上有一個「進入」按鈕代替之後的密碼閘）→ 生長中（依日期逐件生長）→ 靜止；桌面滑鼠停留或手機長按（約 500ms）時該物件循環動效，移開或放開即停；點擊物件 → 物件溶解成文字面板，可關閉；面板上有「歷史」按鈕，本單只顯示「尚未接入」。
- 無障礙：物件是可聚焦的按鈕（鍵盤 Enter 打開面板，Esc 關閉），有 `aria-label`。
- 字體：中文宋體（`"Noto Serif TC", "Songti TC", serif`），不從外部 CDN 載字體以外的資源。介面語言繁體中文。
- 響應式：390×844 與 1440×900 都無橫向捲動，所有物件可點到。
- `vite.config.ts` 設 `base: "./"`，讓 build 出的 `web/dist` 可放在任意子路徑。

## 邊界
1. 只動 `web/` 目錄內的檔案（新建）。不改 `src/`、`scripts/`、`test/`、`objects/`、`.github/`、`README.md`。
2. 密鑰不寫進代碼、文件和日誌。
3. 不 git commit / push（主 AI 驗收後統一提交）。
4. 工單檔案留在 `_tickets/doing/`，不要挪。
5. 不寫遍歷目錄、逐個改檔案內容的腳本；改哪個檔案就點名改哪個。
6. 不打開資料庫、圖片、壓縮包這類非文字檔。
7. `web/node_modules`、`web/dist` 不進版本控制（在 `web/.gitignore` 寫明）。

## 驗收（寫命令，不寫感覺）
1. `cd web && npm ci && npm run build` → 成功，產出 `web/dist/index.html`，無 TypeScript 錯誤。
2. `cd web && npm test` → 測試全過；至少包含：同一文字兩次 `shapeFor` 結果深度相等；兩段不同假文字結果不同；覆寫 `kind` 生效。
3. `node -e "const fs=require('fs');const w=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?w(d+'/'+e.name):[d+'/'+e.name]);console.log(w('web/dist').filter(f=>f.endsWith('.md')).length)"` → 輸出 `0`。
4. `cd web && npx playwright test` → 通過。不要執行 `playwright install`，也不下載瀏覽器：`playwright.config.ts` 若有環境變數 `PW_EXECUTABLE_PATH` 就用它當 `launchOptions.executablePath`，否則用 `channel: 'msedge'`（Windows 自帶的 Edge）。測試要對 `npm run preview` 起的頁面做：在 390×844 和 1440×900 下 `document.documentElement.scrollWidth <= innerWidth`；點「進入」後等待生長完成，物件按鈕數量等於假內容件數；點第一件物件出現文字面板且含該物件的假文字；按 Esc 面板消失。截圖存到 `web/test-results/`（此目錄也寫進 `web/.gitignore`）。
5. 本機 shell 是 Windows：工具預設的 shell 若是 cmd，`&&` 照常可用；若某條命令輸出為空或只回顯命令本身，重跑一次再當證據。

## 為什麼這樣驗收
目的是確認畫面設計在手機和電腦都能真的用，且形狀是由文字確定生成（之後接入加密內容時，同一篇文章每次打開形狀一樣）。build 裡不能出現 `.md`，因為發佈流程會因此中止，也是防明文外洩的底線。

## 產出
- `web/package.json`、`web/package-lock.json`、`web/vite.config.ts`、`web/tsconfig.json`、`web/index.html`、`web/.gitignore`
- `web/src/` 下的元件、`shape.ts`、`fixtures.ts`
- `web/tests/` 下的單元測試與 Playwright 測試
