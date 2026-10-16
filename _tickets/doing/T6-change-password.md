# T6：更換密碼

> 派單：Claude Code (Opus) | 日期：2026-10-16 | 工人：opencode:openai/gpt-6.1-sol

## 目標
按設計（Q31）：更換密碼由**本機腳本**完成：先用舊密碼解開全部內容，全部成功後才用新密碼重新加密。網站本身不改密碼。
附帶兩件網站上的事：換密碼後，舊的歷史版本仍可用舊密碼單獨解開；換密碼後，存在瀏覽器的舊密碼與權杖要能乾淨地失效。

## 動手前先讀
1. `src/crypto.mjs`、`scripts/seal.mjs`、`test/roundtrip.mjs`、`README.md`
2. `web/src/History.tsx`、`web/src/App.tsx`、`web/src/Editor.tsx`
3. `web/tests/history.spec.ts`、`web/tests/unlock.spec.ts`、`web/tests/editor.spec.ts`

## 規格
1. **新增 `scripts/rekey.mjs`**（Node 22，只用內建模組與 `../src/crypto.mjs`）：
   - 用法：`node scripts/rekey.mjs [內容根目錄，預設 .]`。處理 `<根>/objects/*.md.enc.json` 與 `<根>/epitaph.md.enc.json`（不存在就略過）。
   - 密碼來源：若有環境變數 `BLACKTOMB_PASSWORD` 與 `BLACKTOMB_NEW_PASSWORD` 就用它們（給測試與進階使用）；否則在終端機互動詢問「舊密碼」「新密碼」「再輸入一次新密碼」，輸入時不回顯（raw mode，不顯示字元）。
   - 檢查：新密碼兩次不同、與舊密碼相同、或少於 8 個字元 → 報錯結束（非 0），不寫任何檔案。
   - **先全部解開**：任何一個檔案用舊密碼解不開 → 列出解不開的檔名，報錯結束，不寫任何檔案。
   - 全部解開後，以新密碼重新 `seal()`，先寫到同目錄的暫存檔 `<檔名>.rekey-tmp`，全部寫完再逐一 rename 覆蓋原檔。格式與 `seal.mjs` 相同（`JSON.stringify(env, null, 2) + "\n"`）。
   - 輸出只有檔名與數量，例如「已重新加密 9 個檔案」，最後提示「請 commit 並 push，網站更新後用新密碼進入；各裝置需重新貼上權杖」。不得輸出明文或密碼。
   - 不執行 git。
2. **新增 `test/rekey.mjs`**：在暫存目錄用假內容（`test-password` 加密 3 件物件 + 墓誌銘）測試：
   - 成功：環境變數給新密碼 `new-test-password` 後，全部檔案能用新密碼解開、文字與原本相同、舊密碼解不開、沒有殘留 `.rekey-tmp`。
   - 舊密碼錯：結束碼非 0，所有檔案位元組不變。
   - 有一個檔案損壞：結束碼非 0，所有檔案位元組不變，輸出含該檔名。
   - 新密碼太短 / 與舊密碼相同：結束碼非 0，檔案不變。
   - 所有情況的 stdout/stderr 都不含假文字與密碼。
3. **歷史面板用舊密碼解開**（`web/src/History.tsx`）：某一版顯示「此版本無法用目前密碼解開」時，下方出現一個密碼欄（label「舊密碼」）與「解開」按鈕，只用來解開這一版；成功就顯示文字，失敗顯示「舊密碼不正確」。這個密碼不存任何地方，關閉面板即清除。
4. **換密碼後瀏覽器端失效**：確認（不足就修）：
   - 「記住此裝置」存的舊密碼解不開新內容時，回到密碼畫面且清掉儲存，不顯示錯誤以外的內容。
   - 編輯器裡用舊密碼封存的權杖解不開時，顯示「無法讀取權杖，請重新貼上」，可以貼新權杖覆蓋。
5. **README.md**：把「更換密碼」一行換成 `node scripts/rekey.mjs` 的用法說明（互動輸入、先全部解開才寫入、完成後 commit/push、各裝置要重新輸入密碼與重新貼上權杖、舊歷史版本仍是舊密碼加密，可在歷史面板用舊密碼解開）。

## 邊界
1. 只動 `scripts/rekey.mjs`（新增）、`test/rekey.mjs`（新增）、`README.md`、`web/src/`、`web/tests/`。不改 `src/crypto.mjs`、`scripts/seal.mjs`、`objects/`、`.github/`。
2. 密鑰不寫進代碼、文件和日誌；測試只用 `test-password`、`new-test-password` 與假文字。
3. 不 git commit / push 本專案。截圖不進版本控制。
4. 工單檔案留在 `_tickets/doing/`，不要挪。
5. 不打開資料庫、圖片、壓縮包這類非文字檔。
6. 不要對真正的 `objects/` 執行 rekey。

## 驗收（寫命令，不寫感覺）
1. `node test/roundtrip.mjs` 與 `node test/rekey.mjs` → 都成功，貼出輸出。
2. `node scripts/rekey.mjs <不存在 objects 的暫存目錄>`（環境變數給兩個密碼）→ 正常結束並報告 0 個檔案；貼出輸出。
3. `cd web && npm test` → 全過。
4. `cd web && npm run build:test && npx playwright test` → 全過，新增：歷史某版以 `{}` 假密文模擬解不開 → 出現「舊密碼」欄；改為用另一個密碼（例如 `old-test-password`）加密的密文，輸入錯的顯示「舊密碼不正確」，輸入對的顯示該版文字；記住此裝置存的是錯誤密碼時回到密碼畫面且儲存被清除；編輯器內存的權杖以別的密碼封存時顯示「無法讀取權杖，請重新貼上」。
5. `git status --short` → 只有邊界內的檔案有改動。

## 為什麼這樣驗收
換密碼是唯一會改寫所有密文的操作，一旦寫壞就無法復原，所以必須「先全部解開、再全部寫入」並證明失敗時檔案完全不變。

## 產出
- `scripts/rekey.mjs`、`test/rekey.mjs` 新增
- `README.md` 修改
- `web/src/History.tsx`（與必要的 `App.tsx`/`Editor.tsx`/`style.css`）修改、`web/tests/` 新增測試
