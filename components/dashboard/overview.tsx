'use client';
import { useState } from 'react';
import {
  Users,
  Activity,
  FlaskConical,
  GitBranch,
  ArrowUpRight,
  Boxes,
  ChevronRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Panel, Stat, Pill, trendData } from './shared';
import { type CaseRecord, statusLabels } from '@/lib/dashboard-data';
export function Overview({
  go,
  cases,
}: {
  go: (id: string) => void;
  cases: CaseRecord[];
}) {
  const [metric, setMetric] = useState('calls');
  return (
    <>
      <Tabs
        value={metric}
        onValueChange={(v) => setMetric(String(v))}
        className="overview-tabs"
      >
        <TabsList>
          <TabsTrigger value="calls">工具概览</TabsTrigger>
          <TabsTrigger value="cases">测试概览</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="stats-grid">
        <Stat
          label="注册用户"
          value="1,284"
          foot="较昨日 +46 人"
          icon={<Users size={17} />}
        />
        <Stat
          label="今日工具调用"
          value="3,960"
          foot="较昨日 +14.8%"
          icon={<Activity size={17} />}
        />
        <Stat
          label="今日新增 Case"
          value="386"
          foot="测试通过 365 · 失败 21"
          icon={<FlaskConical size={17} />}
        />
        <Stat
          label="解析任务完成率"
          value="98.2%"
          foot="8 个运行中 · 12 个等待中"
          icon={<GitBranch size={17} />}
        />
      </div>
      <div className="overview-bottom">
        <Panel
          title={metric === 'calls' ? '工具调用趋势' : '测试 Case 趋势'}
          subtitle="2026.09.02 — 2026.09.08"
        >
          <div className="chart-wrap overview-chart">
            <ResponsiveContainer
              width="100%"
              height="100%"
              initialDimension={{ width: 600, height: 310 }}
            >
              <BarChart
                data={trendData}
                margin={{ top: 20, right: 10, bottom: 0, left: -15 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="var(--border)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
                />
                <Tooltip
                  cursor={{ fill: 'var(--muted)' }}
                  contentStyle={{
                    background: 'var(--card)',
                    color: 'var(--foreground)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    fontSize: 13,
                  }}
                  formatter={(v) => [
                    Number(v).toLocaleString(),
                    metric === 'calls' ? '工具调用' : '新增 Case',
                  ]}
                />
                <Bar
                  dataKey={metric}
                  fill="var(--chart-main)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={47}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel
          title="最近解析"
          subtitle="最近提交的 CICT 测试任务"
          action={
            <Button
              variant="ghost"
              size="icon"
              aria-label="查看所有解析任务"
              onClick={() => go('cict')}
            >
              <ArrowUpRight size={16} />
            </Button>
          }
        >
          <div className="recent-list">
            {cases.slice(0, 5).map((c) => (
              <button
                key={c.id}
                className="recent-row"
                onClick={() => go('cict')}
              >
                <span className="avatar">{c.user.slice(-2)}</span>
                <span className="recent-info">
                  <strong>{c.name}</strong>
                  <span>
                    {c.id} · {c.user}
                  </span>
                </span>
                <span className="recent-status">
                  <Pill
                    tone={
                      c.status === 'failed'
                        ? 'red'
                        : c.status === 'running'
                          ? 'blue'
                          : 'green'
                    }
                  >
                    {statusLabels[c.status]}
                  </Pill>
                  <small>{c.time}</small>
                </span>
              </button>
            ))}
          </div>
        </Panel>
      </div>
      <div className="section-label" style={{ marginTop: 26 }}>
        <h2>数据看板</h2>
        <span>3 个数据维度</span>
      </div>
      <div className="dimension-grid">
        {[
          {
            id: 'tools',
            title: '工具使用',
            icon: Boxes,
            description: '工具注册、版本分布、Token 与会话分析',
            stats: [
              ['接入工具', '6'],
              ['Token 消耗', '2.84M'],
            ],
          },
          {
            id: 'cict',
            title: 'CICT 分析',
            icon: FlaskConical,
            description: '测试分布、Case 明细与解析结果',
            stats: [
              ['解析成功', '378'],
              ['测试通过率', '94.6%'],
            ],
          },
          {
            id: 'pipeline',
            title: '解析流水线',
            icon: GitBranch,
            description: 'Go 队列、ACP 调用与 Agent 执行日志',
            stats: [
              ['活跃 Worker', '8 / 12'],
              ['平均耗时', '48.2s'],
            ],
          },
        ].map((d) => (
          <button
            className="panel module-card"
            key={d.id}
            onClick={() => go(d.id)}
          >
            <div className="module-heading">
              <d.icon size={18} />
              <h3>{d.title}</h3>
              <ChevronRight size={16} />
            </div>
            <p>{d.description}</p>
            <div className="module-stats">
              {d.stats.map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
