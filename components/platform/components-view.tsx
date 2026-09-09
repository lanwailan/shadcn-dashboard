'use client';

import {
  BarChart3,
  Blocks,
  Gauge,
  LineChart,
  ListChecks,
  PieChart,
  Rows3,
  Type,
} from 'lucide-react';
import { componentDefinitions, datasets } from '@/lib/platform-data';
import type { ComponentDefinition, Dataset } from '@/lib/platform-types';

const icons = {
  metric: Gauge,
  barChart: BarChart3,
  lineChart: LineChart,
  pieChart: PieChart,
  table: Rows3,
  progress: Gauge,
  statusList: ListChecks,
  markdown: Type,
};

export function isCompatible(
  definition: ComponentDefinition,
  dataset: Dataset,
) {
  return Object.entries(definition.roles).every(([role, types]) => {
    if (role === 'series') return true;
    return dataset.fields.some((field) => types?.includes(field.type));
  });
}

export function ComponentsView() {
  return (
    <>
      <div className="registry-summary panel">
        <span className="asset-icon">
          <Blocks size={18} />
        </span>
        <div>
          <h2>组件输入契约</h2>
          <p>
            组件只消费 Dataset 字段角色。平台根据字段类型自动校验和推荐映射。
          </p>
        </div>
        <strong>
          {componentDefinitions.length}
          <small> 个内置组件</small>
        </strong>
      </div>
      <div className="component-grid">
        {componentDefinitions.map((definition) => {
          const Icon = icons[definition.type];
          const compatible = datasets.filter((dataset) =>
            isCompatible(definition, dataset),
          );
          return (
            <article className="panel component-card" key={definition.type}>
              <header>
                <span className="asset-icon">
                  <Icon size={18} />
                </span>
                <span className={`component-state ${definition.status}`}>
                  {definition.status === 'stable' ? '稳定' : 'Beta'}
                </span>
              </header>
              <h2>{definition.name}</h2>
              <code>{definition.type}</code>
              <p>{definition.description}</p>
              <div className="contract-list">
                {Object.entries(definition.roles).length ? (
                  Object.entries(definition.roles).map(([role, types]) => (
                    <div key={role}>
                      <span>{role}</span>
                      <strong>{types?.join(' / ')}</strong>
                    </div>
                  ))
                ) : (
                  <div>
                    <span>输入</span>
                    <strong>任意 Dataset</strong>
                  </div>
                )}
              </div>
              <footer>
                <span>可用 Dataset</span>
                <div>
                  {compatible.map((dataset) => (
                    <i title={dataset.name} key={dataset.id}>
                      {dataset.name.slice(0, 1)}
                    </i>
                  ))}
                </div>
                <b>{compatible.length}</b>
              </footer>
            </article>
          );
        })}
      </div>
      <section className="panel plugin-policy">
        <div>
          <h2>自定义组件策略</h2>
          <p>
            第一阶段保持受控注册。特殊组件通过审核进入注册表，不在运行时加载任意
            React 代码。
          </p>
        </div>
        <div className="policy-levels">
          <span className="active">
            <b>Level 1</b> 数据源热插拔
          </span>
          <span className="active">
            <b>Level 2</b> 页面热编排
          </span>
          <span>
            <b>Level 3</b> 受控组件插件
          </span>
        </div>
      </section>
    </>
  );
}
