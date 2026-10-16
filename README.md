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
- 更換密碼：先解開全部，再以新密碼重新加密。
