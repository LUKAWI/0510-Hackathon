# 审查问题修复任务

- [x] Task 1: 统一 ProcessingStage 类型
  - [x] 在 `stores/processing.ts` 的联合中添加 `"aligning"` 字面量
  - [x] 删除 `types/textbook.ts` 中 ProcessingStage 的定义和导出
  - [x] 修改 `types/index.ts`，将 ProcessingStage 从 stores/processing 重新导出
  - [x] `types/textbook.ts` 中 ProcessingTask.stage 改为 string
  - [x] `LoadingOverlay.tsx` 补全 `aligning` 阶段标签

- [x] Task 2: 替换 API 层 Record\<string, unknown\> 为具体类型
  - [x] `lib/api/merge.ts`：getDecisions 返回 MergeDecision[]，runIntegration decisions 改为 MergeDecision[]
  - [x] `lib/api/report.ts`：listReports 返回 FullIntegrationReport[]
  - [x] `components/merge/MergePanel.tsx`：移除 `as unknown as` 和 `as readonly MergeDecision[]` 双重转换
  - [x] `components/report/ReportPanel.tsx`：移除 `as Record\<string, unknown\>` 转换，直接使用类型属性

- [x] Task 3: 修复 useBatchDeleteTextbooks 部分失败逻辑
  - [x] mutationFn 不 throw，返回 `{ deleted, failed }` 结构
  - [x] onSuccess 中检查 failed 并 console.warn

- [x] Task 4: 修复 Textbook.status 类型
  - [x] `types/textbook.ts`：Textbook.status 从 string 改为 TextbookStatus

- [x] Task 5: 修复 FileUploadZone setTimeout 泄漏
  - [x] 使用 timeoutRef + useEffect cleanup 清理 setTimeout

- [x] Task 6: 修复 useBreakpoint SSR 快照
  - [x] `hooks/useBreakpoint.ts`：getServerSnapshot 返回 "narrow"

- [x] Task 7: 修复 useUploadTextbook 缺少 onError
  - [x] `hooks/useTextbooks.ts`：添加 onError 回调

- [x] Task 8: 修复 useRunIntegration 的 void invalidateQueries
  - [x] `hooks/useMerge.ts`：onSuccess 改为 async + Promise.allSettled

- [x] Task 9: 实现 MergePanel handleSave
  - [x] handleSave 调用 runIntegrationMutation.mutate({})，保存按钮改为条件 disabled

- [x] Task 10: 构建验证
  - [x] `npm run build` 通过（3685 modules，0 错误）

- [x] Task 11: 浏览器端到端验证
  - [x] 前端页面 6/6 UI 元素检查通过
  - [x] 页面错误: 0
  - [x] API /api/textbooks/ 返回 200
