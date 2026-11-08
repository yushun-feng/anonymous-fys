# Local private gallery (never published)

本目录是**本机私有**相册脚手架：图片与视频**不会进 git**，也**不会进 GitHub Pages**。仓库只允许提交路径/配置代码，禁止提交任何媒体文件。

## 打开方式

```bash
npm install
npm run dev
```

浏览器打开：

`http://localhost:5173/#/gallery`

（站点软门禁解锁后；默认口令见 `.env.example` / `VITE_SITE_PASSWORD`。）

生产构建 / Pages **不会**挂导航入口，`#/gallery` 在线上只显示「仅本地可用」。

## 媒体根目录

优先级（高 → 低）：

1. 环境变量 `GALLERY_ROOT`（shell 或 `.env.local`）
2. 仓库根目录 gitignored 文件 `.gallery-root.local`（一行路径）
3. 默认：`private/gallery/`（本目录）

### Windows 推荐（本机 `D:\视频`）

在仓库根创建 `.env.local`（已被 gitignore）：

```env
GALLERY_ROOT=D:/视频
```

（推荐正斜杠；若写 `D:\视频` 请勿给值加引号，避免 `\v` 被当成转义。）

或创建 `.gallery-root.local`，内容一行：

```text
D:/视频
```

然后：

```bash
npm run dev
```

终端应出现类似：`[local-gallery] media root: D:\视频 …`

也可用一次性环境变量（PowerShell）：

```powershell
$env:GALLERY_ROOT = 'D:\视频'
npm run dev
```

## 放图 / 放视频

### 默认仓库脚手架

```
private/gallery/albums/<相册名>/*.{jpg,png,webp,gif,heic,avif,mp4,webm,mov,mkv,…}
```

### 外部根目录（如 `D:\视频`）

- 若存在 `albums/` 子目录 → 与上面相同约定。
- 否则：**每个子文件夹 = 一个相册**；根目录下的扁平图片/视频会合成一个「根目录」相册。

支持的扩展名：

- 图片：`jpg` `jpeg` `png` `webp` `gif` `heic` `avif`
- 视频：`mp4` `webm` `mov` `mkv` `m4v` `ogv`（网格用 ffmpeg 缓存帧作预览；点进灯箱用 `<video controls>` 播放）

刷新 `#/gallery` 即可浏览。空相册也会列出，但没有封面。灯箱支持 ←/→ 与按钮翻看相邻图片/视频。

视频预览图缓存在相册内 `.gallery-cache/*.poster.jpg`（仍在 `GALLERY_ROOT` 下，不进 git）。需要本机 **ffmpeg**。

## 粘贴链接下载（Twitter / 抖音）

本机需安装 **yt-dlp**（合并音视频时建议同时有 **ffmpeg**）：

```powershell
winget install yt-dlp.yt-dlp
winget install Gyan.FFmpeg
```

在 `#/gallery` 页面粘贴链接 →「抓取下载」。文件写入媒体根下：

- Twitter/X → `<GALLERY_ROOT>/twitter/`
- 抖音 → `<GALLERY_ROOT>/douyin/`

例如 `GALLERY_ROOT=D:\视频` 时落到 `D:\视频\twitter\` / `D:\视频\douyin\`。下载内容**永不**提交 git / Pages。

也可直接调本地接口：

```powershell
curl -X POST http://localhost:5173/__local/gallery/fetch `
  -H "Content-Type: application/json" `
  -d '{"url":"https://x.com/..."}'
```

## 安全约定（强制）

- **禁止**把 `D:\视频`、本目录或其它本机相册里的媒体 `git add` / commit / push。
- 整个 `private/` 已写入根 `.gitignore`；仅本 README 与 `albums/.gitkeep` 被显式放行跟踪。
- `.gallery-root.local`、`.env.local` 已被 ignore；只提交路径配置代码本身。
- Vite 仅在 `npm run dev` 通过 `/__local/gallery/` **现读现传**；`npm run build` 会拒绝把 `private` 产物打进 `dist`。
- Pages 工作流另有硬门禁，拒绝上传含 `private` / `__local` 媒体路径的产物。
- 不要把本目录复制到 `public/`，也不要用 `import.meta.glob` 引入这里的媒体。
