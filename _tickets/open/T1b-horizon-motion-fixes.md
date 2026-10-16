# T1b：T1 審查跟進（地平線對齊、減少動態、互動測試）

> 派單：Claude Code (Opus) | 日期：2026-10-16 | 工人：opencode:openai/gpt-6.1-sol
> workdir: web
> claimed-by: （派單時由主 AI 填寫）

## 目標
修正 T1 審查發現的三點，見 `_receipts/T1-frontend-prototype.review.md`。

## 動手前先讀
1. `_receipts/T1-frontend-prototype.review.md`
2. `web/src/style.css`、`web/src/App.tsx`、`web/src/Object.tsx`、`web/tests/cemetery.spec.ts`

## 規格
1. 地平線：手機（390×844，頁面比視窗高）上，地平線線條與地面（灰階漸層）的上緣必須在同一個 y 位置。做法：`.cemetery` 背景只留黑色；新增一個 `aria-hidden` 的 `.ground` 元素，絕對定位，`top` 與 `.horizon` 相同，向下延伸到頁面底部，承載原本的灰階漸層。
2. 減少動態：使用者設定 `prefers-reduced-motion: reduce` 時，懸停或長按不播放 Remotion 循環（形狀保持靜止），其餘功能不變。用 `matchMedia` 判斷。
3. 測試：在 `web/tests/cemetery.spec.ts` 新增：
   - 390×844 與 1440×900 下，`.horizon` 與 `.ground` 的 `getBoundingClientRect().top` 相差 ≤ 1px。
   - 桌面懸停第一件物件 600ms 後，其 `svg g` 的 `transform` 屬性和懸停前不同；移開 300ms 後回到原值。
   - 觸控（`hasTouch: true` 的 context，用 CDP `Input.dispatchTouchEvent` 按住 1200ms）時 `transform` 改變，放開後不打開面板；之後短按另一件物件會打開面板。
   - `page.emulateMedia({ reducedMotion: 'reduce' })` 下懸停 600ms，`transform` 不變。

## 邊界
1. 只動 `web/src/style.css`、`web/src/App.tsx`、`web/src/Object.tsx`、`web/tests/cemetery.spec.ts`。
2. 密鑰不寫進代碼、文件和日誌。
3. 不 git commit / push（主 AI 驗收後統一提交）。
4. 工單檔案留在 `_tickets/doing/`，不要挪。
5. 不寫遍歷目錄、逐個改檔案內容的腳本；改哪個檔案就點名改哪個。
6. 不打開資料庫、圖片、壓縮包這類非文字檔。

## 驗收（寫命令，不寫感覺）
1. `cd web && npm run build` → 成功，無 TypeScript 錯誤。
2. `cd web && npm test` → 全過。
3. `cd web && npx playwright test` → 全過（含上面新增的測試；同 T1，不下載瀏覽器，用 msedge）。

## 為什麼這樣驗收
手機和電腦同等重要，手機上不能看到兩條分界線；長按與懸停是設計裡唯一的循環動效入口，之前沒有測試保護；減少動態是無障礙底線。

## 產出
- 上述四個檔案的修改
