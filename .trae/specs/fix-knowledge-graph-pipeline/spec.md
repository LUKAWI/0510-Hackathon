# 知识图谱管线修复 Spec

## Why
当前知识图谱的提取→存储→构建→前端展示管线断裂，上传教材后不构建图谱，前端画布硬编码空数据，RAG 回答不融合图谱上下文。需要打通整条链路。

## What Changes
- 教材上传后台任务增加：LLM 知识提取 → 写入 knowledge_units（含 embedding）→ 写入 knowledge_edges
- knowledge_units 存储时生成并写入 1024 维 embedding
- 前端 App.tsx 中 GraphCanvas/NodeDetailPanel 接入真实 API 数据
- 前端 GraphPage（在 App.tsx 或独立组件）使用 React Query 获取图谱数据
- RAG 回答接口增加 graphContext 字段，返回相关概念节点和边
- 编写知识图谱专项测试（提取、存储、查询）
- **BREAKING**: knowledge_units 的 id 生成逻辑修正（extract_service 已生成 UUID，store_knowledge_units 不再重复生成）

## Impact
- Affected specs: 新增
- Affected code:
  - `api/routers/textbooks.py` — 后台任务增加知识提取步骤
  - `api/services/extract_service.py` — 无需改动（已有完善实现）
  - `api/services/graph_service.py` — 写入 knowledge_units 时增加 embedding
  - `api/services/rag_service.py` — 增加图谱上下文检索
  - `api/routers/rag.py` — 响应增加 graphContext
  - `api/core/embedding.py` — 可能需要暴露维度常量
  - `src/App.tsx` — GraphCanvas/NodeDetailPanel 接入真实数据
  - `src/hooks/` — 新增 useGraphData hook
  - `api/tests/` — 新增 test_graph.py

## ADDED Requirements

### Requirement: 教材上传自动构建知识图谱
系统 SHALL 在上传教材后台任务中，解析完成后自动执行 LLM 知识提取并存入 knowledge_units 和 knowledge_edges。

#### Scenario: 成功上传并构建图谱
- **WHEN** 用户上传 PDF/MD/TXT/DOCX 教材
- **THEN** 后台任务依次执行：解析章节 → 生成 chunk embedding → LLM 提取知识单元 → 生成单元 embedding → 写入 knowledge_units → 写入 knowledge_edges → 更新状态为 ready

#### Scenario: 知识提取失败不阻塞
- **WHEN** LLM 知识提取对某个章节失败
- **THEN** 记录 warning 日志，跳过该章节，继续处理其他章节，不影响教材整体状态

### Requirement: 知识单元存储时写入 Embedding
系统 SHALL 在 `store_knowledge_units` 中调用 EmbeddingService 为每个知识单元生成 embedding 并写入。

#### Scenario: 正常写入含 embedding 的单元
- **WHEN** 调用 store_knowledge_units 并传入知识单元列表
- **THEN** 对每个单元的 name+definition 文本生成 1024 维 embedding，随其他字段一并写入

### Requirement: 前端图谱画布接入 API 数据
前端 SHALL 通过 React Query 从 `/api/graph/merged/all` 拉取图谱数据，传入 GraphCanvas 和 NodeDetailPanel。

#### Scenario: 有数据时渲染图谱
- **WHEN** 图谱 API 返回非空 nodes/edges
- **THEN** GraphCanvas 使用 AntV G6 渲染节点和边，NodeDetailPanel 在点击节点时展示详情

#### Scenario: 无数据时显示空状态
- **WHEN** 图谱 API 返回空 nodes
- **THEN** 显示"暂无知识图谱，上传教材后自动构建"的空状态提示

#### Scenario: 加载中显示骨架屏
- **WHEN** 图谱数据正在请求中
- **THEN** 显示 GraphSkeleton 骨架屏

### Requirement: RAG 问答返回图谱上下文
RAG 问答接口 SHALL 在回答中附带 graphContext，包含与问题相关的知识节点和关系边。

#### Scenario: 检索到相关知识点
- **WHEN** 用户提问且向量检索命中 chunks
- **THEN** 根据 chunks 的 unit_id 关联查询 knowledge_units 和 knowledge_edges，返回 graphContext

#### Scenario: 无相关知识点
- **WHEN** 向量检索未命中任何 chunk
- **THEN** graphContext 返回 null

### Requirement: 知识图谱专项测试
系统 SHALL 有覆盖知识提取、图谱存储、图谱查询、前端 API 客户端的专项测试。

#### Scenario: 测试知识提取
- **WHEN** 运行 test_graph.py
- **THEN** 验证 extract_knowledge_units 返回结构正确

#### Scenario: 测试图谱 API
- **WHEN** 运行 test_graph.py
- **THEN** 验证 GET /api/graph/merged/all 返回 200 且格式正确
