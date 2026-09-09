'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertCircle, Database, GripVertical } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { datasets } from '@/lib/platform-data';
import type {
  DashboardConfig,
  Dataset,
  WidgetConfig,
} from '@/lib/platform-types';

const colors = [
  '#8198c5',
  '#72a991',
  '#a595c4',
  '#d09b66',
  '#bd7777',
  '#7896a3',
];

function valueOf(widget: WidgetConfig, dataset: Dataset) {
  const field = widget.mapping.value;
  if (!field) return 0;
  const values = dataset.rows.map((row) => Number(row[field]) || 0);
  const aggregate = widget.options?.aggregate ?? 'sum';
  if (aggregate === 'count') return dataset.rows.length;
  if (aggregate === 'avg')
    return (
      values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1)
    );
  if (aggregate === 'max') return Math.max(...values, 0);
  return values.reduce((sum, value) => sum + value, 0);
}

function formatValue(value: string | number | boolean, precision = 0) {
  if (typeof value !== 'number') return String(value);
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 10_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toLocaleString('zh-CN', {
    maximumFractionDigits: precision,
    minimumFractionDigits: precision,
  });
}

function WidgetBody({
  widget,
  dataset,
}: {
  widget: WidgetConfig;
  dataset: Dataset;
}) {
  const rows = dataset.rows.slice(0, widget.query?.limit ?? 20);
  const category = widget.mapping.category;
  const metric = widget.mapping.value;
  const chartData = rows.map((row, index) => ({
    name: category ? String(row[category]) : '',
    value: metric ? Number(row[metric]) || 0 : 0,
    fill: colors[index % colors.length],
  }));
  const chartProps = {
    width: '100%' as const,
    height: '100%' as const,
    initialDimension: { width: 540, height: 240 },
  };
  const tooltipStyle = {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 7,
    fontSize: 12,
  };

  if (widget.component === 'metric') {
    const value = valueOf(widget, dataset);
    return (
      <div className="runtime-metric">
        <strong style={{ color: widget.options?.color }}>
          {formatValue(value, widget.options?.precision)}
          {widget.options?.unit}
        </strong>
        <p>
          {widget.options?.description ??
            `${dataset.rows.length} 条数据参与计算`}
        </p>
      </div>
    );
  }
  if (widget.component === 'barChart') {
    return (
      <div className="runtime-chart">
        <ResponsiveContainer {...chartProps}>
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 8, left: -22, bottom: 0 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="var(--border)"
              strokeDasharray="3 4"
            />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              dy={7}
            />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar
              dataKey="value"
              fill={widget.options?.color ?? colors[0]}
              radius={[4, 4, 0, 0]}
              maxBarSize={44}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }
  if (widget.component === 'lineChart') {
    return (
      <div className="runtime-chart">
        <ResponsiveContainer {...chartProps}>
          <LineChart
            data={chartData}
            margin={{ top: 8, right: 12, left: -22, bottom: 0 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="var(--border)"
              strokeDasharray="3 4"
            />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              dy={7}
            />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={widget.options?.color ?? colors[0]}
              strokeWidth={2.5}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }
  if (widget.component === 'pieChart') {
    return (
      <div className="runtime-chart pie-runtime">
        <ResponsiveContainer {...chartProps}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius="48%"
              outerRadius="76%"
              paddingAngle={2}
            />
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className="runtime-legend">
          {chartData.slice(0, 5).map((item, index) => (
            <span key={item.name}>
              <i style={{ background: colors[index % colors.length] }} />
              {item.name}
            </span>
          ))}
        </div>
      </div>
    );
  }
  if (widget.component === 'progress') {
    return (
      <div className="runtime-progress">
        {rows.slice(0, 6).map((row) => {
          const value = metric ? Number(row[metric]) || 0 : 0;
          return (
            <div key={category ? String(row[category]) : String(value)}>
              <div>
                <span>{category ? String(row[category]) : widget.title}</span>
                <strong>
                  {formatValue(value, 1)}
                  {widget.options?.unit ?? '%'}
                </strong>
              </div>
              <Progress value={Math.min(value, 100)} />
            </div>
          );
        })}
      </div>
    );
  }
  if (widget.component === 'statusList') {
    return (
      <div className="runtime-status-list">
        {rows.slice(0, 7).map((row, index) => {
          const status = widget.mapping.series
            ? String(row[widget.mapping.series])
            : '正常';
          const positive = ['健康', '正常', '已完成', 'success'].includes(
            status,
          );
          return (
            <div key={`${String(row[category ?? ''])}-${index}`}>
              <span
                className={`status-indicator ${positive ? 'ok' : 'warn'}`}
              />
              <div>
                <strong>
                  {category ? String(row[category]) : `记录 ${index + 1}`}
                </strong>
                <small>{dataset.name}</small>
              </div>
              <span className="muted">{status}</span>
              {metric && (
                <b>
                  {formatValue(Number(row[metric]), 1)}
                  {widget.options?.unit ?? '%'}
                </b>
              )}
            </div>
          );
        })}
      </div>
    );
  }
  if (widget.component === 'table') {
    const columns = widget.mapping.columns?.length
      ? widget.mapping.columns
      : dataset.fields.slice(0, 6).map((field) => field.key);
    return (
      <div className="runtime-table">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>
                  {dataset.fields.find((field) => field.key === column)
                    ?.label ?? column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 8).map((row, index) => (
              <tr key={index}>
                {columns.map((column) => (
                  <td key={column}>{formatValue(row[column])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return (
    <div className="runtime-markdown">
      <p>{widget.options?.description ?? '可在编排器中填写说明内容。'}</p>
    </div>
  );
}

export function WidgetRenderer({
  widget,
  editable = false,
  onRemove,
}: {
  widget: WidgetConfig;
  editable?: boolean;
  onRemove?: () => void;
}) {
  const dataset = datasets.find((item) => item.id === widget.dataset);
  if (!dataset)
    return (
      <section className="panel runtime-widget widget-error">
        <AlertCircle />
        <strong>Dataset 不存在</strong>
        <p>{widget.dataset}</p>
      </section>
    );
  return (
    <section className="panel runtime-widget" data-widget={widget.component}>
      <header>
        <div>
          <h2>{widget.title}</h2>
          <p>
            <Database size={12} />
            {dataset.name} · {dataset.version}
          </p>
        </div>
        {editable && (
          <div className="widget-tools">
            <GripVertical size={16} />
            {onRemove && <button onClick={onRemove}>移除</button>}
          </div>
        )}
      </header>
      <WidgetBody widget={widget} dataset={dataset} />
    </section>
  );
}

export function DashboardRenderer({
  dashboard,
  editable = false,
  onReorder,
  onRemove,
}: {
  dashboard: DashboardConfig;
  editable?: boolean;
  onReorder?: (from: number, to: number) => void;
  onRemove?: (id: string) => void;
}) {
  return (
    <div
      className="dashboard-runtime"
      style={
        {
          '--dashboard-gap': `${dashboard.layout.gap}px`,
        } as React.CSSProperties
      }
    >
      {dashboard.widgets.map((widget, index) => (
        <div
          className="runtime-cell"
          style={{
            gridColumn: `span ${Math.min(widget.position.w, 24)}`,
            minHeight: Math.max(
              widget.position.h * dashboard.layout.rowHeight,
              100,
            ),
          }}
          key={widget.id}
          draggable={editable}
          onDragStart={(event) =>
            event.dataTransfer.setData('text/widget-index', String(index))
          }
          onDragOver={(event) => editable && event.preventDefault()}
          onDrop={(event) => {
            if (!editable || !onReorder) return;
            event.preventDefault();
            const from = Number(
              event.dataTransfer.getData('text/widget-index'),
            );
            if (Number.isFinite(from) && from !== index) onReorder(from, index);
          }}
        >
          <WidgetRenderer
            widget={widget}
            editable={editable}
            onRemove={onRemove ? () => onRemove(widget.id) : undefined}
          />
        </div>
      ))}
    </div>
  );
}
