# T2（草稿，等 T1 回執後再放進 open/）：瀏覽器解密接入

- 密碼閘取代「進入」按鈕，用 `src/crypto.mjs` 解開 `objects/*.md.enc.json` 與 `epitaph.md.enc.json`，生成畫面。
- 同裝置 30 天保留解鎖。
- 改 `.github/workflows/pages.yml`：先 build `web/`，再把 `web/dist` 與密文打包，保留 `.md` 防呆。
- 驗收：用測試密碼加密的假內容跑 Playwright，錯密碼顯示錯誤、對密碼顯示物件。
