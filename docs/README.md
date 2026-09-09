# Insight Studio 文档

## 开始阅读

1. [项目 README](../README.md)：产品目标、运行方式和目录结构。
2. [Agent 开发规则](../AGENTS.md)：所有 Agent 修改仓库时必须遵守的规则。
3. [数据接入与扩展规则](integration-rules.md)：连接器、Dataset、转换和 Dashboard 契约。
4. [Go API 与 Adapter 契约](backend-adapter-contract.md)：前后端边界和接口格式。
5. [平台架构](metadata-platform-architecture.md)：模块拆分和生产落地顺序。

## 机器可读 Schema

- [Connector Definition](schemas/connector-definition.schema.json)
- [Data Source](schemas/data-source.schema.json)
- [Dataset](schemas/dataset.schema.json)
- [Dashboard](schemas/dashboard.schema.json)

## 示例

- [Jira 数据源](../examples/data-source.jira.json)
- [测试结果转换脚本](../examples/transform.normalize-test-cases.js)

文档与实现不一致时，先确认是否存在尚未完成的迁移。不要只修改文档来掩盖实现差异；应同步修正 TypeScript 类型、JSON Schema、示例和代码。
