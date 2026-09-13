# Go API 与 PlatformAdapter 契约

本文定义 React 与 Go 控制面的边界。React 组件只依赖 `PlatformAdapter`，Go 负责连接外部系统、解析凭据、调度、转换、快照和权限。

## 1. 前端接口

当前最小接口位于 `lib/platform-api.ts`：

```ts
interface PlatformAdapter {
  testConnection(draft: SourceDraft): Promise<ConnectionTestResult>;
  previewSource(draft: SourceDraft): Promise<PreviewResult>;
  publishSource(draft: SourceDraft): Promise<DataSource>;
  queryDataset(datasetId: string, query?: DatasetQuery): Promise<DatasetResult>;
}
```

`platformAdapter` 是应用唯一绑定点。当前指向 Mock 实现；接 Go 后应指向 `HttpPlatformAdapter`。页面组件不得直接依赖具体实现。

后续可在保持调用方稳定的情况下继续扩展：

```ts
interface PlatformAdapter {
  listConnectorDefinitions(): Promise<ConnectorDefinition[]>;
  listSources(): Promise<DataSource[]>;
  testConnection(draft: SourceDraft): Promise<ConnectionTestResult>;
  previewSource(draft: SourceDraft): Promise<PreviewResult>;
  publishSource(draft: SourceDraft): Promise<DataSource>;
  runSource(sourceId: string): Promise<JobRun>;
  listRuns(sourceId?: string): Promise<JobRun[]>;
  queryDataset(datasetId: string, query?: DatasetQuery): Promise<DatasetResult>;
  saveDashboard(config: DashboardConfig): Promise<DashboardConfig>;
}
```

## 2. REST 资源

```http
GET  /api/v1/connector-definitions

GET  /api/v1/data-sources
POST /api/v1/data-sources/test
POST /api/v1/data-sources/preview
POST /api/v1/data-sources
PUT  /api/v1/data-sources/{sourceId}
POST /api/v1/data-sources/{sourceId}/runs
GET  /api/v1/data-sources/{sourceId}/runs

GET  /api/v1/datasets
GET  /api/v1/datasets/{datasetId}
GET  /api/v1/datasets/{datasetId}/schema
POST /api/v1/datasets/{datasetId}/query

GET  /api/v1/dashboards
POST /api/v1/dashboards
PUT  /api/v1/dashboards/{dashboardId}
POST /api/v1/dashboards/{dashboardId}/publish
```

## 3. 连接测试

请求：

```http
POST /api/v1/data-sources/test
Content-Type: application/json
```

```json
{
  "connector": "jira",
  "config": {
    "endpoint": "https://jira.example.com",
    "jql": "project = CICT",
    "authRef": "jira-prod-token"
  }
}
```

响应：

```json
{
  "ok": true,
  "latency": 142,
  "message": "连接成功，已获得只读访问权限。",
  "checkedAt": "2026-09-09T08:00:00Z",
  "capabilities": ["read:issues", "read:fields"]
}
```

服务端不能把凭据值回传给浏览器。

## 4. 样本预览

请求：

```json
{
  "connector": "jira",
  "config": {
    "endpoint": "https://jira.example.com",
    "jql": "project = CICT",
    "authRef": "jira-prod-token"
  },
  "limit": 100
}
```

响应：

```json
{
  "fields": [
    {
      "key": "project",
      "label": "项目",
      "type": "string",
      "role": "dimension",
      "description": "项目名称"
    }
  ],
  "rows": [{ "project": "BYD" }],
  "totalEstimate": 728,
  "truncated": true
}
```

## 5. Dataset 查询

请求：

```json
{
  "select": ["project", "failed", "updatedAt"],
  "filters": [
    { "field": "updatedAt", "operator": "gte", "value": "2026-09-09T00:00:00Z" }
  ],
  "groupBy": ["project"],
  "aggregates": [{ "field": "failed", "function": "sum", "as": "failed" }],
  "orderBy": [{ "field": "failed", "direction": "desc" }],
  "limit": 100
}
```

响应必须包含实际使用的 Snapshot 和 Dataset 版本：

```json
{
  "datasetId": "test_case_status",
  "datasetVersion": "1.2",
  "snapshotId": "snap_01J7A9",
  "snapshotAt": "2026-09-09T08:00:00Z",
  "fields": [],
  "rows": [],
  "page": { "limit": 100, "nextCursor": null }
}
```

服务端必须校验字段、操作符、聚合、排序、limit 和调用方权限，不能直接拼接客户端 SQL。

## 6. 错误格式

所有失败使用统一响应：

```json
{
  "error": {
    "code": "CONNECTOR_AUTH_FAILED",
    "message": "连接器认证失败，请检查密钥引用。",
    "requestId": "req_01J7AA",
    "retryable": false,
    "details": {
      "field": "authRef"
    }
  }
}
```

建议错误码：

| 错误码                    | 场景                    |
| ------------------------- | ----------------------- |
| `VALIDATION_FAILED`       | 配置或查询不符合 Schema |
| `CONNECTOR_NOT_FOUND`     | 连接器类型不存在        |
| `CONNECTOR_AUTH_FAILED`   | 凭据不存在或认证失败    |
| `CONNECTOR_TIMEOUT`       | 外部系统超时            |
| `SOURCE_PREVIEW_EMPTY`    | 样本请求成功但没有数据  |
| `TRANSFORM_FAILED`        | 转换执行失败            |
| `DATASET_SCHEMA_MISMATCH` | 输出与 Dataset 契约不符 |
| `PERMISSION_DENIED`       | 调用方无权限            |
| `RATE_LIMITED`            | 达到平台或外部系统限制  |

## 7. Go Connector 接口

```go
type Connector interface {
    Test(ctx context.Context, cfg Config) (*TestResult, error)
    Discover(ctx context.Context, cfg Config) (*SourceSchema, error)
    Preview(ctx context.Context, cfg Config, limit int) (*PreviewResult, error)
    Fetch(ctx context.Context, req FetchRequest) (*FetchResult, error)
}
```

`FetchRequest` 至少携带配置版本、运行 ID、同步模式、游标和限制。`FetchResult` 至少携带记录、下一个游标、是否完成和来源元数据。

连接器实现不得：

- 向前端返回解析后的密钥。
- 生成 React 或 Dashboard 配置。
- 绕过 Dataset 校验直接写查询表。
- 在日志中记录完整 Header、Cookie 或请求体。

## 8. 切换到 HTTP Adapter

1. 实现 `HttpPlatformAdapter`，每个方法映射到 `/api/v1` 资源。
2. 统一处理认证、请求 ID、超时和错误格式。
3. 在 `lib/platform-api.ts` 中将 `platformAdapter` 绑定到 HTTP 实现。
4. 将页面 LocalStorage 初始化替换为 Adapter 查询。
5. 使用 TanStack Query 管理缓存、重试和失效。
6. 保留 Mock Adapter 供 Storybook、离线演示或测试使用。

不要在各个 React 页面中逐个替换为 `fetch`。
