# Immich 教學撰寫規格

- 讀者：會用手機拍照、會操作網頁，但不需要會架伺服器或寫程式。
- 語言：台灣繁體中文；以「你」稱呼讀者，不使用 emoji。
- 每章：8–12 個 section；每個 section 要有 `id`、`data-nav`，每個 h2 要有已定義的 `data-icon`。
- 元件：只使用 `steps`、`callout`、`data-table`、`code-block`、`details.faq`、`figure.shot`。
- 安全：帳號、密碼、hostname、IP、分享連結、access token、伺服器路徑與完整 log 都視為敏感資料，寫入前必須遮罩或改寫。
- 變更：管理員設定（使用者、儲存、jobs）會影響整個伺服器；必須明確說明每一步的影響範圍，且不引導讀者刪除、停用或重設沒有把握的項目。
- 截圖：Browserless 只做唯讀瀏覽，不新增／刪除使用者、不改儲存、不跑 jobs、不刪相片或分享。圖片須先人工檢查與遮罩（帳號、人臉以外的可辨識資訊）。
- 事實來源：優先使用 Immich 官方文件（immich.app/docs）與官方 GitHub，其次才是實測結果；版本目前為 v2.5.x，介面改版時以最新官方文件為準。

修改後執行：

```bash
node scripts/build_nav.js
node scripts/build_nav.js --check
node scripts/check_links.js
```
