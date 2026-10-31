# anonymous-fys

个人 **C++ / 图形学 / GPU** 知识库。

## 原则

- **Markdown 是唯一事实来源。** 所有笔记写在 [`notes/`](./notes/) 下，按主题分文件夹。
- **静态站点只是浏览层。** 根目录的 Vite 前端读取并渲染 `notes/`，不反向生成或改写笔记内容。
- 写作约定见 [`notes/CONVENTIONS.md`](./notes/CONVENTIONS.md)（目录结构、YAML frontmatter、新增流程）。

## 本地预览

```bash
npm install
npm run dev
```

浏览器打开终端提示的本地地址（默认 `http://localhost:5173`）。

```bash
npm run build    # 产出 dist/（资源前缀为 /anonymous-fys/，与 Pages 一致）
npm run preview  # 预览构建结果
```

## GitHub Pages（网页浏览）

期望地址：<https://yushun-feng.github.io/anonymous-fys/>

合并到 `main` 后，Actions 工作流会构建并部署 `dist/`。首次启用步骤：

1. 打开仓库 **Settings → Pages**
2. **Build and deployment → Source** 选择 **GitHub Actions**
3. 确认 workflow `Deploy GitHub Pages` 在 `main` 上成功跑通（也可手动 **Actions → Deploy GitHub Pages → Run workflow**）

> **私有仓库限制：** GitHub Pages 用于私有仓库通常需要 **GitHub Pro / Team / Enterprise** 等付费计划。免费个人账号下的私有仓可能无法发布 Pages；公开仓库或对应付费计划可用。

路由使用 hash（`#/note/...`），在 `/anonymous-fys/` 基路径下笔记链接可正常工作。

## 仓库结构（摘要）

```
notes/           # 知识正文（source of truth）
  cpp/
  graphics/
  gpu/
  CONVENTIONS.md
src/             # 浏览站点源码
.github/workflows/deploy-pages.yml
index.html
package.json
```

首页按 **topic / tag** 列出笔记；详情页渲染 Markdown，并对 `cpp` / `glsl` / `hlsl` 等做代码高亮。
