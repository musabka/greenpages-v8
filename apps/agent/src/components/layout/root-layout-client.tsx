'use client';

import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { AuthProvider } from '@/components/auth/auth-provider';
import { SettingsProvider, type SiteSettings } from '@/components/settings-context';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

interface RootLayoutClientProps {
  children: ReactNode;
  settings: SiteSettings;
}

/**
 * Root Layout Client Component
 * يستقبل الإعدادات من Server Component ويوفرها للتطبيق
 */
export function RootLayoutClient({ children, settings }: RootLayoutClientProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SettingsProvider initialSettings={settings}>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </SettingsProvider>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
