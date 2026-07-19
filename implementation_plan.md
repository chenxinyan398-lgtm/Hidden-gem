# SecretSpace (MVP) 開發實作計畫

這個計畫將根據您確認後的規格書（採用 Email 認證、限制登入後解鎖、使用 Supabase）來進行開發。

## User Review Required (需要您協助與確認的事項)

> [!IMPORTANT]
> 1. **Supabase 專案建立**：請您先至 [Supabase 官網](https://supabase.com/) 建立一個新專案。
> 2. **環境變數**：建立完成後，請將 `Project URL` 與 `anon public` key 複製，並在專案根目錄建立 `.env.local` 檔案填寫：
>    ```env
>    NEXT_PUBLIC_SUPABASE_URL=你的_URL
>    NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_KEY
>    ```
> 3. **專案覆蓋確認**：目前專案目錄中似乎有先前其他的程式碼（`cardit`）。為了開發 SecretSpace，我預計會**覆蓋**或清空原本 `app` 資料夾下的一些頁面來作為新專案的首頁與路由。如果您希望保留舊程式碼，請告知，我會將 SecretSpace 建在特定的子目錄下。

## Open Questions (開放性問題)

> [!QUESTION]
> **資料庫建立方式**：為了最快完成 MVP，我稍後會提供一段 **SQL 語法**，您只需複製貼上到 Supabase 後台的 "SQL Editor" 執行即可快速建好資料表。您覺得這樣可以嗎？

---

## Proposed Changes (預計開發項目)

### 1. 核心依賴套件安裝 (Dependencies)
我們需要安裝以下套件來支援功能：
- `@supabase/supabase-js` 與 `@supabase/ssr`：用於連接後端與處理會員驗證。
- `lucide-react`：用於優美的圖示。
- `qrcode.react`：用於生成 QR Code。
- `html5-qrcode` 或 `@zxing/browser`：用於網頁端呼叫相機掃描 QR Code。

### 2. 資料庫建置 (Supabase SQL)
建立三個核心 Table（會提供 SQL 給您執行）：
- `users`：儲存使用者基本資料。
- `contents`：儲存日記/清單，包含鎖定狀態。
- `access_grants`：紀錄誰可以看什麼內容，包含 QR Code 授權碼。

### 3. 核心頁面開發 (Next.js App Router)
我們將採用適合手機版操作的 UI 佈局 (Bottom Navigation)，包含以下頁面：

- **共用佈局 (`app/layout.tsx`)**：
  - 限制最大寬度 (Max-width: 400px)，在電腦版也會呈現手機尺寸的介面。
  - 加入深色主題 (Dark Mode) 基底。
  - 底部導覽列元件 (BottomNav)。
- **會員認證 (`app/auth/page.tsx`)**：
  - Email / 密碼登入與註冊畫面。
- **私密主頁 (`app/page.tsx`)**：
  - 登入後預設頁面，顯示使用者的「私房清單」與「心情日記」。
- **新增內容 (`app/create/page.tsx`)**：
  - 編輯器頁面，可輸入標題、選擇類型並儲存（預設上鎖）。
- **內容詳情與分享 (`app/content/[id]/page.tsx`)**：
  - 檢視內容。
  - 「產生分享 QR Code」的按鈕，點擊後顯示 QR Code 畫面。
- **掃描解鎖 (`app/scan/page.tsx`)**：
  - 開啟手機鏡頭掃描 QR Code。
  - 掃描成功後打 API 建立授權，並導向該內容的閱讀頁面。

## Verification Plan (驗證計畫)
1. 在本地執行 `npm run dev`，確認網頁可正常開啟並呈現手機版視覺。
2. 進行註冊與登入測試，確認可寫入 Supabase Auth。
3. 建立一筆日記內容，確認資料庫寫入成功且預設為 Locked。
4. 點擊分享產生 QR Code，並透過模擬另一位使用者掃描該網址，確認權限開通且能看到內容。
