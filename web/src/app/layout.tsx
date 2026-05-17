import type { Metadata } from 'next';

/**
 * Root Layout
 * Next.js App Router的根布局组件
 */
export const metadata: Metadata = {
  title: 'Agent Chat',
  description: 'AG-UI based AI Agent Chat Interface',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
