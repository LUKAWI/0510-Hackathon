# 后端审计与 LLM 测试 — 验证清单

- [x] `api/requirements.txt` 中已移除 `sentence-transformers`、`torch`、`langchain`、`langchain-community`、`langchain-text-splitters`
- [x] `pip install -r api/requirements.txt` 安装成功，无报错
- [x] `TextbookList.tsx` 中 `textbooks` 直接赋值 `data` 数组（不再做 `"items" in data` 判断）
- [x] 前端 `TextbookStatus` 类型包含 `"uploading" | "parsing" | "processing" | "ready" | "error"`
- [x] LLM 测试脚本 `api/tests/test_llm.py` 存在且可执行
- [x] LLM 生成测试：`qwen3.5-plus` 返回非空文本
- [x] Embedding 测试：`text-embedding-v4` 返回 1024 维向量
- [x] 后端 uvicorn 启动无 import 错误
- [x] `GET /api/health` 返回 `{"status": "ok"}` (HTTP 200)
- [x] `GET /api/textbooks/` 返回 `[]` 或正确数组 (HTTP 200)
- [x] `npm run build` TypeScript 编译通过，零错误
- [x] 前端 `http://localhost:5173/` 页面正常渲染
- [x] 教材管理面板在有教材时不再误显示「暂无教材」
- [x] 浏览器控制台无 JavaScript 运行时错误（仅 Google Fonts CDN CORS，非代码错误）
