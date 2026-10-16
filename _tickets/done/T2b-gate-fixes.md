# T2b：T2 審查跟進（空內容、中文檔名、測試字樣、密碼閘版面）

> 派單：Claude Code (Opus) | 日期：2026-10-16 | 工人：opencode:openai/gpt-6.1-sol
> workdir: web
> claimed-by: opencode opencode v2.0.29 / openai/gpt-6.1-sol @ 2026-10-16 18:25:14

## 目標
修正 `_receipts/T2-decrypt-integration.review.md` 第 1–5 條。

## 動手前先讀
1. `_receipts/T2-decrypt-integration.review.md`
2. `web/src/content.ts`、`web/src/App.tsx`、`web/src/style.css`、`web/index.html`、`web/tests/content.test.ts`、`web/tests/unlock.spec.ts`、`web/tests/cemetery.spec.ts`

## 規格
1. **空內容**：index 裡沒有任何可解密的檔案（無 epitaph 且無合格物件）時，送出密碼後留在密碼閘，顯示「目前還沒有內容」，不存任何 localStorage 記錄，也不進入墓園。有任何一個檔案時照舊（以解密成功驗證密碼）。
2. **檔名**：`parseFilename` 接受 `YYYY-MM-DD-<slug>.md.enc.json`，slug 為任何不含 `/` 和 `\` 的非空字串（含中文、大寫、空格）。日期仍需合法。`copy-content.mjs` 不需改；fetch 已用 `encodeURIComponent`。
3. **去掉測試字樣**：刪掉石碑上方「此處留下的，只是測試」那行（連同 `.eyebrow` 樣式若不再使用）；`aria-label` 改為「依日期排列的物件」；面板標題改為顯示該物件的日期（`<h2>` 內容為日期，原本 panel-top 的日期可移除以免重複）；`index.html` 的 `<title>` 改為「黑墓」。
4. **選中比對**：用 `date` 與 `slug` 一起比對。
5. **密碼閘版面**：整個表單位於地平線上方的黑色天空中，與地平線至少留 24px（390×844 與 1440×900 都是）；輸入框焦點樣式改為 1px 淺灰外框（同 `button:focus-visible`），不出現瀏覽器預設彩色焦點框；勾選框用 `accent-color` 灰色系。

## 邊界
1. 只動上面「動手前先讀」第 2 項列出的檔案。
2. 密鑰不寫進代碼、文件和日誌。
3. 不 git commit / push；截圖不進版本控制。
4. 工單檔案留在 `_tickets/doing/`，不要挪。
5. 不寫遍歷目錄、逐個改檔案內容的腳本；改哪個檔案就點名改哪個。
6. 不打開資料庫、圖片、壓縮包這類非文字檔。

## 驗收（寫命令，不寫感覺）
1. `cd web && npm run build` → 成功。
2. `cd web && npm test` → 全過，新增：中文 slug（`2026-10-16-我的想法.md.enc.json`）與大寫/空格 slug 可解析；含 `/` 或日期不合法的仍被拒。
3. `cd web && npx playwright test` → 全過。把原「空內容解鎖無物件與墓誌銘」測試改為：空內容時送出任意密碼顯示「目前還沒有內容」、仍在密碼閘、`localStorage` 沒有 `blacktomb.unlock`。新增：390×844 與 1440×900 下表單 `getBoundingClientRect().bottom` ≤ `.horizon` 的 top − 24；頁面標題為「黑墓」；頁面文字不含「測試物件文字」與「只是測試」。
4. `cd web && npm run build:test` 後再跑一次 3（若 playwright 已自動 build:test 可省略並說明）。

## 為什麼這樣驗收
上線後 objects/ 一開始是空的，不能讓任何密碼都「進得去」；Sam 寫內容時檔名很可能是中文，不能被靜默丟掉；正式網站不能殘留測試字樣。

## 產出
- 上述檔案的修改
