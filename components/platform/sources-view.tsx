'use client';

import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  CirclePause,
  KeyRound,
  Plus,
  RefreshCw,
  Search,
  TriangleAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { connectorLabels } from '@/lib/platform-data';
import type { ConnectorType, DataSource } from '@/lib/platform-types';

const emptyForm = {
  name: '',
  connector: 'http' as ConnectorType,
  endpoint: '',
  schedule: '*/10 * * * *',
  outputDataset: '',
  authRef: '',
  owner: '数据平台组',
};

export function SourcesView({
  sources,
  onAdd,
}: {
  sources: DataSource[];
  onAdd: (source: DataSource) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(emptyForm);
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
  const submit = () => {
    if (
      !form.name.trim() ||
      !form.endpoint.trim() ||
      !form.outputDataset.trim()
    ) {
      setNotice('请填写名称、连接地址和输出 Dataset。');
      return;
    }
    onAdd({
      ...form,
      id: `${form.connector}_${Date.now()}`,
      status: 'healthy',
      lastRun: '尚未运行',
      successRate: 100,
      authRef: form.authRef || undefined,
    });
    setForm(emptyForm);
    setNotice('');
    setOpen(false);
  };
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
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="source-dialog">
          <DialogHeader>
            <DialogTitle>新增数据源</DialogTitle>
            <DialogDescription>
              选择通用连接器。凭据只保存引用，不在配置中写入 Token。
            </DialogDescription>
          </DialogHeader>
          <div className="form-grid">
            <label htmlFor="source-name">
              <span>名称</span>
              <Input
                id="source-name"
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                placeholder="例如：Jira Test Issues"
              />
            </label>
            <label htmlFor="source-connector">
              <span>连接器</span>
              <Select
                value={form.connector}
                onValueChange={(value) =>
                  setForm({ ...form, connector: value as ConnectorType })
                }
              >
                <SelectTrigger id="source-connector">
                  <SelectValue>{connectorLabels[form.connector]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(connectorLabels).map(([value, label]) => (
                    <SelectItem value={value} key={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="span-2" htmlFor="source-endpoint">
              <span>连接地址 / 文件位置</span>
              <Input
                id="source-endpoint"
                value={form.endpoint}
                onChange={(event) =>
                  setForm({ ...form, endpoint: event.target.value })
                }
                placeholder="https://api.internal/v1/data"
              />
            </label>
            <label htmlFor="source-schedule">
              <span>调度规则</span>
              <Input
                id="source-schedule"
                value={form.schedule}
                onChange={(event) =>
                  setForm({ ...form, schedule: event.target.value })
                }
              />
            </label>
            <label htmlFor="source-dataset">
              <span>输出 Dataset</span>
              <Input
                id="source-dataset"
                value={form.outputDataset}
                onChange={(event) =>
                  setForm({ ...form, outputDataset: event.target.value })
                }
                placeholder="dataset_id"
              />
            </label>
            <label htmlFor="source-auth-ref">
              <span>密钥引用</span>
              <div className="input-with-icon">
                <KeyRound size={14} />
                <Input
                  id="source-auth-ref"
                  value={form.authRef}
                  onChange={(event) =>
                    setForm({ ...form, authRef: event.target.value })
                  }
                  placeholder="authRef，可选"
                />
              </div>
            </label>
            <label htmlFor="source-owner">
              <span>负责人</span>
              <Input
                id="source-owner"
                value={form.owner}
                onChange={(event) =>
                  setForm({ ...form, owner: event.target.value })
                }
              />
            </label>
          </div>
          {notice && <p className="form-error">{notice}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button onClick={submit}>保存数据源</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
