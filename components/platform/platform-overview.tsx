'use client';

import {
  Activity,
  ArrowRight,
  Blocks,
  Database,
  LayoutDashboard,
  PlugZap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  componentDefinitions,
  datasets,
  initialDashboards,
  jobRuns,
} from '@/lib/platform-data';
import { DashboardRenderer } from './widget-renderer';

export function PlatformOverview({ go }: { go: (page: string) => void }) {
  const dashboard = initialDashboards[0];
  return (
    <>
      <div className="platform-kpis">
        {[
          {
            label: '数据源',
            value: '6',
            detail: '5 个运行中',
            trend: '↑ 8.2% 本月',
            tone: 'blue',
            points:
              '0,26 12,22 24,24 36,15 48,20 60,16 72,18 84,10 96,13 108,6',
            icon: PlugZap,
            page: 'sources',
          },
          {
            label: 'Datasets',
            value: String(datasets.length),
            detail: '29 个标准字段',
            trend: '↑ 12.5% 本月',
            tone: 'green',
            points: '0,25 12,17 24,20 36,12 48,19 60,9 72,13 84,8 96,12 108,4',
            icon: Database,
            page: 'datasets',
          },
          {
            label: '组件',
            value: String(componentDefinitions.length),
            detail: '7 个稳定组件',
            trend: '↑ 3 个可复用',
            tone: 'purple',
            points: '0,24 12,18 24,22 36,13 48,15 60,9 72,16 84,10 96,7 108,11',
            icon: Blocks,
            page: 'components',
          },
          {
            label: '已发布大屏',
            value: '2',
            detail: '1 个草稿',
            trend: '↑ 1 个本周发布',
            tone: 'orange',
            points: '0,27 12,23 24,15 36,20 48,12 60,17 72,9 84,13 96,5 108,8',
            icon: LayoutDashboard,
            page: 'dashboards',
          },
        ].map((item) => (
          <button
            className={`panel platform-kpi tone-${item.tone}`}
            key={item.label}
            aria-label={`打开${item.label}`}
            onClick={() => go(item.page)}
          >
            <span className="kpi-icon">
              <item.icon size={18} />
            </span>
            <div className="kpi-copy">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.detail}</small>
            </div>
            <span className="kpi-menu">•••</span>
            <div className="kpi-trend">{item.trend}</div>
            <svg className="kpi-spark" viewBox="0 0 108 30" aria-hidden="true">
              <polyline points={item.points} />
            </svg>
          </button>
        ))}
      </div>
      <div className="platform-section-head">
        <div>
          <h2>运行概览</h2>
          <p>当前平台资产与最近采集状态</p>
        </div>
        <Button
          variant="outline"
          className="btn"
          onClick={() => go('dashboards')}
        >
          进入大屏管理
          <ArrowRight size={14} />
        </Button>
      </div>
      <DashboardRenderer
        dashboard={{ ...dashboard, widgets: dashboard.widgets.slice(4, 6) }}
      />
      <div className="platform-section-head">
        <div>
          <h2>最近运行</h2>
          <p>连接器采集与转换任务</p>
        </div>
        <Button variant="ghost" className="btn" onClick={() => go('runs')}>
          查看全部
          <ArrowRight size={14} />
        </Button>
      </div>
      <section className="panel compact-run-list">
        {jobRuns.slice(0, 4).map((run) => (
          <div key={run.id}>
            <span className={`run-icon ${run.status}`}>
              <Activity size={15} />
            </span>
            <div>
              <strong>{run.source}</strong>
              <small>
                {run.dataset} · {run.trigger}
              </small>
            </div>
            <span className={`plain-status ${run.status}`}>
              {run.status === 'success'
                ? '成功'
                : run.status === 'running'
                  ? '运行中'
                  : '失败'}
            </span>
            <b>{run.rows.toLocaleString()} 行</b>
            <time>{run.startedAt}</time>
          </div>
        ))}
      </section>
    </>
  );
}
