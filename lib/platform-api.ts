import type {
  ConnectionTestResult,
  DataSource,
  DatasetField,
  PreviewResult,
  SourceDraft,
} from './platform-types';

export interface PlatformAdapter {
  testConnection(draft: SourceDraft): Promise<ConnectionTestResult>;
  previewSource(draft: SourceDraft): Promise<PreviewResult>;
  publishSource(draft: SourceDraft): Promise<DataSource>;
}

const wait = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const previewFields: DatasetField[] = [
  {
    key: 'project',
    label: '项目',
    type: 'string',
    role: 'dimension',
    description: '项目名称',
  },
  {
    key: 'platform',
    label: '平台',
    type: 'string',
    role: 'dimension',
    description: '测试平台',
  },
  {
    key: 'total',
    label: '用例数',
    type: 'number',
    role: 'metric',
    description: '测试用例总数',
  },
  {
    key: 'passed',
    label: '通过数',
    type: 'number',
    role: 'metric',
    description: '通过用例数',
  },
  {
    key: 'failed',
    label: '失败数',
    type: 'number',
    role: 'metric',
    description: '失败用例数',
  },
  {
    key: 'updatedAt',
    label: '更新时间',
    type: 'datetime',
    role: 'time',
    description: '数据更新时间',
  },
];

const previewRows = [
  {
    project: 'BYD',
    platform: 'Linux',
    total: 326,
    passed: 301,
    failed: 25,
    updatedAt: '2026-09-09 14:32',
  },
  {
    project: 'Geely',
    platform: 'QNX',
    total: 218,
    passed: 207,
    failed: 11,
    updatedAt: '2026-09-09 14:30',
  },
  {
    project: 'NIO',
    platform: 'Android',
    total: 184,
    passed: 179,
    failed: 5,
    updatedAt: '2026-09-09 14:28',
  },
];

export const mockPlatformAdapter: PlatformAdapter = {
  async testConnection(draft) {
    await wait(650);
    const requiredValue = draft.config.endpoint;
    if (!requiredValue?.trim()) {
      return {
        ok: false,
        latency: 0,
        message: '缺少连接地址，请补充后重试。',
        checkedAt: new Date().toLocaleTimeString('zh-CN'),
      };
    }
    return {
      ok: true,
      latency: 86 + draft.connector.length * 17,
      message: '连接成功，已获得只读访问权限。',
      checkedAt: new Date().toLocaleTimeString('zh-CN'),
    };
  },

  async previewSource() {
    await wait(700);
    return {
      fields: previewFields,
      rows: previewRows,
      totalEstimate: 728,
    };
  },

  async publishSource(draft) {
    await wait(500);
    return {
      id: `${draft.connector}_${Date.now()}`,
      name: draft.name,
      connector: draft.connector,
      endpoint: draft.config.endpoint,
      schedule: draft.schedule,
      outputDataset: draft.outputDataset,
      authRef: draft.config.authRef || undefined,
      owner: draft.owner,
      status: 'healthy',
      lastRun: '尚未运行',
      successRate: 100,
      config: draft.config,
      syncMode: draft.syncMode,
      cursorField: draft.cursorField || undefined,
      schema: draft.fields,
    };
  },
};

// Application binding. Replace this single export with an HTTP implementation
// when the Go control API is available; UI components only depend on PlatformAdapter.
export const platformAdapter: PlatformAdapter = mockPlatformAdapter;
