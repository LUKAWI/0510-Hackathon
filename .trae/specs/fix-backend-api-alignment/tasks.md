# 前后端对齐任务清单

- [x] Task 1: 检查 Python 环境和后端依赖
  - [x] 确认 Python 版本支持 FastAPI（3.13.5 + fastapi 0.136.1 + uvicorn 0.41.0）
  - [x] 确认 `api/requirements.txt` 中依赖已安装
  - [x] 验证 `.env` 文件存在且有有效 `DATABASE_URL` 和 `DASHSCOPE_API_KEY`

- [x] Task 2: 修复前端 API 路径前缀（核心修复）+ 附属 TS 错误
  - [x] 修改 `src/lib/api/client.ts`：`BASE_URL` 改为 `http://localhost:8000/api`
  - [x] 修复 MergePanel.tsx 中 `previewMutation`/`saveMutation` 引用错误
  - [x] 修复 MergePanel.tsx 中类型转换错误（2处）
  - [x] 修复 CitationCard.tsx 中未使用的 `Hash` 导入
  - [x] 修复 ReportPanel.tsx 中 `useLatestReport` → `useReports`
  - [x] 修复 ReportPanel.tsx 中 `title` 参数和属性类型错误
  - [x] 修复 useReport.ts hook 返回数组而非单对象
  - [x] 运行 `npm run build` 验证 TypeScript 编译通过

- [x] Task 3: 启动后端服务器
  - [x] 终止已有 Python 进程
  - [x] 启动 uvicorn：`python -m uvicorn api.main:app --reload --port 8000`
  - [x] 验证后端健康检查：`GET http://localhost:8000/api/health` 返回 200

- [x] Task 4: 重启前端开发服务器
  - [x] 终止已有 Vite 进程
  - [x] 运行 `npm run dev` 启动前端

- [x] Task 5: 浏览器端到端验证
  - [x] 使用 Playwright 打开 `http://localhost:5173/`
  - [x] 页面错误：0
  - [x] API 调用验证：`GET /api/textbooks/` → 200
  - [x] UI 元素检查通过（TopBar、CenterPanel、BottomBar、RightPanel、GraphCanvas）

# Task Dependencies
- Task 3 依赖 Task 1（需确认 Python 环境可用）
- Task 4 依赖 Task 2（需先修复 API 路径）
- Task 5 依赖 Task 3 和 Task 4（需前后端都运行）
