# 数据接入与扩展规则

本文定义 Insight Studio 的数据源、Dataset、转换、组件和 Dashboard 接入规则。产品代码、Go 服务、Worker 和自动化 Agent 都应遵守这些约束。

## 1. 术语

| 术语                 | 含义                                                |
| -------------------- | --------------------------------------------------- |
| Connector Definition | 一种连接协议的元数据，包括表单字段和能力            |
| Data Source Instance | 某个连接器的一份具体配置，例如 Jira CICT 项目       |
| Source Data          | 外部系统返回的原始数据，只在采集与转换阶段存在      |
| Dataset Definition   | 稳定的数据契约，包括字段、版本、负责人和权限        |
| Dataset Snapshot     | 某次成功运行产生的不可变数据版本                    |
| Transform            | 将 Source Data 转换为标准 Dataset rows 的规则       |
| Component Definition | 组件接受的字段角色和支持能力                        |
| Dashboard            | 由布局、Dataset 引用、字段映射和组件选项组成的 JSON |

## 2. 两类接入操作

### 新增数据源实例

适用于平台已经支持的 HTTP、MySQL、Jira 等连接器。用户只需在向导中提交配置，不需要修改代码。

```text
选择 Connector Definition
→ 填写 Data Source Instance
→ 测试连接
→ 获取样本
→ 推断并确认 Schema
→ 配置同步策略
→ 发布
```

### 新增连接器类型

适用于出现全新的认证协议、分页协议或数据读取方式。需要注册 Connector Definition，并在 Go 或受控 Worker 中实现 Connector。

新连接器不得通过在 React 中加入业务分支来实现。

## 3. Connector Definition

连接器定义必须包含：

- 唯一且稳定的 `type`
- 用户可读的名称、分类和说明
- 配置字段列表
- 字段类型、是否必填、选项和帮助信息
- `preview`、`schemaDiscovery`、`incrementalSync`、`realtime` 能力声明

配置字段类型当前支持：

```text
text | url | number | select | credential
```

`credential` 字段的值必须是 `authRef`，不能是实际凭据。

新增定义的位置是 `lib/connector-definitions.ts`。生产环境可以由 `GET /api/connector-definitions` 返回相同结构，实现真正的运行时注册。

## 4. Data Source Instance

发布后的数据源必须至少包含：

```json
{
  "id": "jira_cict_cases",
  "name": "Jira CICT Cases",
  "connector": "jira",
  "config": {
    "endpoint": "https://jira.example.com",
    "jql": "project = CICT",
    "authRef": "jira-prod-token"
  },
  "outputDataset": "test_case_status",
  "owner": "测试平台组",
  "syncMode": "incremental",
  "schedule": "*/10 * * * *",
  "cursorField": "updatedAt"
}
```

规则：

- `id` 使用小写字母、数字和下划线，发布后不能随意修改。
- `outputDataset` 必须引用已注册或本次发布创建的 Dataset。
- `endpoint` 不得包含用户名、密码或访问 Token。
- 定时同步使用标准 Cron；实时同步由 Webhook 或事件触发。
- 增量同步必须声明稳定游标，并定义重复数据的幂等键。
- 配置更新创建新版本，运行中的任务继续使用启动时版本。

机器校验规则见 `docs/schemas/data-source.schema.json`。

## 5. 连接测试与样本预览

连接测试由服务端执行，前端不直接连接外部系统。

测试结果包含：

- 是否成功
- 响应延迟
- 可读权限范围
- 脱敏后的错误信息
- 检查时间

样本预览限制：

- 默认最多 100 行。
- 单次响应建议不超过 1 MB。
- 不将样本持久化为正式 Snapshot。
- 字段值需要经过脱敏规则。
- 预览超时、解析失败和空数据必须分别返回。

## 6. Dataset 契约

Dashboard 和组件只读取 Dataset，不读取 Source Data。

字段必须声明：

| 属性          | 说明                                            |
| ------------- | ----------------------------------------------- |
| `key`         | 稳定字段标识，使用 lowerCamelCase 或 snake_case |
| `label`       | 页面显示名称                                    |
| `type`        | `string`、`number`、`datetime` 或 `boolean`     |
| `role`        | `dimension`、`metric` 或 `time`                 |
| `description` | 字段业务含义和单位                              |

角色含义：

- `dimension`：用于分组、筛选、分类或系列。
- `metric`：用于求和、平均、计数或数值比较。
- `time`：用于时间范围、排序和时间序列。

契约规则：

- 同一版本中的字段含义和单位必须稳定。
- 新增可选字段属于向后兼容变更。
- 删除字段、修改类型、角色、单位或含义需要提升主版本。
- Snapshot 必须记录 Dataset 版本和生成时间。
- 空值策略必须在转换阶段确定，不能由每个组件自行猜测。

机器校验规则见 `docs/schemas/dataset.schema.json`。

## 7. 转换脚本

转换的统一输入：

```json
{
  "sourceData": [],
  "parameters": {},
  "context": {
    "sourceId": "jira_cict_cases",
    "runId": "run_01",
    "now": "2026-09-09T08:00:00Z"
  }
}
```

统一输出：

```json
{
  "schemaVersion": "1.0",
  "schema": [],
  "rows": [],
  "metadata": {
    "source": "jira_cict_cases",
    "transformedAt": "2026-09-09T08:00:00Z"
  }
}
```

规则：

- 输出必须可 JSON 序列化。
- 不输出 JSX、HTML、函数、类实例或循环引用。
- 不从脚本读取密钥；连接器负责认证。
- JavaScript 在无文件和默认无网络权限的沙箱运行。
- Python 在独立 Worker 运行，限制 CPU、内存和执行时间。
- Agent 转换必须使用结构化输出，并在入库前执行 JSON Schema 校验。
- 转换失败不得覆盖最后一个成功 Snapshot。

示例见 `examples/transform.normalize-test-cases.js`。

## 8. 同步与运行

同步模式：

| 模式          | 适用情况               | 要求                     |
| ------------- | ---------------------- | ------------------------ |
| `full`        | 小型表、文件、低频数据 | 每次生成完整 Snapshot    |
| `incremental` | 数据库、Jira、GitLab   | 游标、幂等键、补偿窗口   |
| `realtime`    | Webhook、Agent、事件流 | 签名校验、去重、重放保护 |

运行状态至少包括 `queued`、`running`、`success`、`failed` 和 `cancelled`。失败记录要包含阶段、错误码、脱敏信息、重试次数和关联配置版本。

## 9. Component Definition

组件通过字段角色契约声明输入：

```json
{
  "type": "barChart",
  "roles": {
    "category": ["string", "datetime"],
    "value": ["number"],
    "series": ["string"]
  },
  "supports": ["filter", "drillDown", "refresh"]
}
```

只有满足必需字段角色的 Dataset 才能选择该组件。组件接收标准的 `rows`、`mapping`、`options`、`loading` 和 `error`，不得感知连接器类型。

## 10. Dashboard JSON

Dashboard 使用 24 列布局。每个 Widget 必须包含：

- 唯一 `id`
- 已注册的 `component`
- 已存在的 `dataset`
- 组件标题和位置
- 与组件输入契约一致的 `mapping`
- 可选查询和展示选项

发布前必须验证：

- 组件存在。
- Dataset 存在。
- 映射字段存在且类型兼容。
- 宽度和位置没有超出 24 列。
- 查询参数只使用允许的过滤、排序和聚合。

机器校验规则见 `docs/schemas/dashboard.schema.json`。

## 11. 安全边界

- `authRef` 的真实值由密钥管理服务解析，并记录访问审计。
- 前端导出配置时必须排除或掩码凭据字段。
- Dataset 权限在查询 API 处执行，不能只依赖页面隐藏。
- SQL 使用参数绑定，字段、排序、聚合和 limit 使用白名单。
- Webhook 必须验证签名、时间戳和幂等键。
- 日志不能包含 Authorization、Cookie、密码或完整请求体中的敏感字段。

## 12. 提交检查清单

- [ ] 没有在 React 组件中直接访问业务数据源
- [ ] 没有真实凭据进入代码、配置、日志或测试数据
- [ ] TypeScript 类型、JSON Schema、示例和文档保持一致
- [ ] 新连接器通过统一 Adapter 和 Connector 协议
- [ ] Dataset 字段有类型、角色和说明
- [ ] 转换输出可校验且确定
- [ ] Widget 映射通过兼容性检查
- [ ] 加载、错误、空数据和移动端状态可用
- [ ] 定向 lint、TypeScript 和生产构建通过
