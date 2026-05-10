# 知识图谱管线修复检查清单

## Task 1: 修复 knowledge_units ID 生成逻辑
- [ ] store_knowledge_units() 中 SQL 的 $1 参数直接使用 unit_id 变量，不再另调 uuid4()
- [ ] 单元无 id 时才生成新 UUID

## Task 2: store_knowledge_units 写入 embedding
- [ ] store_knowledge_units 接受可选的 embedding_service 参数
- [ ] 当 embedding_service 非空时，对每个单元的 name+definition 文本调用 encode() 生成 embedding
- [ ] embedding 列表正确传递给 SQL INSERT 的 embedding 列
- [ ] 批量编码而非逐条调用 API

## Task 3: 教材上传后台任务接入知识提取
- [ ] _process_textbook_background() 在 chunk embedding 完成后调用 extract_knowledge_units
- [ ] 对每个章节逐一调用 LLM 提取
- [ ] 收集所有单元调用 store_knowledge_units（含 embedding_service）
- [ ] 收集所有关系调用 store_relationships
- [ ] 提取失败的章节记录 warning 日志并继续，不影响其他章节
- [ ] 教材最终状态保持为 'ready'

## Task 4: RAG 回答增加 graphContext
- [ ] query_rag() 从 chunks 中提取 unit_id
- [ ] 根据 unit_id 查询 knowledge_units 获取节点
- [ ] 根据节点 ID 查询 knowledge_edges 获取关系边
- [ ] 返回结果中包含 graphContext.nodes 和 graphContext.edges
- [ ] 无 unit_id 时 graphContext 为 null
- [ ] rag.py 路由的响应模型包含 graphContext 字段

## Task 5: 前端接入图谱 API 数据
- [ ] useGraphData.ts hook 文件存在且使用 @tanstack/react-query
- [ ] App.tsx 中 CenterContent 使用 useGraphData() 替代空数组
- [ ] GraphCanvas 接收 nodes/edges/isLoading 来自 hook
- [ ] NodeDetailPanel 接收 nodes/edges 来自 hook
- [ ] GraphLegend 接收 activeBooks 来自 nodes 数据
- [ ] 空数据时 GraphCanvas 自带空状态显示
- [ ] 错误状态有 ErrorToast 处理

## Task 6: 编写知识图谱专项测试
- [ ] test_graph.py 文件存在
- [ ] 测试 extract_knowledge_units 返回结构正确
- [ ] 测试 store_knowledge_units 写入逻辑
- [ ] 测试 get_merged_graph 返回格式
- [ ] 测试 GET /api/graph/merged/all 返回 200
- [ ] 测试 GET /api/graph/search/{keyword} 返回正确结果
- [ ] 测试 GET /api/graph/node/{id} 返回节点详情
- [ ] 使用 pytest + httpx.AsyncClient 可运行

## Task 7: 验证与构建
- [ ] npm run build 通过（0 TypeScript 错误）
- [ ] ruff check 通过
- [ ] 后端 /api/health 返回 200
- [ ] 前端图谱页面正常渲染空状态
- [ ] 上传测试文件后图谱 API 返回非空数据
