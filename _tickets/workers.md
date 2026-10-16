# 工人配置
> 電腦：Windows 11 Pro，終端：PowerShell 7 | 生成：2026-10-16 | 沿用 DocManager 專案（2026-10-15 用戶已確認：opencode 的 GPT 6.1 sol 寫碼、由 Claude 審核）

## 施工：opencode-sol（openai/gpt-6.1-sol）
- 適合：全部
- 施工命令：`opencode run --auto -m openai/gpt-6.1-sol --title <工單名> <提示>`（在作業目錄內執行）
- 允許看的內容：myepitaph 原始碼與假內容；不給真實明文、密碼或權杖
- 試跑：沿用 DocManager 2026-10-15 T0 通過（同一台電腦、同一工具與模型）

## 審查：Claude Code（主 AI 本身）
- 用戶指定由 Claude 審核，不另設審查工人；審查時逐條重跑驗收、讀 diff、核實

## 腳本
- 派單：`_tickets/dispatch.ps1 <工單名> opencode-sol`
- 等待：輪詢 `_receipts/<工單名>.status` 出現 `exit=`
