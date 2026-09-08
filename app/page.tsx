'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Boxes,
  FlaskConical,
  GitBranch,
  LayoutDashboard,
  Moon,
  Sun,
  Command,
  Download,
  CalendarDays,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarProvider,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Overview } from '@/components/dashboard/overview';
import { ToolsView } from '@/components/dashboard/tools-view';
import { CictView } from '@/components/dashboard/cict-view';
import { PipelineView } from '@/components/dashboard/pipeline-view';
import { downloadText } from '@/components/dashboard/case-table';
import {
  initialCases,
  toolsData,
  registrants,
  type CaseRecord,
} from '@/lib/dashboard-data';
import { useWebTools } from '@/hooks/use-web-tools';
export const dimensions = [
  {
    id: 'tools',
    label: '工具使用',
    description: '注册、激活和调用情况',
    icon: Boxes,
  },
  {
    id: 'cict',
    label: 'CICT 分析',
    description: '测试结果与 Case 解析',
    icon: FlaskConical,
  },
  {
    id: 'pipeline',
    label: '解析流水线',
    description: '队列、Worker 和执行记录',
    icon: GitBranch,
  },
];
const navigation = [
  { id: 'overview', label: '数据总览', icon: LayoutDashboard },
  ...dimensions,
];
function AppSidebar({ page, go }: { page: string; go: (id: string) => void }) {
  const { setOpenMobile, state, isMobile } = useSidebar();
  return (
    <Sidebar
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
            <strong>Insight Admin</strong>
            <p>研发数据平台</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>工作空间</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={page === 'overview'}
                  tooltip="数据总览"
                  aria-label="数据总览"
                  onClick={() => {
                    go('overview');
                    setOpenMobile(false);
                  }}
                >
                  <LayoutDashboard />
                  <span>数据总览</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>数据看板</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {dimensions.map((n) => (
                <SidebarMenuItem key={n.id}>
                  <SidebarMenuButton
                    isActive={page === n.id}
                    tooltip={n.label}
                    aria-label={n.label}
                    onClick={() => {
                      go(n.id);
                      setOpenMobile(false);
                    }}
                  >
                    <n.icon />
                    <span>{n.label}</span>
                    {n.id === 'pipeline' && (
                      <span className="nav-count">8</span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="sidebar-user">
          <span className="avatar">RD</span>
          <div className="sidebar-brand-text">
            <strong>研发团队</strong>
            <p>演示工作空间</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
export default function Home() {
  const [page, setPage] = useState('overview');
  const [dark, setDark] = useState(true);
  const [cases, setCases] = useState<CaseRecord[]>(initialCases);
  const locks = useRef(new Set<string>());
  const go = useCallback((id: string) => {
    if (!navigation.some((n) => n.id === id)) return;
    setPage(id);
    location.hash = id;
    window.scrollTo({ top: 0 });
  }, []);
  useEffect(() => {
    const stored = localStorage.getItem('insight-admin-theme');
    queueMicrotask(() => setDark(stored !== 'light'));
    const sync = () => {
      const h = location.hash.slice(1);
      setPage(navigation.some((n) => n.id === h) ? h : 'overview');
    };
    queueMicrotask(sync);
    addEventListener('hashchange', sync);
    return () => removeEventListener('hashchange', sync);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);
  const retry = useCallback(async (id: string) => {
    if (!initialCases.some((c) => c.id === id))
      throw new Error('Case not found');
    if (locks.current.has(id)) throw new Error('Case is already being parsed');
    locks.current.add(id);
    setCases((cs) =>
      cs.map((c) => (c.id === id ? { ...c, status: 'running' } : c)),
    );
    await new Promise((r) => setTimeout(r, 1600));
    setCases((cs) =>
      cs.map((c) =>
        c.id === id ? { ...c, status: 'success', duration: 42 } : c,
      ),
    );
    locks.current.delete(id);
  }, []);
  useWebTools({ go, retry, cases });
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar page={page} go={go} />
        <SidebarInset className="min-w-0">
          <header className="admin-header">
            <div className="header-left">
              <SidebarTrigger aria-label="展开或收起导航" />
              <span className="header-divider" />
              <span className="header-current">
                {navigation.find((n) => n.id === page)?.label}
              </span>
              <span className="header-secondary">内部工具与测试分析</span>
            </div>
            <div className="header-right">
              <span className="demo-label">Demo</span>
              <Button
                variant="ghost"
                size="icon"
                aria-label={dark ? '切换浅色主题' : '切换深色主题'}
                onClick={() => {
                  setDark(!dark);
                  localStorage.setItem(
                    'insight-admin-theme',
                    !dark ? 'dark' : 'light',
                  );
                }}
              >
                {dark ? <Sun size={18} /> : <Moon size={18} />}
              </Button>
              <span className="avatar">RD</span>
            </div>
          </header>
          <main className="workspace" id="content">
            <div className="page-head">
              <div>
                <h1>{navigation.find((n) => n.id === page)?.label}</h1>
                {page !== 'overview' && (
                  <p className="subtitle">
                    {dimensions.find((d) => d.id === page)?.description} · 2026
                    年 9 月 8 日
                  </p>
                )}
              </div>
              <div className="head-actions">
                <span className="date-label">
                  <CalendarDays size={15} />
                  2026-09-08
                </span>
                <Button
                  className="btn"
                  onClick={() =>
                    downloadText(
                      `insight-${page}-2026-09-08.json`,
                      JSON.stringify(
                        {
                          environment: 'demo',
                          date: '2026-09-08',
                          view: page,
                          ...(page === 'tools'
                            ? { tools: toolsData, registrants }
                            : page === 'overview'
                              ? {
                                  registered_users: 1284,
                                  calls_today: 3960,
                                  cases_today: 386,
                                  completion_rate: 98.2,
                                }
                              : { cases }),
                        },
                        null,
                        2,
                      ),
                    )
                  }
                >
                  <Download size={15} />
                  导出报告
                </Button>
              </div>
            </div>
            {page === 'overview' ? (
              <Overview go={go} cases={cases} />
            ) : page === 'tools' ? (
              <ToolsView />
            ) : page === 'cict' ? (
              <CictView cases={cases} retry={retry} />
            ) : (
              <PipelineView cases={cases} retry={retry} />
            )}
            <footer className="footer">
              <span>
                Insight Admin <span className="footer-dot">·</span>{' '}
                演示数据，未连接后端
              </span>
              <span>数据快照 2026-09-08 14:32 · UTC+8</span>
            </footer>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
