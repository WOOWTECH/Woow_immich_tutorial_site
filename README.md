# Immich 自架相簿指南

12 章繁體中文教學，帶使用者透過 WoowTech 自架的 [Immich](https://immich.app/) 相簿服務，把照片與影片集中備份在自己家：從登入、上傳、時間軸、相簿、AI 搜尋、分享，一路到行動 App 備份、管理員設定、安全與排錯。

**規劃網址：<https://immich-guide.woowtech.io/>**

## 安全範圍

- 截圖採唯讀瀏覽，不在指定 Immich 伺服器新增／刪除使用者、修改儲存、執行 jobs、刪除相片或建立分享。
- 圖片必須遮罩帳號、hostname、IP、分享連結、token 與可辨識的人臉／地點資訊。
- 教學不鼓勵把相簿、分享連結或管理介面公開到網際網路，強調最小暴露。

## 維護

`chapters.json` 是章節、導覽、SEO 與 sitemap 的單一來源：

```bash
node scripts/build_nav.js
node scripts/check_links.js
```

本站內容以 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.zh-hant) 授權，保留 WoowTech 出處。
