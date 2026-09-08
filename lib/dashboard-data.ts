/** Replace this adapter with your Go HTTP API. All current records are fictional. */
export type ParseStatus = 'success' | 'failed' | 'running' | 'queued';
export type TestResult = {
  type: 'BFT' | 'CAN' | 'IMMO';
  passed: number;
  total: number;
  message: string;
};
export type CaseRecord = {
  id: string;
  name: string;
  platform: string;
  user: string;
  time: string;
  status: ParseStatus;
  duration: number;
  tests: TestResult[];
  build: number;
};
export const statusLabels: Record<ParseStatus, string> = {
  success: '解析成功',
  failed: '解析失败',
  running: '解析中',
  queued: '排队中',
};
export const toolsData = [
  {
    name: 'DevPilot',
    description: '智能研发助手',
    version: 'v2.4.0',
    users: 876,
    activations: 2431,
    tokens: 1420000,
    calls: 2140,
    color: 'var(--blue)',
  },
  {
    name: 'Code Review',
    description: '代码审查助手',
    version: 'v1.8.2',
    users: 624,
    activations: 782,
    tokens: 680000,
    calls: 860,
    color: 'var(--purple)',
  },
  {
    name: 'ARXML Studio',
    description: 'AUTOSAR 语义分析',
    version: 'v3.1.0',
    users: 318,
    activations: 346,
    tokens: 260000,
    calls: 425,
    color: 'var(--teal)',
  },
  {
    name: 'LogLens',
    description: '日志分析工具',
    version: 'v1.3.5',
    users: 246,
    activations: 214,
    tokens: 310000,
    calls: 310,
    color: '#e0a154',
  },
  {
    name: 'TestCraft',
    description: '测试用例生成',
    version: 'v2.0.1',
    users: 192,
    activations: 122,
    tokens: 140000,
    calls: 165,
    color: '#dc799e',
  },
  {
    name: 'DocFlow',
    description: '文档智能助手',
    version: 'v1.1.0',
    users: 108,
    activations: 78,
    tokens: 30000,
    calls: 60,
    color: '#7a96a5',
  },
];
export const registrants = [
  {
    name: '陈思远',
    team: '平台研发',
    tool: 'DevPilot',
    version: 'v2.4.0',
    date: '09-08 14:12',
  },
  {
    name: '王子涵',
    team: '测试开发',
    tool: 'Code Review',
    version: 'v1.8.2',
    date: '09-08 13:48',
  },
  {
    name: '李明',
    team: '基础软件',
    tool: 'ARXML Studio',
    version: 'v3.1.0',
    date: '09-08 11:26',
  },
  {
    name: '赵雨桐',
    team: '平台研发',
    tool: 'DevPilot',
    version: 'v2.3.2',
    date: '09-08 10:18',
  },
  {
    name: '张晨',
    team: '集成测试',
    tool: 'LogLens',
    version: 'v1.3.5',
    date: '09-08 09:35',
  },
];
export const initialCases: CaseRecord[] = Array.from(
  { length: 12 },
  (_, i) => ({
    id: `CICT-${2841 - i}`,
    name: [
      'Nightly · 整车功能回归',
      'CAN 总线通信验证',
      'IMMO 防盗认证测试',
      'BFT 基础功能测试',
      'Release · 集成回归',
      '诊断与故障恢复',
    ][i % 6],
    platform: ['Linux · x86_64', 'QNX · ARM64', 'Windows · x64'][i % 3],
    user: ['陈思远', '王子涵', '李明', '张晨'][i % 4],
    time: `${14 - Math.floor(i / 4)}:${String(32 - (i % 4) * 7).padStart(2, '0')}`,
    status: (i === 2
      ? 'failed'
      : i === 4
        ? 'running'
        : i === 7
          ? 'queued'
          : 'success') as ParseStatus,
    duration: 38 + i * 7,
    build: 2841 - i,
    tests: [
      {
        type: 'BFT',
        passed: 32,
        total: 32,
        message: '基础功能检查通过，启动和运行状态正常。',
      },
      {
        type: 'CAN',
        passed: i % 3 === 1 ? 22 : 24,
        total: 24,
        message:
          i % 3 === 1
            ? '2 项失败：CAN_HS_014 超时、CAN_HS_019 帧序号不一致。'
            : '通信时序与报文完整性验证通过。',
      },
      {
        type: 'IMMO',
        passed: 12,
        total: 12,
        message: '密钥认证与防盗状态切换验证通过。',
      },
    ],
  }),
);
export function casePaths(c: CaseRecord) {
  return {
    source: `/data/cict/2026-09-08/${c.id}/results/`,
    output: `/data/analysis/${c.id}/report.json`,
    jenkins: `jenkins.internal/job/cict-nightly/${c.build}/`,
    file: `${c.id.toLowerCase()}-results.xml`,
  };
}
export function makeLogs(c: CaseRecord) {
  const p = casePaths(c);
  if (c.status === 'queued')
    return `[${c.time}:00] INFO  pipeline.enqueue case=${c.id}\n[${c.time}:00] INFO  Waiting for available Go worker`;
  if (c.status === 'failed')
    return `[${c.time}:00] INFO  pipeline.dequeue case=${c.id}\n[${c.time}:01] INFO  source=${p.source}${p.file}\n[${c.time}:02] INFO  acp.session.create agent=agent-cli\n[${c.time}:32] ERROR ACP_TIMEOUT: agent response exceeded 30s\n[${c.time}:32] INFO  No analysis artifact written. Retry available.`;
  return `[${c.time}:00] INFO  pipeline.dequeue case=${c.id} worker=go-worker-03\n[${c.time}:01] INFO  source=${p.source}${p.file}\n[${c.time}:02] INFO  acp.session.create agent=agent-cli\n[${c.time}:03] INFO  agent.analyze suites=BFT,CAN,IMMO${c.status === 'running' ? '\n[' + c.time + ':04] INFO  Agent analysis in progress...' : `\n[${c.time}:38] INFO  analysis.complete duration=${c.duration}s\n[${c.time}:39] INFO  artifact.write path=${p.output}\n[${c.time}:39] INFO  pipeline.ack status=success`}`;
}
