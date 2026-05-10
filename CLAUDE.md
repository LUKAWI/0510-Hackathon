# 学科知识整合智能体 · 项目开发规则

## 项目概述

学科知识整合智能体：加载多本教材（PDF/Markdown/DOCX），自动构建跨教材知识图谱，提供 RAG 问答与多轮对话能力。用户提问后，系统检索相关教材片段，结合知识图谱中的概念关系生成整合性回答，并注明出处。

核心价值：帮助学习者跨越单一教材边界，建立学科全局视角。

---

## 技术栈

### 前端

React 18+ · TypeScript strict · Vite · Tailwind CSS · shadcn/ui · AntV G6（知识图谱可视化）

### 后端

Python FastAPI · 通义千问 API（大模型推理 + Embedding） · LangChain（文档加载/文本分割/RAG 链路）

### 数据库

Neon PostgreSQL + pgvector（向量存储与检索） · Drizzle ORM（前端侧 schema 管理）

### 部署

前后端分离部署（Vercel 前端 + 云服务器/容器后端）。API Key 和数据库连接串通过环境变量注入，不写代码里。

---

## 核心功能（P0 必须实现）

| 编号 | 功能 | 说明 |
|------|------|------|
| F1 | 多格式教材加载 | 支持 PDF、Markdown、DOCX，解析后按章节切分存储 |
| F2 | 知识图谱构建 | 自动提取概念与关系，生成节点-边结构，支持增量更新 |
| F3 | 跨教材知识整合 | 同一概念在不同教材中的表述关联与融合 |
| F4 | RAG 问答 | 基于向量检索 + 图谱上下文生成回答，注明教材出处 |
| F5 | 多轮对话 | 维护会话上下文，支持追问和引用回溯 |
| F6 | 知识图谱可视化 | 前端使用 AntV G6 展示概念节点与关系边，支持交互探索 |

### API 响应格式

```typescript
interface RAGResponse {
  answer: string;
  sources: Array<{
    book: string;
    chapter?: string;
    snippet: string;
  }>;
  graphContext?: {
    nodes: Array<{ id: string; label: string; type: string }>;
    edges: Array<{ source: string; target: string; relation: string }>;
  };
}
```

---

## 必须遵守

### 通用

- 先做 MVP，让功能正常，再做优化
- 提交前 `npm run build` 通过；Python 侧 `ruff check` 通过

### 前端（React/TypeScript）

- 所有 `.ts`/`.tsx` 通过 strict 检查，零 `any`
- 组件用 `function` 声明，Props 类型单独导出
- 表单用 React Hook Form + Zod，不手写状态管理
- 样式用 Tailwind 语义间距，不写裸 `px`
- 涉及数据加载的组件必须覆盖三种状态：加载中（骨架屏）、空数据（提示）、错误（提示+重试）
- 知识图谱渲染使用 AntV G6，大图场景开启 Web Worker 布局

### 后端（Python/FastAPI）

- 使用类型注解，`mypy` 检查通过
- 异步处理耗时操作（文档解析、Embedding 生成）
- 错误统一用 FastAPI 异常处理器返回标准格式
- 数据库查询走 Drizzle（前端 schema）或直接 SQL（后端），向量检索用 pgvector `<=>` 运算符

### 回答质量

- 回答必须基于教材内容 + 注明出处（书名、章节、原文片段）
- 末尾附免责声明："以上内容整合自教材原文，仅供参考学习，如有疑问请查阅原书"
- 引用知识图谱关系时需说明概念间的关联路径

---

## 严格禁止

### 代码层面

- `any` 类型（TypeScript）或无类型注解的函数（Python）
- 硬编码密钥 / 连接串 / API 地址
- `useEffect` 做数据请求（用 React Query 或 Server Actions）
- `useState` 管理表单（用 React Hook Form）
- 内联样式 `style={{...}}`
- 直接提交 `main` 分支
- 引入独立向量数据库（统一用 pgvector）

### 业务层面

- 编造教材中不存在的知识点或引用
- 伪造或篡改教材出处
- 在未检索到相关内容时强行生成"权威"回答

---

## 项目结构

```
hackathon/
├── src/                          # 前端源码
│   ├── components/
│   │   ├── ui/                   # shadcn/ui 基础组件
│   │   ├── chat/                 # 对话界面组件
│   │   ├── graph/                # 知识图谱可视化组件（AntV G6）
│   │   └── upload/               # 教材上传组件
│   ├── pages/                    # 页面路由
│   ├── hooks/                    # 自定义 hooks
│   ├── lib/                      # 工具函数、API 客户端
│   ├── types/                    # 全局类型定义
│   └── styles/                   # Tailwind 配置
├── api/                          # 后端源码
│   ├── main.py                   # FastAPI 入口
│   ├── routers/                  # 路由模块
│   │   ├── chat.py               # RAG 问答接口
│   │   ├── document.py           # 文档上传/管理接口
│   │   └── graph.py              # 知识图谱查询接口
│   ├── services/                 # 业务逻辑
│   │   ├── embedding.py          # Embedding 生成（通义千问）
│   │   ├── graph_builder.py      # 图谱构建
│   │   └── rag_chain.py          # RAG 链路
│   ├── core/                     # 配置、数据库连接
│   └── schemas/                  # Pydantic 数据模型
├── drizzle/                      # 数据库 migration
├── public/                       # 静态资源
├── CLAUDE.md                     # 本文件
└── package.json
```

---

## 环境变量

所有敏感配置通过环境变量注入，项目根目录提供 `.env.example` 作为模板：

```bash
# 通义千问
DASHSCOPE_API_KEY=sk-xxxxxxxxxxxx

# Neon PostgreSQL
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# FastAPI 后端
BACKEND_URL=http://localhost:8000

# 可选
VECTOR_DIM=1536                    # Embedding 维度，默认 1536
CHUNK_SIZE=512                     # 文本切分长度
CHUNK_OVERLAP=64                   # 切分重叠长度
```

规则：
- `.env` 文件不提交到 Git（已在 `.gitignore` 中）
- 前端通过 Vite `import.meta.env` 访问 `VITE_` 前缀变量
- 后端通过 `os.environ` 或 `pydantic-settings` 读取
- 部署时在 Vercel / 容器平台的环境变量面板配置

---

## 性能要求

| 指标 | 目标值 |
|------|--------|
| 首屏加载（LCP） | < 2.5s |
| RAG 问答响应（首 token） | < 3s |
| 知识图谱渲染（500 节点） | < 1s |
| 文档上传处理（50 页 PDF） | < 30s |
| 向量检索（Top-K=5） | < 200ms |

优化手段：
- 图谱布局使用 Web Worker 避免阻塞主线程
- Embedding 请求批量处理，减少 API 调用次数
- 向量检索走 HNSW 索引（pgvector）
- 前端路由懒加载，按需分割代码块

---

## 安全要求

- 所有用户输入在渲染前做 XSS 转义
- 文件上传限制类型（PDF/MD/DOCX）和大小（单文件 < 20MB）
- API 接口添加速率限制（Rate Limiting），防止滥用
- 通义千问 API Key 仅在后端使用，不暴露给前端
- 数据库连接使用 SSL，连接串中包含 `sslmode=require`
- 敏感操作（删除文档、重建图谱）需二次确认

---

## 常用命令

```bash
# 前端
npm run dev              # Vite 开发服务器
npm run build            # TypeScript 检查 + 构建
npm run lint             # ESLint 检查

# 后端
cd api && uvicorn main:app --reload    # FastAPI 开发服务器
cd api && ruff check .                 # Python 代码检查
cd api && mypy .                       # 类型检查

# 数据库
npx drizzle-kit push                   # 同步数据库 schema

# 部署
npx vercel --prod                      # 部署前端到 Vercel
```
