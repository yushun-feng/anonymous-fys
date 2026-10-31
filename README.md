# anonymous-fys

公开的 **C++ / 图形学 / GPU** 技术笔记仓库（Markdown 为正文，静态站仅供浏览）。

## 原则

- **Markdown 是唯一事实来源。** 所有笔记写在 [`notes/`](./notes/) 下，按主题分文件夹。
- **静态站点只是浏览层。** 根目录的 Vite 前端读取并渲染 `notes/`，不反向生成或改写笔记内容。
- **勿写入隐私内容。** 不要提交密钥、令牌、邮箱、本地绝对路径或个人身份信息；约定见 [`notes/CONVENTIONS.md`](./notes/CONVENTIONS.md)。

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

### 浏览口令（软门禁）

站点在展示笔记列表/正文前会要求输入口令。这是**前端混淆 / 劝退随手访客**，**不是安全鉴权**：口令会打进客户端打包产物，源码与构建结果里都能发现。解锁状态记在 `sessionStorage`，同一浏览器标签会话内刷新不会反复询问。

| 场景 | 如何设置 |
|------|----------|
| 本地开发 | 在 shell 里导出，或在项目根建 `.env` / `.env.local`：`VITE_SITE_PASSWORD=你的口令`，再 `npm run dev` |
| GitHub Actions → Pages | 仓库 **Settings → Secrets and variables → Actions** 新建 Secret，名称为 `VITE_SITE_PASSWORD`，值为你的口令。workflow 构建步骤会把它注入为同名环境变量 |

未设置 `VITE_SITE_PASSWORD` 时，默认口令为 `notes`（方便本地直接打开）。

## GitHub Pages（网页浏览）

项目站地址形态：`https://<owner>.github.io/anonymous-fys/`（当前 owner 下即为 GitHub 项目 Pages URL）。

合并到 `main` 后，Actions 工作流会构建并部署 `dist/`。首次启用步骤：

1. 打开仓库 **Settings → Pages**
2. **Build and deployment → Source** 选择 **GitHub Actions**
3. （可选）在 **Settings → Secrets and variables → Actions** 添加 `VITE_SITE_PASSWORD`（见上）
4. 确认 workflow `Deploy GitHub Pages` 在 `main` 上成功跑通（也可手动 **Actions → Deploy GitHub Pages → Run workflow**）

公开仓库按上述步骤即可发布 Pages。若仓库为 private，则通常需要 Pro / Team / Enterprise。

路由使用 hash（`#/note/...`），在 `/anonymous-fys/` 基路径下笔记链接可正常工作。软门禁不改动 hash 路由与 Pages 基路径。

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

首页按 **topic / tag** 列出笔记；详情页渲染 Markdown，并对 `cpp` / `glsl` / `hlsl` 等做代码高亮。示例笔记仅为通用技术占位，不含个人事务内容。
