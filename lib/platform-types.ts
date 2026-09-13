export type FieldType = 'string' | 'number' | 'datetime' | 'boolean';
export type FieldRole = 'dimension' | 'metric' | 'time';
export type ConnectorType =
  | 'http'
  | 'mysql'
  | 'postgresql'
  | 'jira'
  | 'feishu'
  | 'gitlab'
  | 'file'
  | 'webhook'
  | 'agent'
  | 'script';

export type DatasetField = {
  key: string;
  label: string;
  type: FieldType;
  role: FieldRole;
  description: string;
};

export type Dataset = {
  id: string;
  name: string;
  description: string;
  version: string;
  owner: string;
  source: string;
  updatedAt: string;
  refresh: string;
  cacheTtl: string;
  permission: string;
  fields: DatasetField[];
  rows: Record<string, string | number | boolean>[];
  lineage: string[];
};

export type DataSource = {
  id: string;
  name: string;
  connector: ConnectorType;
  endpoint: string;
  schedule: string;
  outputDataset: string;
  authRef?: string;
  owner: string;
  status: 'healthy' | 'warning' | 'disabled';
  lastRun: string;
  successRate: number;
  config?: Record<string, string>;
  syncMode?: 'full' | 'incremental' | 'realtime';
  cursorField?: string;
  schema?: DatasetField[];
};

export type ConnectorFieldDefinition = {
  key: string;
  label: string;
  type: 'text' | 'url' | 'number' | 'select' | 'credential';
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  help?: string;
};

export type ConnectorDefinition = {
  type: ConnectorType;
  name: string;
  category: 'api' | 'database' | 'saas' | 'event' | 'file' | 'compute';
  description: string;
  fields: ConnectorFieldDefinition[];
  capabilities: {
    preview: boolean;
    schemaDiscovery: boolean;
    incrementalSync: boolean;
    realtime: boolean;
  };
};

export type SourceDraft = {
  name: string;
  connector: ConnectorType;
  owner: string;
  config: Record<string, string>;
  outputDataset: string;
  schedule: string;
  syncMode: 'full' | 'incremental' | 'realtime';
  cursorField: string;
  fields: DatasetField[];
};

export type ConnectionTestResult = {
  ok: boolean;
  latency: number;
  message: string;
  checkedAt: string;
};

export type PreviewResult = {
  fields: DatasetField[];
  rows: Record<string, string | number | boolean>[];
  totalEstimate: number;
};

export type DatasetQuery = {
  filters?: Record<string, string | number | boolean>;
  limit?: number;
};

export type DatasetResult = {
  datasetId: string;
  datasetVersion: string;
  snapshotId: string;
  snapshotAt: string;
  fields: DatasetField[];
  rows: Record<string, string | number | boolean>[];
  page: { limit: number; nextCursor: string | null };
};

export type ComponentType =
  | 'metric'
  | 'barChart'
  | 'lineChart'
  | 'pieChart'
  | 'table'
  | 'progress'
  | 'statusList'
  | 'markdown';

export type ComponentDefinition = {
  type: ComponentType;
  name: string;
  description: string;
  roles: Partial<Record<'category' | 'value' | 'series' | 'time', FieldType[]>>;
  supports: string[];
  status: 'stable' | 'beta';
};

export type WidgetConfig = {
  id: string;
  component: ComponentType;
  dataset: string;
  title: string;
  position: { x: number; y: number; w: number; h: number };
  mapping: {
    value?: string;
    category?: string;
    series?: string;
    time?: string;
    columns?: string[];
  };
  query?: { limit?: number; filters?: Record<string, string> };
  options?: {
    color?: string;
    aggregate?: 'sum' | 'avg' | 'count' | 'max';
    unit?: string;
    precision?: number;
    description?: string;
  };
};

export type DashboardConfig = {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'published';
  updatedAt: string;
  layout: { columns: 24; rowHeight: 20; gap: number };
  widgets: WidgetConfig[];
};

export type JobRun = {
  id: string;
  source: string;
  dataset: string;
  trigger: 'schedule' | 'webhook' | 'manual';
  status: 'success' | 'failed' | 'running';
  rows: number;
  duration: string;
  startedAt: string;
};
