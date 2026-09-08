import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Insight · 研发效能中心',
  description: '统一查看内部工具使用、CICT 测试分析与解析流水线。',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html className="dark" lang="zh-CN" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
