# 派單：.\_tickets\dispatch.ps1 <工單名(不含 .md)> <工人名>
# 工人名目前只有 opencode-sol（opencode run --auto -m openai/gpt-6.1-sol）
param([Parameter(Mandatory=$true)][string]$Ticket, [Parameter(Mandatory=$true)][string]$Worker)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$open = Join-Path $root "_tickets\open\$Ticket.md"
$doing = Join-Path $root "_tickets\doing\$Ticket.md"
$rcpDir = Join-Path $root "_receipts"
New-Item -ItemType Directory -Force $rcpDir | Out-Null

switch ($Worker) {
  'opencode-sol' { $model = 'openai/gpt-6.1-sol'; $tool = 'opencode' }
  default { Write-Error "未知工人 $Worker（可用：opencode-sol）"; exit 1 }
}

# 1. 領單（挪動即上鎖）
if (-not (Test-Path -LiteralPath $open)) { Write-Error "找不到工單：$open"; exit 1 }
if (Test-Path -LiteralPath $doing) { Write-Error "doing 裡已有同名工單：$doing"; exit 1 }
try { Move-Item -LiteralPath $open -Destination $doing } catch { Write-Error "領單失敗：$open"; exit 1 }
$ver = (& opencode --version 2>$null | Select-Object -First 1)

# 2. 簽名
$text = [IO.File]::ReadAllText($doing, [Text.Encoding]::UTF8)
$stamp = "> claimed-by: $tool $ver / $model @ " + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
$text = [regex]::Replace($text, '(?m)^> claimed-by:.*$', $stamp.Replace('$','$$'))
[IO.File]::WriteAllText($doing, $text, (New-Object Text.UTF8Encoding($false)))

# 3. 定位（workdir 須在倉庫根目錄之內；不存在就建立）
$m = [regex]::Match($text, '(?m)^> workdir:\s*(.+?)\s*$')
$work = if ($m.Success) { [IO.Path]::GetFullPath((Join-Path $root $m.Groups[1].Value)) } else { $root }
$rootFull = [IO.Path]::GetFullPath($root).TrimEnd('\')
if ($work -ne $rootFull -and -not $work.StartsWith($rootFull + '\', [StringComparison]::OrdinalIgnoreCase)) {
  Move-Item $doing (Join-Path $root "_tickets\blocked\$Ticket.md")
  Write-Error "作業目錄不在倉庫內：$work"; exit 1
}
if (-not (Test-Path -LiteralPath $work)) { New-Item -ItemType Directory -Path $work | Out-Null }
$work = (Resolve-Path -LiteralPath $work).Path

# 4. 只給絕對路徑
$tpl = Join-Path $root "_tickets\receipt-template.md"
$rcp = Join-Path $rcpDir "$Ticket.md"
$prompt = "你是這張工單的執行者，無頭運行，沒有人能回答你的問題。工單：$doing（已替你領好，放在 _tickets/doing/）。倉庫根目錄：$root；作業目錄：$work，先 cd 過去；工單驗收命令裡的相對路徑（例如 cd web）以倉庫根目錄為起點。先完整讀工單，再讀它列出的檔案。嚴格按工單做，不越出範圍。刪資料、刪目錄、強推、對外發消息這類不可逆操作，工單沒寫明就不做，寫進存疑項；查不清的也寫進存疑項，不要猜。不寫「遍歷目錄、逐個改檔案內容」的腳本，要改的檔案逐個點名改；不打開資料庫、圖片、壓縮包這類非文字檔，工單點名要處理的除外。自檢時起的後台進程，收尾前關掉。不要挪工單檔案；工單沒要求就不提交代碼；不合併任何別的分支或 PR。你的 shell 工具在這台 Windows 上可能預設是 cmd，pwsh -Command 包裝常常只回顯命令；某條命令輸出為空或只回顯命令本身，說明沒跑成功，要換方式重跑（例如寫成 %TEMP% 下的臨時腳本再執行，並在回執貼出腳本內容），不能當作證據。完工後按 $tpl 的格式寫回執到 $rcp，用工單的語言。執行引擎一欄寫：$tool $ver / $model。每條驗收都貼出真實命令和原樣輸出，不許編。"

# 5. 脫離會話運行
$log = Join-Path $rcpDir "$Ticket.run.log"
$status = Join-Path $rcpDir "$Ticket.status"
$promptFile = Join-Path $rcpDir "$Ticket.prompt.txt"
[IO.File]::WriteAllText($promptFile, $prompt, (New-Object Text.UTF8Encoding($false)))
Remove-Item -LiteralPath $status -ErrorAction SilentlyContinue
$runner = Join-Path $rcpDir "$Ticket.runner.ps1"
@"
`$ErrorActionPreference = 'Continue'
[Console]::OutputEncoding = [Text.Encoding]::UTF8
`$OutputEncoding = [Text.Encoding]::UTF8
Set-Location -LiteralPath '$work'
`$start = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
`$p = [IO.File]::ReadAllText('$promptFile', [Text.Encoding]::UTF8)
& opencode run --auto -m $model --title '$Ticket' `$p *> '$log'
`$code = `$LASTEXITCODE
`$note = ''
if (-not (Test-Path -LiteralPath '$rcp')) { `$note = 'receipt=missing' }
Set-Content -LiteralPath '$status' -Encoding UTF8 -Value @("exit=`$code", "start=`$start", ('end=' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')), `$note)
"@ | Set-Content -LiteralPath $runner -Encoding UTF8
Start-Process pwsh -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File', ('"' + $runner + '"')) -WindowStyle Hidden
Write-Output "已派出 $Ticket → $Worker ($model)，作業目錄 $work"
Write-Output "日誌：$log"
