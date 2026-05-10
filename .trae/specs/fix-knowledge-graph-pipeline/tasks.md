# 知识图谱管线修复任务

## Task 1: 修复 knowledge_units ID 生成逻辑
- [ ] 修复 `api/services/graph_service.py` 中 `store_knowledge_units()`：当单元已有 id 时直接使用，不再强制生成 uuid4()
  - 当前代码先取 unit.get("id") 存到 unit_id，但在 SQL 中仍传 uuid4() 或 unit_id，应该直接使用 unit_id

## Task 2: store_knowledge_units 写入 embedding
- [ ] 修改 `api/services/graph_service.py` 中 `store_knowledge_units()`：
  - 接受可选的 `embedding_service: EmbeddingService | None = None`
  - 当 embedding_service 非空时，对每个单元的 name+definition 生成 embedding 并写入
  - 使用 `embedding_service.encode()` 批量生成，避免逐条调用

## Task 3: 教材上传后台任务接入知识提取
- [ ] 修改 `api/routers/textbooks.py` 中 `_process_textbook_background()`：
  - chunk embedding 完成后，对每个章节调用 `extract_knowledge_units()`
  - 收集所有提取的知识单元和关系
  - 调用修改后的 `store_knowledge_units()`（含 embedding_service）
  - 调用 `store_relationships()`
  - 异常处理：LLM 知识提取失败时记录 warning 并继续，不中断教材状态更新

## Task 4: RAG 回答增加 graphContext
- [ ] 修改 `api/services/rag_service.py` 中 `query_rag()`：
  - 检索到 chunks 后，提取其中的 unit_id
  - 查询 knowledge_units 和 knowledge_edges 获取关联的概念和关系
  - 在返回结果中增加 `graphContext` 字段

- [ ] 修改 `api/routers/rag.py` 的响应模型，增加 graphContext 字段

## Task 5: 前端接入图谱 API 数据
- [ ] 新建 `src/hooks/useGraphData.ts`：
  - 使用 `@tanstack/react-query` 的 useQuery 从 `getMergedGraph()` 获取数据
  - 返回 { nodes, edges, isLoading, error, refetch }

- [ ] 修改 `src/App.tsx` 中的 `CenterContent`：
  - 使用 `useGraphData` hook 替代硬编码的 `nodes={[]} edges={[]}`
  - 将 graphData 传入 GraphCanvas、NodeDetailPanel
  - isLoading 传入 GraphCanvas 的 isLoading prop
  - 传入 GraphLegend 的 activeBooks（从 nodes 中的 unique textbookId 推导）

## Task 6: 编写知识图谱专项测试
- [ ] 新建 `api/tests/test_graph.py`：
  - 测试 `extract_knowledge_units` 返回结构（Mock LLMClient）
  - 测试 `store_knowledge_units` SQL 拼接
  - 测试 `get_merged_graph` 返回格式
  - 测试图谱 API 端点 `GET /api/graph/merged/all` 返回 200
  - 测试图谱 API 端点 `GET /api/graph/search/test` 返回正确结果
  - 使用 `pytest` + `httpx.AsyncClient`

## Task 7: 验证与构建
- [ ] 运行 `npm run build` 确保前端 TypeScript 编译通过
- [ ] 运行 `cd api && ruff check .` 确保后端代码规范
- [ ] 启动后端服务器验证健康检查通过
- [ ] 启动前端服务器验证图谱页面正常渲染（含空状态）

# Task Dependencies
- Task 2 依赖 Task 1（ID 逻辑修正后才能正确写入 embedding）
- Task 3 依赖 Task 2（上传任务需要调用含 embedding 的存储）
- Task 6 可与 Task 1~5 并行
- Task 7 依赖 Task 1~6 全部完成
