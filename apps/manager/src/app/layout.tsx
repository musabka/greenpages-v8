import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';
import { RootLayoutClient } from '@/components/layout/root-layout-client';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'لوحة تحكم مدير المحافظة | الصفحات الخضراء',
    template: '%s | الصفحات الخضراء',
  },
  description: 'لوحة تحكم مدير المحافظة - الصفحات الخضراء',
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
        <RootLayoutClient>
          {children}
        </RootLayoutClient>
      </body>
    </html>
  );
}
