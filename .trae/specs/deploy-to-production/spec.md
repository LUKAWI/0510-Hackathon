# 项目生产环境部署 Spec

## Why

项目目前仅在本地开发环境运行（前端 `localhost:5173` + 后端 `localhost:8000`），无法对外提供服务。根据黑客松赛题要求，必须提交**公网可访问的部署链接**。本 spec 提供两种方案：

1. **推荐方案（黑客松场景）**：前端 Vercel + 后端魔搭创空间（ModelScope Studio Docker）——免费、简单
2. **生产方案（长期运营）**：前端 Vercel + 后端自建云服务器（阿里云/AWS）——可控、高性能

## 部署架构总览

```
用户浏览器
    │
    ▼
┌──────────────────────────────────────────┐
│  前端托管                                   │
│  方案 A: Vercel (推荐)                      │
│  方案 B: 魔搭创空间 Static                   │
│  https://your-project.vercel.app           │
│  React + Vite 静态站点                     │
└──────────────┬───────────────────────────┘
               │ fetch(VITE_API_URL)
               ▼
┌──────────────────────────────────────────┐
│  后端托管                                   │
│  方案 A: 魔搭创空间 Docker (推荐，免费)       │
│  方案 B: 自建云服务器 (阿里云/AWS 等)         │
│  FastAPI + uvicorn                        │
│  端口: 7860 (魔搭要求)                       │
└──────────────┬───────────────────────────┘
               │ asyncpg
               ▼
┌──────────────────────────────────────────┐
│  Neon PostgreSQL (云数据库)                │
│  pgvector 扩展已启用                       │
└──────────────────────────────────────────┘
```

## 方案对比

| 维度 | 魔搭创空间 Docker | 自建云服务器 |
|------|-------------------|-------------|
| 费用 | 免费（CPU 2核16G） | ~￥100-200/月 |
| 部署难度 | 低（Git push 即可） | 中（需配 Nginx/systemd/HTTPS） |
| 自定义程度 | 中（端口固定 7860） | 高 |
| 稳定性 | 依赖魔搭平台 | 自主可控 |
| 适用场景 | 黑客松/原型/Demo | 长期生产运营 |
| torch 支持 | ✅ 基础镜像自带 | 需手动安装 |

## What Changes

### 前端
- 创建 `vercel.json`（SPA 路由回退 + 缓存头）
- 配置 `VITE_API_URL` 环境变量指向后端地址
- Vercel 自动部署（连接 GitHub）

### 后端（魔搭创空间）
- 创建 `backend.Dockerfile`（魔搭 Docker 创空间要求端口 7860）
- 创建 `ms_deploy.json`（魔搭快速部署配置）
- 在魔搭创空间设置中配置环境变量（API Key、数据库连接串等）
- 通过 Git 推送代码自动触发构建和部署

### 后端（自建服务器，备选）
- 创建 systemd 服务文件
- 创建 Nginx 反向代理配置
- 配置 HTTPS

### 数据库
- 无需变更，沿用现有 Neon `DATABASE_URL`
- 确保 pgvector 扩展已启用

## Impact

- Affected specs: fix-backend-api-alignment（部署前需确保接口对齐）
- Affected code:
  - 新增 `vercel.json`
  - 新增 `backend.Dockerfile`（魔搭创空间）
  - 新增 `ms_deploy.json`（魔搭快速部署配置）
  - 可能修改 `api/main.py`（端口改为 7860 或通过环境变量控制）

---

## ADDED Requirements

### Requirement: 前端部署（Vercel）
系统 SHALL 将 Vite 构建产物部署到 Vercel，生成公网可访问的 HTTPS URL。前端通过 `VITE_API_URL` 环境变量连接后端。

#### Scenario: Vercel 部署成功
- **WHEN** 执行 `npx vercel --prod` 或 Git push 到 main 分支
- **THEN** 返回 `https://<project-name>.vercel.app` 的部署 URL
- **AND** 访问该 URL 能看到前端页面完整渲染
- **AND** 页面刷新任何子路由不会 404

### Requirement: 后端 Docker 化（魔搭创空间部署）
系统 SHALL 创建符合魔搭创空间 Docker 规范的 Dockerfile，将 FastAPI 后端容器化部署到魔搭创空间。

#### Scenario: Dockerfile 符合魔搭规范
- **WHEN** 魔搭创空间读取项目的 Dockerfile
- **THEN** 基础镜像使用 `modelscope-registry.cn-beijing.cr.aliyuncs.com/modelscope-repo/python:3.10`
- **AND** 工作目录为 `/home/user/app`
- **AND** 服务监听 `0.0.0.0:7860`
- **AND** 依赖通过 `pip install -r requirements.txt` 安装

#### Scenario: 魔搭创空间部署成功
- **WHEN** 代码推送到魔搭创空间 Git 仓库
- **THEN** 创空间自动构建 Docker 镜像并启动
- **AND** 创空间状态变为"运行中"
- **AND** 通过创空间提供的公网 URL 可以访问 `/api/health` 返回 `{"status":"ok"}`

### Requirement: 环境变量安全配置
系统 SHALL 通过魔搭创空间/云服务器的环境变量面板配置敏感信息，不将密钥硬编码到代码中。

#### Scenario: 魔搭环境变量配置
- **WHEN** 在魔搭创空间设置页面配置环境变量
- **THEN** `DASHSCOPE_API_KEY`、`DATABASE_URL` 等变量在容器运行时可用
- **AND** `.env` 文件不包含真实密钥（仅保留示例值）
- **AND** 真实密钥不出现在 Git 仓库中

### Requirement: CORS 安全限制
系统 SHALL 将后端 CORS 从 `allow_origins=["*"]` 改为仅允许前端域名。

#### Scenario: Vercel 前端请求通过
- **WHEN** 前端（Vercel）向后端发起请求
- **THEN** CORS 检查通过，请求正常响应

#### Scenario: 本地开发也通过
- **WHEN** 本地 `http://localhost:5173` 向后端发起请求
- **THEN** CORS 检查通过（本地开发 origin 在白名单中）
