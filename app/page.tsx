'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  Blocks,
  Braces,
  Command,
  Database,
  Download,
  HelpCircle,
  LayoutDashboard,
  Moon,
  Plus,
  PlugZap,
  Search,
  Sparkles,
  Sun,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ComponentsView } from '@/components/platform/components-view';
import { DashboardsView } from '@/components/platform/dashboards-view';
import { DatasetsView } from '@/components/platform/datasets-view';
import { PlatformOverview } from '@/components/platform/platform-overview';
import { RunsView } from '@/components/platform/runs-view';
import { SourcesView } from '@/components/platform/sources-view';
import { downloadText } from '@/components/dashboard/case-table';
import { initialDashboards, initialSources } from '@/lib/platform-data';
import type { DashboardConfig, DataSource } from '@/lib/platform-types';

const navigation = [
  {
    id: 'overview',
    label: '平台总览',
    icon: LayoutDashboard,
    group: 'platform',
  },
  { id: 'sources', label: '数据源', icon: PlugZap, group: 'platform' },
  { id: 'datasets', label: 'Datasets', icon: Database, group: 'platform' },
  { id: 'runs', label: '运行记录', icon: Activity, group: 'platform' },
  { id: 'dashboards', label: '大屏管理', icon: Braces, group: 'display' },
  { id: 'components', label: '组件注册表', icon: Blocks, group: 'display' },
] as const;
type PageId = (typeof navigation)[number]['id'];

function PlatformSidebar({
  page,
  go,
}: {
  page: PageId;
  go: (id: PageId) => void;
}) {
  const { setOpenMobile, state, isMobile } = useSidebar();
  const [query, setQuery] = useState('');
  const renderGroup = (group: 'platform' | 'display') => (
    <SidebarGroup>
      <SidebarGroupLabel>
        {group === 'platform' ? '数据平台' : '可视化'}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {navigation
            .filter(
              (item) =>
                item.group === group &&
                item.label.toLowerCase().includes(query.toLowerCase()),
            )
            .map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  isActive={page === item.id}
                  tooltip={item.label}
                  aria-label={item.label}
                  onClick={() => {
                    go(item.id);
                    setOpenMobile(false);
                  }}
                >
                  <item.icon />
                  <span>{item.label}</span>
                  {item.id === 'runs' && <span className="nav-count">1</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      className="app-sidebar"
      data-collapsed={state === 'collapsed' && !isMobile}
    >
      <SidebarHeader>
        <div className="sidebar-brand">
          <span className="brand-icon">
            <Command size={19} />
          </span>
          <div className="sidebar-brand-text">
            <strong>Insight Studio</strong>
            <p>数据接入与编排平台</p>
          </div>
        </div>
        <div className="sidebar-search search">
          <Search size={15} />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索功能..."
            aria-label="搜索导航"
          />
          <kbd>⌘K</kbd>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {renderGroup('platform')}
        {renderGroup('display')}
      </SidebarContent>
      <SidebarFooter>
        <div className="sidebar-promo">
          <span>
            <Sparkles size={16} />
          </span>
          <strong>创建你的数据大屏</strong>
          <p>选择 Dataset，几分钟内完成编排。</p>
          <Button size="sm" onClick={() => go('dashboards')}>
            开始编排
          </Button>
        </div>
        <div className="sidebar-user">
          <span className="avatar">RD</span>
          <div className="sidebar-brand-text">
            <strong>研发效能平台</strong>
            <p>管理员工作空间</p>
          </div>
        </div>
        <button className="sidebar-help" onClick={() => go('datasets')}>
          <HelpCircle size={15} />
          <span>接入指南与帮助</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}

const pageDescriptions: Record<PageId, string> = {
  overview: '数据接入、标准化、查询与可视化的统一工作台',
  sources: '管理连接器、调度规则和密钥引用',
  datasets: '定义字段契约、查询协议、权限与数据血缘',
  runs: '查看采集、转换和快照生成任务',
  dashboards: '选择 Dataset、映射字段并发布配置化大屏',
  components: '管理通用组件的输入契约和可用能力',
};

function loadStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    return JSON.parse(localStorage.getItem(key) ?? '') as T;
  } catch {
    return fallback;
  }
}

export default function Home() {
  const [page, setPage] = useState<PageId>('overview');
  const [dark, setDark] = useState(false);
  const [sources, setSources] = useState<DataSource[]>(initialSources);
  const [dashboards, setDashboards] =
    useState<DashboardConfig[]>(initialDashboards);
  const go = useCallback((id: PageId) => {
    setPage(id);
    location.hash = id;
    window.scrollTo({ top: 0 });
  }, []);
  useEffect(() => {
    const sync = () => {
      const id = location.hash.slice(1) as PageId;
      setPage(navigation.some((item) => item.id === id) ? id : 'overview');
    };
    queueMicrotask(() => {
      sync();
      setDark(localStorage.getItem('insight-admin-theme-v2') === 'dark');
      setSources(loadStored('insight-sources', initialSources));
      setDashboards(loadStored('insight-dashboards', initialDashboards));
    });
    addEventListener('hashchange', sync);
    return () => removeEventListener('hashchange', sync);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);
  const addSource = (source: DataSource) =>
    setSources((current) => {
      const next = [...current, source];
      localStorage.setItem('insight-sources', JSON.stringify(next));
      return next;
    });
  const saveDashboard = (dashboard: DashboardConfig) =>
    setDashboards((current) => {
      const exists = current.some((item) => item.id === dashboard.id);
      const next = exists
        ? current.map((item) => (item.id === dashboard.id ? dashboard : item))
        : [...current, dashboard];
      localStorage.setItem('insight-dashboards', JSON.stringify(next));
      return next;
    });
  const current = navigation.find((item) => item.id === page)!;
  return (
    <TooltipProvider>
      <SidebarProvider>
        <PlatformSidebar page={page} go={go} />
        <SidebarInset className="app-main-shell min-w-0">
          <header className="admin-header">
            <div className="header-left">
              <SidebarTrigger aria-label="展开或收起导航" />
              <span className="header-divider" />
              <span className="header-current">{current.label}</span>
              <span className="header-secondary">
                Metadata-driven Data Platform
              </span>
            </div>
            <div className="header-right">
              <span className="environment-label">
                <i />
                Development
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label={dark ? '切换浅色主题' : '切换深色主题'}
                onClick={() => {
                  const next = !dark;
                  setDark(next);
                  localStorage.setItem(
                    'insight-admin-theme-v2',
                    next ? 'dark' : 'light',
                  );
                }}
              >
                {dark ? <Sun size={18} /> : <Moon size={18} />}
              </Button>
              <span className="avatar">RD</span>
            </div>
          </header>
          <main className="workspace platform-workspace" id="content">
            <div className="page-head">
              <div>
                <h1>
                  {page === 'overview' ? '上午好，研发团队！👋' : current.label}
                </h1>
                <p className="subtitle">{pageDescriptions[page]}</p>
              </div>
              <div className="head-actions">
                <span className="schema-version">Schema v1.0</span>
                {page === 'overview' && (
                  <Button
                    className="btn primary-action"
                    onClick={() => go('dashboards')}
                  >
                    <Plus size={15} />
                    新建大屏
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="btn"
                  onClick={() =>
                    downloadText(
                      `insight-platform-${page}.json`,
                      JSON.stringify({ sources, dashboards }, null, 2),
                    )
                  }
                >
                  <Download size={14} />
                  导出配置
                </Button>
              </div>
            </div>
            {page === 'overview' && (
              <PlatformOverview go={(id) => go(id as PageId)} />
            )}{' '}
            {page === 'sources' && (
              <SourcesView sources={sources} onAdd={addSource} />
            )}{' '}
            {page === 'datasets' && <DatasetsView />}{' '}
            {page === 'runs' && <RunsView />}{' '}
            {page === 'dashboards' && (
              <DashboardsView dashboards={dashboards} onSave={saveDashboard} />
            )}{' '}
            {page === 'components' && <ComponentsView />}
            <footer className="footer">
              <span>
                Insight Studio <span className="footer-dot">·</span>{' '}
                元数据驱动原型
              </span>
              <span>配置存储：浏览器 LocalStorage · 无真实凭据</span>
            </footer>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
