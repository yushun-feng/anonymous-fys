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

### 访客访问记录（IP / 时间 / 地点 / 设备）

GitHub Pages **不会**向仓库所有者提供可查询的访问者真实 IP 日志。本站用可选的前端 beacon +（可选）隐私向分析产品来补齐「谁在何时从哪类设备访问」：

| 字段 | 来源 |
|------|------|
| 时间、path/hash、referrer | 浏览器 |
| userAgent、platform/OS、browser、screen/viewport、language、mobile | 浏览器（见 `src/visit-log.js`） |
| 近似 IP / 城市国家 | 浏览器请求公共 geo API（默认 `ipapi.co/json/`，可关） |
| **边缘真实 IP** | 需 Cloudflare（或同类）代理日志，或你的接收端用连接方 `remoteAddr` 记账 |

**推荐配置（二选一或组合）：**

1. **JSON beacon（细字段，含设备 + 近似 geo）**  
   - 本地 / Secret：`VITE_VISIT_LOG_ENDPOINT=https://你的接收地址`  
   - 页面加载与 hash 路由变化时 `POST` 正文为 JSON 字符串（`Content-Type: text/plain`，避免 CORS 预检；接收端按 JSON 解析 body）。  
   - **推荐接收端**：本仓库 [`workers/visit-log/`](./workers/visit-log/)（Cloudflare Worker：CORS POST、可选 KV、`GET /recent`；步骤见该目录 README：`npx wrangler deploy` → 把 Worker URL 设为 Pages Secret `VITE_VISIT_LOG_ENDPOINT` → 重新部署 Pages）。也可 Pipedream / Make / n8n / [webhook.site](https://webhook.site)。  
   - 关闭近似 IP：`VITE_VISIT_LOG_GEO=0`。

2. **隐私向仪表盘（汇总 PV，不自带「逐条 IP」）**  
   - Umami：`VITE_UMAMI_SRC` + `VITE_UMAMI_WEBSITE_ID` → 在 Umami 控制台看访问。  
   - Plausible：`VITE_PLAUSIBLE_DOMAIN` → [Plausible](https://plausible.io) 站点报表。  
   - GoatCounter：`VITE_GOATCOUNTER_CODE` → `https://<code>.goatcounter.com` 报表。

未配置上述变量时，模块为空操作，不影响浏览。

**站长如何查看日志：**

- Beacon：打开你配置的 webhook / Worker / 自动化工具的投递历史或数据库。  
- Umami / Plausible / GoatCounter：登录对应控制台。  
- 若要 **服务器侧真实 IP**：把 Pages 挂到 Cloudflare（橙云代理）看 Analytics / Logpush，或让 `VITE_VISIT_LOG_ENDPOINT` 的服务端记录请求 IP（可与 body 里的近似 geo 对照）。

完整变量列表见 [`.env.example`](./.env.example)；Pages 构建通过 Actions Secrets 注入（见 workflow）。

## GitHub Pages（网页浏览）

项目站地址形态：`https://<owner>.github.io/anonymous-fys/`（当前 owner 下即为 GitHub 项目 Pages URL）。

合并到 `main` 后，Actions 工作流会构建并部署 `dist/`。首次启用步骤：

1. 打开仓库 **Settings → Pages**
2. **Build and deployment → Source** 选择 **GitHub Actions**
3. （可选）在 **Settings → Secrets and variables → Actions** 添加 `VITE_SITE_PASSWORD`、以及访客记录相关 `VITE_VISIT_LOG_*` / Umami·Plausible·GoatCounter 变量（见上「访客访问记录」）
4. 确认 workflow `Deploy GitHub Pages` 在 `main` 上成功跑通（也可手动 **Actions → Deploy GitHub Pages → Run workflow**）

公开仓库按上述步骤即可发布 Pages。若仓库为 private，则通常需要 Pro / Team / Enterprise。

路由使用 hash（`#/note/...`、`#/portal`、`#/shader`；旧 `#/solar` / `#/moon` 会重定向到 `#/portal`），在 `/anonymous-fys/` 基路径下笔记与展台链接可正常工作。

解锁浏览后，右侧为可拖拽调节宽度的 **代码 Playground**（CodeMirror 语法高亮）：JS/TS 在沙箱 iframe 中一键运行（TS 经 Sucrase 浏览器内转译）；C++ 默认在浏览器内用 [browsercc](https://github.com/BertalanD/browsercc)（Clang/LLD WASM → WASI）本地编译运行，stdout/stderr 显示在面板输出区（首次需从 CDN 拉取约 90MB 工具链，之后可缓存）。可选「远程备用」走 [Wandbox](https://wandbox.org/)，或新标签打开 [Compiler Explorer](https://godbolt.org/)。笔记中的 JS/TS/C/C++ 代码块可点「→ Playground」发送到面板。窄屏默认收起，可用右下角按钮展开。

## 仓库结构（摘要）

```
notes/           # 知识正文（source of truth）
  cpp/
  graphics/
  gpu/
  CONVENTIONS.md
src/             # 浏览站点源码
workers/visit-log/  # 可选：Cloudflare Worker 接收访客 JSON beacon
.github/workflows/deploy-pages.yml
index.html
package.json
```

首页按 **topic / tag** 列出笔记；详情页渲染 Markdown，并对 `cpp` / `glsl` / `hlsl` 等做代码高亮。示例笔记仅为通用技术占位，不含个人事务内容。

站点另提供 **Portal** 三维展台（Three.js）：程序化低/中模风格的合作机器人 **Atlas** 与 **P-body**（外形灵感来自 Portal 2，未使用 Valve 游戏资产或贴图），带 idle / 张望动画；首页有压缩预览，完整页路由为 `#/portal`。支持拖拽旋转与滚轮/捏合缩放；无 WebGL 时显示降级提示而不影响笔记浏览。
