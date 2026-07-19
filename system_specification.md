# 系統規格書 (System Specification)

> **說明**：請針對此規格書進行 Review，如有需要細部制定的部分（如特定資料欄位、UI 流程細節），請提出修改建議。確認後，我們將依據此規格書與企劃書進行後續開發。

## 一、 系統架構與技術選型
- **前端 (Web/PWA 適用於手機)**：Next.js (React) + TailwindCSS
  - 考量到目前專案環境已有 Next.js 基礎，採用 Next.js 開發 Responsive Web App (PWA)，可快速在手機端呈現。
- **後端 & 資料庫**：Supabase (PostgreSQL)
  - 建議使用 Supabase 處理會員認證 (Auth) 與資料庫儲存，加速 MVP 開發。
- **相機與 QR Code 套件**：
  - 生成：`qrcode.react`
  - 掃描：使用支援行動裝置瀏覽器的 QR 掃描套件 (如 `html5-qrcode` 或 `react-qr-reader`)。

## 二、 資料庫綱要設計 (Schema Draft)

### 1. Users (使用者)
- `id` (UUID, Primary Key)
- `username` (字串, 顯示名稱)
- `avatar_url` (字串, 頭像)
- `created_at` (時間戳記)

### 2. Contents (私密內容 - 清單/日記)
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key -> Users)
- `type` (列舉: 'LIST', 'DIARY')
- `title` (字串, 標題)
- `body` (文字, 內容/描述)
- `is_locked` (布林值, 預設 true)
- `created_at`, `updated_at` (時間戳記)

### 3. Access_Grants (授權紀錄)
- `id` (UUID, Primary Key)
- `content_id` (UUID, Foreign Key -> Contents)
- `grantee_user_id` (UUID, Foreign Key -> Users, 被授權人)
- `access_token` (字串, 用於 QR Code 的解鎖金鑰)
- `created_at` (時間戳記)

## 三、 核心使用者流程 (User Flows)

### 1. 登入與註冊流程
- 使用者透過 Email/Password 註冊/登入。
- 登入後進入「我的私密主頁」。

### 2. 新增私密內容流程
- 點擊「新增」按鈕，選擇建立「私房清單」或「心情日記」。
- 輸入標題與內容，儲存後狀態預設為「已上鎖 (Locked)」。

### 3. 授權分享流程 (產生 QR Code)
- 在特定內容點擊「分享/授權」按鈕。
- 系統在 `Access_Grants` 建立一筆紀錄，並生成包含 `access_token` 的專屬 URL。
- 前端將該 URL 轉換為 QR Code 顯示於螢幕上。

### 4. 掃描解鎖流程 (解鎖者)
- 朋友在自己的手機上開啟 App 的「掃描」功能，掃描上述 QR Code。
- 系統驗證 `access_token`。
- 若驗證成功，系統更新權限，朋友的畫面上會顯示解鎖動畫，並呈現該私密內容。

## 四、 介面需求 (UI/UX)
- **風格**：極簡、暗色系 (Dark Mode 預設)、帶有神秘感與高級感。
- **關鍵動畫**：掃描成功時的「解鎖 (Unlock)」視覺回饋。
- **導覽列**：底部導覽列 (Bottom Navigation) 包含：首頁 (我的內容)、掃描 (相機)、個人設定。

## 五、 待確認事項 (Open Questions for Review)
1. **認證方式**：MVP 是否先實作簡單的 Email/密碼註冊即可？好的
2. **未註冊者解鎖**：當朋友掃描 QR Code 時，如果他還不是 App 會員，是強迫他註冊才能看，還是提供一個網頁版的臨時預覽？(建議 MVP 先限制登入會員才能解鎖，實作較單純)要限制登入才能作解鎖
3. **後端環境**：是否同意採用 Supabase 作為後端？或是您有其他偏好的服務？好
