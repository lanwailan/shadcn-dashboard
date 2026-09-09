import type {
  ConnectorDefinition,
  ConnectorFieldDefinition,
  ConnectorType,
} from './platform-types';

const endpoint = (
  label: string,
  placeholder: string,
): ConnectorFieldDefinition => ({
  key: 'endpoint',
  label,
  type: 'text',
  placeholder,
  required: true,
});

const authRef: ConnectorFieldDefinition = {
  key: 'authRef',
  label: '密钥引用',
  type: 'credential',
  placeholder: '例如 jira-prod-token',
  help: '这里只保存密钥名称，Token 由密钥服务管理。',
};

export const connectorDefinitions: ConnectorDefinition[] = [
  {
    type: 'http',
    name: 'HTTP API',
    category: 'api',
    description: '接入 REST 或 JSON API，支持分页与请求参数。',
    fields: [
      endpoint('API 地址', 'https://api.internal/v1/metrics'),
      {
        key: 'method',
        label: '请求方法',
        type: 'select',
        required: true,
        options: [
          { label: 'GET', value: 'GET' },
          { label: 'POST', value: 'POST' },
        ],
      },
      {
        key: 'dataPath',
        label: '数据路径',
        type: 'text',
        placeholder: '例如 data.items',
        help: '响应为嵌套 JSON 时，指定记录数组的位置。',
      },
      authRef,
    ],
    capabilities: {
      preview: true,
      schemaDiscovery: true,
      incrementalSync: true,
      realtime: false,
    },
  },
  {
    type: 'mysql',
    name: 'MySQL',
    category: 'database',
    description: '连接 MySQL 实例，通过只读 SQL 生成 Dataset。',
    fields: [
      endpoint('主机地址', 'mysql.internal:3306'),
      { key: 'database', label: '数据库', type: 'text', required: true },
      { key: 'table', label: '表或视图', type: 'text', required: true },
      authRef,
    ],
    capabilities: {
      preview: true,
      schemaDiscovery: true,
      incrementalSync: true,
      realtime: false,
    },
  },
  {
    type: 'postgresql',
    name: 'PostgreSQL',
    category: 'database',
    description: '连接 PostgreSQL，通过表、视图或受限 SQL 采集。',
    fields: [
      endpoint('主机地址', 'postgres.internal:5432'),
      { key: 'database', label: '数据库', type: 'text', required: true },
      { key: 'schema', label: 'Schema', type: 'text', placeholder: 'public' },
      { key: 'table', label: '表或视图', type: 'text', required: true },
      authRef,
    ],
    capabilities: {
      preview: true,
      schemaDiscovery: true,
      incrementalSync: true,
      realtime: false,
    },
  },
  {
    type: 'jira',
    name: 'Jira',
    category: 'saas',
    description: '使用 JQL 接入 Issue、测试用例与缺陷数据。',
    fields: [
      endpoint('站点地址', 'https://jira.example.com'),
      {
        key: 'jql',
        label: 'JQL',
        type: 'text',
        required: true,
        placeholder: 'project = CICT',
      },
      authRef,
    ],
    capabilities: {
      preview: true,
      schemaDiscovery: true,
      incrementalSync: true,
      realtime: true,
    },
  },
  {
    type: 'feishu',
    name: '飞书',
    category: 'saas',
    description: '接入多维表格、文档目录或机器人事件。',
    fields: [
      endpoint('资源地址', 'bitable/app_token/table_id'),
      {
        key: 'resourceType',
        label: '资源类型',
        type: 'select',
        options: [
          { label: '多维表格', value: 'bitable' },
          { label: '文档', value: 'document' },
        ],
      },
      authRef,
    ],
    capabilities: {
      preview: true,
      schemaDiscovery: true,
      incrementalSync: true,
      realtime: true,
    },
  },
  {
    type: 'gitlab',
    name: 'GitLab',
    category: 'saas',
    description: '接入项目、提交、Pipeline、Merge Request 与 Issue。',
    fields: [
      endpoint('GitLab 地址', 'https://gitlab.internal'),
      { key: 'projectId', label: 'Project ID', type: 'text', required: true },
      {
        key: 'resourceType',
        label: '资源类型',
        type: 'select',
        options: [
          { label: 'Pipelines', value: 'pipelines' },
          { label: 'Merge Requests', value: 'merge_requests' },
          { label: 'Commits', value: 'commits' },
        ],
      },
      authRef,
    ],
    capabilities: {
      preview: true,
      schemaDiscovery: true,
      incrementalSync: true,
      realtime: true,
    },
  },
  {
    type: 'file',
    name: 'CSV / Excel',
    category: 'file',
    description: '从对象存储或上传目录读取 CSV、XLSX 文件。',
    fields: [
      endpoint('文件位置', 'R2://imports/test-cases.xlsx'),
      { key: 'sheet', label: 'Sheet', type: 'text', placeholder: 'Sheet1' },
    ],
    capabilities: {
      preview: true,
      schemaDiscovery: true,
      incrementalSync: false,
      realtime: false,
    },
  },
  {
    type: 'webhook',
    name: 'Webhook',
    category: 'event',
    description: '接收 CICT、流水线或外部系统主动推送的数据。',
    fields: [endpoint('接收路径', '/hooks/cict/results'), authRef],
    capabilities: {
      preview: true,
      schemaDiscovery: true,
      incrementalSync: false,
      realtime: true,
    },
  },
  {
    type: 'agent',
    name: 'Agent 输出',
    category: 'compute',
    description: '接收 ACP Agent CLI 的结构化分析结果。',
    fields: [
      endpoint('队列或主题', 'pipeline://cict-analysis'),
      {
        key: 'resultPath',
        label: '结果 JSON 路径',
        type: 'text',
        placeholder: 'result.analysis',
      },
    ],
    capabilities: {
      preview: true,
      schemaDiscovery: true,
      incrementalSync: false,
      realtime: true,
    },
  },
  {
    type: 'script',
    name: '自定义脚本',
    category: 'compute',
    description: '使用受限 JavaScript 或 Python Worker 标准化数据。',
    fields: [
      endpoint('脚本引用', 'scripts/normalize-cases.js'),
      {
        key: 'runtime',
        label: '运行时',
        type: 'select',
        options: [
          { label: 'JavaScript Sandbox', value: 'javascript' },
          { label: 'Python Worker', value: 'python' },
        ],
      },
    ],
    capabilities: {
      preview: true,
      schemaDiscovery: true,
      incrementalSync: false,
      realtime: false,
    },
  },
];

export function getConnectorDefinition(type: ConnectorType) {
  return connectorDefinitions.find((item) => item.type === type)!;
}
