# Insight Studio

Insight Studio 是一个基于 React、TypeScript 和 shadcn/ui 的元数据驱动数据接入与可视化编排平台。它将外部数据源标准化为统一 Dataset，再通过组件注册表和 Dashboard JSON 动态生成研发效能大屏。

平台当前覆盖工具使用量、CICT 测试结果和 Go/ACP/Agent Pipeline 运行情况，并为 Jira、飞书、GitLab、数据库、HTTP、Webhook、文件和脚本等数据提供统一接入入口。

## 核心原则

```mermaid
flowchart LR
    A[Connector Definition] --> B[Data Source Instance]
    B --> C[采集与转换]
    C --> D[Dataset Snapshot]
    D --> E[统一查询 API]
    E --> F[Component Registry]
    F --> G[Dashboard JSON]
    G --> H[React Renderer]
```

- React 只管理连接配置、Dataset 契约和页面编排，不直接访问 Jira、数据库或飞书。
- 数据源实例只引用连接器类型。新增同类数据源不增加 Go 接口或 React 页面。
- 所有连接器最终输出 Dataset。前端不感知数据来自哪个系统。
- 密钥不进入配置、日志、LocalStorage 或 Dataset，只保存 `authRef`。
- 转换脚本只处理数据，不返回 JSX、HTML 或可执行的 Dashboard 内容。
- Dashboard JSON 只能引用注册组件，不能携带任意脚本。

更完整的开发约束见 [AGENTS.md](AGENTS.md) 和 [接入规则](docs/integration-rules.md)。

## 当前功能

- 浅色和暗色后台界面、响应式与可折叠侧边栏
- 基于 Efferd `dashboard-3` 的中性 inset 后台布局和紧凑数据卡片
- 元数据驱动的六步数据源接入向导
- HTTP、MySQL、PostgreSQL、Jira、飞书、GitLab、CSV/Excel、Webhook、Agent 和脚本连接器定义
- 连接测试、样本预览、Schema 推断、字段角色配置、同步策略和发布
- Dataset 字段、版本、权限、缓存、数据预览与血缘展示
- Metric、Table、Line、Bar、Pie、Progress、Status List、Markdown 组件注册表
- 按 Dataset Schema 自动判断可用组件
- 24 列 Dashboard 编排、字段映射、拖拽排序、JSON 校验和动态渲染
- 数据源与 Dashboard 的浏览器持久化

## 当前实现边界

这是一个可交互的纯前端原型：

- `platformAdapter` 当前绑定 `mockPlatformAdapter`。
- 新增数据源和 Dashboard 保存在 LocalStorage。
- 连接测试、预览数据、运行记录和 Dataset 行是演示数据。
- 页面不会访问真实密钥或外部系统。

接入 Go 服务时，只需要实现 `PlatformAdapter` 并替换 [lib/platform-api.ts](lib/platform-api.ts) 中的应用绑定。组件不应直接调用 `fetch` 或依赖 Mock 数据。

## 快速开始

要求 Node.js 22.13 或更高版本。

```bash
npm install
npm run dev
```

访问：

- 平台总览：<http://localhost:3000/#overview>
- 数据源：<http://localhost:3000/#sources>
- Dataset：<http://localhost:3000/#datasets>
- 运行记录：<http://localhost:3000/#runs>
- 大屏管理：<http://localhost:3000/#dashboards>
- 组件注册表：<http://localhost:3000/#components>

## 使用方法

### 接入现有连接器的数据源

1. 打开“数据源”，点击“新增数据源”。
2. 选择连接器类型。
3. 填写名称、负责人和连接参数。认证字段填写 `authRef`。
4. 执行连接测试并读取样本。
5. 检查推断出的字段类型，将字段标记为维度、指标或时间。
6. 填写 Dataset ID，选择全量、增量或实时同步。
7. 检查脱敏后的 JSON 并发布。

### 新增一种连接器类型

1. 在 [lib/platform-types.ts](lib/platform-types.ts) 的 `ConnectorType` 中注册类型。
2. 在 [lib/connector-definitions.ts](lib/connector-definitions.ts) 中增加 `ConnectorDefinition`，声明字段和能力。
3. 在开发阶段为 Adapter 增加预览样本；生产阶段在 Go 中实现统一 Connector 接口。
4. 更新 [数据源 JSON Schema](docs/schemas/data-source.schema.json) 的 connector 枚举。
5. 增加脱敏、失败和空数据验证。

不要为连接器实例增加专用 React 表单、页面或业务 API。

### 新增 Dataset

1. 定义稳定且唯一的 Dataset ID。
2. 为每个字段声明 `type`、`role`、显示名称和含义。
3. 指定负责人、权限、刷新方式、缓存和血缘。
4. 确保转换结果通过 [Dataset JSON Schema](docs/schemas/dataset.schema.json)。
5. 在 Dashboard 中按字段角色完成组件映射。

### 新增可视化组件

1. 在 `ComponentType` 和 `componentDefinitions` 中注册组件与字段契约。
2. 在 `WidgetRenderer` 中实现渲染分支。
3. 明确空数据、加载、错误和类型不匹配状态。
4. 组件不能自行访问业务数据源；数据必须来自 Dataset 查询接口。
5. 更新 Dashboard Schema 与示例配置。

## 项目结构

```text
app/
  page.tsx                          页面入口与导航
  globals.css                      主题和平台样式
components/platform/
  source-wizard.tsx                数据源接入向导
  sources-view.tsx                 数据源管理
  datasets-view.tsx                Dataset 浏览器
  dashboards-view.tsx              Dashboard 编排器
  components-view.tsx              组件注册表
  widget-renderer.tsx               动态组件渲染
lib/
  connector-definitions.ts         连接器表单和能力元数据
  platform-types.ts                TypeScript 数据契约
  platform-api.ts                  PlatformAdapter 与当前绑定
  platform-data.ts                 演示数据、组件和 Dashboard 配置
docs/
  integration-rules.md             接入与扩展规则
  backend-adapter-contract.md      Go API 和 Adapter 协议
  metadata-platform-architecture.md 架构与落地顺序
  schemas/                         机器可读 JSON Schema
examples/
  data-source.jira.json            数据源示例
  transform.normalize-test-cases.js 转换脚本示例
```

## 数据存储

原型使用以下 LocalStorage 键：

| 键                       | 内容                 |
| ------------------------ | -------------------- |
| `insight-sources`        | 用户新增的数据源实例 |
| `insight-dashboards`     | Dashboard 配置       |
| `insight-admin-theme-v2` | 主题选择             |

不要在这些键中保存 Token、密码、Cookie 或私钥。

## 验证

```bash
npx oxfmt <changed-files>
npx oxlint <changed-ts-and-tsx-files>
npx tsc --noEmit --incremental false
npm run build
```

`components/ui` 中部分上游 shadcn 通用组件存在既有 oxlint 可访问性告警，所以当前应对本次修改文件运行定向 lint。生产构建和 TypeScript 检查必须通过。

## 文档索引

- [Agent 开发规则](AGENTS.md)
- [数据接入与扩展规则](docs/integration-rules.md)
- [Go API 与 PlatformAdapter 契约](docs/backend-adapter-contract.md)
- [平台架构](docs/metadata-platform-architecture.md)
- [Connector Definition Schema](docs/schemas/connector-definition.schema.json)
- [数据源 Schema](docs/schemas/data-source.schema.json)
- [Dataset Schema](docs/schemas/dataset.schema.json)
- [Dashboard Schema](docs/schemas/dashboard.schema.json)
