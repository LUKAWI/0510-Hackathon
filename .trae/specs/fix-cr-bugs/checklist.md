# 审查问题修复验证清单

- [x] `stores/processing.ts` 中 ProcessingStage 包含 "aligning" 字面量
- [x] `types/textbook.ts` 中不再定义 ProcessingStage
- [x] `types/index.ts` 从 stores 重新导出 ProcessingStage
- [x] `lib/api/merge.ts` 中 getDecisions 返回 MergeDecision[]（非 Record）
- [x] `lib/api/merge.ts` 中 runIntegration.decisions 为 MergeDecision[]
- [x] `lib/api/report.ts` 中 listReports 返回 FullIntegrationReport[]
- [x] `hooks/useTextbooks.ts` 批量删除不再 throw，返回 { deleted, failed }
- [x] `types/textbook.ts` 中 Textbook.status 为 TextbookStatus 类型
- [x] `components/textbook/FileUploadZone.tsx` 有 useEffect cleanup 清理 setTimeout
- [x] `hooks/useBreakpoint.ts` getServerSnapshot 返回 "narrow"
- [x] `hooks/useTextbooks.ts` useUploadTextbook 有 onError
- [x] `hooks/useMerge.ts` onSuccess 使用 Promise.allSettled
- [x] `components/merge/MergePanel.tsx` handleSave 已实现，保存按钮已启用
- [x] `npm run build` TypeScript 编译通过，0 错误
- [x] 前端 `http://localhost:5173/` 可正常访问，Console 0 错误
- [x] 后端 API 正常响应 200
