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

### 浏览口令

站点在展示笔记列表/正文前会要求输入口令。同一浏览器标签会话内解锁后刷新不会反复询问。

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

路由使用 hash（`#/note/...`、`#/solar`；旧 `#/moon` 会重定向到 `#/solar`），在 `/anonymous-fys/` 基路径下笔记与太阳系展台链接可正常工作。

解锁浏览后，右侧为可拖拽调节宽度的 **代码 Playground**：JS/TS 在沙箱 iframe 中运行（TS 经 Sucrase 浏览器内转译）；C++ 通过嵌入/跳转 [Compiler Explorer（Godbolt）](https://godbolt.org/) 执行（本站无本地 C++ 后端）。笔记中的 JS/TS/C/C++ 代码块可点「→ Playground」发送到面板。窄屏默认收起，可用右下角按钮展开。

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

站点另提供 **太阳系** 三维展台（Three.js）：太阳与八大行星（含地球旁月球、土星环），双语名称标签随 3D 位置跟踪；首页有压缩预览，完整页路由为 `#/solar`。支持拖拽旋转与滚轮/捏合缩放；无 WebGL 时显示降级提示而不影响笔记浏览。轨道半径与天体尺寸为可读性示意，非真实比例。

## 太阳系纹理

本地资源目录：[`public/textures/solar/`](./public/textures/solar/)。

| 文件 | 来源 |
|------|------|
| `sun.jpg`、`mercury.jpg`、`venus.jpg`、`mars.jpg`、`jupiter.jpg`、`saturn.jpg`、`uranus.jpg`、`neptune.jpg`、`saturn-ring.jpg`、`saturn-ring-alpha.gif` | [threex.planets](https://github.com/jeromeetienne/threex.planets) 示例贴图（多为 NASA 公开行星影像改编） |
| `earth.jpg` | [three.js 示例](https://github.com/mrdoob/three.js/blob/r170/examples/textures/planets/earth_atmos_2048.jpg) |
| `moon.jpg` | [three.js 示例月球贴图](https://github.com/mrdoob/three.js/blob/r170/examples/textures/planets/moon_1024.jpg)（NASA 公开月球影像） |

NASA 影像一般可按 NASA 媒体使用政策用于非商业/教育展示；仓库仅做浏览展台，未宣称对原始数据拥有版权。
