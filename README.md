# myepitaph

個人墓誌銘網站。原文全部加密，repo 只含密文。

## 使用方法

網站：<https://samreproduction.github.io/myepitaph/>（GitHub Pages，push 到 `main` 後約一分鐘更新）

### 瀏覽與解鎖

1. 用手機或電腦打開網站，輸入全站共用密碼，按「進入」。
2. 勾選「記住此裝置 30 天」，同一瀏覽器 30 天內不必再輸入。公用電腦不要勾。
3. 進入後物件依日期逐件生長；滑鼠停留或手機長按讓線條呼吸，點選物件閱讀全文，「歷史」逐版查看舊版本。
4. 離開時按右上角「上鎖」，清除此裝置記住的密碼。

網站完全沒有內容時，密碼畫面會顯示「目前還沒有內容」，此時網站無法解鎖，也進不了編輯器。第一筆內容要先在電腦上封存（見下方「封存第一筆內容」）。

### 一次性設定：GitHub 權杖

手機與電腦的網站編輯器透過 GitHub API 直接提交密文，需要一把細粒度權杖。每個裝置貼一次即可。

1. GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate new token。
2. Repository access 選 **Only select repositories**，只選 `samreproduction/myepitaph`。
3. Permissions → Repository permissions → **Contents: Read and write**，其他全部維持 No access。
4. 設定到期日（例如 90 天）。到期後重新產生一把，在編輯器按「移除權杖」再貼上新的。
5. 在網站解鎖後按「編輯」，把權杖貼進欄位，按「儲存權杖」。權杖會用網站密碼加密後存在這個瀏覽器，不會進 repo。

權杖只出現在 GitHub 頁面與你的瀏覽器。不要把權杖寫進任何檔案、commit 或訊息。

### 在手機或電腦新增、修改物件

1. 解鎖網站，按右上角「編輯」。
2. 新增：在「新增物件」填日期、短名（檔名用，例如 `first-snow`）與文字，按「儲存」。
3. 修改：在「物件清單」展開物件，改文字後按「儲存」；墓誌銘在最上方的欄位修改。
4. 刪除：展開物件按「刪除」。墓園會留下空缺，內容仍保留在 Git 歷史。
5. 看到「已提交，約一分鐘後上線」即完成。按「完成」回到墓園。
6. 若顯示「此內容已在別處更新」，代表另一個裝置先改了同一件，按「完成」後重新整理頁面再改。

### 封存第一筆內容（電腦，Windows PowerShell）

明文只放在 repo 之外，例如 `~\blacktomb-plain\`。物件與墓誌銘分開兩個資料夾，因為兩者封存到不同位置：

    ~\blacktomb-plain\objects\2026-10-17-first.md   物件，檔名格式 YYYY-MM-DD-短名.md
    ~\blacktomb-plain\epitaph\epitaph.md            墓誌銘，第一行是標題

在 repo 根目錄執行：

    $env:BLACKTOMB_PASSWORD = Read-Host '密碼' -MaskInput
    node scripts/seal.mjs seal ~\blacktomb-plain\objects objects
    node scripts/seal.mjs seal ~\blacktomb-plain\epitaph .
    Remove-Item Env:BLACKTOMB_PASSWORD
    git add objects epitaph.md.enc.json
    git commit -m "封存第一筆內容"
    git push

macOS / Linux 用 `read -rs BLACKTOMB_PASSWORD; export BLACKTOMB_PASSWORD` 代替第一行，`unset BLACKTOMB_PASSWORD` 代替 `Remove-Item`。密碼用輸入的方式給，不要寫在命令裡，避免留在終端機歷史。

push 前確認 `git status` 只列出 `.enc.json` 檔。網站更新後就能用同一個密碼解鎖，之後的新增與修改都可以在手機上做。

把密文解回明文（例如復原本地副本）：

    node scripts/seal.mjs open objects ~\blacktomb-plain-restore

## 結構

- `objects/` 每件想法一個加密檔 `YYYY-MM-DD-slug.md.enc.json`
- `epitaph.md.enc.json` 墓誌銘
- `src/crypto.mjs` 加解密（Web Crypto，瀏覽器與 Node 共用）
- `scripts/seal.mjs` 本地命令列工具，加密與解密
- `web/` 網站（Vite + React + Remotion）
- `.github/workflows/pages.yml` 只打包密文並發佈，不持有密碼

## 本地使用

明文保存在 repo 之外，例如 `~/blacktomb-plain/`。

    BLACKTOMB_PASSWORD='...' node scripts/seal.mjs seal ~/blacktomb-plain objects/
    BLACKTOMB_PASSWORD='...' node scripts/seal.mjs open objects/ ~/blacktomb-plain-restore

測試：`node test/roundtrip.mjs`（只用假內容）

## 注意

- 密碼遺失，內容無法復原。
- 更換密碼：執行 `node scripts/rekey.mjs [內容根目錄，預設 .]`，在終端機互動輸入舊密碼、新密碼及再次確認新密碼（不回顯）。進階使用或測試可同時設定 `BLACKTOMB_PASSWORD` 與 `BLACKTOMB_NEW_PASSWORD`。新密碼至少 8 個字元且不可與舊密碼相同；腳本先全部解開，全部成功才寫入暫存密文，再替換原檔；若替換途中失敗，用 `git checkout -- objects epitaph.md.enc.json` 還原後重試。完成後自行 commit 並 push；網站更新後，各裝置要重新輸入密碼並重新貼上權杖。舊歷史版本仍以舊密碼加密，可在歷史面板用「舊密碼」解開。網站本身不更換密碼。

## 第三方授權

- 動畫使用 Remotion（`remotion`、`@remotion/player`，版本固定 4.0.536）。Remotion 不是開源授權：個人、3 人以下公司與非營利組織可免費使用（含商業用途）；超過規模的營利公司需購買 Company License。本站為個人使用，屬免費授權範圍（2026-10-16 依套件內 LICENSE.md 確認）。Remotion 5.0 授權會調整，升級前需重新確認。
