# 部署任务清单

> **重要提醒：** 推荐优先走「方案 A：魔搭创空间」路径（免费、快速）。「方案 B：自建服务器」作为备选长期方案。

---

## 阶段零：前置准备（必须先做）

### Task 0: 确保前后端本地联调通过

**步骤：**
1. 启动后端：`cd api && uvicorn main:app --reload --port 8000`
2. 启动前端：`npm run dev`
3. 在浏览器 `http://localhost:5173` 逐个测试所有功能：上传教材、知识图谱渲染、RAG 问答、整合报告
4. 确认所有 API 调用成功（无 404/500/网络错误）

**验证：** 所有核心功能在本地正常运行

### Task 0.5: 准备 Neon 数据库

**步骤：**
1. 登录 [Neon Console](https://console.neon.tech/)
2. 确保项目存在且状态为 Active
3. 在 SQL Editor 中执行 `CREATE EXTENSION IF NOT EXISTS vector;`（确认 pgvector 已启用）
4. 复制连接字符串（格式：`postgresql://user:pass@host/db?sslmode=require`），后续会用到

**验证：** Neon 控制台显示数据库状态正常，pgvector 扩展已安装

### Task 0.6: 获取魔搭 API Token

**步骤：**
1. 访问 [魔搭访问令牌页面](https://modelscope.cn/my/myaccesstoken)
2. 登录你的魔搭账号（可用阿里云账号登录或手机号注册）
3. 点击"创建令牌"，复制生成的 Token
4. （可选）设置环境变量方便使用：`set MODELSCOPE_API_TOKEN=你的token`

**验证：** 能复制到一长串 Token 字符串

---

## 阶段一：前端部署

### Task 1: 创建 vercel.json 配置文件

✅ 已完成

**步骤：**
1. 在项目根目录新建 `vercel.json`
2. 写入以下内容：
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
     "headers": [
       {
         "source": "/assets/(.*)",
         "headers": [
           { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
         ]
       }
     ]
   }
   ```
3. `rewrites` 的作用：SPA 路由回退——用户刷新子路由时 Vercel 返回 `index.html`
4. `headers` 的作用：静态资源长期缓存，二次加载秒开

**验证：** 文件存在于项目根目录，JSON 格式有效

### Task 2: 部署前端到 Vercel

**步骤：**
1. 安装 Vercel CLI：`npm install -g vercel`
2. 登录：`npx vercel login`（浏览器会弹窗，用 GitHub 登录）
3. 在项目根目录执行：`npx vercel`
4. CLI 会询问：
   - "Set up and deploy?" → **Yes**
   - "Which scope?" → 选择你的团队/个人账户
   - "Link to existing project?" → **No**（首次部署）
   - "Project name?" → 输入名字（如 `knowledge-agent`）
   - "In which directory is your code?" → **`./`**
   - "Override settings?" → **No**（自动识别 Vite 项目）
5. 等待构建完成，CLI 返回预览 URL

**验证：** 预览 URL 能打开前端页面

### Task 3: 配置 Vercel 环境变量

**步骤：**
1. 打开 [Vercel Dashboard](https://vercel.com/dashboard)
2. 找到你的项目 → Settings → Environment Variables
3. 添加变量：

   | Key | Value | Environments |
   |-----|-------|-------------|
   | `VITE_API_URL` | `https://你的魔搭创空间URL/api` | Production, Preview |

   > **注意：** 后端地址先用占位值 `https://xxx.gradio.live/api`，等后端部署完再更新
4. 点击 **Save** → 在 Deployments 中找到最新部署 → **Redeploy**（让环境变量生效）

**验证：** Redeploy 完成，页面正常加载

### Task 4: 连接 GitHub 自动部署

**步骤：**
1. Vercel Dashboard → 你的项目 → Settings → Git
2. 点击 **Connect Git Repository**
3. 授权 Vercel 访问 GitHub → 选择仓库 `LUKAWI/0510-Hackathon`
4. Framework Preset: **Vite**，其他默认
5. 点击 **Deploy**

**效果：** 以后 `git push` 到 `main` 分支，Vercel 自动部署

**验证：** 修改 `index.html` 中的 `<title>`，`git commit && git push`，观察 Vercel 是否自动构建

---

## 阶段二：后端部署（方案 A：魔搭创空间，推荐）

### Task 5: 创建 backend.Dockerfile

✅ 已完成

**背景：** 魔搭 Docker 创空间要求：
- 基础镜像用魔搭官方 Python 镜像
- 工作目录 `/home/user/app`
- 服务必须监听 `0.0.0.0:7860`（端口固定，不可改）

**步骤：**
1. 在项目根目录新建 `backend.Dockerfile`
2. 写入以下内容：
   ```dockerfile
   FROM modelscope-registry.cn-beijing.cr.aliyuncs.com/modelscope-repo/python:3.10

   WORKDIR /home/user/app

   COPY api/requirements.txt /home/user/app/
   RUN pip install --no-cache-dir -r requirements.txt

   COPY api/ /home/user/app/api/

   # 魔搭创空间要求服务监听 0.0.0.0:7860
   EXPOSE 7860

   CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "7860"]
   ```

**关键说明：**
- 不使用 `torch` 的基础镜像也可以，因为你的项目通过 DashScope API 做 Embedding，不需要本地 torch
- 如果项目确实需要 torch，把基础镜像换为 `modelscope-registry.cn-beijing.cr.aliyuncs.com/modelscope-repo/python:3.10-torch2.1.0`（镜像更大，构建更慢）

**验证：** 文件存在于项目根目录

### Task 6: 创建 ms_deploy.json 快速部署配置

✅ 已完成

**步骤：**
1. 在项目根目录新建 `ms_deploy.json`
2. 写入以下内容：
   ```json
   {
     "$schema": "https://modelscope.cn/api/v1/studios/deploy_schema.json",
     "sdk_type": "docker",
     "resource_configuration": "platform/2v-cpu-16g-mem",
     "port": 7860,
     "environment_variables": [
       { "name": "DASHSCOPE_API_KEY", "value": "sk-你的真实APIKey" },
       { "name": "DATABASE_URL", "value": "postgresql://user:pass@host/db?sslmode=require" },
       { "name": "EMBEDDING_MODEL_NAME", "value": "text-embedding-v4" },
       { "name": "EMBEDDING_DIM", "value": "1024" },
       { "name": "CHUNK_SIZE", "value": "500" },
       { "name": "CHUNK_OVERLAP", "value": "80" },
       { "name": "LLM_MODEL_NAME", "value": "qwen3.5-plus" }
     ]
   }
   ```
3. **重要：** 将 `DASHSCOPE_API_KEY` 的 `value` 替换为你的真实 API Key
4. **重要：** 将 `DATABASE_URL` 的 `value` 替换为你的 Neon 数据库连接串

**验证：** 文件存在于项目根目录，JSON 格式有效

### Task 7: 在魔搭创建创空间

**步骤（方式一：通过网页界面快速创建）：**
1. 访问 [魔搭创空间创建页面](https://modelscope.cn/studios/create?template=quick)
2. 切换到**"快速部署并创建"**模式
3. 填写基础信息：
   - 英文名称：`knowledge-agent-backend`（或你喜欢的名字）
   - 中文名称：`学科知识整合智能体后端`
   - 许可证：MIT
   - 公开性：Public（评审需要访问）
4. 上传项目文件（将整个项目文件夹拖拽上传，或只上传必要文件：`api/`、`backend.Dockerfile`、`ms_deploy.json`）
5. 点击"确认创建并部署"

**步骤（方式二：通过 Git 推送）：**
1. 先在魔搭网页创建 Docker 创空间
2. 克隆创空间仓库：`git clone https://oauth2:你的Token@www.modelscope.cn/你的用户名/knowledge-agent-backend.git`
3. 将项目文件（`api/`、`backend.Dockerfile`、`ms_deploy.json`）复制到克隆的目录中
4. `git add . && git commit -m "deploy backend" && git push`
5. 在创空间设置页点击"上线"

**验证：** 创空间状态变为"运行中"，点击"查看日志"无错误

### Task 8: 获取后端公网 URL 并更新前端配置

**步骤：**
1. 魔搭创空间运行成功后，复制创空间的公网 URL（格式类似 `https://xxx.gradio.live`）
   > 注意：Docker 创空间的 URL 通常是 `https://你的用户名-knowledge-agent-backend.ms.modelscope.cn` 或类似的格式，实际以上线后显示的为准
2. 后端 API 地址 = `创空间URL/api`
3. 回到 Vercel Dashboard → 项目 → Settings → Environment Variables
4. 更新 `VITE_API_URL` 的值为后端 API 地址（如 `https://xxx.gradio.live/api`）
5. Redeploy 前端

**验证：** 
- 浏览器访问 `创空间URL/api/health` 返回 `{"status":"ok"}`
- 通过 Vercel 前端页面能正常调用 API

### Task 9: 修改后端 CORS 配置（安全加固）

✅ 已完成

**步骤：**

编辑 `api/main.py`，将：
```python
allow_origins=["*"],
```
改为：
```python
allow_origins=[
    "https://你的项目名.vercel.app",  # Vercel 生产域名
    "http://localhost:5173",          # 本地开发
],
```

修改后推送代码或在创空间更新文件。

**验证：** 从 Vercel 前端页面能正常调用 API，本地开发也能调用

---

## 阶段二备选：后端部署（方案 B：自建云服务器）

> 如果魔搭创空间资源不足或不满足需求，可采用此方案。

### Task B1: 准备云服务器

**推荐配置：**
| 方案 | 配置建议 | 月费 |
|------|---------|------|
| 阿里云 ECS | 2 vCPU + 4GB RAM + 40GB SSD | ~￥100-150 |
| AWS EC2 t3.medium | 2 vCPU + 4GB RAM | ~$30 |
| DigitalOcean Droplet | 2 vCPU + 4GB RAM | ~$24 |

**步骤：**
1. 购买实例（Ubuntu 22.04/24.04 LTS）
2. 安全组放行端口：22（SSH）、80（HTTP）、443（HTTPS）
3. SSH 连接：`ssh root@<服务器IP>`
4. 更新系统：`apt update && apt upgrade -y`

**验证：** 能 SSH 连接到服务器

### Task B2: 搭建 Python 环境

**步骤：**
```bash
apt install -y python3.11 python3.11-venv python3.11-dev python3-pip git nginx certbot python3-certbot-nginx
mkdir -p /opt/knowledge-agent && cd /opt/knowledge-agent
python3.11 -m venv venv && source venv/bin/activate
pip install --upgrade pip setuptools wheel
```

**验证：** `python3.11 --version` 输出 Python 3.11.x

### Task B3: 部署代码并安装依赖

**步骤：**
```bash
cd /opt/knowledge-agent
git clone https://github.com/LUKAWI/0510-Hackathon.git repo
cd repo/api
source /opt/knowledge-agent/venv/bin/activate
pip install -r requirements.txt
# 国内服务器用清华镜像：pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

**验证：** `python -c "import fastapi; import asyncpg; print('OK')"` 无报错

### Task B4: 配置 .env 和 systemd

**步骤：**
```bash
cd /opt/knowledge-agent/repo/api
nano .env  # 填写真实 API Key、数据库连接串
```

创建 `/etc/systemd/system/knowledge-agent.service`：
```ini
[Unit]
Description=学科知识整合智能体后端
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/knowledge-agent/repo/api
Environment="PATH=/opt/knowledge-agent/venv/bin"
ExecStart=/opt/knowledge-agent/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl enable knowledge-agent
systemctl start knowledge-agent
```

**验证：** `systemctl status knowledge-agent` 显示 `active (running)`

### Task B5: 配置 Nginx + HTTPS

**步骤：**
```bash
nano /etc/nginx/sites-available/knowledge-agent
```
```nginx
server {
    listen 80;
    server_name api.your-domain.com;
    client_max_body_size 50m;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }
}
```
```bash
ln -s /etc/nginx/sites-available/knowledge-agent /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d api.your-domain.com  # 配置 HTTPS
```

**验证：** `curl http://<服务器IP>/api/health` 返回 `{"status":"ok"}`

---

## 阶段三：端到端验证

### Task 10: 端到端测试

在 Vercel 部署的前端页面上：
1. 上传一本测试教材（PDF/MD）
2. 确认文件上传进度条正常，上传完成后出现在教材列表
3. 等待教材处理完成（状态变为已索引）
4. 打开知识图谱面板，确认节点和边渲染正常
5. 输入一个知识点问题进行 RAG 查询，确认返回带出处的答案
6. 查看整合报告面板
7. 测试多轮对话的上下文连贯性

**验证：** 所有功能在公网环境下正常运行

---

## 任务依赖关系

```
Task 0 (本地联调) ──→ Task 0.5 (Neon 准备) ──→ Task 0.6 (魔搭 Token)
                           │
         ┌─────────────────┴─────────────────┐
         ▼                                    ▼
Task 1~4 (前端 Vercel)              Task 5~9 (后端魔搭创空间)
         │                                    │
         └─────────────────┬─────────────────┘
                           ▼
                     Task 10 (端到端验证)
```

- Task 1~4 和 Task 5~9 可以并行执行
- Task 3（Vercel 环境变量）中的 `VITE_API_URL` 需要后端 URL 先确定，可以先填占位值
- 方案 B（自建服务器）作为备选，仅当方案 A 不满足需求时使用
