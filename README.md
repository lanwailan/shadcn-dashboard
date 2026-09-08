# Insight Admin

纯前端研发数据后台，使用 React 19、TypeScript、shadcn/ui（Base UI）、Recharts。布局参考 Shadcn Admin。默认深色，可切换浅色。

## 运行

```sh
npm install
npm run dev
npm run build
```

`dist/client` 是可部署的静态目录。Hash 导航支持直接进入 `/#tools`、`/#cict`、`/#pipeline`，无需服务器路由改写。没有应用后端、数据库或认证逻辑。

## 功能

- 总览：指标、7 日趋势、最近解析、三个数据维度入口。
- 工具：注册、版本、激活、Token、调用分布、小时分布、会话深度、注册用户明细。
- CICT：每日汇总、类型/用户/平台分布、搜索与状态筛选、任务展开、BFT/CAN/IMMO 明细、日志和 JSON 报告、下载。
- 流水线：Go → ACP → Agent CLI → 结果归档、Worker、队列、耗时分布。
- 重新解析为 1.6 秒前端模拟，仅更新最近任务，不修改全天统计快照。测试失败与解析失败独立。

## 接入与扩展

`lib/dashboard-data.ts` 定义 CaseRecord、TestResult、状态、演示数据与日志生成。接入 Go 时将此数据适配层换成 HTTP API，组件无需了解 ACP 细节。

建议接口：

- `GET /api/metrics/tools?from=&to=`：聚合指标、时间序列与分布。
- `GET /api/cict/cases?query=&status=&cursor=`：分页任务。
- `GET /api/cict/cases/:id`：基础信息、测试细则、日志与结果文件。
- `POST /api/cict/cases/:id/reparse`：返回排队任务 ID；后端执行幂等保护。
- `GET /api/pipeline`：队列与 Worker 快照。通过 SSE 或轮询更新任务。

`components/dashboard/shared.tsx` 是 Stat / Panel / Pill / Distribution / TrendChart 等公共组件。`case-table.tsx` 在 CICT 和流水线间复用。`app/globals.css` 维护主题和布局。新增维度：增加 View 组件，在 app/page.tsx 的 dimensions 中注册导航并添加渲染，再在总览增加指标入口。

所有姓名、路径与数据为演示内容，Jenkins 路径是文本示例。重新解析不调用服务器。主题偏好保存在当前浏览器中。

## 检查

`npx tsc --noEmit` 和 `npm run build` 验证类型与静态导出。未进行浏览器交互 QA。可选 WebMCP 在支持 document.modelContext 的浏览器中暴露读取和模拟重解析功能；普通浏览器自动忽略。

检查说明：生成模板自带的部分 components/ui 与 use-mobile.ts 存在 lint 规则冲突，未修改第三方组件。本次业务代码单独运行 oxlint。WebMCP 未在支持的浏览器上下文中验证。
