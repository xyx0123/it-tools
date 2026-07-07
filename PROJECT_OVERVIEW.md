# IT-Tools 工程说明

## 1. 项目定位

IT-Tools 是一个基于 Web 的开发者工具集合站点，前端内置多类实用工具（当前代码中可见约 86 个工具模块），通过单页应用统一承载。

## 2. 技术栈

### 2.1 运行时与语言

- Node.js（建议使用 18+）
- TypeScript 5
- Vue 3（Composition API）

### 2.2 前端框架与核心库

- vue: UI 框架
- vue-router: 路由管理
- pinia: 状态管理
- vue-i18n: 国际化
- @vueuse/core / @vueuse/head: 常用组合式工具与 Head 管理
- naive-ui: 组件库

### 2.3 构建与工程化

- Vite 4
- pnpm（packageManager 指定为 pnpm@9.11.0）
- vue-tsc: Vue + TS 类型检查
- ESLint + @antfu/eslint-config
- Prettier
- unplugin-auto-import / unplugin-vue-components: 自动导入
- unplugin-icons: 图标按需引入
- vite-svg-loader: SVG 组件化
- vite-plugin-vue-markdown: Markdown 作为 Vue 组件
- vite-plugin-pwa + workbox-window: PWA 支持
- UnoCSS + presetAttributify + presetTypography + presetScrollbar: 原子化样式体系

### 2.4 测试

- Vitest（单元测试，jsdom 环境）
- Playwright（E2E，多浏览器项目）

## 3. 工程结构（核心目录）

- src/main.ts: 应用入口，注册 Pinia、Head、i18n、Router、UI 插件与 PWA
- src/App.vue: 顶层容器，挂载主题、消息、通知、动态布局
- src/router.ts: 路由注册，动态注入工具路由与重定向路由
- src/tools/: 工具系统核心目录
- src/tools/index.ts: 工具清单与分类聚合
- src/tools/tools.store.ts: 工具列表、收藏、分组等状态逻辑
- src/layouts/: 页面布局（基础布局 / 工具布局）
- src/pages/: 首页、关于页、404 页等
- src/plugins/: i18n、naive-ui、统计插件
- src/modules/: 命令面板、国际化组件、共享模块、追踪模块
- locales/: 多语言资源文件
- scripts/: 发布、changelog、脚手架生成等脚本
- public/: 静态资源

## 4. 路由与工具组织方式

### 4.1 路由来源

- 基础页面路由：`/`、`/about`、404
- 工具路由：由 `src/tools/index.ts` 中导出的 `tools` 列表自动映射
- 重定向路由：工具的 `redirectFrom` 字段展开生成
- 开发环境专用 demo 路由：仅在 development 环境注入

### 4.2 工具定义模式

每个工具目录通常导出一个 `tool` 对象，包含：

- name
- path
- description
- keywords
- component（懒加载组件）
- icon
- redirectFrom（可选）
- createdAt（可选，用于新工具标记）

## 5. 配置与环境变量

项目通过 `src/config.ts` 做集中配置校验与读取（figue）：

- APP 类
  - PACKAGE_VERSION
  - VITE_VERCEL_GIT_COMMIT_SHA
  - BASE_URL
  - VITE_VERCEL_ENV
- 统计类（Plausible）
  - VITE_TRACKER_ENABLED
  - VITE_PLAUSIBLE_DOMAIN
  - VITE_PLAUSIBLE_API_HOST
- 展示控制
  - VITE_SHOW_BANNER
  - VITE_SHOW_SPONSOR_BANNER

## 6. 本地开发与常用命令

```bash
pnpm install
pnpm dev
```

其他命令：

```bash
pnpm build      # 类型检查 + 生产构建
pnpm preview    # 本地预览构建产物（5050）
pnpm test       # 单元测试
pnpm test:e2e   # Playwright 端到端测试
pnpm lint       # ESLint
```

## 7. 构建与发布特性

- 构建目标：esnext
- 支持 PWA manifest 与 service worker 自动更新
- 支持 BASE_URL 注入，便于子路径部署
- 提供 Dockerfile、nginx.conf、vercel/netlify 配置，便于多平台部署

## 8. 国际化与主题

- 国际化：基于 `@intlify/unplugin-vue-i18n` 预编译 messages + vue-i18n 运行时
- 主题：Naive UI 深色/浅色主题切换，主题覆盖位于 `src/themes.ts`
- 本地持久化：例如语言与收藏工具通过 storage 持久化

## 9. 扩展开发建议

### 9.1 新增工具

使用脚手架命令：

```bash
pnpm run script:create:tool my-tool-name
```

会在 `src/tools` 生成新工具目录，并更新工具导入入口；之后补充分类注册与业务实现。

### 9.2 新增 UI 组件模板

```bash
pnpm run script:create:ui
```

## 10. 适合二次开发的点

- 新增/下线某类工具（围绕 `src/tools/index.ts` 与工具目录）
- 切换站点主题与视觉体系（`src/themes.ts` + UnoCSS 配置）
- 接入新的统计或埋点方案（`src/plugins/plausible.plugin.ts`）
- 扩展 i18n 语言（`locales/` 与工具内 locales）

## 11. 快速结论

这是一个标准的 Vue 3 + Vite + TypeScript 单页应用，工程化成熟，适合作为“多工具聚合平台”模板继续扩展。其核心优势在于：工具模块化、路由自动化、国际化与主题体系完整、并且具备可直接落地的测试与部署链路。
