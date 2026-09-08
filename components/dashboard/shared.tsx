'use client';
import type { ReactNode } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
export function Pill({
  children,
  tone = 'green',
}: {
  children: ReactNode;
  tone?: string;
}) {
  return (
    <span className={`pill ${tone}`}>
      <span className="dot" />
      {children}
    </span>
  );
}
export function Panel({
  title,
  subtitle,
  action,
  children,
  className = '',
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel panel-pad ${className}`}>
      <div className="panel-head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
export function Stat({
  label,
  value,
  unit,
  foot,
  icon,
}: {
  label: string;
  value: string;
  unit?: string;
  foot: string;
  icon?: ReactNode;
}) {
  return (
    <div className="panel stat">
      <div className="stat-label">
        {label}
        {icon}
      </div>
      <div className="big-number">
        {value}
        <small>{unit}</small>
      </div>
      <div className="stat-foot">{foot}</div>
    </div>
  );
}
export const trendData = [
  { date: '09.02', calls: 1850, cases: 220 },
  { date: '09.03', calls: 2300, cases: 258 },
  { date: '09.04', calls: 2160, cases: 245 },
  { date: '09.05', calls: 3200, cases: 340 },
  { date: '09.06', calls: 2700, cases: 290 },
  { date: '09.07', calls: 3450, cases: 335 },
  { date: '09.08', calls: 3960, cases: 386 },
];
export function TrendChart({
  metric = 'calls',
}: {
  metric?: 'calls' | 'cases';
}) {
  return (
    <div className="chart-wrap">
      <ResponsiveContainer
        width="100%"
        height="100%"
        initialDimension={{ width: 600, height: 230 }}
      >
        <AreaChart
          data={trendData}
          margin={{ top: 12, right: 9, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id={`fill-${metric}`} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={metric === 'calls' ? '#648cf8' : '#42bda4'}
                stopOpacity={0.2}
              />
              <stop
                offset="100%"
                stopColor={metric === 'calls' ? '#648cf8' : '#42bda4'}
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="var(--border)"
            vertical={false}
            strokeDasharray="3 5"
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
            contentStyle={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              fontSize: 13,
            }}
            formatter={(v) => [
              Number(v).toLocaleString(),
              metric === 'calls' ? '工具调用' : '新增 Case',
            ]}
          />
          <Area
            type="monotone"
            dataKey={metric}
            stroke={metric === 'calls' ? '#648cf8' : '#42bda4'}
            strokeWidth={2.5}
            fill={`url(#fill-${metric})`}
            activeDot={{ r: 5, strokeWidth: 3, stroke: 'var(--card)' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
export function Distribution({
  items,
}: {
  items: { name: string; value: number; color?: string }[];
}) {
  const total = items.reduce((s, i) => s + i.value, 0);
  return (
    <div>
      {items.map((item, index) => (
        <div className="bar-item" key={item.name}>
          <div className="bar-label">
            <span>{item.name}</span>
            <span className="muted">
              {item.value.toLocaleString()}{' '}
              <span
                style={{
                  display: 'inline-block',
                  width: 46,
                  textAlign: 'right',
                }}
              >
                {Math.round((item.value / total) * 100)}%
              </span>
            </span>
          </div>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{
                width: `${(item.value / total) * 100}%`,
                background:
                  item.color ||
                  ['var(--blue)', 'var(--teal)', 'var(--purple)', '#e7b15a'][
                    index % 4
                  ],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
