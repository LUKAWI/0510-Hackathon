# 审查问题全面修复 Spec

## Why
3 轮代码审查（前端组件、hooks/stores/types、后端路由服务）发现 3 个严重 Bug 和 4 个中等 Bug，需要统一修复以保证类型安全和运行时正确性。

## What Changes
- **统一 `ProcessingStage` 类型**：删除 `types/textbook.ts` 中的重复定义，合并缺失字面量到 `stores/processing.ts`，`types/index.ts` 从 store 重新导出
- **替换 `Record<string, unknown>` 为具体类型**：`merge.ts` 和 `report.ts` 的 API 返回类型
- **修复 `useBatchDeleteTextbooks` 部分失败逻辑**
- **修复 `Textbook.status` 类型**
- **修复 `FileUploadZone` setTimeout 泄漏**
- **修复 `useBreakpoint` SSR 快照**
- **修复 `useUploadTextbook` / `useRunIntegration` 错误处理**
- **修复 `MergePanel` handleSave 空函数**

## Impact
- Affected specs: fix-backend-api-alignment（类型部分）
- Affected code: `src/types/textbook.ts`、`src/types/index.ts`、`src/stores/processing.ts`、`src/lib/api/merge.ts`、`src/lib/api/report.ts`、`src/hooks/useTextbooks.ts`、`src/hooks/useMerge.ts`、`src/hooks/useBreakpoint.ts`、`src/components/textbook/FileUploadZone.tsx`、`src/components/merge/MergePanel.tsx`

## ADDED Requirements

### Requirement: ProcessingStage 类型唯一来源
系统 SHALL 将 `ProcessingStage` 统一定义在 `stores/processing.ts` 中，`types/textbook.ts` 不再定义此类型，`types/index.ts` 从 store 重新导出。合并后的字面量集合为：`"idle" | "uploading" | "parsing" | "extracting" | "building_graph" | "aligning" | "merging" | "indexing" | "done" | "error"`。

### Requirement: API 层使用具体 DTO 类型
`getDecisions()` SHALL 返回 `MergeDecision[]` 而非 `Array<Record<string, unknown>>`。`runIntegration()` 的 `decisions` 字段 SHALL 为 `MergeDecision[]`。`listReports()` SHALL 返回 `FullIntegrationReport[]`。

### Requirement: 批量删除部分失败安全处理
`useBatchDeleteTextbooks` SHALL 不因部分失败抛出异常，改为返回 `{ deleted: number; failed: { id: string; reason: string }[] }`，由调用方 `onSuccess` 统一刷新缓存。

### Requirement: Textbook.status 类型为精确联合
`Textbook` 接口中 `status` 字段 SHALL 从 `string` 改为 `TextbookStatus`（`"processing" | "ready" | "error"`）。

### Requirement: FileUploadZone 定时器清理
`FileUploadZone` 中的 `setTimeout(resetState, 2000)` SHALL 在组件卸载时通过 `useEffect` cleanup 函数清除。

### Requirement: useBreakpoint SSR 快照安全
`useBreakpoint` 中 `getServerSnapshot` SHALL 返回 `"narrow"` 代替 `"desktop"`，避免窄屏设备 hydration mismatch。

### Requirement: useUploadTextbook 错误反馈
`useUploadTextbook` SHALL 添加 `onError` 回调，使用 toast 通知用户上传失败。

### Requirement: useRunIntegration 错误处理
`onSuccess` 中的 3 个 `void invalidateQueries` SHALL 改为 `async` + `Promise.allSettled`。

### Requirement: MergePanel handleSave 功能
`handleSave` SHALL 实现保存决策到后端的逻辑（调用 `mergeApi.saveDecisions`）。
