# 前后端对齐验证清单

- [x] `src/lib/api/client.ts` 中 `BASE_URL` 包含 `/api` 后缀
- [x] `npm run build` 无 TypeScript 错误
- [x] 后端 FastAPI 在 `localhost:8000` 正常运行
- [x] `GET http://localhost:8000/api/health` 返回 200
- [x] 前端 `http://localhost:5173/` 可正常访问
- [x] `GET /api/textbooks/` API 调用返回 200（空数组）
- [x] 前端页面 UI 组件（TopBar、CenterPanel、BottomBar、RightPanel）完整渲染
- [x] 左侧教材管理面板在展开模式下显示上传区域
- [x] 中间知识图谱区域显示空状态提示"暂无知识图谱"
- [x] 无 JavaScript 运行时错误或未捕获异常（0 errors）
