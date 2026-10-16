# myepitaph

個人墓誌銘網站。原文全部加密，repo 只含密文。

## 結構

- `objects/` 每件想法一個加密檔 `YYYY-MM-DD-slug.md.enc.json`
- `epitaph.md.enc.json` 墓誌銘
- `src/crypto.mjs` 加解密（Web Crypto，瀏覽器與 Node 共用）
- `scripts/seal.mjs` 本地命令列工具，加密與解密
- `site/` 網站（之後實作）
- `.github/workflows/pages.yml` 只打包密文並發佈，不持有密碼

## 本地使用

明文保存在 repo 之外，例如 `~/blacktomb-plain/`。

    BLACKTOMB_PASSWORD='...' node scripts/seal.mjs seal ~/blacktomb-plain objects/
    BLACKTOMB_PASSWORD='...' node scripts/seal.mjs open objects/ ~/blacktomb-plain-restore

測試：`node test/roundtrip.mjs`（只用假內容）

## 注意

- 密碼遺失，內容無法復原。
- 更換密碼：執行 `node scripts/rekey.mjs [內容根目錄，預設 .]`，在終端機互動輸入舊密碼、新密碼及再次確認新密碼（不回顯）。進階使用或測試可同時設定 `BLACKTOMB_PASSWORD` 與 `BLACKTOMB_NEW_PASSWORD`。新密碼至少 8 個字元且不可與舊密碼相同；腳本先全部解開，全部成功才寫入暫存密文，再替換原檔；若替換途中失敗，用 `git checkout -- objects epitaph.md.enc.json` 還原後重試。完成後自行 commit 並 push；網站更新後，各裝置要重新輸入密碼並重新貼上權杖。舊歷史版本仍以舊密碼加密，可在歷史面板用「舊密碼」解開。網站本身不更換密碼。
