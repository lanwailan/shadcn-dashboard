import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Insight Studio · 数据接入与编排平台',
  description:
    '以 Dataset 契约、组件注册表和 Dashboard Schema 驱动的数据可视化平台。',
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
