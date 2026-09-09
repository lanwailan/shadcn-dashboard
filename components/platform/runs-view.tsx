'use client';

import { useState } from 'react';

import {
  CheckCircle2,
  Clock3,
  Play,
  RotateCw,
  TerminalSquare,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { jobRuns } from '@/lib/platform-data';

export function RunsView() {
  const [notice, setNotice] = useState('');
  return (
    <div className="runs-layout">
      <section className="panel run-table">
        <div className="table-toolbar">
          <div>
            <h2>采集与转换任务</h2>
            <p className="subtitle">调度器、Webhook 与手动运行的统一记录</p>
          </div>
          <Button
            className="btn"
            onClick={() =>
              setNotice('失败任务 run-11820 已重新加入 Pipeline 队列')
            }
          >
            <Play size={14} />
            重新运行失败任务
          </Button>
        </div>
        {notice && (
          <output className="inline-notice" aria-live="polite">
            {notice}
          </output>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>运行 ID</TableHead>
              <TableHead>数据源</TableHead>
              <TableHead>输出 Dataset</TableHead>
              <TableHead>触发方式</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>数据量</TableHead>
              <TableHead>耗时</TableHead>
              <TableHead>开始时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobRuns.map((run) => (
              <TableRow key={run.id}>
                <TableCell className="mono field-key">{run.id}</TableCell>
                <TableCell>{run.source}</TableCell>
                <TableCell>
                  <span className="dataset-chip">{run.dataset}</span>
                </TableCell>
                <TableCell>{run.trigger}</TableCell>
                <TableCell>
                  <span className={`plain-status ${run.status}`}>
                    {run.status === 'success' ? (
                      <CheckCircle2 size={13} />
                    ) : run.status === 'running' ? (
                      <RotateCw size={13} />
                    ) : (
                      <XCircle size={13} />
                    )}{' '}
                    {run.status === 'success'
                      ? '成功'
                      : run.status === 'running'
                        ? '运行中'
                        : '失败'}
                  </span>
                </TableCell>
                <TableCell>{run.rows.toLocaleString()} 行</TableCell>
                <TableCell>{run.duration}</TableCell>
                <TableCell>{run.startedAt}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
      <aside className="panel run-console">
        <header>
          <TerminalSquare size={16} />
          <strong>run_98F21</strong>
          <span className="plain-status failed">失败</span>
        </header>
        <pre>{`[14:10:00] INFO  scheduler.trigger source=feishu_specs
[14:10:01] INFO  connector.feishu.fetch table=specs
[14:10:02] INFO  rows.received count=42
[14:10:03] INFO  python_worker.start transform=spec_parser_v4
[14:10:29] WARN  agent.enrich retry=2
[14:10:30] ERROR AGENT_TIMEOUT duration=30s
[14:10:30] INFO  snapshot.preserved version=v17
[14:10:30] INFO  run.failed retryable=true`}</pre>
        <footer>
          <Clock3 size={13} />
          旧快照继续服务，不影响查询 API
        </footer>
      </aside>
    </div>
  );
}
