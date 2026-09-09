'use client';

import { useState } from 'react';
import {
  ArrowRight,
  Braces,
  Clock3,
  Database,
  KeyRound,
  Search,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { datasets } from '@/lib/platform-data';
import type { Dataset } from '@/lib/platform-types';

function formatCell(value: string | number | boolean) {
  return typeof value === 'number'
    ? value.toLocaleString('zh-CN')
    : String(value);
}

function DatasetDetail({ dataset }: { dataset: Dataset }) {
  return (
    <section className="panel dataset-detail">
      <header className="dataset-title">
        <div>
          <span className="asset-icon">
            <Database size={18} />
          </span>
          <div>
            <h2>
              {dataset.name}
              <span>{dataset.version}</span>
            </h2>
            <p>{dataset.description}</p>
          </div>
        </div>
        <code>GET /api/datasets/{dataset.id}/query</code>
      </header>
      <div className="dataset-meta">
        {[
          { icon: UserRound, label: '负责人', value: dataset.owner },
          {
            icon: Clock3,
            label: '刷新 / 缓存',
            value: `${dataset.refresh} / ${dataset.cacheTtl}`,
          },
          { icon: ShieldCheck, label: '权限范围', value: dataset.permission },
          {
            icon: Braces,
            label: '数据规模',
            value: `${dataset.rows.length} 行 · ${dataset.fields.length} 字段`,
          },
        ].map((item) => (
          <div key={item.label}>
            <item.icon size={15} />
            <span>
              {item.label}
              <strong>{item.value}</strong>
            </span>
          </div>
        ))}
      </div>
      <Tabs defaultValue="schema" className="dataset-tabs">
        <TabsList>
          <TabsTrigger value="schema">Schema</TabsTrigger>
          <TabsTrigger value="preview">数据预览</TabsTrigger>
          <TabsTrigger value="lineage">数据血缘</TabsTrigger>
          <TabsTrigger value="api">查询协议</TabsTrigger>
        </TabsList>
        <TabsContent value="schema">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>字段</TableHead>
                <TableHead>含义</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>说明</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataset.fields.map((field) => (
                <TableRow key={field.key}>
                  <TableCell className="mono field-key">{field.key}</TableCell>
                  <TableCell>{field.label}</TableCell>
                  <TableCell>
                    <span className={`type-tag ${field.type}`}>
                      {field.type}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="role-tag">{field.role}</span>
                  </TableCell>
                  <TableCell className="muted">{field.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
        <TabsContent value="preview">
          <div className="runtime-table dataset-preview">
            <table>
              <thead>
                <tr>
                  {dataset.fields.map((field) => (
                    <th key={field.key}>{field.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataset.rows.slice(0, 8).map((row, index) => (
                  <tr key={index}>
                    {dataset.fields.map((field) => (
                      <td key={field.key}>{formatCell(row[field.key])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
        <TabsContent value="lineage">
          <div className="lineage-flow">
            {dataset.lineage.map((node, index) => (
              <div key={node}>
                <span
                  className={
                    index === dataset.lineage.length - 1 ? 'current' : ''
                  }
                >
                  {node}
                </span>
                {index < dataset.lineage.length - 1 && <ArrowRight size={16} />}
              </div>
            ))}
          </div>
          <div className="lineage-note">
            <KeyRound size={15} />
            <p>凭据由密钥管理服务解析。Dataset 仅保存来源 ID 与 authRef。</p>
          </div>
        </TabsContent>
        <TabsContent value="api">
          <pre className="api-contract">
            {JSON.stringify(
              {
                dataset: dataset.id,
                version: dataset.version,
                endpoints: [
                  `GET /api/datasets/${dataset.id}/schema`,
                  `GET /api/datasets/${dataset.id}/query`,
                  `POST /api/datasets/${dataset.id}/query`,
                ],
                query: {
                  filters: {},
                  groupBy: [],
                  metrics: [],
                  orderBy: [],
                  limit: 100,
                },
                response: {
                  schema: 'DatasetField[]',
                  rows: 'Record<string, unknown>[]',
                  metadata: {
                    version: dataset.version,
                    updatedAt: dataset.updatedAt,
                    cacheTtl: dataset.cacheTtl,
                  },
                },
              },
              null,
              2,
            )}
          </pre>
        </TabsContent>
      </Tabs>
    </section>
  );
}

export function DatasetsView({ initialId }: { initialId?: string }) {
  const [selected, setSelected] = useState(initialId ?? datasets[0].id);
  const [query, setQuery] = useState('');
  const active =
    datasets.find((dataset) => dataset.id === selected) ?? datasets[0];
  return (
    <div className="asset-layout">
      <aside className="panel asset-list">
        <div className="asset-search search">
          <Search size={15} />
          <Input
            aria-label="搜索 Dataset"
            placeholder="搜索 Dataset"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        {datasets
          .filter((dataset) =>
            `${dataset.name} ${dataset.id}`
              .toLowerCase()
              .includes(query.toLowerCase()),
          )
          .map((dataset) => (
            <button
              key={dataset.id}
              className={selected === dataset.id ? 'active' : ''}
              onClick={() => setSelected(dataset.id)}
            >
              <span className="asset-icon">
                <Database size={16} />
              </span>
              <span>
                <strong>{dataset.name}</strong>
                <small>
                  {dataset.id} · {dataset.fields.length} 字段
                </small>
              </span>
            </button>
          ))}
      </aside>
      <DatasetDetail dataset={active} />
    </div>
  );
}
