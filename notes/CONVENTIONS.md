# 笔记约定

本目录是知识库的**唯一事实来源（source of truth）**。根目录下的静态站点仅用于浏览，不反向生成笔记内容。

## 目录结构

```
notes/
├── CONVENTIONS.md          # 本约定
├── cpp/                    # C++ 语言与工程
├── graphics/               # 图形学（渲染、几何、着色等）
└── gpu/                    # GPU / 并行计算 / API
```

- 每个主题一个文件夹：`cpp/`、`graphics/`、`gpu/`。
- 笔记为 Markdown 文件（`.md`），文件名使用短横线小写，例如 `raii-basics.md`。
- 不要把生成物、截图缓存或站点构建产物放进 `notes/`。

## Frontmatter

每篇笔记文件开头必须包含 YAML frontmatter：

```yaml
---
title: 笔记标题
tags: [tag-a, tag-b]
topic: cpp          # 必须是 cpp | graphics | gpu，与所在文件夹一致
updated: 2026-10-31 # ISO 日期 YYYY-MM-DD
---
```

字段说明：

| 字段 | 必填 | 说明 |
|------|------|------|
| `title` | 是 | 显示标题 |
| `tags` | 是 | 字符串数组；浏览页按 tag 筛选 |
| `topic` | 是 | `cpp` / `graphics` / `gpu`，须与父文件夹名一致 |
| `updated` | 是 | 最后更新日期 |
| `source` | 否 | 外部来源 URL（教材章节、YouTube 视频等）；有明确出处时建议填写 |

## 正文建议

- 短小、可检索：一题一文，避免超长杂记。
- 代码块标明语言：`cpp`、`glsl`、`hlsl` 等，站点会做高亮。
- 可在正文中互链其他笔记（相对路径），但站点路由以 frontmatter 为准。

## 公开仓库与隐私

本仓库为 **public**，`notes/` 与站点构建结果会对所有人可见。请勿提交：

- 密钥、token、密码、证书、`.env` 等凭据
- 真实邮箱、电话、住址、证件号等个人标识
- 本机绝对路径（如 `/Users/...`、`C:\Users\...`）或内网地址
- 未公开的公司/项目内部材料

示例笔记只放**通用技术占位**内容。若误提交敏感信息，应轮换凭据，并考虑从 git 历史中清除（仅改当前文件不够）。

## 新增笔记流程

1. 在对应 `notes/<topic>/` 下新建 `.md`。
2. 填齐 frontmatter。
3. 本地 `npm run dev` 确认首页列表与详情页渲染正常。
4. 发布前自查：无隐私/密钥，正文保持技术性、可公开。

