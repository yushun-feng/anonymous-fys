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
npm run build    # 产出 dist/
npm run preview  # 预览构建结果
```

## 仓库结构（摘要）

```
notes/           # 知识正文（source of truth）
  cpp/
  graphics/
  gpu/
  CONVENTIONS.md
src/             # 浏览站点源码
index.html
package.json
```

首页按 **topic / tag** 列出笔记；详情页渲染 Markdown，并对 `cpp` / `glsl` / `hlsl` 等做代码高亮。
