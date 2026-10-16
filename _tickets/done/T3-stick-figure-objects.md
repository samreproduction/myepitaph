# T3：物件改為具體簡筆畫

> 派單：Claude Code (Opus) | 日期：2026-10-16 | 工人：opencode:openai/gpt-6.1-sol
> workdir: web
> claimed-by: opencode opencode v2.0.29 / openai/gpt-6.1-sol @ 2026-10-16 18:02:16

## 目標
物件從抽象線條改成一眼認得出的簡筆畫（例如一棵完整的樹：樹幹、分枝、樹冠），仍由文字確定性生成。

## 動手前先讀
1. `web/src/shape.ts`、`web/src/Object.tsx`、`web/src/style.css`
2. `web/tests/shape.test.ts`、`web/tests/cemetery.spec.ts`

## 規格
1. 種類（6 種，都是單色線條簡筆畫，像用筆一筆筆畫出來）：
   - `tree` 樹：完整樹幹、至少 2 層分枝、圓團狀樹冠輪廓、底部一小段地面線。
   - `flower` 花：莖、1～2 片葉、花瓣圍成的花頭。
   - `grass` 草叢：5～9 根長短不一的草葉，可帶 1 朵小花。
   - `bird` 鳥：停在一根短枝上的側面小鳥（頭、身、尾、腳、眼點）。
   - `lantern` 燈籠：吊繩、提把、燈身、底座，燈身內一道火光線。
   - `mountain` 遠山：2～3 座山稜線，一座帶雪線，加一輪小月或太陽。
2. 確定性：`shapeFor(text, override?)` 仍是純函式，不用 `Math.random`。用現有雜湊選種類；同一種類內的細節也由文字特徵決定：
   - 字數 → 尺寸（例如樹高、草葉長度）；
   - 段落數 → 結構數量（例如樹的分枝層數、花瓣數、山的座數），有上下限；
   - 標點數 → 小細節（例如果實或葉子數、鳥的翅膀角度）；
   - 雜湊 → 左右偏向、輕微傾斜。
   不同文字即使同一種類，也要看得出不同（形狀參數不同）。
3. `ShapeSpec` 可以擴充欄位（例如 `fills` 給果實或眼點用的小實心圓），保持 `kind`、`paths`、`strokeWidth`、`rotation` 欄位。`override.kind` 仍可指定上面 6 種之一；指定不認得的種類時退回雜湊選的種類。
4. 所有座標在 viewBox `0 0 100 100` 內，留 4 單位邊距，底部對齊在 y≈88 附近，讓一排物件像站在同一片地上。
5. 動效（Object.tsx）：
   - 生長：物件出現時線條由下往上描出（`stroke-dasharray`/`stroke-dashoffset`，約 0.9 秒），不只是淡入。減少動態時直接顯示完整圖。
   - 循環（懸停或長按）：依種類輕微擺動，例如樹冠與草葉隨風擺、鳥輕點頭、燈籠擺盪、山上的月亮微微升降；以底部為支點，幅度小。
6. 線條顏色、粗細延續現在的灰白色調；不加彩色。

## 邊界
1. 只動 `web/src/shape.ts`、`web/src/Object.tsx`、`web/src/style.css`、`web/tests/shape.test.ts`、`web/tests/cemetery.spec.ts`；如需要可新增 `web/src/drawings.ts` 放各種類的繪製函式。
2. 密鑰不寫進代碼、文件和日誌。
3. 不 git commit / push（主 AI 驗收後統一提交）；截圖不進版本控制。
4. 工單檔案留在 `_tickets/doing/`，不要挪。
5. 不寫遍歷目錄、逐個改檔案內容的腳本；改哪個檔案就點名改哪個。
6. 不打開資料庫、圖片、壓縮包這類非文字檔。

## 驗收（寫命令，不寫感覺）
1. `cd web && npm run build` → 成功，無 TypeScript 錯誤。
2. `cd web && npm test` → 全過，至少新增：
   - 6 種 `kind` 都能用 override 產生，且每種 `paths` 非空、所有數字座標在 4～96 之間；
   - `tree` 至少有樹幹、≥2 條分枝與樹冠（可用 ShapeSpec 內的具名部件或 path 數量斷言）；
   - 同一文字兩次結果深度相等；同一種類、不同文字（例如段落數不同）結果不同；
   - 用 8 件假內容跑 `shapeFor`，至少出現 3 種不同 `kind`（若現有雜湊做不到，調整雜湊到種類的對應方式，不要改假內容）。
3. `cd web && npx playwright test` → 全過（既有測試不刪，必要時更新選擇器）。
4. 寫一個不進版本控制的展示頁或 Playwright 測試，把 6 種種類各畫一次（同一頁），截圖存到 `web/test-results/`，在回執列出路徑。

## 為什麼這樣驗收
Sam 要的是看得懂的具體圖像，同時保留設計的核心：同一篇文字永遠長出同一個圖，不同文字長出不同的圖。

## 產出
- 上述檔案的修改（與可選的 `web/src/drawings.ts`）
