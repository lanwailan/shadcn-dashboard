'use client';

import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Braces,
  Check,
  ChevronRight,
  Copy,
  Grip,
  LayoutDashboard,
  Plus,
  Save,
  Settings2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { componentDefinitions, datasets } from '@/lib/platform-data';
import type {
  ComponentType,
  DashboardConfig,
  DatasetField,
  WidgetConfig,
} from '@/lib/platform-types';
import { isCompatible } from './components-view';
import { DashboardRenderer } from './widget-renderer';

type Mode = 'list' | 'view' | 'edit';

const makeWidget = (
  datasetId: string,
  component: ComponentType,
): WidgetConfig => {
  const dataset = datasets.find((item) => item.id === datasetId) ?? datasets[0];
  const numeric = dataset.fields.find((field) => field.type === 'number');
  const category = dataset.fields.find((field) => field.role === 'dimension');
  const definition = componentDefinitions.find(
    (item) => item.type === component,
  )!;
  return {
    id: `widget-${Date.now()}`,
    component,
    dataset: dataset.id,
    title: `${dataset.name} · ${definition.name}`,
    position: {
      x: 0,
      y: 99,
      w: component === 'metric' ? 6 : component === 'table' ? 24 : 12,
      h: component === 'metric' ? 5 : 13,
    },
    mapping: {
      value: numeric?.key,
      category: category?.key,
      series: dataset.fields.find(
        (field) => field.type === 'string' && field.key !== category?.key,
      )?.key,
      columns: dataset.fields.slice(0, 6).map((field) => field.key),
    },
    options: {
      aggregate: component === 'metric' ? 'sum' : undefined,
      precision: numeric?.key.toLowerCase().includes('rate') ? 1 : 0,
    },
  };
};

function FieldSelect({
  label,
  value,
  fields,
  types,
  onChange,
}: {
  label: string;
  value?: string;
  fields: DatasetField[];
  types?: string[];
  onChange: (value: string) => void;
}) {
  const options = types?.length
    ? fields.filter((field) => types.includes(field.type))
    : fields;
  return (
    <label>
      <span>{label}</span>
      <Select
        value={value ?? ''}
        onValueChange={(next) => onChange(String(next))}
      >
        <SelectTrigger>
          <SelectValue>
            {fields.find((field) => field.key === value)?.label ?? '选择字段'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((field) => (
            <SelectItem value={field.key} key={field.key}>
              {field.label} · {field.type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}

function DashboardEditor({
  dashboard,
  onSave,
  onBack,
}: {
  dashboard: DashboardConfig;
  onSave: (dashboard: DashboardConfig) => void;
  onBack: () => void;
}) {
  const [draft, setDraft] = useState(dashboard);
  const [datasetId, setDatasetId] = useState(datasets[0].id);
  const compatible = componentDefinitions.filter((definition) =>
    isCompatible(
      definition,
      datasets.find((item) => item.id === datasetId)!,
    ),
  );
  const [component, setComponent] = useState<ComponentType>('metric');
  const [candidate, setCandidate] = useState(() =>
    makeWidget(datasetId, component),
  );
  const [jsonMode, setJsonMode] = useState(false);
  const [json, setJson] = useState(JSON.stringify(dashboard, null, 2));
  const [message, setMessage] = useState('');
  const dataset = datasets.find((item) => item.id === datasetId)!;
  const definition = componentDefinitions.find(
    (item) => item.type === component,
  )!;
  const updateCandidate = (
    nextDataset: string,
    nextComponent: ComponentType,
  ) => {
    setDatasetId(nextDataset);
    setComponent(nextComponent);
    setCandidate(makeWidget(nextDataset, nextComponent));
  };
  const add = () => {
    const widget = { ...candidate, id: `widget-${Date.now()}` };
    const next = {
      ...draft,
      updatedAt: '刚刚',
      widgets: [...draft.widgets, widget],
    };
    setDraft(next);
    setJson(JSON.stringify(next, null, 2));
    setMessage(`${widget.title} 已加入画布`);
  };
  const save = () => {
    onSave({ ...draft, updatedAt: '刚刚' });
    setMessage('配置已保存到浏览器');
  };
  const applyJson = () => {
    try {
      const parsed = JSON.parse(json) as DashboardConfig;
      if (!Array.isArray(parsed.widgets) || parsed.layout?.columns !== 24)
        throw new Error();
      setDraft(parsed);
      setMessage('JSON 配置已应用');
    } catch {
      setMessage('JSON 无效：需要 24 列布局和 widgets 数组');
    }
  };
  return (
    <>
      <div className="studio-topbar">
        <Button variant="ghost" className="btn" onClick={onBack}>
          <ArrowLeft size={15} />
          返回
        </Button>
        <span className="header-divider" />
        <Input
          aria-label="大屏标题"
          value={draft.title}
          onChange={(event) =>
            setDraft({ ...draft, title: event.target.value })
          }
        />
        <Tabs
          value={jsonMode ? 'json' : 'visual'}
          onValueChange={(value) => setJsonMode(value === 'json')}
        >
          <TabsList>
            <TabsTrigger value="visual">
              <LayoutDashboard size={13} />
              可视化
            </TabsTrigger>
            <TabsTrigger value="json">
              <Braces size={13} />
              JSON
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Button
          variant="outline"
          className="btn"
          onClick={() =>
            setDraft({
              ...draft,
              status: draft.status === 'published' ? 'draft' : 'published',
            })
          }
        >
          {draft.status === 'published' ? '取消发布' : '标记发布'}
        </Button>
        <Button className="btn" onClick={save}>
          <Save size={14} />
          保存
        </Button>
      </div>
      {jsonMode ? (
        <div className="json-editor-layout">
          <section className="panel json-editor">
            <header>
              <h2>Dashboard Schema</h2>
              <span>确定性配置 · 版本化保存</span>
            </header>
            <Textarea
              value={json}
              onChange={(event) => setJson(event.target.value)}
              spellCheck={false}
            />
            <Button className="btn" onClick={applyJson}>
              校验并应用
            </Button>
          </section>
          <section className="panel json-help">
            <h2>配置约束</h2>
            <code>layout.columns = 24</code>
            <code>widgets[].component</code>
            <code>widgets[].dataset</code>
            <code>widgets[].mapping</code>
            <code>widgets[].position</code>
            <p>运行时只读取已注册组件和 Dataset，不执行配置中的代码。</p>
          </section>
        </div>
      ) : (
        <div className="studio-layout">
          <aside className="panel widget-builder">
            <header>
              <Settings2 size={16} />
              <div>
                <h2>添加组件</h2>
                <p>选择 Dataset 与字段映射</p>
              </div>
            </header>
            <div className="builder-form">
              <label htmlFor="builder-dataset">
                <span>Dataset</span>
                <Select
                  value={datasetId}
                  onValueChange={(value) => {
                    const nextId = String(value);
                    const nextComponent =
                      componentDefinitions.find((item) =>
                        isCompatible(
                          item,
                          datasets.find((data) => data.id === nextId)!,
                        ),
                      )?.type ?? 'table';
                    updateCandidate(nextId, nextComponent);
                  }}
                >
                  <SelectTrigger id="builder-dataset">
                    <SelectValue>{dataset.name}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {datasets.map((item) => (
                      <SelectItem value={item.id} key={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label htmlFor="builder-component">
                <span>
                  组件 <small>{compatible.length} 个匹配</small>
                </span>
                <Select
                  value={component}
                  onValueChange={(value) =>
                    updateCandidate(datasetId, value as ComponentType)
                  }
                >
                  <SelectTrigger id="builder-component">
                    <SelectValue>{definition.name}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {compatible.map((item) => (
                      <SelectItem value={item.type} key={item.type}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label htmlFor="builder-title">
                <span>标题</span>
                <Input
                  id="builder-title"
                  value={candidate.title}
                  onChange={(event) =>
                    setCandidate({ ...candidate, title: event.target.value })
                  }
                />
              </label>
              {definition.roles.value && (
                <FieldSelect
                  label="指标字段"
                  value={candidate.mapping.value}
                  fields={dataset.fields}
                  types={definition.roles.value}
                  onChange={(value) =>
                    setCandidate({
                      ...candidate,
                      mapping: { ...candidate.mapping, value },
                    })
                  }
                />
              )}{' '}
              {definition.roles.category && (
                <FieldSelect
                  label="分类 / X 轴"
                  value={candidate.mapping.category}
                  fields={dataset.fields}
                  types={definition.roles.category}
                  onChange={(value) =>
                    setCandidate({
                      ...candidate,
                      mapping: { ...candidate.mapping, category: value },
                    })
                  }
                />
              )}
              <label htmlFor="builder-width">
                <span>组件宽度</span>
                <Select
                  value={String(candidate.position.w)}
                  onValueChange={(value) =>
                    setCandidate({
                      ...candidate,
                      position: { ...candidate.position, w: Number(value) },
                    })
                  }
                >
                  <SelectTrigger id="builder-width">
                    <SelectValue>{candidate.position.w} / 24 列</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {[6, 8, 12, 16, 24].map((width) => (
                      <SelectItem value={String(width)} key={width}>
                        {width} / 24 列
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <Button className="btn" onClick={add}>
                <Plus size={14} />
                加入画布
              </Button>
            </div>
            <div className="contract-match">
              <Check size={14} />
              <p>
                Schema 校验通过
                <br />
                <span>
                  {dataset.id} → {component}
                </span>
              </p>
            </div>
          </aside>
          <main className="studio-canvas">
            <div className="canvas-head">
              <div>
                <h2>{draft.title}</h2>
                <p>24 列网格 · 拖拽卡片调整顺序</p>
              </div>
              <span>{draft.widgets.length} 个组件</span>
            </div>
            <DashboardRenderer
              dashboard={draft}
              editable
              onReorder={(from, to) => {
                const widgets = [...draft.widgets];
                const [moved] = widgets.splice(from, 1);
                widgets.splice(to, 0, moved);
                setDraft({ ...draft, widgets });
              }}
              onRemove={(id) =>
                setDraft({
                  ...draft,
                  widgets: draft.widgets.filter((widget) => widget.id !== id),
                })
              }
            />
            {draft.widgets.length === 0 && (
              <div className="empty-canvas">
                <Grip size={24} />
                <p>从左侧添加第一个组件</p>
              </div>
            )}
          </main>
        </div>
      )}
      {message && (
        <output className="editor-toast" aria-live="polite">
          {message}
        </output>
      )}
    </>
  );
}

export function DashboardsView({
  dashboards,
  onSave,
}: {
  dashboards: DashboardConfig[];
  onSave: (dashboard: DashboardConfig) => void;
}) {
  const [mode, setMode] = useState<Mode>('list');
  const [selectedId, setSelectedId] = useState(dashboards[0]?.id);
  const selected = useMemo(
    () => dashboards.find((item) => item.id === selectedId) ?? dashboards[0],
    [dashboards, selectedId],
  );
  if (mode === 'edit' && selected)
    return (
      <DashboardEditor
        dashboard={selected}
        onSave={onSave}
        onBack={() => setMode('list')}
      />
    );
  if (mode === 'view' && selected)
    return (
      <>
        <div className="dashboard-view-head">
          <Button
            variant="ghost"
            className="btn"
            onClick={() => setMode('list')}
          >
            <ArrowLeft size={15} />
            全部大屏
          </Button>
          <div>
            <h2>{selected.title}</h2>
            <p>{selected.description}</p>
          </div>
          <span
            className={`plain-status ${selected.status === 'published' ? 'success' : 'running'}`}
          >
            {selected.status === 'published' ? '已发布' : '草稿'}
          </span>
          <Button
            variant="outline"
            className="btn"
            onClick={() => setMode('edit')}
          >
            编辑配置
          </Button>
        </div>
        <DashboardRenderer dashboard={selected} />
      </>
    );
  return (
    <>
      <div className="view-toolbar">
        <div>
          <h2>大屏与页面</h2>
          <p>页面由 Dashboard JSON 和组件注册表动态渲染</p>
        </div>
        <Button
          className="btn"
          onClick={() => {
            const created: DashboardConfig = {
              id: `dashboard-${Date.now()}`,
              title: '未命名大屏',
              description: '新建配置化大屏',
              status: 'draft',
              updatedAt: '刚刚',
              layout: { columns: 24, rowHeight: 20, gap: 16 },
              widgets: [],
            };
            onSave(created);
            setSelectedId(created.id);
            setMode('edit');
          }}
        >
          <Plus size={15} />
          新建大屏
        </Button>
      </div>
      <div className="dashboard-list">
        {dashboards.map((dashboard) => (
          <article className="panel dashboard-card" key={dashboard.id}>
            <div className="dashboard-mini">
              <div className="mini-grid">
                {dashboard.widgets.slice(0, 6).map((widget) => (
                  <span
                    key={widget.id}
                    style={{
                      gridColumn: `span ${Math.max(1, Math.round(widget.position.w / 6))}`,
                      background:
                        widget.component === 'metric'
                          ? 'var(--muted)'
                          : 'color-mix(in srgb,var(--blue) 12%,var(--muted))',
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="dashboard-card-body">
              <header>
                <span
                  className={`plain-status ${dashboard.status === 'published' ? 'success' : 'running'}`}
                >
                  {dashboard.status === 'published' ? '已发布' : '草稿'}
                </span>
                <button aria-label="复制配置">
                  <Copy size={14} />
                </button>
              </header>
              <h2>{dashboard.title}</h2>
              <p>{dashboard.description}</p>
              <dl>
                <div>
                  <dt>组件</dt>
                  <dd>{dashboard.widgets.length}</dd>
                </div>
                <div>
                  <dt>布局</dt>
                  <dd>{dashboard.layout.columns} 列</dd>
                </div>
                <div>
                  <dt>更新</dt>
                  <dd>{dashboard.updatedAt}</dd>
                </div>
              </dl>
              <footer>
                <Button
                  variant="outline"
                  className="btn"
                  onClick={() => {
                    setSelectedId(dashboard.id);
                    setMode('edit');
                  }}
                >
                  编辑
                </Button>
                <Button
                  className="btn"
                  onClick={() => {
                    setSelectedId(dashboard.id);
                    setMode('view');
                  }}
                >
                  打开
                  <ChevronRight size={14} />
                </Button>
              </footer>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
