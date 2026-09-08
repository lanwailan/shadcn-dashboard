'use client';
import { Fragment, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Search,
  Terminal,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pill } from './shared';
import {
  type CaseRecord,
  statusLabels,
  casePaths,
  makeLogs,
} from '@/lib/dashboard-data';
export function downloadText(name: string, content: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(
    new Blob([content], { type: 'text/plain;charset=utf-8' }),
  );
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
export function CaseTable({
  cases,
  retry,
  title = '解析任务',
  initialOpen,
  filterDefault = 'all',
}: {
  cases: CaseRecord[];
  retry: (id: string) => Promise<void>;
  title?: string;
  initialOpen?: string;
  filterDefault?: string;
}) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState(filterDefault);
  const [open, setOpen] = useState<string | null>(initialOpen || null);
  const [logTab, setLogTab] = useState('log');
  const [notice, setNotice] = useState('');
  const filtered = cases.filter(
    (c) =>
      (status === 'all' || c.status === status) &&
      `${c.id} ${c.name} ${c.user} ${c.platform}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <section className="panel table-panel">
      <div className="table-toolbar">
        <div>
          <h2>
            {title}{' '}
            <span className="pill" style={{ marginLeft: 8 }}>
              {cases.length}
            </span>
          </h2>
          <p className="subtitle" style={{ marginTop: 5 }}>
            最近任务 · 展开查看测试细则与执行日志
          </p>
        </div>
        <div className="table-controls">
          <div className="search">
            <Search size={15} />
            <Input
              aria-label="搜索任务、用户或平台"
              placeholder="搜索 Case、用户或平台…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Select value={status} onValueChange={(v) => setStatus(String(v))}>
            <SelectTrigger className="btn" aria-label="筛选解析状态">
              <SelectValue>
                {status === 'all'
                  ? '全部状态'
                  : statusLabels[status as keyof typeof statusLabels]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              {Object.entries(statusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <output aria-live="polite" style={{ display: 'block' }}>
        {notice && (
          <p
            style={{
              padding: '0 24px 15px',
              fontSize: 13,
              color: 'var(--blue)',
            }}
          >
            {notice}
          </p>
        )}
      </output>
      <Table>
        <TableHeader>
          <TableRow>
            {[
              'Case / 测试任务',
              '解析状态',
              '测试结果',
              '平台',
              '提交人',
              '时间',
              '',
            ].map((h, i) => (
              <TableHead key={i}>{h}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((c) => {
            const expanded = open === c.id;
            const passed = c.tests.reduce((s, t) => s + t.passed, 0),
              total = c.tests.reduce((s, t) => s + t.total, 0);
            const hasResult = c.status === 'success';
            const paths = casePaths(c);
            return (
              <Fragment key={c.id}>
                <TableRow className={expanded ? 'bg-muted/40' : ''}>
                  <TableCell>
                    <button
                      onClick={() => setOpen(expanded ? null : c.id)}
                      aria-expanded={expanded}
                      aria-controls={`detail-${c.id}`}
                      style={{
                        display: 'flex',
                        gap: 10,
                        alignItems: 'center',
                        textAlign: 'left',
                      }}
                    >
                      {expanded ? (
                        <ChevronDown size={15} />
                      ) : (
                        <ChevronRight size={15} />
                      )}
                      <span>
                        <span className="case-title">{c.name}</span>
                        <span className="case-sub" style={{ display: 'block' }}>
                          {c.id} · nightly-build #{c.build}
                        </span>
                      </span>
                    </button>
                  </TableCell>
                  <TableCell>
                    <Pill
                      tone={
                        c.status === 'success'
                          ? 'green'
                          : c.status === 'failed'
                            ? 'red'
                            : c.status === 'running'
                              ? 'blue'
                              : 'orange'
                      }
                    >
                      {statusLabels[c.status]}
                    </Pill>
                  </TableCell>
                  <TableCell>
                    {hasResult ? (
                      <span
                        style={{
                          color: passed === total ? 'var(--teal)' : '#d8952d',
                        }}
                      >
                        {passed === total
                          ? '全部通过'
                          : `${total - passed} 项失败`}{' '}
                        <span className="muted">
                          {passed}/{total}
                        </span>
                      </span>
                    ) : (
                      <span className="muted">等待解析结果</span>
                    )}
                  </TableCell>
                  <TableCell>{c.platform}</TableCell>
                  <TableCell>{c.user}</TableCell>
                  <TableCell className="muted">{c.time}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`${expanded ? '收起' : '展开'} ${c.id}`}
                      onClick={() => setOpen(expanded ? null : c.id)}
                    >
                      {expanded ? <ChevronDown /> : <ChevronRight />}
                    </Button>
                  </TableCell>
                </TableRow>
                {expanded && (
                  <TableRow id={`detail-${c.id}`}>
                    <TableCell colSpan={7} style={{ padding: 0 }}>
                      <div className="case-detail">
                        <div className="detail-top">
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                            }}
                          >
                            <h3>{c.id} 解析详情</h3>
                            <Pill
                              tone={
                                hasResult
                                  ? 'green'
                                  : c.status === 'failed'
                                    ? 'red'
                                    : 'blue'
                              }
                            >
                              {statusLabels[c.status]}
                            </Pill>
                          </div>
                          <Button
                            variant="outline"
                            className="btn"
                            disabled={
                              c.status === 'running' || c.status === 'queued'
                            }
                            onClick={async () => {
                              setNotice(
                                `${c.id} 已提交模拟解析，正在等待 Agent…`,
                              );
                              await retry(c.id);
                              setNotice(
                                `${c.id} 模拟解析完成，报告与日志已更新。`,
                              );
                            }}
                          >
                            <RefreshCw
                              className={
                                c.status === 'running' ? 'animate-spin' : ''
                              }
                              size={14}
                            />
                            {c.status === 'running' ? '正在解析…' : '重新解析'}
                          </Button>
                        </div>
                        <dl className="detail-meta">
                          {[
                            ['结果源路径', paths.source],
                            ['测试平台', c.platform],
                            ['Jenkins 构建路径', paths.jenkins],
                            [
                              '提交信息',
                              `${c.user} · 2026-09-08 ${c.time} · release/2026.09`,
                            ],
                          ].map(([label, value]) => (
                            <div key={label}>
                              <dt>{label}</dt>
                              <dd
                                className={label.includes('路径') ? 'mono' : ''}
                              >
                                {value}
                              </dd>
                            </div>
                          ))}
                        </dl>
                        <h3>
                          测试细则{' '}
                          <span
                            className="muted"
                            style={{
                              fontSize: 12,
                              fontWeight: 400,
                              marginLeft: 7,
                            }}
                          >
                            测试结果与解析状态独立统计
                          </span>
                        </h3>
                        {hasResult ? (
                          <div className="test-results">
                            {c.tests.map((t) => (
                              <article className="test-result" key={t.type}>
                                <header>
                                  <h3>{t.type} 测试</h3>
                                  <Pill
                                    tone={
                                      t.passed === t.total ? 'green' : 'orange'
                                    }
                                  >
                                    {t.passed === t.total ? '通过' : '失败'}
                                  </Pill>
                                </header>
                                <strong style={{ fontSize: 24 }}>
                                  {t.passed}
                                  <span
                                    className="muted"
                                    style={{ fontSize: 13, fontWeight: 400 }}
                                  >
                                    {' '}
                                    / {t.total} 项通过
                                  </span>
                                </strong>
                                <p style={{ marginTop: 10 }}>{t.message}</p>
                              </article>
                            ))}
                          </div>
                        ) : (
                          <div className="empty" style={{ padding: 25 }}>
                            {c.status === 'failed'
                              ? 'ACP 调用超时，尚未生成测试分析报告。可重新解析。'
                              : '等待 Agent 完成解析后展示测试结果。'}
                          </div>
                        )}
                        <div className="log-panel">
                          <div className="log-head">
                            <span
                              style={{
                                display: 'flex',
                                gap: 8,
                                alignItems: 'center',
                              }}
                            >
                              <Terminal size={14} />
                              Go Pipeline · 执行记录
                            </span>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                              }}
                            >
                              <Tabs
                                value={logTab}
                                onValueChange={(v) => setLogTab(String(v))}
                              >
                                <TabsList>
                                  <TabsTrigger value="log">
                                    执行日志
                                  </TabsTrigger>
                                  <TabsTrigger
                                    value="file"
                                    disabled={!hasResult}
                                  >
                                    结果文件
                                  </TabsTrigger>
                                </TabsList>
                              </Tabs>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="下载执行日志"
                                onClick={() =>
                                  downloadText(`${c.id}.log`, makeLogs(c))
                                }
                              >
                                <Download size={14} />
                              </Button>
                            </div>
                          </div>
                          <pre>
                            {logTab === 'file' && hasResult
                              ? JSON.stringify(
                                  {
                                    case_id: c.id,
                                    parsed_at: `2026-09-08T${c.time}:39+08:00`,
                                    duration_seconds: c.duration,
                                    source: paths.source + paths.file,
                                    output: paths.output,
                                    parse_status: 'success',
                                    tests: c.tests,
                                  },
                                  null,
                                  2,
                                )
                              : makeLogs(c)}
                          </pre>
                        </div>
                        <p
                          className="subtitle"
                          style={{
                            fontSize: 12,
                            whiteSpace: 'normal',
                            overflowWrap: 'anywhere',
                          }}
                        >
                          解析耗时：{hasResult ? `${c.duration} 秒` : '—'} ·
                          结果存放：{hasResult ? paths.output : '尚未生成'} ·
                          重新解析仅模拟前端状态，不调用真实服务器。
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
      {filtered.length === 0 && (
        <div className="empty">
          <Search size={28} style={{ margin: '0 auto 12px' }} />
          <p>没有符合条件的任务</p>
          <Button
            variant="link"
            onClick={() => {
              setQuery('');
              setStatus('all');
            }}
          >
            清除筛选
          </Button>
        </div>
      )}
      <div className="table-bottom">
        显示 {filtered.length} / {cases.length} 条最近任务 · 汇总指标为全天快照
      </div>
    </section>
  );
}
