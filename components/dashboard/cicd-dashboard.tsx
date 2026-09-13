'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Activity,
  Boxes,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Download,
  GitBranch,
  GitCommitHorizontal,
  Play,
  RotateCcw,
  ServerCog,
  TimerReset,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';
import { downloadText } from '@/components/dashboard/case-table';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { platformAdapter } from '@/lib/platform-api';
import type { DatasetResult } from '@/lib/platform-types';

const projectOptions = ['Vortex Core', 'Vehicle OS', 'Cockpit'];
const environmentOptions = ['生产', '预发', '开发'];
const triggerColors = ['#ff5a12', '#f59e0b', '#6d5dfc', '#2563eb'];

const deliveryChartConfig = {
  pipelines: { label: '流水线', color: '#ff5a12' },
  failed: { label: '失败', color: '#31343a' },
} satisfies ChartConfig;

const failureChartConfig = {
  failed: { label: '失败', color: '#ff5a12' },
  recovered: { label: '已恢复', color: '#525866' },
} satisfies ChartConfig;

const stageChartConfig = {
  duration: { label: '平均耗时', color: '#ff5a12' },
} satisfies ChartConfig;

type CicdData = {
  daily: DatasetResult;
  triggers: DatasetResult;
  stages: DatasetResult;
  recent: DatasetResult;
};

type DailyPoint = {
  date: string;
  pipelines: number;
  succeeded: number;
  failed: number;
  recovered: number;
  avgDuration: number;
};

function durationLabel(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${Math.round(seconds % 60)}s`;
}

function statusTone(status: string) {
  if (status === '成功' || status === '正常') return 'cicd-status-success';
  if (status === '运行中') return 'cicd-status-running';
  if (status === '失败' || status === '关注') return 'cicd-status-failed';
  return 'cicd-status-muted';
}

function KpiCard({
  title,
  value,
  detail,
  icon,
}: {
  title: string;
  value: string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <Card className="cicd-kpi">
      <CardContent>
        <div>
          <strong>{value}</strong>
          <span>{title}</span>
          <small>{detail}</small>
        </div>
        <i>{icon}</i>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="cicd-skeleton" aria-label="正在加载 CI/CD 数据">
      <div className="cicd-kpi-grid">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton className="h-36 rounded-2xl" key={index} />
        ))}
      </div>
      <div className="cicd-primary-grid">
        <Skeleton className="h-[390px] rounded-2xl" />
        <Skeleton className="h-[390px] rounded-2xl" />
      </div>
    </div>
  );
}

export function CicdDashboard() {
  const [project, setProject] = useState('all');
  const [environment, setEnvironment] = useState('all');
  const [period, setPeriod] = useState(14);
  const [data, setData] = useState<CicdData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const filters: Record<string, string> = {};
    if (project !== 'all') filters.project = project;
    if (environment !== 'all') filters.environment = environment;

    Promise.all([
      platformAdapter.queryDataset('cicd_delivery_daily', {
        filters,
        limit: 500,
      }),
      platformAdapter.queryDataset('cicd_trigger_distribution', {
        filters,
        limit: 1500,
      }),
      platformAdapter.queryDataset('pipeline_runs', { limit: 20 }),
      platformAdapter.queryDataset('cicd_recent_runs', {
        filters,
        limit: 12,
      }),
    ])
      .then(([daily, triggers, stages, recent]) => {
        if (active) {
          setData({ daily, triggers, stages, recent });
          setError('');
        }
      })
      .catch((reason: unknown) => {
        if (active)
          setError(reason instanceof Error ? reason.message : '数据加载失败');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [environment, project]);

  const dailyPoints = useMemo(() => {
    if (!data) return [];
    const grouped = new Map<string, DailyPoint & { samples: number }>();
    data.daily.rows.forEach((row) => {
      const date = String(row.date);
      const current = grouped.get(date) ?? {
        date,
        pipelines: 0,
        succeeded: 0,
        failed: 0,
        recovered: 0,
        avgDuration: 0,
        samples: 0,
      };
      current.pipelines += Number(row.pipelines);
      current.succeeded += Number(row.succeeded);
      current.failed += Number(row.failed);
      current.recovered += Number(row.recovered);
      current.avgDuration += Number(row.avgDuration);
      current.samples += 1;
      grouped.set(date, current);
    });
    return Array.from(grouped.values())
      .map(({ samples, ...row }) => ({
        ...row,
        avgDuration: row.avgDuration / Math.max(samples, 1),
      }))
      .slice(-period);
  }, [data, period]);

  const triggerRows = useMemo(() => {
    if (!data) return [];
    const visibleDates = new Set(dailyPoints.map((row) => row.date));
    const grouped = new Map<string, number>();
    data.triggers.rows.forEach((row) => {
      if (!visibleDates.has(String(row.date))) return;
      const name = String(row.trigger);
      grouped.set(name, (grouped.get(name) ?? 0) + Number(row.runs));
    });
    return Array.from(grouped, ([name, value], index) => ({
      name,
      value,
      fill: triggerColors[index % triggerColors.length],
    }));
  }, [dailyPoints, data]);

  const totals = useMemo(() => {
    const pipelines = dailyPoints.reduce((sum, row) => sum + row.pipelines, 0);
    const succeeded = dailyPoints.reduce((sum, row) => sum + row.succeeded, 0);
    const duration =
      dailyPoints.reduce((sum, row) => sum + row.avgDuration, 0) /
      Math.max(dailyPoints.length, 1);
    const running =
      data?.stages.rows.reduce((sum, row) => sum + Number(row.running), 0) ?? 0;
    const queued =
      data?.stages.rows.reduce((sum, row) => sum + Number(row.queued), 0) ?? 0;
    return {
      pipelines,
      successRate: pipelines ? (succeeded / pipelines) * 100 : 0,
      duration,
      running,
      queued,
    };
  }, [dailyPoints, data]);

  const exportReport = () => {
    if (!data) return;
    downloadText(
      `cicd-report-2026-09-13.json`,
      JSON.stringify(
        {
          filters: { project, environment, period },
          snapshotAt: data.daily.snapshotAt,
          summary: totals,
          daily: dailyPoints,
          triggers: triggerRows,
          recentRuns: data.recent.rows,
        },
        null,
        2,
      ),
    );
  };

  return (
    <div className="cicd-dashboard">
      <div className="cicd-hero">
        <div className="cicd-title-row">
          <div>
            <div className="cicd-live-label">
              <span /> 实时监控 · 最后更新 16:42
            </div>
            <h1>CI/CD 交付大屏</h1>
            <p>构建、测试、发布与部署的运行态势</p>
          </div>
          <div className="cicd-toolbar">
            <Select
              value={project}
              onValueChange={(value) => setProject(String(value))}
            >
              <SelectTrigger aria-label="选择项目" className="cicd-select">
                <SelectValue>
                  {project === 'all' ? '全部项目' : project}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部项目</SelectItem>
                {projectOptions.map((item) => (
                  <SelectItem value={item} key={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={environment}
              onValueChange={(value) => setEnvironment(String(value))}
            >
              <SelectTrigger aria-label="选择环境" className="cicd-select">
                <SelectValue>
                  {environment === 'all' ? '全部环境' : environment}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部环境</SelectItem>
                {environmentOptions.map((item) => (
                  <SelectItem value={item} key={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              className="cicd-export"
              onClick={exportReport}
              disabled={!data}
            >
              <Download /> 导出报告
            </Button>
          </div>
        </div>
        <div className="cicd-periods" aria-label="时间范围">
          {[7, 14, 30].map((days) => (
            <button
              className={period === days ? 'active' : ''}
              onClick={() => setPeriod(days)}
              key={days}
            >
              近 {days} 天
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <Card className="cicd-error">
          <CircleAlert />
          <div>
            <strong>无法读取 CI/CD Dataset</strong>
            <p>{error}</p>
          </div>
          <Button variant="outline" onClick={() => location.reload()}>
            <RotateCcw /> 重新加载
          </Button>
        </Card>
      ) : !data || dailyPoints.length === 0 ? (
        <Card className="cicd-empty">
          <Boxes />
          <strong>当前筛选范围没有流水线数据</strong>
          <p>调整项目、环境或时间范围后重试。</p>
        </Card>
      ) : (
        <>
          <div className="cicd-kpi-grid">
            <KpiCard
              title="流水线执行"
              value={totals.pipelines.toLocaleString('zh-CN')}
              detail={`近 ${period} 天 · ${project === 'all' ? '全部项目' : project}`}
              icon={<Play />}
            />
            <KpiCard
              title="交付成功率"
              value={`${totals.successRate.toFixed(1)}%`}
              detail="目标 95.0% · 统计成功结束任务"
              icon={<CheckCircle2 />}
            />
            <KpiCard
              title="当前运行中"
              value={String(totals.running)}
              detail={`${totals.queued} 个任务等待执行`}
              icon={<Activity />}
            />
            <KpiCard
              title="平均交付耗时"
              value={durationLabel(totals.duration)}
              detail="从触发到部署完成"
              icon={<TimerReset />}
            />
          </div>

          <div className="cicd-primary-grid">
            <Card className="cicd-card cicd-trend-card">
              <CardHeader>
                <CardTitle>流水线执行趋势</CardTitle>
                <CardDescription>每日运行总量与失败数量</CardDescription>
                <CardAction>
                  <Badge variant="outline" className="cicd-online">
                    <span /> Online
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  className="cicd-main-chart"
                  config={deliveryChartConfig}
                >
                  <AreaChart
                    data={dailyPoints}
                    accessibilityLayer
                    margin={{ left: -14, right: 10, top: 12 }}
                  >
                    <defs>
                      <linearGradient
                        id="cicd-pipeline-area"
                        x1="0"
                        x2="0"
                        y1="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="var(--color-pipelines)"
                          stopOpacity={0.38}
                        />
                        <stop
                          offset="100%"
                          stopColor="var(--color-pipelines)"
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 4" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tickMargin={10}
                      minTickGap={28}
                    />
                    <YAxis axisLine={false} tickLine={false} width={38} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      dataKey="pipelines"
                      type="natural"
                      stroke="var(--color-pipelines)"
                      strokeWidth={2.3}
                      fill="url(#cicd-pipeline-area)"
                    />
                    <Line
                      dataKey="failed"
                      type="monotone"
                      stroke="var(--color-failed)"
                      strokeWidth={1.6}
                      dot={false}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="cicd-card cicd-trigger-card">
              <CardHeader>
                <CardTitle>触发方式分布</CardTitle>
                <CardDescription>当前筛选范围内的流水线来源</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="cicd-donut-wrap">
                  <ChartContainer
                    className="cicd-donut"
                    config={{ runs: { label: '执行次数', color: '#ff5a12' } }}
                  >
                    <PieChart accessibilityLayer>
                      <Pie
                        data={triggerRows}
                        dataKey="value"
                        nameKey="name"
                        innerRadius="57%"
                        outerRadius="86%"
                        paddingAngle={3}
                        cornerRadius={7}
                        stroke="var(--card)"
                        strokeWidth={4}
                      ></Pie>
                      <ChartTooltip
                        content={<ChartTooltipContent nameKey="name" />}
                      />
                    </PieChart>
                  </ChartContainer>
                  <div className="cicd-donut-total">
                    <strong>
                      {triggerRows
                        .reduce((sum, item) => sum + item.value, 0)
                        .toLocaleString('zh-CN')}
                    </strong>
                    <span>次触发</span>
                  </div>
                </div>
                <div className="cicd-legend">
                  {triggerRows.map((item) => (
                    <div key={item.name}>
                      <i style={{ background: item.fill }} />
                      <span>{item.name}</span>
                      <strong>{item.value.toLocaleString('zh-CN')}</strong>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="cicd-secondary-grid">
            <Card className="cicd-card">
              <CardHeader>
                <CardTitle>流水线阶段耗时</CardTitle>
                <CardDescription>
                  Go 调度、ACP 与 Agent 处理链路
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  className="cicd-secondary-chart"
                  config={stageChartConfig}
                >
                  <BarChart
                    data={data.stages.rows.map((row) => ({
                      stage: String(row.stage),
                      duration: Number(row.duration),
                    }))}
                    layout="vertical"
                    accessibilityLayer
                    margin={{ left: 4, right: 26 }}
                  >
                    <CartesianGrid horizontal={false} strokeDasharray="3 4" />
                    <XAxis
                      type="number"
                      axisLine={false}
                      tickLine={false}
                      unit="s"
                    />
                    <YAxis
                      type="category"
                      dataKey="stage"
                      axisLine={false}
                      tickLine={false}
                      width={72}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="duration"
                      fill="var(--color-duration)"
                      radius={[0, 7, 7, 0]}
                      barSize={16}
                    />
                  </BarChart>
                </ChartContainer>
                <div className="cicd-stage-health">
                  {data.stages.rows.map((row) => (
                    <div key={String(row.stage)}>
                      <span className={statusTone(String(row.status))} />
                      <strong>{String(row.stage)}</strong>
                      <small>{String(row.status)}</small>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="cicd-card">
              <CardHeader>
                <CardTitle>失败与恢复趋势</CardTitle>
                <CardDescription>失败流水线与当日恢复数量</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  className="cicd-secondary-chart"
                  config={failureChartConfig}
                >
                  <LineChart
                    data={dailyPoints}
                    accessibilityLayer
                    margin={{ left: -14, right: 12, top: 10 }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 4" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tickMargin={10}
                      minTickGap={26}
                    />
                    <YAxis axisLine={false} tickLine={false} width={36} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      dataKey="failed"
                      type="monotone"
                      stroke="var(--color-failed)"
                      strokeWidth={2.3}
                      dot={{ r: 2.5 }}
                    />
                    <Line
                      dataKey="recovered"
                      type="monotone"
                      stroke="var(--color-recovered)"
                      strokeWidth={2}
                      strokeDasharray="5 4"
                      dot={{ r: 2 }}
                    />
                  </LineChart>
                </ChartContainer>
                <div className="cicd-inline-legend">
                  <span>
                    <i className="failed" />
                    失败流水线
                  </span>
                  <span>
                    <i className="recovered" />
                    已恢复
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="cicd-card cicd-runs-card">
            <CardHeader>
              <CardTitle>最近流水线</CardTitle>
              <CardDescription>构建、测试与部署任务的最新状态</CardDescription>
              <CardAction>
                <span className="cicd-snapshot">
                  Snapshot · {data.recent.datasetVersion}
                </span>
              </CardAction>
            </CardHeader>
            <CardContent>
              {data.recent.rows.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>流水线</TableHead>
                      <TableHead>项目 / 分支</TableHead>
                      <TableHead>环境</TableHead>
                      <TableHead>触发</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead className="text-right">耗时</TableHead>
                      <TableHead className="text-right">开始时间</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recent.rows.map((row) => (
                      <TableRow key={String(row.pipelineId)}>
                        <TableCell>
                          <strong className="cicd-pipeline-id">
                            {String(row.pipelineId)}
                          </strong>
                        </TableCell>
                        <TableCell>
                          <div className="cicd-project-cell">
                            <strong>{String(row.project)}</strong>
                            <span>
                              <GitBranch />
                              {String(row.branch)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {String(row.environment)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="cicd-trigger">
                            <GitCommitHorizontal />
                            {String(row.trigger)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`cicd-run-status ${statusTone(String(row.status))}`}
                          >
                            <i />
                            {String(row.status)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          <Clock3 className="cicd-clock" />
                          {durationLabel(Number(row.duration))}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {String(row.startedAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="cicd-table-empty">
                  <ServerCog />
                  当前筛选范围没有最近运行记录
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
