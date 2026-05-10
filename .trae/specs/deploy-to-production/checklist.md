# 部署验证清单

## 前置准备

- [ ] 本地前后端联调通过：`npm run dev` + `uvicorn` 同时运行，所有功能正常
- [ ] Neon 数据库状态 Active，pgvector 扩展已启用（`CREATE EXTENSION IF NOT EXISTS vector;`）
- [ ] `DATABASE_URL` 连接串可用，远端可连接
- [ ] 魔搭账号已注册并完成实名认证（Docker 创空间需要实名）
- [ ] 魔搭 API Token 已获取（https://modelscope.cn/my/myaccesstoken）

## 前端部署（Vercel）

- [x] `vercel.json` 已创建，包含 SPA rewrites 规则和静态资源缓存头
- [ ] Vercel CLI 已安装并登录（`npx vercel whoami` 正常）
- [ ] 首次 Vercel 部署成功，预览 URL 可访问
- [ ] Vercel 环境变量 `VITE_API_URL` 已配置（先填占位值，后端部署完再更新）
- [ ] 生产部署完成，`https://<project>.vercel.app` 正常显示页面
- [ ] 页面刷新子路由不会 404
- [ ] GitHub 自动部署已连接，`git push` 后自动触发构建

## 后端部署（魔搭创空间 Docker）

- [x] `backend.Dockerfile` 已创建在项目根目录
- [x] Dockerfile 使用魔搭官方基础镜像（`modelscope-registry.cn-beijing.cr.aliyuncs.com/modelscope-repo/python:3.10`）
- [x] Dockerfile 中工作目录为 `/home/user/app`
- [x] Dockerfile 中服务监听 `0.0.0.0:7860`
- [x] Dockerfile 正确安装 `api/requirements.txt` 依赖
- [x] `ms_deploy.json` 已创建在项目根目录
- [x] `ms_deploy.json` 中 `sdk_type` 为 `"docker"`
- [x] `ms_deploy.json` 中 `port` 为 `7860`
- [x] `ms_deploy.json` 中 `resource_configuration` 为 `"platform/2v-cpu-16g-mem"`
- [ ] `ms_deploy.json` 中所有环境变量已填写真实值（`DASHSCOPE_API_KEY`, `DATABASE_URL` 等）
- [ ] 魔搭创空间已创建并上线
- [ ] 创空间状态为"运行中"
- [ ] 创空间构建日志无错误
- [ ] 创空间运行日志无错误
- [ ] 浏览器访问 `创空间URL/api/health` 返回 `{"status":"ok"}`
- [x] 后端 CORS 已配置（包含 Vercel 前端域名 + `localhost:5173`）（当前仅 `localhost:5173`，Vercel 域名需部署后手动添加）

## 后端部署（自建云服务器，备选）

- [ ] 云服务器已购买并运行（至少 4GB RAM + 20GB 磁盘）
- [ ] 安全组已放行 22/80/443 端口
- [ ] Python 3.11+ 和虚拟环境已就绪
- [ ] 后端代码已上传到服务器
- [ ] `pip install -r requirements.txt` 全部依赖安装成功
- [ ] `.env` 文件已创建，所有环境变量已填写真实值
- [ ] systemd 服务文件已创建并启用
- [ ] `systemctl status knowledge-agent` 显示 `active (running)`
- [ ] Nginx 反向代理已配置
- [ ] HTTPS 证书已配置（Let's Encrypt）
- [ ] 服务器重启后后端服务自动恢复

## 前后端联调

- [ ] Vercel 前端 `VITE_API_URL` 已更新为后端真实地址
- [ ] 前端页面打开后，浏览器 Network 面板确认 API 请求发向了正确的后端地址
- [ ] 前端控制台无 CORS 报错
- [ ] 前端控制台无 404/500 报错

## 端到端功能验证

- [ ] 通过 Vercel URL 访问前端，页面完整加载，无控制台错误
- [ ] 教材上传功能正常（上传 → 进度条 → 列表出现 → 状态变为已索引）
- [ ] 知识图谱可视化正常（节点/边渲染、缩放/拖拽交互）
- [ ] 节点点击显示详细信息
- [ ] 不同教材来源的节点用不同颜色区分
- [ ] RAG 问答功能正常（输入问题 → 返回带出处引用的回答）
- [ ] 回答中的引用可点击查看原文片段
- [ ] 多轮对话上下文保持正常（追问能引用上文内容）
- [ ] 整合报告面板正常显示
- [ ] 所有功能在移动端浏览器也能正常使用（响应式）

## 安全审计

- [ ] `.env` 文件未提交到 Git 仓库（在 `.gitignore` 中）
- [x] `ms_deploy.json` 中的 API Key 不会暴露在 Git 中（已在 `.gitignore` 中）
- [ ] 后端 CORS 已限制（非 `*`）
- [ ] API Key 仅在服务端使用，前端代码中无硬编码密钥
- [ ] 数据库连接使用 SSL（`sslmode=require`）
- [ ] 魔搭创空间公开访问设置正确（黑客松评审需要 Public）
