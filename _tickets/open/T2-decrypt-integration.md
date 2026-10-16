# T2：瀏覽器解密與密碼閘

> 派單：Claude Code (Opus) | 日期：2026-10-16 | 工人：opencode:openai/gpt-6.1-sol
> claimed-by: （派單時由主 AI 填寫）

## 目標
網站改為讀取加密內容：訪客輸入共用密碼，在瀏覽器內用 `src/crypto.mjs` 解開 `objects/*.md.enc.json` 與 `epitaph.md.enc.json`，再生長出物件；發佈流程改為建置 `web/` 並只發佈密文。

## 動手前先讀
1. `README.md`、`src/crypto.mjs`、`scripts/seal.mjs`、`.github/workflows/pages.yml`
2. `web/src/App.tsx`、`web/src/fixtures.ts`、`web/package.json`、`web/playwright.config.ts`、`web/tests/`

## 規格
1. **內容打包**：新增 `web/scripts/copy-content.mjs`，在 `vite build` 之後執行（接到 `npm run build` 末尾）。它從 `CONTENT_ROOT`（環境變數，預設是倉庫根目錄 `..`）讀 `objects/*.enc.json` 與 `epitaph.md.enc.json`（不存在就略過），複製到 `web/dist/content/`，並寫 `web/dist/content/index.json`：`{ "epitaph": "epitaph.md.enc.json" | null, "objects": ["2026-01-03-test-one.md.enc.json", ...] }`，按檔名排序。只複製 `.enc.json`，其他檔案一律不碰。
2. **測試用密文**：新增 `web/scripts/make-fixtures.mjs`，用 `src/crypto.mjs` 的 `seal` 以密碼 `test-password` 把 `web/src/fixtures.ts` 同樣的 8 段假文字與假墓誌銘加密，寫到 `web/tests/content/objects/<date>-<slug>.md.enc.json` 與 `web/tests/content/epitaph.md.enc.json`。執行一次並提交產出的密文檔（假內容，可公開）。不產生任何 `.md` 明文檔。
3. **載入與解密**（新增 `web/src/content.ts`）：
   - 讀 `./content/index.json`，抓各密文檔，用 `open(envelope, password)` 解密（從 `../../src/crypto.mjs` 匯入，由 Vite 打包）。所有檔案並行解密。
   - 由檔名 `YYYY-MM-DD-slug.md.enc.json` 取 `date`、`slug`；檔名不合格式的跳過並 `console.warn`。按日期排序。
   - 密碼錯（第一個解密失敗）→ 丟出可辨識的錯誤，畫面顯示「密碼不正確」。
   - `objects` 為空時正常顯示，地面上沒有物件；`epitaph` 為 null 時不顯示石碑文字。
4. **密碼閘**（取代「進入」按鈕）：未解鎖畫面仍是黑底與地平線，中間一個密碼輸入框（`type="password"`、有 `<label>`「密碼」）、「進入」按鈕、一個「記住此裝置 30 天」勾選框（預設不勾）。按 Enter 或按鈕送出；解密中按鈕顯示「解開中…」並停用；錯誤時顯示「密碼不正確」並清空輸入框、焦點回到輸入框。
5. **30 天保留**：勾選時把密碼與到期時間存到 `localStorage`（鍵名 `blacktomb.unlock`），下次開頁自動解開；到期或解密失敗就刪除並回到密碼閘。不勾就不存。所有 `localStorage` 存取包在 try/catch。畫面右上角（解鎖後）加一個「上鎖」小按鈕，按下刪除記錄並回到密碼閘。
6. **App 改用解密內容**：`fixtures.ts` 只留給單元測試與 `make-fixtures.mjs` 使用；App 不再匯入它。解鎖後的生長、懸停、長按、面板、歷史提示等行為不變。
7. **測試設定**：`playwright.config.ts` 的 `webServer` 改為先以 `CONTENT_ROOT=tests/content` 建置再 preview（例如 `npm run build:test && npm run preview -- --port 4173 --strictPort`，`build:test` 用 node 設定環境變數，跨平台，不依賴 `cross-env` 以外的新套件；能不加套件就不加）。
8. **發佈流程** `.github/workflows/pages.yml`：在 Assemble 前加 `actions/setup-node@v4`（node 22，npm 快取指向 `web/package-lock.json`）、`npm ci` 與 `npm run build`（`working-directory: web`，`CONTENT_ROOT` 用預設即倉庫根）。發佈目錄改為 `web/dist`；保留原有 `.md` 防呆（改為檢查 `web/dist`），另加一條：若 `web/dist` 內有任何非 `.enc.json` 的 `.json` 以外的內容檔出現在 `content/` 底下就失敗。不再複製 `site/`。工作流仍不持有任何密碼或 secret。

## 邊界
1. 只動：`web/`（含新增檔）、`.github/workflows/pages.yml`。不改 `src/`、`scripts/`、`test/`、`objects/`、`README.md`。
2. 密鑰不寫進代碼、文件和日誌；測試密碼 `test-password` 只出現在測試與 `make-fixtures.mjs`。
3. 不 git commit / push（主 AI 驗收後統一提交）；截圖不進版本控制。
4. 工單檔案留在 `_tickets/doing/`，不要挪。
5. 不寫遍歷目錄、逐個改檔案內容的腳本；改哪個檔案就點名改哪個（`copy-content.mjs` 讀取 objects 目錄清單是規格要求，不在此限）。
6. 不打開資料庫、圖片、壓縮包這類非文字檔。

## 驗收（寫命令，不寫感覺）
1. `cd web && npm run build` → 成功（倉庫 `objects/` 目前是空的，`dist/content/index.json` 應為 `{"epitaph":null,"objects":[]}`），貼出 index.json 內容。
2. `cd web && npm run build:test` → 成功，`dist/content/index.json` 列出 8 個物件與 epitaph。
3. 用 node 腳本在 `web/dist` 內所有檔案搜尋假文字「這是一段用來展示的假文字」→ 0 次（證明明文沒有被打包進網站）；`.md` 檔數量 → 0。
4. `cd web && npm test` → 全過，至少新增：檔名解析（合格與不合格各一）、用 `test-password` 解開一個測試密文得到對應假文字、錯密碼丟出錯誤。
5. `cd web && npx playwright test` → 全過，既有測試改為先輸入 `test-password` 再進入，並新增：錯密碼顯示「密碼不正確」且無物件；對密碼後 8 件物件與面板文字正確；勾選記住後重新整理頁面直接解鎖；按「上鎖」後回到密碼閘且重新整理仍是密碼閘；不勾記住時重新整理回到密碼閘。
6. `node -e "require('yaml')"` 不可用時，改用 `npx --yes js-yaml .github/workflows/pages.yml` 以外的方法驗證 YAML 語法：在回執貼出修改後 `pages.yml` 全文即可。

## 為什麼這樣驗收
核心是「repo 和網站只有密文，原文只在瀏覽器內解開」：驗收 3 確認建置產物不含明文；驗收 5 確認密碼閘、錯誤處理和 30 天保留真的能用；發佈流程改完後，合併到 main 才會真的上線。

## 產出
- `web/scripts/copy-content.mjs`、`web/scripts/make-fixtures.mjs`、`web/src/content.ts`
- `web/tests/content/` 下的測試密文
- `web/src/App.tsx`、`web/package.json`、`web/playwright.config.ts`、`web/tests/*` 的修改
- `.github/workflows/pages.yml` 的修改
