審查：Claude Code（主 AI）@ 2026-10-16 18:30（UTC+8）

總評：雲端重跑 build（index 為空）、build:test、vitest 17 過、Playwright 15 過；建置產物不含明文。手機 4 倍降速下解鎖約 3.6 秒，可接受。以下要修 → T2b。

1. 中｜web/src/content.ts loadContent / App.tsx unlock｜沒有任何內容時任何密碼都能「解鎖」，勾選記住還會把這個任意密碼存起來。正式站目前 objects/ 為空，上線後就是這樣。→ 沒有可驗證的密文時不算解鎖。
2. 中｜web/src/content.ts:22 parseFilename｜slug 只接受小寫英數與連字號；Sam 用中文檔名（如 2026-10-16-我的想法.md）時會被靜默跳過，內容不見。→ slug 放寬為任何不含 / 的字元。
3. 中｜web/src/App.tsx、index.html｜仍有測試字樣：「此處留下的，只是測試」、aria-label「依日期排列的測試物件」、面板標題「測試物件文字」、頁面標題「墓園・假內容原型」。
4. 低｜web/src/App.tsx selected?.slug === item.slug｜不同日期同 slug 會一起被標成選中。
5. 低｜密碼閘版面：表單跨在地平線上（線從「密碼」與輸入框之間穿過）；手機焦點框是瀏覽器預設橘色、勾選框是預設白色，與黑灰色調不合。
6. 不改：勾選記住時密碼以明文存 localStorage（設計 Q42 的取捨，已告知 Sam）。JS 577 kB。
