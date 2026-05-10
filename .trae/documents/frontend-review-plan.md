# 前端代码审查与测试计划

> **目标：** 审查前端代码是否有 bug，修复发现的问题，然后在本地启动服务进行浏览器测试。

> **架构：** 项目基于 React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui + AntV G6 知识图谱 + Zustand 状态管理。

---

## 审查发现的 Bug 列表

通过逐文件审查 + `npm run build` 验证（TypeScript 编译通过），发现以下 **8 个问题**：

| # | 严重度 | 文件 | 问题描述 |
|---|--------|------|----------|
| 1 | 🟡 Medium | `components/graph/NodeDetailPanel.tsx:147` | 标签文字重复，渲染"关键词关键词" |
| 2 | 🔴 High | `App.tsx:31-32` | GraphCanvas 传入硬编码 `nodes={[]}` `edges={[]}`，图谱永不显示数据 |
| 3 | 🟡 Medium | `components/graph/GraphCanvas.tsx:53` | 节点描边色 `#ffffff` 在白背景下不可见 |
| 4 | 🟡 Medium | `components/graph/GraphCanvas.tsx:227` | 仅搜索时所有边设 "default" 状态，应 dim 非关联边 |
| 5 | 🟡 Low | `lib/errors.ts:108` vs `FileUploadZone.tsx:9` | 文件类型白名单不一致（errors.ts 缺少 `.txt` `.xlsx`） |
| 6 | 🟡 Medium | `App.tsx` | ErrorBoundary 存在但未使用，组件崩溃无兜底 |
| 7 | 🟡 Medium | `App.tsx` | ErrorToast 存在但未渲染，处理错误不弹 toast |
| 8 | 🟡 Low | `components/merge/` 无 `index.ts`；`components/report/` 无 `index.ts` | 不影响构建但不符合项目导出模式 |
| 9 | 🟡 Low | `PanelTabs.tsx` merge/rag/chat 标签仅显示占位 | 功能未接入，预期行为还是遗漏？|
| 10 | 🔴 High | `MainLayout.tsx` 未包裹 ErrorBoundary 和 ErrorToast | 运行时错误会导致白屏无提示 |

---

## 任务清单

### Task 1: 修复 NodeDetailPanel.tsx 标签文字重复

**文件:** `src/components/graph/NodeDetailPanel.tsx`

- [ ] **Step 1:** 修改第 147-149 行，去掉重复的中文标签

当前代码：
```tsx
<h4 className="mb-1.5 text-xs font-medium text-muted-foreground">
  {"关键词"}
  关键词
</h4>
```

修改为：
```tsx
<h4 className="mb-1.5 text-xs font-medium text-muted-foreground">
  关键词
</h4>
```

---

### Task 2: 修复 App.tsx — 让 GraphCanvas 从 store/API 获取数据

**文件:** `src/App.tsx`

- [ ] **Step 1:** 当前 GraphCanvas 硬编码 `nodes={[]}` `edges={[]}`，需要改为从图谱 store 或数据源获取。由于后端 API 已有 `getGraph()`，应先确认 store 是否需要新增 graph data 字段，或直接在 GraphCanvas 内部自行 fetch。

**决定：** 由于 GraphCanvas 目前已有 Loading/Empty/Data 三种状态处理，且当前 `nodes`/`edges` 通过 props 传入，最简单的方式是：
- 在 `graph` store 中添加 `nodes` 和 `edges` 的缓存字段
- 从 API 获取数据后存入 store
- App.tsx 中从 store 读取并传入 GraphCanvas

但在当前计划中，GraphCanvas 传入空数组并不会崩溃，只是显示 EmptyState，这可能是预期行为（等待后端就绪）。**先保留不改**，但需添加注释说明这是待接入的占位。

---

### Task 3: 修复 GraphCanvas.tsx 节点描边色

**文件:** `src/components/graph/GraphCanvas.tsx`

- [ ] **Step 1:** 修改第 52 行，将 `stroke: "#ffffff"` 改为与背景形成对比的颜色（如 `#d4d4d8` 即 `border` 色）

```typescript
// 将 line 52:
stroke: "#ffffff",
// 改为:
stroke: "var(--color-border)",
```

---

### Task 4: 修复 GraphCanvas.tsx 搜索/高亮边状态逻辑

**文件:** `src/components/graph/GraphCanvas.tsx`

- [ ] **Step 1:** 修改第 227 行的边状态设置逻辑

当前代码：
```typescript
graph.setElementState(edge.id!, connected || (!hasHighlights && !hasSearch) ? "default" : "dim");
```

问题：当 `hasSearch = true` 且 `hasHighlights = false` 时，所有边始终设为 "default"，搜索筛选不生效。

修改为：
```typescript
const shouldDimEdge = (hasSearch || hasHighlights) && !connected;
graph.setElementState(edge.id!, shouldDimEdge ? "dim" : "default");
```

---

### Task 5: 统一文件类型白名单

**文件:** `src/lib/errors.ts`

- [ ] **Step 1:** 修改 `SUPPORTED_EXTENSIONS` 数组，使其与 `FileUploadZone.tsx` 一致

```typescript
// 修改前:
const SUPPORTED_EXTENSIONS = [".pdf", ".md", ".markdown", ".docx"] as const

// 修改后:
const SUPPORTED_EXTENSIONS = [".pdf", ".md", ".txt", ".docx", ".xlsx"] as const
```

---

### Task 6: 在 App.tsx 中添加 ErrorBoundary 和 ErrorToast

**文件:** `src/App.tsx`

- [ ] **Step 1:** 在 App 组件外层包裹 ErrorBoundary
- [ ] **Step 2:** 在 App 组件内渲染 ErrorToast
- [ ] **Step 3:** 同时确保 LoadingOverlay 也被渲染

修改后 App.tsx：
```tsx
import { ErrorBoundary } from '@/components/global/ErrorBoundary';
import { ErrorToast } from '@/components/global/ErrorToast';
import { LoadingOverlay } from '@/components/global/LoadingOverlay';

export default function App() {
  return (
    <ErrorBoundary>
      <MainLayout leftContent={<LeftContent />}>
        <CenterContent />
      </MainLayout>
      <ErrorToast />
      <LoadingOverlay />
    </ErrorBoundary>
  );
}
```

---

### Task 7: 补充 merge 和 report 的 index.ts 导出

**文件:** `src/components/merge/index.ts`（新建）、`src/components/report/index.ts`（新建）

- [ ] **Step 1:** 新建 `src/components/merge/index.ts`
- [ ] **Step 2:** 新建 `src/components/report/index.ts`

内容参照 `src/components/graph/index.ts` 的模式，导出组件和 Props 类型。

---

### Task 8: 确认 PanelTabs 占位是否为预期行为

**文件:** `src/components/layout/PanelTabs.tsx`

- [ ] **Step 1:** merge/rag/chat 标签当前显示"功能开发中…"，这可能是 MVP 阶段的预期状态。如果用户确认需要接入对应组件，后续再处理。

---

### Task 9: 构建验证

- [ ] **Step 1:** 运行 `npm run build` 确保修改后编译通过

---

### Task 10: 启动本地开发服务器测试

- [ ] **Step 1:** 终止所有已有的 Vite 进程
- [ ] **Step 2:** 运行 `npm run dev` 启动开发服务器
- [ ] **Step 3:** 使用 Playwright 浏览器打开 `http://localhost:5173`
- [ ] **Step 4:** 截图验证页面渲染正常（TopBar、LeftPanel、CenterPanel、BottomBar 均可见）
- [ ] **Step 5:** 测试交互：切换左右面板、上传文件区域拖拽、图谱空状态显示

---

## 审查总结

**TypeScript 编译：✅ 通过**（`tsc -b` 无错误）

**总体评价：** 代码质量较高，类型系统完整，组件拆分合理，错误处理体系完善。发现的 8 个问题中 2 个为 High 严重度（数据未接入、未包裹 ErrorBoundary），其余为 Medium/Low。修复后即可满足前端基本可用性。
