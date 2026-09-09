# JSON Schema 使用说明

这些文件用于校验平台配置的基本结构：

- `connector-definition.schema.json`：连接器表单与能力元数据
- `data-source.schema.json`：发布后的数据源实例
- `dataset.schema.json`：Dataset 定义和当前快照数据
- `dashboard.schema.json`：Dashboard 和 Widget 配置

JSON Schema 只完成结构校验。以下规则必须由应用层继续校验：

- Data Source 的配置字段是否符合对应 Connector Definition。
- `authRef` 是否存在以及调用方是否有使用权限。
- 增量游标字段是否存在并具有稳定排序。
- Dataset 字段 `key` 是否唯一，行值是否符合字段类型。
- Widget 引用的 Dataset、组件和映射字段是否存在。
- Widget 的 `x + w` 是否小于等于 24。
- Dashboard 中的 Widget ID 是否唯一以及布局是否发生冲突。
- 配置发布者是否具有 Dataset 和 Dashboard 权限。

修改任何 Schema 时，需要同步：

1. `lib/platform-types.ts`
2. 相关示例
3. `docs/integration-rules.md`
4. Go 请求/响应结构
5. 必要的迁移和版本说明
