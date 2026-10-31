# Visit-log Cloudflare Worker

接收站点 [`src/visit-log.js`](../../src/visit-log.js) 发来的 JSON beacon（时间、path、近似 IP/地点、设备字段），并在边缘补上 **Cloudflare 连接 IP / `request.cf` 地理信息**。

| 方法 | 行为 |
|------|------|
| `OPTIONS` | CORS 预检，`204` |
| `POST` | 解析 JSON（兼容 `Content-Type: text/plain` 的 `sendBeacon`）；有 KV 则写入，否则 `console.log` + `204` |
| `GET` `/` 或 `/recent` | **仅当绑定了 KV**：返回近期条目；可设 `READ_TOKEN` 保护 |

## 1. 创建 Cloudflare 账号

1. 打开 [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up) 注册/登录。  
2. 本机安装依赖并登录 Wrangler：

```bash
cd workers/visit-log
npm install
npx wrangler login
```

浏览器完成 OAuth 后即可部署到你的账号（免费 Workers 额度通常足够个人站点）。

## 2. （可选）KV：持久化 + 查询近期记录

不做这一步时，Worker 仍会 `204` 接收，并在 **Workers → Logs** / `npx wrangler tail` 里看到条目。

```bash
npx wrangler kv namespace create VISIT_LOG
```

把输出的 `id` 填进 [`wrangler.toml`](./wrangler.toml)，取消注释：

```toml
[[kv_namespaces]]
binding = "VISIT_LOG"
id = "粘贴这里的_id"
```

（可选）保护 GET：

```bash
npx wrangler secret put READ_TOKEN
# 查询时：Authorization: Bearer <token>  或  ?token=<token>
```

## 3. 部署 Worker

```bash
cd workers/visit-log
npx wrangler deploy
```

记下输出里的 URL，形如：

`https://anonymous-fys-visit-log.<你的子域>.workers.dev`

本地调试：`npx wrangler dev`，用 curl 测：

```bash
curl -i -X POST http://127.0.0.1:8787/ \
  -H 'Content-Type: text/plain;charset=UTF-8' \
  -d '{"event":"pageview","time":"2026-10-31T00:00:00.000Z","path":"/anonymous-fys/#/","ip":"1.2.3.4","device":{"browser":"Chrome","os":"Linux","mobile":false}}'

# 绑定 KV 后：
curl -s 'http://127.0.0.1:8787/recent?limit=20'
```

## 4. 把 Worker URL 接到 GitHub Pages

1. 打开仓库 **Settings → Secrets and variables → Actions**。  
2. 新建（或更新）Secret：名称 **`VITE_VISIT_LOG_ENDPOINT`**，值为上面的 Worker URL（可带或不带末尾 `/`）。  
3. **重新部署 Pages**：推送到 `main`，或 **Actions → Deploy GitHub Pages → Run workflow**。  

构建时 workflow 会把该 Secret 注入前端；未设置时 `visit-log.js` 为空操作。

本地预览也可在项目根 `.env.local` 写：

```bash
VITE_VISIT_LOG_ENDPOINT=https://anonymous-fys-visit-log.<子域>.workers.dev
```

## 5. 站长如何看日志

- **未绑 KV**：Cloudflare Dashboard → Workers → 本 Worker → **Logs**，或本目录 `npx wrangler tail`。  
- **已绑 KV**：浏览器或 curl 访问 `GET https://<worker>/recent`（若设了 `READ_TOKEN` 需带上）。  
- 每条记录含客户端上报的 `time` / `path` / `ip` / `location` / `device`，以及边缘侧的 `edge.connectingIp` 与 CF geo，便于对照。

## 字段摘要

与前端 beacon 对齐，并附加 `edge`：

- `time`, `path`, `referrer`, `title`, `sessionId`, `event`
- `ip`, `location` / `geo`（浏览器侧近似）
- `device`（userAgent、os、browser、screen、viewport、language、mobile 等）
- `edge.connectingIp`, `edge.country`, `edge.city`, …（Worker / CF）
