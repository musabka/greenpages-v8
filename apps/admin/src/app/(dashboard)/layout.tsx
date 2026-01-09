'use client';

import { useAuth } from '@/components/auth-provider';
import { Sidebar } from '@/components/sidebar';
import { Search } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />
      
      <div className="lg:mr-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="بحث..."
                  className="w-full h-10 pr-10 pl-4 rounded-lg border border-gray-300 bg-gray-50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Right side placeholder for future actions */}
            <div className="hidden sm:block text-sm text-gray-600">
              مرحباً، {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user?.email ?? 'مسؤول'}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
