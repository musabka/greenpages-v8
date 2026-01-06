'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  RefreshCw,
  BarChart3,
  LogOut,
  Menu,
  X,
  Map,
  DollarSign,
  Package,
  Clock,
  Wallet,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';

const navigation = [
  { name: 'الرئيسية', href: '/dashboard', icon: LayoutDashboard },
  { name: 'الأنشطة التجارية', href: '/dashboard/businesses', icon: Building2 },
  { name: 'الأعمال المعلقة', href: '/dashboard/businesses/pending', icon: Clock },
  { name: 'المندوبين', href: '/dashboard/agents', icon: Users },
  { name: 'تقارير الأداء', href: '/dashboard/agents/performance', icon: TrendingUp },
  { name: 'المالية', href: '/dashboard/financial', icon: DollarSign },
  { name: 'التسويات المالية', href: '/dashboard/financial/settlements', icon: Wallet },
  { name: 'الباقات', href: '/dashboard/packages', icon: Package },
  { name: 'التجديدات', href: '/dashboard/renewals', icon: RefreshCw },
  { name: 'التقارير', href: '/dashboard/reports', icon: BarChart3 },
];


export default function ManagerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
      >
        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 right-0 z-40 w-72 bg-gradient-to-b from-green-900 to-green-800 transform transition-transform lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-6 border-b border-green-700">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                <Map className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <h1 className="font-bold text-white text-lg">مدير المحافظة</h1>
                <p className="text-xs text-green-200">الصفحات الخضراء</p>
              </div>
            </Link>
          </div>

          {/* User Info */}
          {user && (
            <div className="px-6 py-4 border-b border-green-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">
                    {user.firstName?.charAt(0) || 'م'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-green-200 text-xs truncate">{user.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-white text-green-900 shadow-lg'
                      : 'text-green-100 hover:bg-green-700'
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="px-4 py-6 border-t border-green-700">
            <button
              onClick={logout}
              className="flex items-center gap-3 px-4 py-3 w-full text-green-100 hover:bg-green-700 rounded-xl transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:mr-72">
        <DashboardHeader />
        <main className="p-6 lg:p-8">{children}</main>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </div>
  );
}
