# Insight Studio Agent Rules

本文件适用于整个仓库。任何 Agent 修改代码前必须先阅读本文件、`README.md`，以及与任务相关的 `docs/` 文档。

## 产品目标

Insight Studio 通过“连接器配置 → Dataset → 统一查询 API → 组件注册表 → Dashboard JSON”实现数据接入和展示。新增已有类型的数据源实例时，不修改 React 主页面或增加业务专用 Go 接口。

## 当前状态

- 当前是 React 纯前端原型。
- `lib/platform-api.ts` 中的 `platformAdapter` 当前绑定 Mock 实现。
- 数据源和 Dashboard 写入 LocalStorage。
- `lib/platform-data.ts` 中的数据均为演示数据。
- 尚未接入真实 Go API、密钥服务、调度器或数据存储。

不要把 Mock 行为描述成已接入生产服务。

## 修改前阅读顺序

1. `README.md`
2. `docs/integration-rules.md`
3. `docs/backend-adapter-contract.md`
4. `lib/platform-types.ts`
5. 与任务直接相关的组件和数据文件

## Source of truth

| 内容                 | 文件                                      |
| -------------------- | ----------------------------------------- |
| TypeScript 领域类型  | `lib/platform-types.ts`                   |
| 连接器字段和能力     | `lib/connector-definitions.ts`            |
| 前端服务边界         | `lib/platform-api.ts`                     |
| 组件注册表与演示配置 | `lib/platform-data.ts`                    |
| 运行时组件映射       | `components/platform/widget-renderer.tsx` |
| 机器可读协议         | `docs/schemas/*.schema.json`              |

修改契约时必须同步 TypeScript 类型、JSON Schema、示例和相关文档。

## 强制接入规则

1. React 组件不得直接请求 Jira、飞书、GitLab、数据库或其他业务数据源。
2. UI 只能依赖 `PlatformAdapter`；不要在页面组件中直接导入 `mockPlatformAdapter`。
3. 数据源配置只能保存 `authRef`。禁止提交真实 Token、密码、Cookie、私钥或带凭据的 URL。
4. 新增已有连接器类型的数据源实例只能产生配置，不得增加专用页面或专用 API。
5. 新连接器必须声明配置字段、必填规则和能力；生产端必须实现统一 Connector 协议。
6. 连接器输出必须先标准化为 Dataset。Dashboard 不得读取连接器原始响应。
7. 转换脚本只返回 `schema`、`rows` 和 `metadata`，不得返回 JSX、HTML、React 组件或执行浏览器代码。
8. Agent 输出必须通过确定性的 JSON Schema 校验后才能生成 Dataset Snapshot。
9. Dashboard JSON 只能引用组件注册表中的组件，不得包含脚本、远程模块或任意 HTML。
10. 图表组件必须处理 loading、error、empty 和字段类型不匹配状态。

详细规则和示例见 `docs/integration-rules.md`。

## 分层约束

```text
UI component
  -> PlatformAdapter
    -> Go control API
      -> Connector runtime / Scheduler / Worker
        -> Dataset Snapshot
          -> Query API
            -> WidgetRenderer
```

禁止跨层：

- `WidgetRenderer` 不访问外部数据源。
- Connector 不输出页面配置。
- Dashboard 不保存查询结果或凭据。
- Dataset 不包含 React 展示属性。
- 页面不根据连接器类型解析业务字段。

## 扩展规则

### 数据源实例

使用接入向导创建。相同连接器类型的新实例无需代码修改。

### 新连接器类型

- 更新 `ConnectorType`。
- 增加 `ConnectorDefinition`。
- 优先复用字段渲染器，避免添加连接器专用 JSX。
- 更新 JSON Schema connector 枚举。
- 增加 Go Connector 或受控 Worker 实现。
- 提供连接测试、样本、失败和脱敏行为。

### 新 Dataset 字段类型

不要直接扩展字符串枚举。先确认查询、序列化、图表兼容判断和 Go 类型均能处理，再同步所有 Schema。

### 新组件

- 先声明组件输入角色契约。
- 再实现 `WidgetRenderer`。
- 保持数据输入为 Dataset rows、mapping 和 options。
- 特殊业务组件应证明无法由现有通用组件实现。

## 设计规则

- 保持当前浅色默认的柔和蓝色后台风格。
- 使用现有 CSS 变量和 shadcn/ui 组件。
- 不引入与现有界面冲突的第二套主题。
- 卡片圆角、间距、边框和状态颜色保持一致。
- 所有交互控件提供文本或 `aria-label`。
- 移动端和折叠侧栏不能退化。

## 安全规则

- 日志和错误信息必须对凭据、Header 和查询参数脱敏。
- 浏览器不持有可用于访问生产系统的长期密钥。
- SQL 必须参数化，并对白名单字段、聚合、排序和 limit 做校验。
- JavaScript 转换运行在隔离环境中，限制网络、文件、CPU 和内存。
- Python 解析运行在独立 Worker 中，通过对象存储交换文件。
- 远程 React 模块、任意 ES Module 和未审核 iframe 不属于当前支持范围。

## 验证要求

修改完成至少运行：

```bash
npx oxfmt <changed-files>
npx oxlint <changed-ts-and-tsx-files>
npx tsc --noEmit --incremental false
npm run build
```

当前全仓 `npm run lint` 会报告部分上游 `components/ui` 的既有规则问题。不要通过关闭规则掩盖本次新增错误；对修改文件运行定向 lint。

## 完成标准

- 行为与文档一致。
- 类型、JSON Schema 和示例同步。
- 不泄露凭据。
- TypeScript 与生产构建通过。
- 新增交互具有错误、空数据和加载状态。
- README 或相关文档说明用户如何使用新增能力。
