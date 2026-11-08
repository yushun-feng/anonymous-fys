# Local stockings gallery (never published)

本目录是**本机私有**相册脚手架：照片不会进 git，也不会进 GitHub Pages。

## 打开方式

```bash
npm install
npm run dev
```

浏览器打开：

`http://localhost:5173/#/stockings`

（站点软门禁解锁后；默认口令见 `.env.example` / `VITE_SITE_PASSWORD`。）

生产构建 / Pages **不会**挂导航入口，`#/stockings` 在线上只显示「仅本地可用」。

## 放图

```
private/stockings/albums/<相册名>/*.jpg|png|webp|gif|heic|avif
```

示例：

```
private/stockings/albums/demo/
  a.jpg
  b.png
```

刷新 `#/stockings` 即可按相册浏览。空相册也会列出，但没有封面。

## 安全约定

- 整个 `private/` 已写入根 `.gitignore`；仅本 README 与 `albums/.gitkeep` 被显式放行跟踪。
- 媒体文件、其它子路径一律不推送。
- Vite 仅在 `npm run dev` 通过 `/__local/stockings/` 提供读取；`npm run build` 会拒绝把 `private` 产物打进 `dist`。
- 不要把本目录复制到 `public/`，也不要用 `import.meta.glob` 引入这里的图片。
