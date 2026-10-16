# T4：瀏覽器編輯器（手機可用）

> 派單：Claude Code (Opus) | 日期：2026-10-16 | 工人：opencode:openai/gpt-6.1-sol
> workdir: web
> claimed-by: opencode opencode v2.0.29 / openai/gpt-6.1-sol @ 2026-10-16 18:38:09

## 目標
Sam 在手機或電腦瀏覽器裡解鎖後，可以新增、修改、刪除物件和修改墓誌銘；網頁在本機加密後，用 GitHub API 把密文提交到 repo，Actions 自動發佈。明文永遠不離開瀏覽器。

## 動手前先讀
1. `src/crypto.mjs`、`README.md`、`.github/workflows/pages.yml`
2. `web/src/App.tsx`、`web/src/content.ts`、`web/src/style.css`、`web/tests/unlock.spec.ts`

## 規格
1. **設定**：新增 `web/src/config.ts`：`{ owner: 'samreproduction', repo: 'myepitaph', branch: 'main' }`。
2. **入口**：解鎖後 masthead 在「上鎖」旁多一個「編輯」按鈕，開啟全螢幕編輯面板（同一頁，不換路由也可）；面板右上「完成」回到墓園並重新生長（用剛編輯後的內容）。
3. **GitHub 權杖**：
   - 第一次開編輯面板且沒有存權杖時，顯示說明與輸入框：「貼上 GitHub 細粒度權杖（只授權 myepitaph，權限 Contents: Read and write，請設到期日）」。
   - 權杖用目前的網站密碼經 `seal()` 加密後存在 `localStorage` 的 `blacktomb.token`（存的是 envelope JSON，不是明文）。之後開編輯面板用網站密碼 `open()` 取回，只放在記憶體。
   - 「移除權杖」按鈕刪除記錄。權杖不寫進 console、錯誤訊息或任何網路請求以外的地方，只出現在 `Authorization: Bearer` 標頭。
   - 網站密碼取自解鎖時輸入的密碼（App 需在記憶體保留目前密碼；上鎖時清掉）。
4. **編輯面板內容**：
   - 墓誌銘：一個多行文字框，載入目前內容。
   - 物件清單：依日期排列，每列顯示日期與第一行文字；點一列展開編輯（多行文字框）。
   - 「新增物件」：日期（預設今天，`<input type="date">`）、短名（slug，預設 `entry`，允許中文；去掉 `/`、`\` 與前後空白）、文字。檔名 `objects/<date>-<slug>.md.enc.json`；同名已存在就自動在 slug 後加 `-2`、`-3`。
   - 每個物件有「刪除」，按下需再確認一次（「確定刪除？內容仍保留在 Git 歷史」）。
   - 每個改動各有「儲存」按鈕；儲存中顯示「提交中…」並停用；成功顯示「已提交，約一分鐘後上線」；失敗顯示 GitHub 回傳的狀態碼與簡短原因（不含權杖）。
5. **提交**（新增 `web/src/github.ts`）：
   - 用 `fetch` 呼叫 `https://api.github.com/repos/{owner}/{repo}/contents/{path}`：GET 取 `sha`（404 代表新檔），PUT 寫入（`content` 為 envelope JSON 加換行後 base64，需正確處理 UTF-8），DELETE 刪除（需 `sha`）。`path` 每段用 `encodeURIComponent`。
   - 提交訊息固定為「更新內容」，不含檔名或任何明文。
   - envelope 用 `seal(text, password)` 產生，格式與 `scripts/seal.mjs` 一致（`JSON.stringify(env, null, 2) + "\n"`）。
   - 409/422（sha 過期）時重新 GET 一次 sha 再試一次。
6. **刪除後的空缺**：本單只刪檔；墓園畫面的「空缺」留到之後的工單。
7. **附帶修正**（T2 審查留下的）：
   - 手機橫放（844×390）時密碼表單不可壓到地平線：當可用高度不足時，表單改為置於地平線下方或縮小間距，`form.bottom ≤ horizon.top - 24` 或 `form.top ≥ horizon.top + 24` 二者擇一成立。
   - 未勾選的勾選框改為深色底灰框（`appearance: none` 自繪，勾選時顯示灰色勾），保持可聚焦與 label 可點。
8. **手機可用**：390×844 下編輯面板無橫向捲動，文字框寬度 100%，按鈕高度 ≥ 44px。

## 邊界
1. 只動 `web/` 內的檔案（可新增）。不改 `src/`、`scripts/`、`test/`、`objects/`、`.github/`、`README.md`。
2. 密鑰不寫進代碼、文件和日誌；測試用的假權杖寫成 `test-token-not-real`。
3. 不 git commit / push；截圖不進版本控制。
4. 工單檔案留在 `_tickets/doing/`，不要挪。
5. 不寫遍歷目錄、逐個改檔案內容的腳本；改哪個檔案就點名改哪個。
6. 不打開資料庫、圖片、壓縮包這類非文字檔。
7. 測試不得對真正的 api.github.com 發出請求：Playwright 用 `page.route('https://api.github.com/**', ...)` 攔截並模擬。

## 驗收（寫命令，不寫感覺）
1. `cd web && npm run build` → 成功。
2. `cd web && npm test` → 全過，新增 `github.ts` 單元測試：UTF-8 內容 base64 正確（含中文）、path 編碼（中文 slug）、409 時重取 sha 重試一次、錯誤訊息不含權杖字串。
3. `cd web && npx playwright test` → 全過，新增（全部攔截 GitHub API）：
   - 首次編輯要求權杖；存入後 `localStorage.blacktomb.token` 不含 `test-token-not-real` 字串，重新整理並解鎖後再開編輯不需重貼。
   - 修改第一件物件後儲存：攔截到的 PUT 帶 `Authorization: Bearer test-token-not-real`、`message` 為「更新內容」、`sha` 為 GET 回傳值；把 `content` base64 解碼後是 envelope JSON，用 `test-password` 以 `src/crypto.mjs` 解開等於新文字；整個請求 body 不含新文字明文。
   - 新增物件（slug「新的想法」）PUT 到 `objects/<今天>-新的想法.md.enc.json`（URL 已編碼）；同名再新增時路徑變成 `-2`。
   - 刪除需二次確認，確認後發出 DELETE 帶正確 sha。
   - 改墓誌銘 PUT 到 `epitaph.md.enc.json`。
   - GitHub 回 401 時顯示含「401」的錯誤，頁面文字不含權杖。
   - 「移除權杖」後 localStorage 無 `blacktomb.token`。
   - 390×844 下編輯面板無橫向捲動；844×390 下密碼表單與地平線不重疊（規格 7）。
4. 在回執貼出：一次模擬 PUT 的 request body（權杖不會在 body 裡）。

## 為什麼這樣驗收
這是 Sam 從手機更新內容的唯一途徑：必須確認提交的只有密文、權杖只以加密形式存放、改錯或衝突時不會默默失敗；測試全部模擬 GitHub，不碰真 repo。

## 產出
- `web/src/config.ts`、`web/src/github.ts`、編輯面板元件（如 `web/src/Editor.tsx`）
- `web/src/App.tsx`、`web/src/style.css` 修改
- `web/tests/` 新增與修改的測試
