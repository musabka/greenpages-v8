import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AgentLayoutClient } from '@/components/layout/agent-layout-client';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'لوحة تحكم المندوب | الصفحات الخضراء',
  description: 'لوحة تحكم المندوبين - الصفحات الخضراء',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="min-h-screen bg-gray-50">
        <AgentLayoutClient>
          {children}
        </AgentLayoutClient>
      </body>
    </html>
  );
}
