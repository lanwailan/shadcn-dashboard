'use client';
import {
  ListOrdered,
  Cpu,
  Timer,
  CheckCheck,
  Layers3,
  GitBranch,
  Workflow,
  FileCheck2,
} from 'lucide-react';
import { Stat, Panel, Pill, Distribution } from './shared';
import { Progress } from '@/components/ui/progress';
import { CaseTable } from './case-table';
import type { CaseRecord } from '@/lib/dashboard-data';
export function PipelineView({
  cases,
  retry,
}: {
  cases: CaseRecord[];
  retry: (id: string) => Promise<void>;
}) {
  return (
    <>
      <div className="stats-grid">
        <Stat
          label="正在运行"
          value="8"
          unit="任务"
          foot="8 / 12 个 Worker 活跃"
          icon={<Cpu size={17} />}
        />
        <Stat
          label="队列等待"
          value="12"
          unit="任务"
          foot="最早入队 14:30 · FIFO 顺序处理"
          icon={<ListOrdered size={17} />}
        />
        <Stat
          label="平均解析耗时"
          value="48.2"
          unit="秒"
          foot="P95 86 秒 · 较昨日 -6.4 秒"
          icon={<Timer size={17} />}
        />
        <Stat
          label="已结束任务完成率"
          value="98.2"
          unit="%"
          foot="累计成功 1,100 / 已结束 1,120"
          icon={<CheckCheck size={17} />}
        />
      </div>
      <section className="panel" style={{ marginBottom: 22 }}>
        <div className="table-toolbar">
          <div>
            <h2>解析流程</h2>
            <p className="subtitle">
              Go Pipeline 负责调度，ACP 连接 Agent CLI 完成分析
            </p>
          </div>
          <Pill>流水线运行正常</Pill>
        </div>
        <div className="flow">
          {[
            {
              icon: Layers3,
              name: '01 · 结果入队',
              text: '接收 CICT 结果文件',
              value: '12',
              unit: ' 等待中',
            },
            {
              icon: GitBranch,
              name: '02 · Go 调度',
              text: 'Worker 从 FIFO 队列取任务',
              value: '8 / 12',
              unit: ' 活跃',
            },
            {
              icon: Workflow,
              name: '03 · ACP → Agent',
              text: '创建会话、解析测试细则',
              value: '8',
              unit: ' 解析中',
            },
            {
              icon: FileCheck2,
              name: '04 · 结果归档',
              text: '写入结构化报告和执行日志',
              value: '1,100',
              unit: ' 累计完成',
            },
          ].map((s, i) => (
            <div className="flow-step" key={s.name}>
              <s.icon
                size={22}
                style={{
                  color: [
                    'var(--blue)',
                    'var(--purple)',
                    'var(--purple)',
                    'var(--teal)',
                  ][i],
                  marginBottom: 16,
                }}
              />
              <h3>{s.name}</h3>
              <p>{s.text}</p>
              <strong>{s.value}</strong>
              <span className="muted" style={{ fontSize: 12 }}>
                {s.unit}
              </span>
            </div>
          ))}
        </div>
      </section>
      <div className="two-cols">
        <Panel title="Worker 资源" subtitle="演示集群 · go-worker-pool">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6,1fr)',
              gap: 12,
              marginTop: 23,
            }}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--muted)',
                  borderRadius: 10,
                  padding: '15px 6px',
                  textAlign: 'center',
                }}
              >
                <Cpu
                  size={20}
                  style={{
                    margin: '0 auto 9px',
                    color: i < 8 ? 'var(--purple)' : 'var(--muted-foreground)',
                  }}
                />
                <span className="mono">{String(i + 1).padStart(2, '0')}</span>
                <p
                  style={{
                    fontSize: 12,
                    color: 'var(--muted-foreground)',
                    marginTop: 5,
                  }}
                >
                  {i < 8 ? '运行' : '空闲'}
                </p>
              </div>
            ))}
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 13,
              margin: '18px 0 10px',
            }}
          >
            <span>Worker 使用率</span>
            <span className="muted">66.7%</span>
          </div>
          <Progress value={66.7} aria-label="Worker 使用率" />
        </Panel>
        <Panel title="解析耗时分布" subtitle="累计 1,120 个已结束任务">
          <Distribution
            items={[
              { name: '小于 30 秒', value: 336 },
              { name: '30–60 秒', value: 548 },
              { name: '60–120 秒', value: 204 },
              { name: '大于 120 秒', value: 32 },
            ]}
          />
        </Panel>
      </div>
      <CaseTable
        title="流水线任务记录"
        cases={cases}
        retry={retry}
        initialOpen="CICT-2837"
      />
    </>
  );
}
