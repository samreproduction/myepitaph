# T7：墓碑堆砌載入動畫與進度條

> 派單：Claude Code (Opus) | 日期：2026-10-17 | 工人：opencode:openai/gpt-6.1-sol
> claimed-by: （派單時由主 AI 填寫）

## 目標
解開內容時（PBKDF2 每檔 60 萬次，九個檔案要幾秒），現在只有按鈕上的「解開中…」。改成一個 Remotion 動畫：一座墓碑在地平線上從零逐塊堆砌，已放下的石塊數量就是進度條。

## 設計方向（已定，照做）
- 品類是私人墓園，首屏主角在等待時就是這座墓碑。安靜、慢、單色，延續物件的細線描繪與灰階地面，不加任何新顏色、光暈、粒子或文字裝飾。
- 墓碑**坐在地平線上**（底邊對齊 `.horizon` 那條線，即 `top: 43svh`），向上長進黑色天空；水平置中。桌面寬 120px，手機（≤600px）寬 96px，高寬比 4:3（viewBox `0 0 120 160`）。
- 結構（共 15 塊，由下而上、由左到右依序放下）：
  1. 底座 1 行 2 塊：整寬 120，高 14，在 y 146–160。
  2. 碑身 5 行，每行高 18，寬 84（x 18–102），錯縫砌法：第 1、3、5 行 2 塊（各 42），第 2、4 行 3 塊（21、42、21）。共 12 塊。
  3. 碑頂 1 塊：寬 84、高 26 的圓拱（上緣為半徑 42 的弧，可略扁），在碑身最上方。
  - 每塊石之間留 1.5 的縫（灰縫）；石塊四角半徑 1；線寬 1。
- 未放下的石塊：虛線外框（`stroke-dasharray: 2 3`），顏色 `#b5b9b2`，不透明度 0.14，無填色。這就是空的進度條軌道，讓人一眼看出總量。
- 放下的石塊：實線 `#b5b9b2`，填色 `#2a2c2b`。放下動作 8 幀：從上方 10px 落下（ease-out，可在最後 2 幀下沉 1px 再回彈），不透明度 0→1。
- 全部放下後：碑頂中央刻一條水平細線（寬 30，`#8c9088`）8 幀畫出，停 300ms，然後整個載入畫面淡出（200ms）進入現有的「生長中」。
- 地平線下方 18px 置中一行小字：`解開 {已完成} / {總數}`，11px，`letter-spacing: .16em`，顏色 `#92958e`。
- 動效減弱（`prefers-reduced-motion: reduce`）：不落下、不淡出，石塊直接換成實線填色。

## 規格
1. **新增 `web/src/TombLoader.tsx`**：
   - Remotion 組件 `TombBuild`（純 SVG，使用 `useCurrentFrame`、`interpolate`、`Easing`），fps 30，每塊石佔 4 幀起始間隔（第 i 塊在第 `i*4` 幀開始落下），刻線在全部放下後開始；`durationInFrames` 依此算出，匯出常數。
   - 組件 `TombLoader({ done, total })`：用 `@remotion/player` 的 `Player`（與 `Object.tsx` 相同方式，`controls={false}`、不可點擊）播放 `TombBuild`。目標石數 = `Math.floor(done / total * 15)`（`total` 為 0 時視為 0）；播放到目標石塊放下完成的幀就 `pause()`，目標增加時再 `play()`，**只用正常速度播放，不用 seekTo 跳幀**，所以進度一次跳很多時石塊仍逐塊落下。`done === total` 時播到結尾，播完呼叫 `onFinished`。
   - 外層 `<div role="progressbar" aria-label="解開內容" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>`，小字在其中。SVG 本身 `aria-hidden`。
   - 每塊石 `<path>` 或 `<rect>` 帶 `data-stone={i}` 與 `data-laid="true|false"`（依目前幀），給測試數。
2. **`web/src/content.ts`**：`loadContent(password, onProgress?)`，`onProgress(done, total)`；`total = 1（index.json）+ 物件數 + (墓誌銘 ? 1 : 0)`。讀到 index 後回報 `(1, total)`，每解開一個檔案 +1。不改解密邏輯與錯誤類型。
3. **`web/src/App.tsx`**：
   - `busy` 時（手動按「進入」或「記住此裝置」自動解鎖）不再顯示表單，改顯示 `TombLoader`；解開成功後**等 `onFinished`** 才 `setPhase('growing')`（全部放下＋刻線＋停留＋淡出，額外等待不得超過 900ms）。
   - 密碼錯或載入失敗：載入畫面立即消失，回到表單並顯示原本的錯誤訊息、清空與聚焦（現有行為不變）。
   - 「上鎖」與現有 `attempt` 防競態邏輯保持不變；舊的載入未完成時上鎖，不得之後又跳進墓園。
4. **`web/src/style.css`**：載入畫面樣式（定位到地平線、手機尺寸、淡出、reduced-motion）。不改其他既有樣式的視覺。
5. **輕量**：不新增任何 npm 依賴，不加圖片、影片、字型檔；`Player` 已在主包內。`npm run build` 後主 JS gzip 大小比本單前（186692 bytes）增加不超過 4000 bytes。

## 動手前先讀
1. `web/src/App.tsx`、`web/src/content.ts`、`web/src/Object.tsx`（現有 Remotion `Player` 用法）、`web/src/style.css`
2. `web/tests/unlock.spec.ts`、`web/playwright.config.ts`、`web/scripts/build-test.mjs`
3. Remotion 4.0.536 已安裝於 `web/node_modules/remotion`，API 以已安裝版本為準。

## 邊界
1. 只動 `web/src/TombLoader.tsx`（新增）、`web/src/App.tsx`、`web/src/content.ts`、`web/src/style.css`、`web/tests/`。不改 `src/`、`scripts/`、`objects/`、`.github/`、`README.md`、`package.json`、`package-lock.json`。
2. 密鑰不寫進代碼、文件和日誌；測試只用 `test-password` 與現有假內容。
3. 不 git commit / push。截圖不進版本控制。
4. 工單檔案留在 `_tickets/doing/`，不要挪。
5. 不打開資料庫、圖片、壓縮包這類非文字檔。

## 驗收（寫命令，不寫感覺）
1. `cd web && npx tsc --noEmit` → 無錯誤。
2. `cd web && npm test` → 全過。新增單元測試：`loadContent` 的 `onProgress` 依序回報 `(1,total)…(total,total)`，最後一次等於 total。
3. `cd web && npm run build:test && npx playwright test` → 全過。新增 `web/tests/loader.spec.ts`：
   - 用 `page.route` 把 `content/*.enc.json` 每個回應延遲 400ms：按「進入」後 `getByRole('progressbar', { name: '解開內容' })` 可見；`aria-valuenow` 先小於 `aria-valuemax`，之後等於；過程中 `[data-laid="true"]` 數量只增不減；最後進到墓園（「上鎖」可見），進度條消失。
   - 錯密碼：進度條出現後消失，顯示「密碼不正確」，輸入框清空並聚焦。
   - `emulateMedia({ reducedMotion: 'reduce' })` 時仍能進到墓園。
   - 既有測試不得改寬鬆（不加長逾時、不刪斷言）。
4. `cd web && npm run build` 後 `gzip -c dist/assets/index-*.js | wc -c`（PowerShell 可用 `node -e` 以 zlib 計算）→ 貼出數字，≤ 190692。
5. `git status --short` → 只有邊界內的檔案有改動。

## 為什麼這樣驗收
進度條要誠實：石塊只能隨真實解密進度增加，不能假裝；錯密碼和上鎖的既有行為不能因為等動畫而變；載入畫面本身不能讓網站變慢。

## 產出
- `web/src/TombLoader.tsx` 新增、`web/tests/loader.spec.ts` 新增
- `web/src/App.tsx`、`web/src/content.ts`、`web/src/style.css` 修改，`web/tests/` 視需要新增單元測試
