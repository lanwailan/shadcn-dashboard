'use client';

import { useMemo, useState } from 'react';
import {
  Bot,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Code2,
  Database,
  FileSpreadsheet,
  GitBranch,
  Globe2,
  KeyRound,
  LoaderCircle,
  Radio,
  RefreshCw,
  Send,
  TableProperties,
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
import {
  connectorDefinitions,
  getConnectorDefinition,
} from '@/lib/connector-definitions';
import { mockPlatformAdapter } from '@/lib/platform-api';
import type {
  ConnectionTestResult,
  ConnectorType,
  DataSource,
  FieldRole,
  FieldType,
  PreviewResult,
  SourceDraft,
} from '@/lib/platform-types';

const stepNames = [
  '选择连接器',
  '连接配置',
  '样本预览',
  'Dataset 契约',
  '同步策略',
  '确认发布',
];

const connectorIcons = {
  http: Globe2,
  mysql: Database,
  postgresql: Database,
  jira: Cloud,
  feishu: Send,
  gitlab: GitBranch,
  file: FileSpreadsheet,
  webhook: Radio,
  agent: Bot,
  script: Code2,
} satisfies Record<ConnectorType, typeof Globe2>;

function defaultConfig(type: ConnectorType) {
  const definition = getConnectorDefinition(type);
  return Object.fromEntries(
    definition.fields.map((field) => [
      field.key,
      field.options?.[0]?.value ?? '',
    ]),
  );
}

const createDraft = (): SourceDraft => ({
  name: '',
  connector: 'http',
  owner: '数据平台组',
  config: defaultConfig('http'),
  outputDataset: '',
  schedule: '*/10 * * * *',
  syncMode: 'incremental',
  cursorField: 'updatedAt',
  fields: [],
});

function ConnectionFields({
  draft,
  update,
}: {
  draft: SourceDraft;
  update: (next: SourceDraft) => void;
}) {
  const definition = getConnectorDefinition(draft.connector);
  return (
    <div className="wizard-form-grid">
      <label htmlFor="wizard-source-name">
        <span>数据源名称</span>
        <Input
          id="wizard-source-name"
          value={draft.name}
          placeholder={`例如：${definition.name} 测试数据`}
          onChange={(event) => update({ ...draft, name: event.target.value })}
        />
      </label>
      <label htmlFor="wizard-source-owner">
        <span>负责人</span>
        <Input
          id="wizard-source-owner"
          value={draft.owner}
          onChange={(event) => update({ ...draft, owner: event.target.value })}
        />
      </label>
      {definition.fields.map((field) => {
        const id = `wizard-config-${field.key}`;
        return (
          <label
            htmlFor={id}
            key={field.key}
            className={field.key === 'endpoint' ? 'wide' : ''}
          >
            <span>
              {field.label}
              {field.required && <b>必填</b>}
            </span>
            {field.type === 'select' ? (
              <Select
                value={draft.config[field.key]}
                onValueChange={(value) =>
                  update({
                    ...draft,
                    config: { ...draft.config, [field.key]: String(value) },
                  })
                }
              >
                <SelectTrigger id={id}>
                  <SelectValue>
                    {field.options?.find(
                      (option) => option.value === draft.config[field.key],
                    )?.label ?? '请选择'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div
                className={field.type === 'credential' ? 'input-with-icon' : ''}
              >
                {field.type === 'credential' && <KeyRound size={14} />}
                <Input
                  id={id}
                  value={draft.config[field.key]}
                  placeholder={field.placeholder}
                  onChange={(event) =>
                    update({
                      ...draft,
                      config: {
                        ...draft.config,
                        [field.key]: event.target.value,
                      },
                    })
                  }
                />
              </div>
            )}
            {field.help && <small>{field.help}</small>}
          </label>
        );
      })}
    </div>
  );
}

function PreviewTable({ preview }: { preview: PreviewResult }) {
  return (
    <div className="wizard-preview-table">
      <table>
        <thead>
          <tr>
            {preview.fields.map((field) => (
              <th key={field.key}>{field.key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {preview.rows.map((row, index) => (
            <tr key={String(row.project ?? index)}>
              {preview.fields.map((field) => (
                <td key={field.key}>{String(row[field.key] ?? '—')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SourceWizard({
  open,
  onOpenChange,
  onPublished,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPublished: (source: DataSource) => void;
}) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<SourceDraft>(createDraft);
  const [testResult, setTestResult] = useState<ConnectionTestResult>();
  const [preview, setPreview] = useState<PreviewResult>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const definition = getConnectorDefinition(draft.connector);
  const publicConfig = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(draft.config).map(([key, value]) => [
          key,
          key.toLowerCase().includes('auth') && value ? '••••••••' : value,
        ]),
      ),
    [draft.config],
  );

  const reset = () => {
    setStep(0);
    setDraft(createDraft());
    setTestResult(undefined);
    setPreview(undefined);
    setBusy(false);
    setError('');
  };
  const close = () => {
    onOpenChange(false);
    queueMicrotask(reset);
  };
  const chooseConnector = (type: ConnectorType) => {
    setDraft({
      ...draft,
      connector: type,
      config: defaultConfig(type),
      syncMode:
        type === 'webhook' || type === 'agent'
          ? 'realtime'
          : getConnectorDefinition(type).capabilities.incrementalSync
            ? 'incremental'
            : 'full',
    });
    setTestResult(undefined);
    setPreview(undefined);
    setError('');
  };
  const testConnection = async () => {
    const missing = definition.fields.find(
      (field) => field.required && !draft.config[field.key]?.trim(),
    );
    if (!draft.name.trim() || missing) {
      setError(
        !draft.name.trim() ? '请填写数据源名称。' : `请填写${missing?.label}。`,
      );
      return;
    }
    setBusy(true);
    setError('');
    const result = await mockPlatformAdapter.testConnection(draft);
    setBusy(false);
    setTestResult(result);
    if (result.ok) setStep(2);
    else setError(result.message);
  };
  const loadPreview = async () => {
    setBusy(true);
    setError('');
    const result = await mockPlatformAdapter.previewSource(draft);
    setPreview(result);
    setDraft({
      ...draft,
      fields: result.fields,
      outputDataset:
        draft.outputDataset ||
        `${draft.connector}_${
          draft.name
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_') || 'dataset'
        }`,
    });
    setBusy(false);
  };
  const next = async () => {
    if (step === 0) return setStep(1);
    if (step === 1) return testConnection();
    if (step === 2) {
      if (!preview) return loadPreview();
      return setStep(3);
    }
    if (step === 3) {
      if (!draft.outputDataset.trim()) {
        setError('请填写输出 Dataset ID。');
        return;
      }
      setError('');
      return setStep(4);
    }
    if (step === 4) return setStep(5);
    setBusy(true);
    const source = await mockPlatformAdapter.publishSource(draft);
    onPublished(source);
    close();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => (nextOpen ? onOpenChange(true) : close())}
    >
      <DialogContent className="source-wizard" showCloseButton={false}>
        <aside className="wizard-steps">
          <div className="wizard-brand">
            <span>
              <Cloud size={17} />
            </span>
            <div>
              <strong>数据接入</strong>
              <small>Connector Studio</small>
            </div>
          </div>
          <ol>
            {stepNames.map((name, index) => (
              <li
                key={name}
                className={
                  index === step ? 'active' : index < step ? 'done' : ''
                }
              >
                <span>{index < step ? <Check size={13} /> : index + 1}</span>
                <div>
                  <strong>{name}</strong>
                  <small>
                    {index < step
                      ? '已完成'
                      : index === step
                        ? '进行中'
                        : '待配置'}
                  </small>
                </div>
              </li>
            ))}
          </ol>
          <div className="wizard-security">
            <KeyRound size={15} />
            <p>
              <strong>凭据安全</strong>配置只保存 authRef，页面不会保存真实
              Token。
            </p>
          </div>
        </aside>
        <section className="wizard-main">
          <DialogHeader>
            <div className="wizard-header-meta">
              <span className="wizard-step-label">
                步骤 {step + 1} / {stepNames.length}
              </span>
              <span>Mock Adapter</span>
            </div>
            <DialogTitle>{stepNames[step]}</DialogTitle>
            <DialogDescription>
              {step === 0 &&
                '选择数据所在的系统，配置表单会由连接器元数据自动生成。'}
              {step === 1 &&
                `配置 ${definition.name} 的访问方式，然后由服务端测试连接。`}
              {step === 2 &&
                '读取少量样本并自动推断字段，外部系统不会被大屏直接查询。'}
              {step === 3 &&
                '确认字段类型和角色，生成统一的 Dataset 数据契约。'}
              {step === 4 && '设置采集方式、频率和增量游标。'}
              {step === 5 && '检查最终配置并发布数据源。'}
            </DialogDescription>
          </DialogHeader>

          <div className="wizard-body">
            {step === 0 && (
              <div className="connector-picker">
                {connectorDefinitions.map((item) => {
                  const Icon = connectorIcons[item.type];
                  return (
                    <button
                      key={item.type}
                      className={
                        draft.connector === item.type ? 'selected' : ''
                      }
                      onClick={() => chooseConnector(item.type)}
                    >
                      <span>
                        <Icon size={19} />
                      </span>
                      <strong>{item.name}</strong>
                      <small>{item.description}</small>
                      {draft.connector === item.type && (
                        <CheckCircle2 size={16} />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {step === 1 && <ConnectionFields draft={draft} update={setDraft} />}
            {step === 2 && (
              <div className="preview-stage">
                {testResult && (
                  <div className="connection-result success">
                    <CheckCircle2 size={18} />
                    <div>
                      <strong>{testResult.message}</strong>
                      <span>
                        {testResult.latency} ms · {testResult.checkedAt}
                      </span>
                    </div>
                  </div>
                )}
                {!preview ? (
                  <div className="preview-empty">
                    <TableProperties size={28} />
                    <h3>连接已就绪</h3>
                    <p>读取最多 100 条样本，用于推断字段，不会创建正式任务。</p>
                    <Button onClick={loadPreview} disabled={busy}>
                      {busy ? (
                        <LoaderCircle className="spin" size={15} />
                      ) : (
                        <RefreshCw size={15} />
                      )}
                      {busy ? '正在读取...' : '读取样本数据'}
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="preview-summary">
                      <span>{preview.fields.length} 个字段</span>
                      <span>{preview.rows.length} 条样本</span>
                      <span>
                        预计 {preview.totalEstimate.toLocaleString()} 条记录
                      </span>
                    </div>
                    <PreviewTable preview={preview} />
                  </>
                )}
              </div>
            )}
            {step === 3 && (
              <div className="schema-stage">
                <label htmlFor="wizard-dataset-id">
                  <span>Dataset ID</span>
                  <Input
                    id="wizard-dataset-id"
                    value={draft.outputDataset}
                    onChange={(event) =>
                      setDraft({ ...draft, outputDataset: event.target.value })
                    }
                  />
                  <small>
                    发布后通过 /api/datasets/{'{datasetId}'}/query 查询。
                  </small>
                </label>
                <div className="schema-mapping-table">
                  <header>
                    <span>字段</span>
                    <span>显示名称</span>
                    <span>类型</span>
                    <span>角色</span>
                  </header>
                  {draft.fields.map((field, index) => (
                    <div key={field.key}>
                      <code>{field.key}</code>
                      <Input
                        value={field.label}
                        aria-label={`${field.key} 显示名称`}
                        onChange={(event) => {
                          const fields = [...draft.fields];
                          fields[index] = {
                            ...field,
                            label: event.target.value,
                          };
                          setDraft({ ...draft, fields });
                        }}
                      />
                      <Select
                        value={field.type}
                        onValueChange={(value) => {
                          const fields = [...draft.fields];
                          fields[index] = {
                            ...field,
                            type: value as FieldType,
                          };
                          setDraft({ ...draft, fields });
                        }}
                      >
                        <SelectTrigger aria-label={`${field.key} 字段类型`}>
                          <SelectValue>{field.type}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {['string', 'number', 'datetime', 'boolean'].map(
                            (type) => (
                              <SelectItem value={type} key={type}>
                                {type}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                      <Select
                        value={field.role}
                        onValueChange={(value) => {
                          const fields = [...draft.fields];
                          fields[index] = {
                            ...field,
                            role: value as FieldRole,
                          };
                          setDraft({ ...draft, fields });
                        }}
                      >
                        <SelectTrigger aria-label={`${field.key} 字段角色`}>
                          <SelectValue>{field.role}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dimension">维度</SelectItem>
                          <SelectItem value="metric">指标</SelectItem>
                          <SelectItem value="time">时间</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {step === 4 && (
              <div className="sync-stage">
                <div className="sync-mode-grid">
                  {[
                    {
                      id: 'full',
                      title: '全量同步',
                      text: '每次重新生成完整快照',
                    },
                    {
                      id: 'incremental',
                      title: '增量同步',
                      text: '使用时间或 ID 游标继续采集',
                    },
                    {
                      id: 'realtime',
                      title: '实时推送',
                      text: '通过 Webhook 或事件写入',
                    },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      className={draft.syncMode === mode.id ? 'selected' : ''}
                      onClick={() =>
                        setDraft({
                          ...draft,
                          syncMode: mode.id as SourceDraft['syncMode'],
                        })
                      }
                    >
                      <span>
                        {draft.syncMode === mode.id && <Check size={13} />}
                      </span>
                      <strong>{mode.title}</strong>
                      <small>{mode.text}</small>
                    </button>
                  ))}
                </div>
                <div className="wizard-form-grid sync-fields">
                  <label htmlFor="wizard-schedule">
                    <span>调度规则</span>
                    <Input
                      id="wizard-schedule"
                      value={draft.schedule}
                      disabled={draft.syncMode === 'realtime'}
                      onChange={(event) =>
                        setDraft({ ...draft, schedule: event.target.value })
                      }
                    />
                    <small>标准 Cron；实时模式由事件触发。</small>
                  </label>
                  <label htmlFor="wizard-cursor">
                    <span>增量游标字段</span>
                    <Input
                      id="wizard-cursor"
                      value={draft.cursorField}
                      disabled={draft.syncMode !== 'incremental'}
                      onChange={(event) =>
                        setDraft({ ...draft, cursorField: event.target.value })
                      }
                    />
                    <small>建议使用更新时间或单调递增 ID。</small>
                  </label>
                </div>
              </div>
            )}
            {step === 5 && (
              <div className="publish-review">
                <div className="review-summary">
                  <div>
                    <span>连接器</span>
                    <strong>{definition.name}</strong>
                  </div>
                  <div>
                    <span>Dataset</span>
                    <strong>{draft.outputDataset}</strong>
                  </div>
                  <div>
                    <span>字段</span>
                    <strong>{draft.fields.length} 个</strong>
                  </div>
                  <div>
                    <span>同步模式</span>
                    <strong>{draft.syncMode}</strong>
                  </div>
                </div>
                <pre>
                  {JSON.stringify(
                    {
                      connector: draft.connector,
                      config: publicConfig,
                      schedule: draft.schedule,
                      outputDataset: draft.outputDataset,
                      schema: Object.fromEntries(
                        draft.fields.map((field) => [
                          field.key,
                          { type: field.type, role: field.role },
                        ]),
                      ),
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>
            )}
            {error && <p className="wizard-error">{error}</p>}
          </div>
          <DialogFooter className="wizard-footer">
            <Button variant="ghost" onClick={close}>
              取消
            </Button>
            <div>
              {step > 0 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep(step - 1);
                    setError('');
                  }}
                >
                  <ChevronLeft size={14} />
                  上一步
                </Button>
              )}
              <Button onClick={next} disabled={busy}>
                {busy && <LoaderCircle className="spin" size={14} />}
                {step === 1
                  ? '测试连接'
                  : step === 2 && !preview
                    ? '读取样本'
                    : step === 5
                      ? '发布数据源'
                      : '继续'}
                {!busy && step < 5 && <ChevronRight size={14} />}
              </Button>
            </div>
          </DialogFooter>
        </section>
      </DialogContent>
    </Dialog>
  );
}
