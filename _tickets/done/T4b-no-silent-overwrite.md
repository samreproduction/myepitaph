# T4b：編輯器不得默默覆蓋內容

> 派單：Claude Code (Opus) | 日期：2026-10-16 | 工人：opencode:openai/gpt-6.1-sol
> workdir: web
> claimed-by: opencode opencode v2.0.29 / openai/gpt-6.1-sol @ 2026-10-16 18:47:13

## 目標
修正 `_receipts/T4-phone-editor.review.md` 第 1、2 條：任何儲存或刪除都不能在不知情下蓋掉別處（另一台裝置）已寫入的內容。

## 動手前先讀
1. `_receipts/T4-phone-editor.review.md`
2. `web/src/github.ts`、`web/src/Editor.tsx`、`web/tests/github.test.ts`、`web/tests/editor.spec.ts`

## 規格
1. `commitContent` 改成明確的三種操作（可拆成三個函式或加 `mode` 參數）：
   - **新增** `create(path, text)`：GET 回 404 才 PUT（不帶 sha）。GET 回 200 時把檔名 slug 後綴依序改成 `-2`、`-3`…（已有 `-N` 就遞增）再試，最多 20 次；PUT 回 422（檔案已存在）時同樣換下一個名字。成功後回傳實際寫入的 path，Editor 用它更新清單。
   - **修改** `update(path, originalText, newText)`：GET 取得線上 envelope（`content` base64 解碼為 UTF-8 JSON）與 sha，用網站密碼 `open()` 解開；若解開文字 ≠ `originalText`（開編輯器時載入的內容），不寫入，丟出錯誤「此內容已在別處更新，請按完成後重新整理再改」。相同才 PUT 帶該 sha。PUT 回 409/422 時重新 GET 並再次比對，仍相同才重試一次。GET 回 404 視為已被刪除，同樣不寫入並提示「此物件已在別處刪除」。
   - **刪除** `remove(path, originalText)`：同樣先 GET 並比對，相同才 DELETE 帶 sha；不同就停下提示（訊息同上）；404 視為已刪除，當作成功並從清單移除。
   - 墓誌銘用 `update`；若線上沒有 `epitaph.md.enc.json` 且原本內容為 null，用 `create` 的邏輯但不換名（固定路徑，GET 200 就提示已在別處更新）。
2. Editor：每件物件與墓誌銘在開啟編輯器時記住「原文」；儲存成功後原文更新為新文字，可以連續修改。
3. 錯誤訊息仍不含權杖或伺服器回應內容。

## 邊界
1. 只動 `web/src/github.ts`、`web/src/Editor.tsx`、`web/tests/github.test.ts`、`web/tests/editor.spec.ts`。
2. 密鑰不寫進代碼、文件和日誌。
3. 不 git commit / push；截圖不進版本控制。
4. 工單檔案留在 `_tickets/doing/`，不要挪。
5. 不寫遍歷目錄、逐個改檔案內容的腳本。
6. 測試不得對真正的 api.github.com 發出請求。

## 驗收（寫命令，不寫感覺）
1. `cd web && npm run build` → 成功。
2. `cd web && npm test` → 全過，新增：新增遇 200 改用 `-2`（再遇 200 用 `-3`）；新增遇 PUT 422 換名；修改時線上解開文字與原文不同 → 不發 PUT 且錯誤訊息正確；相同 → PUT 帶 sha；修改遇 404 → 不寫入；刪除時不同 → 不發 DELETE；刪除遇 404 → 視為成功；409 後重新比對仍相同才重試。測試用的線上 envelope 用 `seal(text, 'test-password')` 產生。
3. `cd web && npx playwright test` → 全過；更新模擬：GET 回傳真的 envelope（用測試密碼加密對應物件的原文），並新增一個 e2e：模擬線上內容已被改過，按儲存顯示「此內容已在別處更新」，且沒有發出 PUT。

## 為什麼這樣驗收
Sam 會在手機和電腦兩邊寫，網站發佈又有延遲；寧可停下提示，也不能讓一邊默默蓋掉另一邊寫的東西。

## 產出
- 上述四個檔案的修改
