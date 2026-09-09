'use client';

import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  CirclePause,
  Plus,
  RefreshCw,
  Search,
  TriangleAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { connectorLabels } from '@/lib/platform-data';
import type { DataSource } from '@/lib/platform-types';
import { SourceWizard } from './source-wizard';

export function SourcesView({
  sources,
  onAdd,
}: {
  sources: DataSource[];
  onAdd: (source: DataSource) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const filtered = useMemo(
    () =>
      sources.filter((source) =>
        `${source.name} ${source.connector} ${source.outputDataset}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [sources, query],
  );
  return (
    <>
      <div className="view-toolbar">
        <div className="search">
          <Search size={15} />
          <Input
            aria-label="搜索数据源"
            placeholder="搜索名称、连接器或 Dataset"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <Button className="btn" onClick={() => setOpen(true)}>
          <Plus size={15} />
          新增数据源
        </Button>
      </div>
      <div className="source-grid">
        {filtered.map((source) => {
          const StatusIcon =
            source.status === 'healthy'
              ? CheckCircle2
              : source.status === 'warning'
                ? TriangleAlert
                : CirclePause;
          return (
            <article className="panel source-card" key={source.id}>
              <header>
                <span className="connector-badge">
                  {connectorLabels[source.connector]}
                </span>
                <span className={`source-state ${source.status}`}>
                  <StatusIcon size={14} />
                  {source.status === 'healthy'
                    ? '健康'
                    : source.status === 'warning'
                      ? '关注'
                      : '已停用'}
                </span>
              </header>
              <h2>{source.name}</h2>
              <p className="source-endpoint mono">{source.endpoint}</p>
              <dl>
                <div>
                  <dt>输出 Dataset</dt>
                  <dd>{source.outputDataset}</dd>
                </div>
                <div>
                  <dt>调度</dt>
                  <dd>{source.schedule}</dd>
                </div>
                <div>
                  <dt>负责人</dt>
                  <dd>{source.owner}</dd>
                </div>
                <div>
                  <dt>成功率</dt>
                  <dd>{source.successRate}%</dd>
                </div>
              </dl>
              <footer>
                <span>最近运行：{source.lastRun}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setNotice(`${source.name} 已提交模拟运行。`)}
                >
                  <RefreshCw size={13} />
                  运行
                </Button>
              </footer>
            </article>
          );
        })}
      </div>
      {notice && (
        <output className="inline-notice" aria-live="polite">
          {notice}
        </output>
      )}
      <SourceWizard
        open={open}
        onOpenChange={setOpen}
        onPublished={(source) => {
          onAdd(source);
          setNotice(`${source.name} 已发布，首轮同步等待调度。`);
        }}
      />
    </>
  );
}
