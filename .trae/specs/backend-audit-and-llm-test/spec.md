# 后端全面审计与 LLM API 测试 Spec

## Why
后端代码存在无依赖使用（torch/sentence-transformers/langchain 等近百MB无用依赖）、前后端数据类型不匹配（Textbook 列表渲染 Bug）、状态枚举值不一致等问题，且从未验证过 DashScope LLM API 是否可用。

## What Changes
- **移除 `requirements.txt` 中未使用的重依赖**：`sentence-transformers`、`torch`、`langchain`、`langchain-community`、`langchain-text-splitters`
- **修复 `TextbookList.tsx` 数据渲染 Bug**：后端返回 `Textbook[]` 数组，组件却按 `{ items: [...] }` 对象解包导致永远显示空列表
- **修复 `TextbookStatus` 类型定义**：前端只定义了 `"processing" | "ready" | "error"`，缺少后端实际使用的 `"parsing"` 和 `"uploading"`
- **编写 LLM API 测试脚本**：验证 DashScope API（Embedding + LLM 生成）调用连通性
- **检查前后端 API 路径与请求/响应类型完全对齐**

## Impact
- Affected specs: fix-backend-api-alignment（已完成，本次在其基础上深化）
- Affected code: `api/requirements.txt`、`src/types/textbook.ts`、`src/components/textbook/TextbookList.tsx`、`api/core/llm_client.py`、`api/core/embedding.py`

## 已识别问题详细清单

### P0（阻断）：TextbookList 数据渲染 Bug
[TextbookList.tsx:L81-L84](file:///d:/辣椒油/AI_project/TrAE%20CN/hackathon/src/components/textbook/TextbookList.tsx#L81-L84)
```typescript
const textbooks = useMemo(() => {
    if (!data) return [];
    return "items" in data ? (data.items as readonly Textbook[]) : [];
}, [data]);
```
`listTextbooks()` 返回 `Promise<Textbook[]>`（直接数组），不是 `{ items: Textbook[] }`。
数组没有 `items` 属性 → 条件永远为假 → textbooks 永远为空 → **教材列表永远显示「暂无教材」**。

### P1（严重）：requirements.txt 包含大量未使用的重依赖
| 依赖 | 大小 | 实际使用 | 说明 |
|------|------|----------|------|
| `sentence-transformers>=3.0.0` | ~50MB | ❌ 未使用 | 代码使用 DashScope API 做 Embedding |
| `torch>=2.3.0` | ~800MB | ❌ 未使用 | sentence-transformers 的传递依赖 |
| `langchain>=0.2.0` | ~15MB | ❌ 未使用 | 未曾导入 |
| `langchain-community>=0.2.0` | ~5MB | ❌ 未使用 | 未曾导入 |
| `langchain-text-splitters>=0.2.0` | ~1MB | ❌ 未使用 | 未曾导入 |

### P1：TextbookStatus 类型与后端返回值不一致
- 前端 `TextbookStatus` = `"processing" | "ready" | "error"`
- 后端实际返回的 status：`"uploading"`（schema 默认值）、`"parsing"`（上传时设置）、`"ready"`、`"error"`
- **缺少 `"parsing"` 和 `"uploading"`**，TypeScript strict 模式下可能导致类型错误

### P2（验证）：LLM/Embedding API 连通性未知
- DashScope API 从未被测试验证过
- `LLMClient` 使用 `MultiModalConversation.call()` 调 `qwen3.5-plus`
- `EmbeddingService` 使用 `dashscope.TextEmbedding.call()` 调 `text-embedding-v4`
- 需要确认 API Key 有效、模型可用、返回格式正确

### 前后端路由路径对齐（已确认无问题）
| 前端路径 | 后端路由 | 方法 | 状态 |
|----------|----------|------|------|
| `textbooks` | `GET /api/textbooks/` | GET | ✅ |
| `textbooks/upload` | `POST /api/textbooks/upload` | POST | ✅ |
| `textbooks/{id}` | `GET /api/textbooks/{id}` | GET | ✅ |
| `textbooks/{id}` | `DELETE /api/textbooks/{id}` | DELETE | ✅ |
| `chat/message` | `POST /api/chat/message` | POST | ✅ |
| `chat/history/{id}` | `GET /api/chat/history/{id}` | GET | ✅ |
| `chat/memories/{id}` | `GET /api/chat/memories/{id}` | GET | ✅ |
| `graph/{id}` | `GET /api/graph/{id}` | GET | ✅ |
| `graph/merged/all` | `GET /api/graph/merged/all` | GET | ✅ |
| `graph/node/{id}` | `GET /api/graph/node/{id}` | GET | ✅ |
| `graph/search/{kw}` | `GET /api/graph/search/{kw}` | GET | ✅ |
| `rag/query` | `POST /api/rag/query` | POST | ✅ |
| `rag/status` | `GET /api/rag/status` | GET | ✅ |
| `rag/index` | `POST /api/rag/index` | POST | ✅ |
| `integration/run` | `POST /api/integration/run` | POST | ✅ |
| `integration/decisions` | `GET /api/integration/decisions` | GET | ✅ |
| `report/list` | `GET /api/report/list` | GET | ✅ |
| `report/generate` | `POST /api/report/generate` | POST | ✅ |
| `report/{id}` | `GET /api/report/{id}` | GET | ✅ |
| `report/{id}` | `PUT /api/report/{id}` | PUT | ✅ |
| `report/{id}` | `DELETE /api/report/{id}` | DELETE | ✅ |
| `report/{id}/download` | `GET /api/report/{id}/download` | GET | ✅ |

## ADDED Requirements

### Requirement: 清理未使用依赖
系统 SHALL 从 `api/requirements.txt` 中移除 `sentence-transformers`、`torch`、`langchain`、`langchain-community`、`langchain-text-splitters`，这些依赖在代码中未被导入使用。

#### Scenario: 依赖精简后安装通过
- **WHEN** 执行 `pip install -r api/requirements.txt`
- **THEN** 所有依赖成功安装
- **AND** `sentence-transformers`、`torch`、`langchain*` 不再被安装
- **AND** 后端服务器可正常启动（uvicorn 无 import 错误）

### Requirement: 修复 TextbookList 数据渲染 Bug
系统 SHALL 将 `TextbookList.tsx` 中 `"items" in data` 的解包逻辑改为直接将数组赋值给 `textbooks`。

#### Scenario: 后端返回教材列表时正确渲染
- **WHEN** 后端 `GET /api/textbooks/` 返回非空数组（如 `[{id:"1",...}]`）
- **THEN** `TextbookList` 组件渲染教材列表项
- **AND** 不再始终显示「暂无教材」空状态

### Requirement: 修复 TextbookStatus 类型定义
系统 SHALL 扩展前端 `TextbookStatus` 类型，使其包含 `"uploading"` 和 `"parsing"` 两个状态值。

#### Scenario: TypeScript 类型检查通过
- **WHEN** 运行 `npm run build`
- **THEN** 无 TextbookStatus 相关的类型错误

### Requirement: LLM API 连接测试
系统 SHALL 提供一个独立脚本，验证 DashScope API（LLM 生成 + Embedding）的连通性和返回格式正确性。

#### Scenario: LLM 生成测试通过
- **WHEN** 执行 LLM 测试脚本
- **THEN** `qwen3.5-plus` 模型返回非空文本
- **AND** 无 API 错误

#### Scenario: Embedding 生成测试通过
- **WHEN** 执行 Embedding 测试脚本
- **THEN** `text-embedding-v4` 模型返回 1024 维的浮点数向量
- **AND** 无 API 错误
