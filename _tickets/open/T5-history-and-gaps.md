# T5：歷史版本與刪除留空缺

> 派單：Claude Code (Opus) | 日期：2026-10-16 | 工人：opencode:openai/gpt-6.1-sol
> workdir: web
> claimed-by: （派單時由主 AI 填寫）

## 目標
1. 文字面板的「歷史」按鈕列出該物件（與墓誌銘）在 Git 裡的每一版，點一版就在瀏覽器解開顯示。
2. 被刪除的物件在墓園上留下空缺（按日期佔一個位置），而不是消失。

做法：建置時（GitHub Actions 或本機 `npm run build`）用 git 把歷代**密文**一起打包進網站，瀏覽器不需要呼叫 GitHub API，私有 repo 也能用。

## 動手前先讀
1. `web/scripts/copy-content.mjs`、`web/scripts/build-test.mjs`、`web/scripts/make-fixtures.mjs`
2. `web/src/content.ts`、`web/src/App.tsx`、`web/src/Object.tsx`、`web/src/github.ts`、`web/src/style.css`
3. `.github/workflows/pages.yml`、`web/playwright.config.ts`、`web/tests/`

## 規格
1. **打包歷史**（`copy-content.mjs`）：若 `CONTENT_ROOT` 在 git 工作樹內且 `git` 可用：
   - 對每個目前存在的物件與 `epitaph.md.enc.json`，用 `git log --format=%H%x09%cI -- <相對路徑>` 取出每個改動它的提交（新到舊），以 `git show <sha>:<路徑>` 取出當時的密文；刪除型提交（檔案不存在）略過。寫到 `dist/content/history/<流水號>.enc.json`，流水號全站遞增，不用原檔名。
   - `index.json` 增加 `"history": { "<檔名>": [{ "file": "history/12.enc.json", "date": "<提交時間 ISO>" }, ...] }`（新到舊，包含目前版本）。
   - 被刪除的物件：`git log --diff-filter=D --name-only --format=%x00%cI -- objects/` 找出曾存在、現在不存在的 `objects/*.md.enc.json`，寫入 `"deleted": [{ "name": "<檔名>", "deletedAt": "<ISO>" }]`。同名後來又被新增的不算刪除。
   - 不在 git 內或沒有 git：`history` 為 `{}`、`deleted` 為 `[]`，建置照常成功。
   - 所有 git 呼叫用 `execFileSync('git', [...], { cwd })`，不經 shell；檔名照原樣傳參數（可能含中文）。
2. **測試用歷史 repo**：新增 `web/scripts/make-history-fixture.mjs`：在 `web/tests/.history-repo/`（寫進 `web/.gitignore`）重建一個獨立 git repo（`git init`，設定 `user.name`/`user.email` 只在該 repo，用 `GIT_AUTHOR_DATE`/`GIT_COMMITTER_DATE` 固定時間）。用 `test-password` 加密並依序提交：8 件假物件與墓誌銘（第 1 版）→ 第一件物件改兩次（共 3 版）→ 墓誌銘改一次（共 2 版）→ 新增一件 `2026-09-10-test-gone` 後再刪除它。`build:test` 改為先跑這個腳本，再以 `CONTENT_ROOT=tests/.history-repo` 建置。不再需要的 `tests/content/` 可保留給單元測試使用。
3. **發佈流程**：`pages.yml` 的 `actions/checkout@v4` 加 `with: fetch-depth: 0`。其他不變。
4. **載入**（`content.ts`）：讀 `history` 與 `deleted`；`deleted` 依檔名解析日期與 slug（用 `parseFilename`），不合格的略過。歷史版本不在解鎖時解密，等使用者點選才解。
5. **歷史介面**：面板的「歷史」按鈕展開版本清單，每版顯示提交日期（`YYYY-MM-DD HH:mm`，本地時間），目前版本標「目前」。點某一版：解密中顯示「解開中…」，完成後在清單下方顯示該版文字；解不開顯示「此版本無法用目前密碼解開」。沒有歷史資料時顯示「沒有歷史紀錄」。墓誌銘石碑下方加一個小的「歷史」按鈕，行為相同（用同一個面板）。
6. **空缺**：被刪除的物件按日期和現有物件一起排序、一起生長，畫成一個淡灰虛線的空位（同尺寸，下面一樣標日期），`aria-label`「已刪除的物件，<日期>」，不可點開、不參與懸停循環。
7. **附帶**：`github.ts` 中 update/remove 時線上檔案解不開（`open()` 失敗）要顯示「無法用目前密碼解開線上版本，未寫入」，不要顯示「網路連線失敗」。

## 邊界
1. 只動 `web/` 內的檔案（可新增）與 `.github/workflows/pages.yml`。不改 `src/`、`scripts/`、`test/`、`objects/`、`README.md`。
2. 密鑰不寫進代碼、文件和日誌。
3. 不 git commit / push 本專案；`tests/.history-repo/` 內的 git 操作是規格要求，只限該目錄。截圖不進版本控制。
4. 工單檔案留在 `_tickets/doing/`，不要挪。
5. 不寫遍歷目錄、逐個改檔案內容的腳本（`copy-content.mjs` 讀取 objects 與 git 輸出是規格要求）。
6. 不打開資料庫、圖片、壓縮包這類非文字檔。

## 驗收（寫命令，不寫感覺）
1. `cd web && npm run build` → 成功，貼出 `dist/content/index.json`（本 repo 的 `objects/` 目前為空，history 應為 `{}`，deleted 應為 `[]`）。
2. `cd web && npm run build:test` → 成功；貼出 index.json 的 `history` 裡第一件物件的 3 筆、墓誌銘的 2 筆，以及 `deleted` 含 `2026-09-10-test-gone.md.enc.json`。
3. 用 node 腳本掃 `web/dist` 所有檔案，三段假文字（第一件物件的三個版本各取一句）出現次數都為 0；`.md` 檔數為 0；`dist/content` 下只有 `.enc.json` 與 `index.json`。
4. `cd web && npm test` → 全過，新增：copy-content 對歷史 repo 產生正確的 history 筆數與 deleted；非 git 目錄時 history 為空且不報錯；`github.ts` 解不開時的新訊息。
5. `cd web && npx playwright test` → 全過，新增：第一件物件的歷史顯示 3 版、「目前」標在最新、點最舊一版顯示第 1 版文字；墓誌銘歷史 2 版；空缺出現在 2026-08-30 之後、帶正確 aria-label、點擊不開面板；物件按鈕數仍為 8。

## 為什麼這樣驗收
設計要求「每次提交即一版」「刪除留下空缺」：歷史必須真的來自 Git 且只以密文發佈；空缺讓刪除可見但內容不再公開顯示。

## 產出
- `web/scripts/copy-content.mjs`、`web/scripts/make-history-fixture.mjs`、`web/scripts/build-test.mjs` 修改
- `web/src/content.ts`、`App.tsx`、`Object.tsx`（或新增空缺元件）、`github.ts`、`style.css` 修改
- `web/.gitignore`、`web/tests/` 修改與新增
- `.github/workflows/pages.yml` 修改
