# Checklist: 前端 UI 设计与适配全面优化

## 色彩系统
- [x] 浅色模式：primary 色为学术蓝 (#2563EB)，卡片背景为浅灰 (#F8FAFC)
- [x] 深色模式：primary 色为亮蓝 (#3B82F6)，背景为暗蓝灰 (#0F172A)
- [x] 所有颜色通过 CSS 变量引用，无硬编码 hex 值
- [x] 色彩变量包含 RGB 辅助值（用于 rgba() 运算）
- [x] primary / secondary / muted / accent / destructive 五层语义色完整定义

## 字体与排版
- [x] Noto Sans SC 中文字体通过 Google Fonts CDN 加载
- [x] index.html 中有字体 preload link 标签
- [x] font-sans 字体栈为: "Noto Sans SC", "Inter", ...系统回退
- [x] 中文内容行高 ≥ 1.7（leading-relaxed）
- [x] 中文内容字距：letter-spacing: 0.02em
- [x] 正文字号 ≥ 13px，长篇内容 ≥ 14px

## 组件样式状态
- [x] Button: default/hover/active/focus-visible/disabled 五种状态完整
- [x] Card: default/hover 两种状态（悬浮阴影）
- [x] Tabs: trigger 的 default/hover/active 三种状态
- [x] Input: default/focus/disabled 三种状态
- [x] Badge: default/secondary/outline/destructive 四种 variant

## 动画与动效（L2）
- [x] 面板展开/折叠使用弹性曲线 cubic-bezier(0.34,1.56,0.64,1)，300ms
- [x] fadeInUp keyframes 已定义（opacity 0→1 + translateY 8px→0）
- [x] 教材列表项入场有 stagger 交错动画（50ms 间隔）
- [x] 聊天消息入场有 fadeInUp 动画
- [x] 按钮点击有涟漪效果（scale + opacity 反馈）
- [x] 所有动画支持 prefers-reduced-motion: reduce 降级

## 暗色模式
- [x] globals.css 中有 @media (prefers-color-scheme: dark) 媒体查询块
- [x] TopBar 在暗色模式下背景/文字适配
- [x] LeftPanel/RightPanel 在暗色模式下边框/背景适配
- [x] 聊天消息气泡在暗色模式下适配（用户消息/助手消息颜色区分）
- [x] 所有 shadcn/ui 组件通过 CSS 变量自动适配暗色模式
- [x] 图谱背景在暗色模式下适配（白底→暗底）

## 响应式适配
- [x] Narrow (<1024px): TopBar 隐藏项目名文字，仅显示图标
- [x] Narrow (<1024px): 面板切换按钮触摸目标 ≥ 44×44px
- [x] Narrow (<1024px): 底部抽屉高度 380px，顶部有拖拽条
- [x] Medium (1024-1440px): 底部抽屉高度 420px
- [x] Wide/Desktop (≥1440px): 右侧面板宽度 400px
- [x] 所有视口宽度下无横向溢出
- [x] 图谱在窄屏下自适应缩放不超出容器

## 性能优化
- [x] GraphCanvas 使用 React.lazy 懒加载
- [x] GraphCanvas 懒加载有 Suspense fallback 骨架屏
- [x] TAB_CONFIGS 提取到模块级别（不在渲染时重建）
- [x] STAGE_LABELS 提取到模块级别
- [x] 教材列表/聊天消息列表容器使用 content-visibility: auto
- [x] npm run build 通过，无 TypeScript 错误

## 排版一致性
- [x] 所有面板标题使用统一字号/字重
- [x] 面板内 padding 统一为 p-4，组件间 gap 统一为 gap-4
- [x] 状态标签/徽章字号统一
- [x] 中英文混排字体回退正确
- [x] 无内联 style={{...}} 样式（全部 Tailwind 类名）

## 构建验证
- [x] npm run build 通过，零 TypeScript 错误
- [x] npm run lint 通过，零 ESLint 告警
- [x] npm run dev 启动后无控制台报错（前端编译正常）
- [x] 所有面板在有数据和空数据状态下均显示正常
