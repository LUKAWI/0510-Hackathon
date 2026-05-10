# 前后端对齐与页面修复 Spec

## Why
后端 FastAPI 服务器未启动，且前端 API 客户端的请求路径与后端路由前缀不匹配，导致所有 API 调用 404、前端页面数据无法加载。

## What Changes
- 启动后端 FastAPI 服务器（uvicorn），确保数据库连接正常
- **修改前端 `BASE_URL`**：在 `src/lib/api/client.ts` 中将基础 URL 从 `http://localhost:8000` 改为 `http://localhost:8000/api`，一次性修复全部 15 个 API 路径不匹配
- 浏览器验证前端页面正常渲染（教材管理面板、知识图谱、功能面板）

## Impact
- Affected specs: 无（首个 spec）
- Affected code: `src/lib/api/client.ts`（1 行修改）、后端启动命令

## 根本原因分析

### 问题 1：后端未启动
后端 FastAPI 服务 (`api/main.py`) 未运行，`localhost:8000` 端口无响应。

### 问题 2：API 路径前缀不匹配（**核心问题**）

后端所有路由均挂载在 `/api/` 前缀下：

| 后端路由模块 | 前缀 |
|---|---|
| textbooks | `/api/textbooks` |
| graph | `/api/graph` |
| rag | `/api/rag` |
| chat | `/api/chat` |
| integration | `/api/integration` |
| report | `/api/report` |

前端 `client.ts` 中 `BASE_URL = 'http://localhost:8000'`（无 `/api` 后缀），导致：

| 前端请求 | 实际 URL | 后端期望 | 结果 |
|---|---|---|---|
| `GET /textbooks` | `http://localhost:8000/textbooks` | `GET /api/textbooks/` | ❌ 404 |
| `POST /textbooks/upload` | `http://localhost:8000/textbooks/upload` | `POST /api/textbooks/upload` | ❌ 404 |
| `GET /graph/{id}` | `http://localhost:8000/graph/{id}` | `GET /api/graph/{id}` | ❌ 404 |
| `POST /rag/query` | `http://localhost:8000/rag/query` | `POST /api/rag/query` | ❌ 404 |
| `POST /chat/message` | `http://localhost:8000/chat/message` | `POST /api/chat/message` | ❌ 404 |
| `POST /integration/run` | `http://localhost:8000/integration/run` | `POST /api/integration/run` | ❌ 404 |

**共 15 个 API 路径全部不匹配。**

### 解决方案
修改 `client.ts` 一行代码：
```typescript
// 修改前
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

// 修改后  
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';
```

此修改使所有前端 API 路径自动对齐后端 `/api/` 前缀。

## ADDED Requirements

### Requirement: 后端服务器启动
系统 SHALL 能够启动 FastAPI 后端开发服务器，监听 `localhost:8000`。

#### Scenario: 后端启动成功
- **WHEN** 执行 `cd api && uvicorn main:app --reload --port 8000`
- **THEN** 后端在 `http://localhost:8000` 上响应请求
- **AND** 健康检查 `/api/health` 返回 `{"status": "ok"}`

### Requirement: 前端 API 路径对齐
系统 SHALL 将前端 API 客户端基础 URL 修改为包含 `/api` 前缀，确保所有 API 调用路径与后端路由匹配。

#### Scenario: 所有 API 路径匹配
- **WHEN** 前端发起任意 API 请求（如 `GET /textbooks`）
- **THEN** 实际请求 URL 为 `http://localhost:8000/api/textbooks`
- **AND** 后端路由 `GET /api/textbooks/` 正确响应

### Requirement: 前端页面数据正常加载
系统 SHALL 在浏览器中正确渲染教材管理面板、知识图谱区域和功能面板。

#### Scenario: 页面正常显示
- **WHEN** 用户访问 `http://localhost:5173/`
- **THEN** TopBar、LeftPanel、CenterPanel（知识图谱）、BottomBar 均可见
- **AND** 教材列表正常显示（有数据时）或显示空状态提示
- **AND** 无 JavaScript 运行时错误
