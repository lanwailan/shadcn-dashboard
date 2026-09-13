'use client';

import { useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Database,
  Layers3,
  PlayCircle,
  PlugZap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';
import { Delta, DeltaIcon, DeltaValue } from '@/components/delta';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  datasets,
  initialDashboards,
  initialSources,
  jobRuns,
} from '@/lib/platform-data';

const toolDataset = datasets.find((item) => item.id === 'tool_usage_daily')!;
const testDataset = datasets.find((item) => item.id === 'test_case_status')!;
const pipelineDataset = datasets.find((item) => item.id === 'pipeline_runs')!;

const toolRows = toolDataset.rows.map((row) => ({
  tool: String(row.tool),
  calls: Number(row.calls),
  active: Number(row.active),
  fill: '',
}));

const testChartConfig = {
  passed: { label: '通过', color: '#25a97b' },
  failed: { label: '失败', color: '#ef6f72' },
} satisfies ChartConfig;

const pipelineChartConfig = {
  duration: { label: '平均耗时', color: '#6f68e8' },
} satisfies ChartConfig;

const shareColors = [
  '#6f68e8',
  '#29a77e',
  '#e6a34b',
  '#e56f87',
  '#5d8ee8',
  '#8a7ca8',
];

const callTrend = [
  { time: '09:00', calls: 216 },
  { time: '10:00', calls: 348 },
  { time: '11:00', calls: 421 },
  { time: '12:00', calls: 302 },
  { time: '13:00', calls: 386 },
  { time: '14:00', calls: 512 },
  { time: '15:00', calls: 468 },
  { time: '16:00', calls: 594 },
  { time: '17:00', calls: 531 },
  { time: '18:00', calls: 662 },
];

const trendChartConfig = {
  calls: { label: '工具调用', color: '#6f68e8' },
} satisfies ChartConfig;

function DashboardStats({ go }: { go: (page: string) => void }) {
  const registered = toolRows.reduce(
    (sum, row) =>
      sum +
      Number(
        toolDataset.rows.find((item) => item.tool === row.tool)?.registered ??
          0,
      ),
    0,
  );
  const totalCases = testDataset.rows.reduce(
    (sum, row) => sum + Number(row.total),
    0,
  );
  const stats = [
    {
      label: '已接入数据源',
      value: String(initialSources.length),
      delta: 8.2,
      footnote: '较上月',
      page: 'sources',
    },
    {
      label: '标准 Dataset',
      value: String(datasets.length),
      delta: 12.5,
      footnote: '本月新增',
      page: 'datasets',
    },
    {
      label: '工具注册用户',
      value: registered.toLocaleString(),
      delta: 5.8,
      footnote: '较上周',
      page: 'dashboards',
    },
    {
      label: '今日测试 Case',
      value: totalCases.toLocaleString(),
      delta: -2.1,
      footnote: '较昨日',
      page: 'runs',
    },
  ];
  return (
    <>
      {stats.map((stat) => (
        <Card className="shadow-none dark:ring-0" key={stat.label}>
          <CardHeader>
            <CardTitle className="text-xs font-normal text-muted-foreground">
              {stat.label}
            </CardTitle>
            <CardAction>
              <Button
                aria-label={`打开${stat.label}`}
                size="icon-xs"
                variant="ghost"
                onClick={() => go(stat.page)}
              >
                <ArrowRight />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="text-2xl font-semibold tabular-nums">{stat.value}</p>
            <div className="flex items-center gap-1 text-xs">
              <Delta value={stat.delta}>
                <DeltaIcon />
                <DeltaValue />
              </Delta>
              <span className="text-muted-foreground">{stat.footnote}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

function ToolTrendCard() {
  const [period, setPeriod] = useState('today');
  const rows = useMemo(
    () => (period === 'recent' ? callTrend.slice(-6) : callTrend),
    [period],
  );
  return (
    <Card className="shadow-none md:col-span-2 lg:col-span-3 dark:ring-0">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CardTitle>工具调用趋势</CardTitle>
            <Delta value={18.6} variant="badge">
              <DeltaIcon variant="trend" />
              <DeltaValue />
            </Delta>
          </div>
          <CardDescription>所有内部工具按小时聚合的调用次数</CardDescription>
        </div>
        <Select
          value={period}
          onValueChange={(value) => setPeriod(String(value))}
        >
          <SelectTrigger className="w-full min-w-32 sm:w-fit" size="sm">
            <SelectValue>
              {period === 'today' ? '今日' : '最近 6 小时'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="today">今日</SelectItem>
            <SelectItem value="recent">最近 6 小时</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <ChartContainer
          className="aspect-[22/8] w-full"
          config={trendChartConfig}
        >
          <AreaChart
            data={rows}
            margin={{ left: 4, right: 8, top: 8 }}
            accessibilityLayer
          >
            <defs>
              <linearGradient id="tool-call-area" x1="0" x2="0" y1="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--color-calls)"
                  stopOpacity={0.4}
                />
                <stop
                  offset="100%"
                  stopColor="var(--color-calls)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 4" />
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tickMargin={8}
            />
            <YAxis axisLine={false} tickLine={false} width={34} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              dataKey="calls"
              type="natural"
              stroke="var(--color-calls)"
              strokeWidth={2}
              fill="url(#tool-call-area)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function ToolShareCard() {
  const groupedRows = [
    ...toolRows.slice(0, 2),
    {
      tool: '其他工具',
      calls: toolRows.slice(2).reduce((sum, current) => sum + current.calls, 0),
      active: toolRows
        .slice(2)
        .reduce((sum, current) => sum + current.active, 0),
      fill: '',
    },
  ];
  const data = groupedRows.map((row, index) => ({
    ...row,
    fill: shareColors[index % shareColors.length],
  }));
  const config = Object.fromEntries(
    data.map((row) => [row.tool, { label: row.tool, color: row.fill }]),
  ) satisfies ChartConfig;
  const total = data.reduce((sum, row) => sum + row.calls, 0);
  return (
    <Card className="flex flex-col shadow-none dark:ring-0">
      <CardHeader className="space-y-1">
        <CardTitle>工具调用占比</CardTitle>
        <CardDescription>今日各工具调用分布</CardDescription>
      </CardHeader>
      <CardContent className="my-auto">
        <ChartContainer
          className="mx-auto aspect-square max-h-48 w-full"
          config={config}
        >
          <PieChart accessibilityLayer>
            <Pie
              data={data}
              dataKey="calls"
              nameKey="tool"
              innerRadius={38}
              outerRadius="86%"
              cornerRadius={7}
              stroke="var(--card)"
              strokeWidth={4}
            />
            <ChartTooltip content={<ChartTooltipContent nameKey="tool" />} />
          </PieChart>
        </ChartContainer>
        <div className="mt-2 grid gap-1.5">
          {data.map((row) => (
            <div className="flex items-center gap-2 text-[10px]" key={row.tool}>
              <i
                className="size-2 rounded-sm"
                style={{ background: row.fill }}
              />
              <span className="min-w-0 flex-1 truncate text-muted-foreground">
                {row.tool}
              </span>
              <strong className="font-medium tabular-nums">
                {((row.calls / total) * 100).toFixed(1)}%
              </strong>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TestResultsCard() {
  const rows = testDataset.rows.map((row) => ({
    project: String(row.project),
    passed: Number(row.passed),
    failed: Number(row.failed),
  }));
  return (
    <Card className="shadow-none md:col-span-2 dark:ring-0">
      <CardHeader>
        <CardTitle>CICT 测试结果</CardTitle>
        <CardDescription>各项目通过与失败 Case 分布</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          className="aspect-video w-full"
          config={testChartConfig}
        >
          <BarChart data={rows} accessibilityLayer>
            <XAxis
              dataKey="project"
              axisLine={false}
              tickLine={false}
              tickMargin={10}
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
              cursor={{ fill: 'var(--muted)', opacity: 0.5 }}
            />
            <Bar
              dataKey="passed"
              stackId="case"
              fill="var(--color-passed)"
              radius={[5, 5, 0, 0]}
            />
            <Bar
              dataKey="failed"
              stackId="case"
              fill="var(--color-failed)"
              radius={[5, 5, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function PipelineLatencyCard() {
  const rows = pipelineDataset.rows.map((row) => ({
    stage: String(row.stage),
    duration: Number(row.duration),
  }));
  return (
    <Card className="shadow-none md:col-span-2 dark:ring-0">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Pipeline 平均耗时</CardTitle>
          <Delta value={-8.4} variant="badge">
            <DeltaIcon variant="trend" />
            <DeltaValue />
          </Delta>
        </div>
        <CardDescription>Go → ACP → Agent CLI 各处理阶段</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          className="aspect-video w-full"
          config={pipelineChartConfig}
        >
          <LineChart
            data={rows}
            margin={{ top: 24, left: 14, right: 14 }}
            accessibilityLayer
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="stage"
              axisLine={false}
              tickLine={false}
              tickMargin={9}
            />
            <ChartTooltip
              content={<ChartTooltipContent indicator="line" />}
              cursor={false}
            />
            <Line
              dataKey="duration"
              type="natural"
              stroke="var(--color-duration)"
              strokeWidth={2}
              dot={{ fill: 'var(--color-duration)' }}
            >
              <LabelList
                dataKey="duration"
                position="top"
                offset={10}
                formatter={(value) => `${Number(value).toFixed(1)}s`}
              />
            </Line>
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function RecentRunsCard({ go }: { go: (page: string) => void }) {
  return (
    <Card className="gap-0 shadow-none md:col-span-2 dark:ring-0">
      <CardHeader className="border-b">
        <CardTitle>最近运行</CardTitle>
        <CardDescription>最新连接器采集与转换任务</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {jobRuns.slice(0, 4).map((run) => (
            <div className="flex min-h-14 items-center gap-3 px-4" key={run.id}>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                {run.status === 'success' ? (
                  <CheckCircle2 className="size-4 text-emerald-500" />
                ) : run.status === 'running' ? (
                  <PlayCircle className="size-4 text-amber-500" />
                ) : (
                  <Activity className="size-4 text-rose-500" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{run.source}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {run.dataset} · {run.trigger}
                </p>
              </div>
              <span className="hidden text-xs tabular-nums text-muted-foreground sm:block">
                {run.rows.toLocaleString()} 行
              </span>
              <Badge
                variant={run.status === 'failed' ? 'destructive' : 'secondary'}
              >
                {run.status === 'success'
                  ? '成功'
                  : run.status === 'running'
                    ? '运行中'
                    : '失败'}
              </Badge>
            </div>
          ))}
        </div>
        <div className="flex justify-center border-t py-2">
          <Button size="sm" variant="ghost" onClick={() => go('runs')}>
            查看全部
            <ArrowRight />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SourceHealthCard({ go }: { go: (page: string) => void }) {
  return (
    <Card className="gap-0 shadow-none dark:ring-0">
      <CardHeader className="border-b">
        <CardTitle>数据源健康度</CardTitle>
        <CardDescription>连接器最新状态</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y">
          {initialSources.slice(0, 5).map((source) => (
            <li className="flex items-center gap-3 px-4 py-3" key={source.id}>
              <span
                className={`size-2 rounded-full ${source.status === 'healthy' ? 'bg-emerald-500' : source.status === 'warning' ? 'bg-amber-500' : 'bg-muted-foreground'}`}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{source.name}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {source.lastRun}
                </p>
              </div>
              <span className="text-xs tabular-nums">
                {source.successRate}%
              </span>
            </li>
          ))}
        </ul>
        <div className="flex justify-center border-t py-2">
          <Button size="sm" variant="ghost" onClick={() => go('sources')}>
            管理数据源
            <ArrowRight />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PlatformActivityCard({ go }: { go: (page: string) => void }) {
  const items = [
    {
      title: 'CICT Agent 完成 326 个 Case 解析',
      time: '2 分钟前',
      icon: CheckCircle2,
    },
    { title: 'tool_usage_daily 生成新快照', time: '8 分钟前', icon: Database },
    { title: 'Jira 连接器配置已更新', time: '21 分钟前', icon: PlugZap },
    { title: '研发效能总览发布 v12', time: '1 小时前', icon: Layers3 },
  ];
  return (
    <Card className="gap-0 shadow-none dark:ring-0">
      <CardHeader className="border-b">
        <CardTitle>平台动态</CardTitle>
        <CardDescription>最近配置与数据变化</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <ul className="divide-y">
          {items.map((item) => (
            <li
              className="flex min-h-16 items-center gap-3 px-4"
              key={item.title}
            >
              <span className="flex size-8 shrink-0 items-center justify-center text-muted-foreground">
                <item.icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-xs">{item.title}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {item.time}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <div className="flex justify-center border-t py-2">
          <Button size="sm" variant="ghost" onClick={() => go('dashboards')}>
            查看配置
            <ArrowRight />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function PlatformOverview({ go }: { go: (page: string) => void }) {
  const published = initialDashboards.filter(
    (item) => item.status === 'published',
  ).length;
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/25 px-4 py-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <Clock3 className="size-4" />
          最近同步于今天 14:32，所有指标来自 Dataset Snapshot
        </span>
        <span>{published} 个大屏已发布</span>
      </div>
      <div className="efferd-dashboard-grid grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardStats go={go} />
        <ToolTrendCard />
        <ToolShareCard />
        <TestResultsCard />
        <PipelineLatencyCard />
        <RecentRunsCard go={go} />
        <SourceHealthCard go={go} />
        <PlatformActivityCard go={go} />
      </div>
    </>
  );
}
