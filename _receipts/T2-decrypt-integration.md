# 回執 T2：瀏覽器解密與密碼閘

> 執行引擎：opencode opencode v2.0.29 / openai/gpt-6.1-sol
> 完成時間：2026-10-16 18:18
> 分支 / 提交 / PR：claude/project-thread-lrhwko / 無 / 無
> 工單：留在 _tickets/doing/ 等待驗收

## 1. 做了什麼
- 正式建置只複製密文與產生索引；測試建置用跨平台 Node 包裝指定測試內容根目錄，沒有新增套件。
- 產生 8 件假物件與假墓誌銘的密文，未產生明文 `.md`。密文留在工作區待主 AI 統一提交，遵守不 commit / push 的邊界。
- 網站從索引並行抓取、解密內容，再維持既有生長與閱讀互動；支援錯密碼、空內容、30 天選擇性保留、自動解鎖與上鎖。所有 localStorage 存取均有例外處理。
- Pages 改建置與發佈 `web/dist`，保留明文防呆並限制 content 內只允許密文和索引；未使用密碼或 secret。
- 新增單元與瀏覽器驗收。第一次瀏覽器執行為 10 過、5 項等待「生長完成」超時；因新增 PBKDF2 解密先於既有約四秒生長動畫，將 expect 等待上限由預設 5 秒改為 15 秒，重跑全部通過，未縮短動畫或略過測試。

## 2. 檔案清單
- `.github/workflows/pages.yml`
- `web/package.json`
- `web/playwright.config.ts`
- `web/scripts/copy-content.mjs`
- `web/scripts/make-fixtures.mjs`
- `web/scripts/build-test.mjs`
- `web/src/content.ts`
- `web/src/crypto.d.ts`
- `web/src/App.tsx`
- `web/src/Object.tsx`（物件型別改用內容模組，互動不變）
- `web/src/style.css`
- `web/tests/cemetery.spec.ts`
- `web/tests/content.test.ts`
- `web/tests/unlock.spec.ts`
- `web/tests/content/objects/2026-01-03-test-one.md.enc.json`
- `web/tests/content/objects/2026-02-12-test-two.md.enc.json`
- `web/tests/content/objects/2026-03-08-test-three.md.enc.json`
- `web/tests/content/objects/2026-04-21-test-four.md.enc.json`
- `web/tests/content/objects/2026-05-16-test-five.md.enc.json`
- `web/tests/content/objects/2026-06-02-test-six.md.enc.json`
- `web/tests/content/objects/2026-07-19-test-seven.md.enc.json`
- `web/tests/content/objects/2026-08-30-test-eight.md.enc.json`
- `web/tests/content/epitaph.md.enc.json`
- `_receipts/T2-decrypt-integration.md`（本回執）

## 3. 驗收證據（工單裡每條檢查對應一段）

以下命令均記錄實際執行方式。`workdir=web` 表示 shell 工具的工作目錄為 `E:\My AI Project\myepitaph\.claude\worktrees\sleepy-yonath-8ed6b1\web`，其餘在倉庫根目錄執行，等同工單要求先從倉庫根 `cd web`。

### 3.0 產生測試密文
命令（workdir=web）：`node scripts/make-fixtures.mjs`
```text
Created 8 encrypted objects and encrypted epitaph (no plaintext files).
```

### 3.1 正式建置與空索引
命令（workdir=web）：`npm run build`
```text

> myepitaph-prototype@0.0.0 build
> tsc --noEmit && vite build && node scripts/copy-content.mjs

vite v7.3.7 building client environment for production...
transforming...
node_modules/@remotion/player/dist/esm/index.mjs (1:0): Module level directives cause errors when bundled, "use client" in "node_modules/@remotion/player/dist/esm/index.mjs" was ignored.
✓ 37 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.47 kB │ gzip:   0.33 kB

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
dist/assets/index-BuWQFVrZ.css    3.91 kB │ gzip:   1.56 kB
dist/assets/index-DZFfNfg7.js   576.82 kB │ gzip: 183.64 kB
✓ built in 1.97s
```

命令：`type web\dist\content\index.json`
```text
{"epitaph":null,"objects":[]}
```

曾嘗試 `node -e "console.log(require('node:fs').readFileSync('web/dist/content/index.json','utf8').trim())"`，工具僅回報 `(no output)`，依要求不當作證據，改用以上 `type` 得到實際內容。

### 3.2 測試建置與九個密文索引
命令（workdir=web）：`npm run build:test`
```text

> myepitaph-prototype@0.0.0 build:test
> node scripts/build-test.mjs


> myepitaph-prototype@0.0.0 build
> tsc --noEmit && vite build && node scripts/copy-content.mjs

vite v7.3.7 building client environment for production...
transforming...
node_modules/@remotion/player/dist/esm/index.mjs (1:0): Module level directives cause errors when bundled, "use client" in "node_modules/@remotion/player/dist/esm/index.mjs" was ignored.
✓ 37 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.47 kB │ gzip:   0.33 kB

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
dist/assets/index-BuWQFVrZ.css    3.91 kB │ gzip:   1.56 kB
dist/assets/index-DZFfNfg7.js   576.82 kB │ gzip: 183.64 kB
✓ built in 1.92s
```

命令：`type web\dist\content\index.json`
```text
{"epitaph":"epitaph.md.enc.json","objects":["2026-01-03-test-one.md.enc.json","2026-02-12-test-two.md.enc.json","2026-03-08-test-three.md.enc.json","2026-04-21-test-four.md.enc.json","2026-05-16-test-five.md.enc.json","2026-06-02-test-six.md.enc.json","2026-07-19-test-seven.md.enc.json","2026-08-30-test-eight.md.enc.json"]}
```

### 3.3 建置產物不含假文字或明文 Markdown
命令：`node C:\Users\User\AppData\Local\Temp\opencode\t2-verify-dist.cjs`
```text
Fake plaintext occurrences: 0
Markdown files: 0
```

臨時腳本 `C:\Users\User\AppData\Local\Temp\opencode\t2-verify-dist.cjs` 全文（只讀取驗收指定的建置產物，不修改任何檔案）：
```javascript
const fs = require('node:fs');
const path = require('node:path');
let matches = 0;
let markdown = 0;
function inspect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) inspect(filename);
    else {
      matches += fs.readFileSync(filename, 'utf8').split('這是一段用來展示的假文字').length - 1;
      if (entry.name.endsWith('.md')) markdown++;
    }
  }
}
inspect('web/dist');
console.log(`Fake plaintext occurrences: ${matches}`);
console.log(`Markdown files: ${markdown}`);
if (matches || markdown) process.exitCode = 1;
```

### 3.4 單元測試
命令（workdir=web）：`npm test`
```text

> myepitaph-prototype@0.0.0 test
> vitest run


 RUN  v4.1.12 E:/My AI Project/myepitaph/.claude/worktrees/sleepy-yonath-8ed6b1/web


 Test Files  2 passed (2)
      Tests  17 passed (17)
   Start at  18:16:50
   Duration  765ms (transform 88ms, setup 0ms, import 139ms, tests 591ms, environment 0ms)

```

新增測試包括合格／不合格檔名、無效日期、真實測試密文解開對應文字、錯密碼辨識、全部內容載入與排序、空索引。

### 3.5 瀏覽器完整測試（調整等待上限後的全量重跑）
命令（workdir=web）：`npx playwright test`
```text
[WebServer] (node:42968) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] node_modules/@remotion/player/dist/esm/index.mjs (1:0): Module level directives cause errors when bundled, "use client" in "node_modules/@remotion/player/dist/esm/index.mjs" was ignored.
[WebServer] 
[WebServer] (!) Some chunks are larger than 500 kB after minification. Consider:
[WebServer] - Using dynamic import() to code-split the application
[WebServer] - Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
[WebServer] - Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
[WebServer] (node:22476) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)

Running 15 tests using 8 workers

(node:42636) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:39876) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:42696) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:39344) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:40352) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:41480) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:39992) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:42356) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
  ok  8 tests\cemetery.spec.ts:132:1 › 六種簡筆畫同頁展示（展示頁與截圖僅存 test-results） (903ms)
  ok  4 tests\cemetery.spec.ts:115:1 › 出現時由底部部件往上描線，懸停不重播生長 (4.8s)
  ok  9 tests\unlock.spec.ts:28:1 › 記住三十天，重整直接解鎖；上鎖刪記錄，重整仍在密碼閘 (3.9s)
  ok 11 tests\unlock.spec.ts:55:3 › 已記住記錄 expired 時清除並回到密碼閘 (1.6s)
  ok 12 tests\unlock.spec.ts:55:3 › 已記住記錄 incorrect 時清除並回到密碼閘 (1.0s)
  ok 13 tests\unlock.spec.ts:55:3 › 已記住記錄 malformed 時清除並回到密碼閘 (553ms)
  ok  5 tests\unlock.spec.ts:11:1 › 錯密碼顯示錯誤、清空與聚焦，沒有物件；正確密碼解出八件與面板 (8.8s)
  ok  7 tests\cemetery.spec.ts:11:3 › 390×844 墓園完整互動 (9.0s)
  ok  1 tests\cemetery.spec.ts:99:1 › 減少動態時懸停不播放循環 (9.3s)
  ok 14 tests\unlock.spec.ts:68:1 › 空內容解鎖無物件與墓誌銘 (1.7s)
  ok  2 tests\cemetery.spec.ts:11:3 › 1440×900 墓園完整互動 (10.1s)
  ok 10 tests\unlock.spec.ts:45:1 › 不勾記住，重整回到密碼閘 (5.7s)
  ok  6 tests\cemetery.spec.ts:66:1 › 觸控長按播放但不開面板，之後短按另一件物件開面板 (10.8s)
  ok 15 tests\unlock.spec.ts:77:1 › localStorage 不可用仍可解鎖與上鎖 (2.2s)
  ok  3 tests\cemetery.spec.ts:49:1 › 桌面懸停播放循環，移開回到靜止 (15.9s)

  15 passed (23.8s)
```

### 3.6 YAML 檢查替代方式
由於本環境 `node -e` 的引號命令沒有可靠輸出，使用具相同 `require('yaml')` 檢查的臨時腳本；未使用被排除的 npx js-yaml 方法。

命令：`node C:\Users\User\AppData\Local\Temp\opencode\t2-check-yaml.cjs`
```text
require('yaml'): MODULE_NOT_FOUND
Fallback: include the complete pages.yml in the receipt as specified by acceptance 6.
```

臨時腳本 `C:\Users\User\AppData\Local\Temp\opencode\t2-check-yaml.cjs` 全文：
```javascript
try {
  require('yaml');
  console.log('yaml is available');
} catch (error) {
  console.log(`require('yaml'): ${error.code}`);
  console.log('Fallback: include the complete pages.yml in the receipt as specified by acceptance 6.');
}
```

依驗收 6 貼出修改後 `.github/workflows/pages.yml` 全文：
```yaml
name: Deploy tomb

# Packages ciphertext only. This workflow has no secrets and never sees the password.
on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deploy.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: web/package-lock.json
      - run: npm ci
        working-directory: web
      - run: npm run build
        working-directory: web
      - name: Assemble site
        run: |
          # Hard guard: refuse to deploy anything that looks like plaintext.
          if find web/dist -name '*.md' | grep -q .; then
            echo "plaintext .md found in web/dist, aborting" && exit 1
          fi
          # Content may contain ciphertext and the generated JSON index only.
          if find web/dist/content -type f ! -name '*.enc.json' ! -name 'index.json' | grep -q .; then
            echo "unexpected content file found in web/dist/content, aborting" && exit 1
          fi
      - uses: actions/upload-pages-artifact@v3
        with:
          path: web/dist
      - id: deploy
        uses: actions/deploy-pages@v4
```

### 3.7 後台清理確認
Playwright 管理的 webServer 隨測試退出；未另起持續運行的後台命令。以 TCP 連線確認 preview 已不在監聽。

命令：`node C:\Users\User\AppData\Local\Temp\opencode\t2-check-cleanup.cjs`
```text
Completed at: 2026-10-16 18:18:24
Preview port 4173: ECONNREFUSED
```

臨時腳本 `C:\Users\User\AppData\Local\Temp\opencode\t2-check-cleanup.cjs` 全文：
```javascript
const net = require('node:net');
console.log(`Completed at: ${new Date().toLocaleString('sv-SE', { hour12: false })}`);
const socket = net.connect({ host: '127.0.0.1', port: 4173 });
socket.on('connect', () => {
  console.log('Preview port 4173 is still open.');
  socket.destroy();
  process.exitCode = 1;
});
socket.on('error', (error) => {
  console.log(`Preview port 4173: ${error.code}`);
  if (error.code !== 'ECONNREFUSED') process.exitCode = 1;
});
```

## 4. 風險與存疑
- 未實際對外發佈或執行 GitHub Actions；YAML 依驗收指定替代方式貼全文，未聲稱通過 YAML parser。
- 本機 Node 為 v24.18.0；工作流指定 Node 22，未另裝 Node 22 實跑。套件沒有更動、沒有新增依賴。
- 既有 Remotion 的 `use client`、大於 500 kB bundle，以及測試環境顏色設定警告仍存在；未擴大工單範圍處理。
- 依規格勾選記住裝置會在該裝置 localStorage 留存密碼；未勾選不留存，上鎖清除。空索引沒有可驗證的密文，任何輸入均可進入空畫面，符合工單空內容要求。
- 收尾 `web/dist` 為測試建置的假內容密文，且 dist 與截圖目錄均已被既有 `.gitignore` 排除；正式發佈會重新以預設倉庫根來源建置。
- 初始已存在的工單領取變動（`_tickets/open/T2-decrypt-integration.md` 刪除狀態、`_tickets/doing/T2-decrypt-integration.md` 未追蹤狀態）未觸動。沒有移動工單、提交、推送、合併或對外發消息。
