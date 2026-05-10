# 后端审计与 LLM 测试任务清单

- [x] Task 1: 清理 `api/requirements.txt` 中未使用的重依赖
  - 移除 `sentence-transformers>=3.0.0`、`torch>=2.3.0`、`langchain>=0.2.0`、`langchain-community>=0.2.0`、`langchain-text-splitters>=0.2.0`
  - 验证精简后 `pip install -r api/requirements.txt` 成功

- [x] Task 2: 修复 `TextbookList.tsx` 数据渲染 Bug
  - 将 `"items" in data` 解包逻辑改为直接使用 `data` 数组
  - 验证教材列表可正确渲染

- [x] Task 3: 修复 `TextbookStatus` 类型定义
  - 在 `src/types/textbook.ts` 中扩展 `TextbookStatus` 包含 `"uploading"` 和 `"parsing"`
  - 运行 `npm run build` 确认 TypeScript 编译通过

- [x] Task 4: 编写并运行 LLM API 连通性测试脚本
  - 创建 `api/tests/test_llm.py`，测试 LLM 生成 (`qwen3.5-plus`) 和 Embedding (`text-embedding-v4`)
  - 运行测试脚本验证 DashScope API 可用

- [x] Task 5: 启动后端并验证所有 API 端点可访问
  - 终止已有 Python 进程
  - 启动 uvicorn 后端服务器
  - 验证 `GET /api/health` 返回 200
  - 验证 `GET /api/textbooks/` 返回 200

- [x] Task 6: 启动前端并执行端到端验证
  - 终止已有 Vite 进程
  - 运行 `npm run build` 确认编译通过
  - 启动 `npm run dev` 前端开发服务器
  - 使用 Playwright 验证页面正常渲染、教材列表不再误显示空状态

# Task Dependencies
- Task 2 和 Task 3 可并行
- Task 5 依赖 Task 1（后端需要无 import 错误）
- Task 6 依赖 Task 2、Task 3、Task 5（需要前后端均运行且修复完成）
- Task 4 仅依赖 `.env` 中有有效 `DASHSCOPE_API_KEY`，与其他任务可并行
