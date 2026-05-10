# Tasks: 前端 UI 设计与适配全面优化

- [x] Task 1: 重写全局设计令牌系统 (globals.css)
  - [ ] 定义学术蓝色彩系统 CSS 变量（浅色 + 深色两套）
  - [ ] 引入 Noto Sans SC 中文字体（Google Fonts CDN）
  - [ ] 配置中文排版基础样式（字号、行高、字距）
  - [ ] 定义阴影系统变量（shadow-sm/md/lg/xl）
  - [ ] 配置 prefers-reduced-motion 降级变量
  - [ ] 在 index.html 中添加字体 preload link
  - **验证**: `npm run dev` 启动后页面显示学术蓝配色 + 中文字体

- [x] Task 2: 升级 shadcn/ui 基础组件样式
  - [x] 升级 Button 组件：补全所有 variant 的 hover/focus/active/disabled 状态，增加点击涟漪反馈动画
  - [x] 升级 Card 组件：增加悬浮阴影效果，圆角统一为 --radius-lg
  - [x] 升级 Tabs 组件：激活态指示器从黑色改为 primary 色，增加过渡动画
  - [x] 升级 Badge 组件：增加 secondary/outline variant 样式
  - [x] 升级 Input 组件：focus 边框改为 primary 色，增加 transition
  - [x] 升级 Progress 组件：填充色改为 primary 色
  - [x] 升级 ScrollArea 组件：滚动条样式适配暗色模式
  - [x] 升级 Separator 组件：透明度微调
  - **验证**: 对比 Button/Card/Tabs/Input 新旧样式视觉效果

- [x] Task 3: 优化布局组件视觉与动画
  - [x] TopBar: 窄屏自动隐藏项目名（仅图标），弹性动画入场
  - [x] LeftPanel: 宽度过渡改用弹性曲线 `cubic-bezier(0.34,1.56,0.64,1)`，300ms
  - [x] LeftPanel: 面板标题栏高度/间距优化（h-10→h-11，更舒适的留白）
  - [x] RightPanel: 侧边栏宽度过渡改弹性曲线
  - [x] RightPanel: 底部抽屉高度从 340px→380px，过渡改弹性曲线
  - [x] RightPanel: 底部抽屉增加水平拖拽条视觉提示
  - [x] RightPanel: 底部抽屉展开时自动滚动到顶部
  - [x] BottomBar: 增加暗色模式适配
  - **验证**: 反复展开/折叠面板，动画流畅且视觉舒适

- [x] Task 4: 添加列表与消息交错入场动画
  - [x] 创建 `src/lib/animation.ts` 工具模块（staggerDelay 辅助函数）
  - [x] 在 globals.css 中定义 `@keyframes fadeInUp` 和 `.animate-fade-in-up` 类
  - [x] TextbookItem: 添加 stagger 入场动画（opacity + translateY）
  - [x] ChatMessage: 新消息入场添加 fadeInUp 动画
  - [x] CitationCard: 引用卡片添加 fadeInUp 动画
  - [x] DecisionCard: 决策卡片添加 stagger 动画
  - **验证**: 上传教材后列表项依次淡入，发送消息后回复消息淡入

- [x] Task 5: 实现暗色模式支持
  - [x] 在 globals.css 中添加 `@media (prefers-color-scheme: dark)` 媒体查询块
  - [x] 确保所有布局组件（TopBar/LeftPanel/CenterPanel/RightPanel/BottomBar）使用 `dark:` 前缀适配
  - [x] 确保所有 shadcn/ui 组件通过 CSS 变量自动适配暗色模式
  - [x] 确保图谱背景在暗色模式下适配
  - [x] 确保聊天消息气泡在暗色模式下适配
  - **验证**: 系统切换暗色模式后，页面各区域颜色正确过渡

- [x] Task 6: 响应式布局细节优化
  - [ ] Narrow 模式 (<1024px): 确保所有按钮触摸目标 ≥ 44×44px（通过 min-h/min-w + padding）
  - [ ] Narrow 模式: TopBar 面板切换按钮增大点击区域
  - [ ] Narrow 模式: 底部抽屉拖拽条视觉优化
  - [ ] Medium 模式 (1024-1440px): 调整右侧抽屉高度至 420px 以更好显示内容
  - [ ] Wide/Desktop 模式: 右侧面板宽度从 380px→400px，增加内容空间
  - [ ] 图谱区域在窄屏下自动缩放适配
  - **验证**: 在不同视口宽度下（375px / 768px / 1280px / 1920px）测试布局

- [x] Task 7: 性能优化（vercel-react-best-practices）
  - [x] GraphCanvas 使用 `React.lazy` + `<Suspense>` 懒加载，添加 fallback 骨架屏
  - [x] GraphToolbar/GraphLegend/NodeDetailPanel 同步懒加载
  - [x] 将 TAB_CONFIGS 等静态数据提取到模块级别（避免重新创建）
  - [x] 将 TopBar 中 STAGE_LABELS 提取到模块级别
  - [x] 对教材列表滚动容器添加 `content-visibility: auto` CSS
  - [x] 对聊天消息列表滚动容器添加 `content-visibility: auto` CSS
  - **验证**: `npm run build` 通过，首屏 JS bundle 不增反降

- [x] Task 8: 全局排版一致性调整
  - [ ] 统一面板标题样式：14px font-medium + 适当间距
  - [ ] 统一内容区文字：13-14px + leading-relaxed
  - [ ] 统一状态标签/徽章：11-12px
  - [ ] 统一间距：面板内 padding 从 p-3→p-4，组件间 gap 从 gap-3→gap-4
  - [ ] 确保所有中文文本使用正确的 letter-spacing
  - **验证**: 视觉检查各面板排版一致性

- [x] Task 9: 构建验证与修复
  - [ ] 运行 `npm run build`，修复 TypeScript 和 CSS 编译错误
  - [ ] 运行 `npm run lint`，修复 ESLint 告警
  - [ ] 本地启动 `npm run dev`，手动浏览所有面板和交互
  - [ ] 在不同浏览器窗口尺寸下验证响应式效果
  - **验证**: build 和 lint 全部通过，无 UI 异常

# Task Dependencies

- Task 2 依赖 Task 1（先有色彩系统，才能升级组件样式）
- Task 3 依赖 Task 1（布局组件的动画曲线依赖 CSS 变量）
- Task 4 依赖 Task 1（动画 keyframes 定义在 globals.css）
- Task 5 依赖 Task 1（暗色模式变量在 globals.css 中定义）
- Task 2 和 Task 3 可以并行（UI 组件和布局组件独立）
- Task 6 依赖 Task 3（响应式优化基于布局组件）
- Task 7 依赖 Task 1（无需其他任务完成，可独立进行）
- Task 8 依赖 Task 1-5（基于已有的样式系统进行一致性调整）
- Task 9 依赖 Task 1-8（全部完成后构建验证）
