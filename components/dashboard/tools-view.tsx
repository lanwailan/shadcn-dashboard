'use client';
import { useState } from 'react';
import { Users, Zap, Coins, MessageSquare, Box } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Panel, Stat, Distribution, TrendChart, Pill } from './shared';
import { toolsData, registrants } from '@/lib/dashboard-data';
export function ToolsView() {
  const [tab, setTab] = useState('tools');
  return (
    <>
      <div className="stats-grid">
        <Stat
          label="累计注册用户"
          value="1,284"
          foot="跨工具去重 · 今日新增 46 人"
          icon={<Users size={17} />}
        />
        <Stat
          label="今日激活次数"
          value="3,973"
          foot="6 个自研工具 · 较昨日 +12.8%"
          icon={<Zap size={17} />}
        />
        <Stat
          label="今日 Token 消耗"
          value="2.84M"
          foot="输入 1.96M · 输出 0.88M"
          icon={<Coins size={17} />}
        />
        <Stat
          label="平均会话深度"
          value="8.6"
          unit="轮"
          foot="活跃会话 462 个 · 中位数 6 轮"
          icon={<MessageSquare size={17} />}
        />
      </div>
      <div className="two-cols">
        <Panel
          title="工具调用趋势"
          subtitle="最近 7 天 · 累计 19,620 次"
          action={<Pill tone="blue">今日 3,960 次</Pill>}
        >
          <TrendChart />
        </Panel>
        <Panel title="工具调用分布" subtitle="今日 · 按工具统计">
          <Distribution
            items={toolsData.map((t) => ({
              name: t.name,
              value: t.calls,
              color: t.color,
            }))}
          />
        </Panel>
      </div>
      <div className="three-cols">
        <Panel title="调用时间分布" subtitle="今日 · Asia/Shanghai">
          <div
            style={{
              height: 140,
              display: 'flex',
              alignItems: 'end',
              gap: 5,
              paddingTop: 12,
            }}
          >
            {[
              12, 5, 3, 2, 4, 8, 18, 75, 245, 560, 867, 440, 245, 650, 828, 0,
              0, 0, 0, 0, 0, 0, 0, 0,
            ].map((v, i) => (
              <div
                key={i}
                title={`${i}:00–${i + 1}:00 · ${i > 14 ? '尚未发生' : v + ' 次'}`}
                style={{
                  flex: 1,
                  height: `${Math.max(v / 9, 2)}%`,
                  background:
                    i > 14
                      ? 'var(--muted)'
                      : i === 10
                        ? 'var(--blue)'
                        : 'color-mix(in srgb,var(--blue) 40%,transparent)',
                  borderRadius: '3px 3px 0 0',
                }}
              />
            ))}
          </div>
          <div
            className="legend"
            style={{ justifyContent: 'space-between', marginTop: 12 }}
          >
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:00</span>
          </div>
          <p className="subtitle">高峰时段 10:00–11:00 · 867 次</p>
        </Panel>
        <Panel title="会话深度分布" subtitle="今日 · 462 个活跃会话">
          <Distribution
            items={[
              { name: '1–3 轮', value: 112 },
              { name: '4–8 轮', value: 198 },
              { name: '9–15 轮', value: 104 },
              { name: '16 轮及以上', value: 48 },
            ]}
          />
        </Panel>
        <Panel title="DevPilot 版本分布" subtitle="876 位当前版本用户">
          <Distribution
            items={[
              { name: 'v2.4.0 · 最新', value: 598 },
              { name: 'v2.3.2', value: 202 },
              { name: 'v2.2.0', value: 76 },
            ]}
          />
          <p className="subtitle">最新版本覆盖率 68.3%</p>
        </Panel>
      </div>
      <section className="panel table-panel">
        <div className="table-toolbar">
          <div>
            <h2>工具与用户明细</h2>
            <p className="subtitle" style={{ marginTop: 5 }}>
              注册量按工具独立统计，用户可使用多个工具
            </p>
          </div>
          <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
            <TabsList>
              <TabsTrigger value="tools">已接入工具</TabsTrigger>
              <TabsTrigger value="users">最近注册用户</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              {(tab === 'tools'
                ? [
                    '工具',
                    '当前版本',
                    '注册用户',
                    '今日激活',
                    'Token 消耗',
                    '调用次数',
                  ]
                : ['注册用户', '所属团队', '注册工具', '使用版本', '注册时间']
              ).map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tab === 'tools'
              ? toolsData.map((t) => (
                  <TableRow key={t.name}>
                    <TableCell>
                      <div
                        style={{
                          display: 'flex',
                          gap: 12,
                          alignItems: 'center',
                        }}
                      >
                        <span
                          className="activity-icon"
                          style={{ color: t.color }}
                        >
                          <Box size={17} />
                        </span>
                        <div className="case-title">
                          {t.name}
                          <div className="case-sub">{t.description}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="pill">{t.version}</span>
                    </TableCell>
                    <TableCell>{t.users.toLocaleString()}</TableCell>
                    <TableCell>{t.activations.toLocaleString()}</TableCell>
                    <TableCell>{(t.tokens / 1000000).toFixed(2)}M</TableCell>
                    <TableCell>{t.calls.toLocaleString()}</TableCell>
                  </TableRow>
                ))
              : registrants.map((u) => (
                  <TableRow key={u.name}>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.team}</TableCell>
                    <TableCell>{u.tool}</TableCell>
                    <TableCell>
                      <span className="pill">{u.version}</span>
                    </TableCell>
                    <TableCell>{u.date}</TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
        <div className="table-bottom">
          {tab === 'tools' ? '6 个工具已接入' : '展示最近 5 位注册用户'} ·
          演示数据
        </div>
      </section>
    </>
  );
}
