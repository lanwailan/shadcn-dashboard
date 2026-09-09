# Insight Studio

一个基于 React、TypeScript 和 shadcn/ui 的元数据驱动数据接入与可视化编排平台原型。

平台将数据接入、Dataset 契约、组件能力和页面布局拆成独立配置。新增常规数据源时，可以复用连接器、输出标准 Dataset，再通过 Dashboard JSON 选择组件与字段映射，无需修改 React 主页面。

## 已实现

- HTTP API、数据库、Jira、飞书、GitLab、文件、Webhook、Agent 和脚本连接器入口
- Dataset Schema、字段角色、查询参数、权限、缓存、数据预览和血缘
- Metric、Table、Line、Bar、Pie、Progress、Status List、Markdown 组件注册表
- 根据 Dataset Schema 自动过滤兼容组件
- 24 列 Dashboard 编排、字段映射、拖拽排序、JSON 校验和预览
- 数据源与 Dashboard 配置的 LocalStorage 持久化
- 深色、浅色主题与响应式侧边栏

## 本地运行

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。

## 验证

```bash
npx tsc --noEmit --incremental false
npm run lint
npm run build
```

## 示例与架构

- [架构说明](docs/metadata-platform-architecture.md)
- [Jira 数据源配置](examples/data-source.jira.json)
- [JavaScript 标准化转换](examples/transform.normalize-test-cases.js)

当前版本是纯前端可交互原型，配置保存在浏览器中，所有业务数据均为演示数据。生产接入边界、统一 API 和 Go 服务拆分见架构说明。
