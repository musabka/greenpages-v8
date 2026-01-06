'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  MapPin,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { api } from '@/lib/api';
import { getStatusBadge } from '../../../../shared/status-badge';
import { OwnershipStatsCards } from '@/components/dashboard/ownership-stats-cards';

type DashboardStats = {
  totalBusinesses: number;
  monthlyBusinesses: number;
  pendingRenewals: number;
  completedRenewals: number;
  totalCommissions: number;
  pendingCommissions: number;
};

type RecentActivity = {
  id: string;
  type: 'business' | 'renewal' | 'commission' | 'visit' | string;
  title: string;
  description: string;
  status?: 'pending' | 'approved' | 'completed' | string;
  date: string;
};

type TodayVisit = {
  id: string;
  businessName: string;
  scheduledAt: string;
  status?: 'pending' | 'approved' | 'completed' | string;
};

type DashboardResponse = {
  stats: DashboardStats;
  recentActivity: RecentActivity[];
  todayVisits: TodayVisit[];
};

const skeletonCard = (
  <div className="rounded-2xl bg-white p-4 shadow-sm animate-pulse">
    <div className="h-4 w-1/3 bg-gray-200 rounded" />
    <div className="mt-3 h-6 w-1/2 bg-gray-200 rounded" />
    <div className="mt-2 h-3 w-1/3 bg-gray-200 rounded" />
  </div>
);

export default function AgentDashboardPage() {
  const { data, isLoading, isError, refetch, error, isFetching } = useQuery({
    queryKey: ['agent-dashboard'],
    queryFn: async () => {
      const res = await api.get('/agent-portal/dashboard');
      return res.data as DashboardResponse;
    },
    retry: 2,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  const stats = data?.stats;
  const recentActivity = data?.recentActivity ?? [];
  const todayVisits = data?.todayVisits ?? [];

  const statCards = stats
    ? [
        {
          title: 'إجمالي الأنشطة',
          value: stats.totalBusinesses,
          subtitle: 'كل الأنشطة المسجلة',
          icon: Building2,
          color: 'text-blue-600 bg-blue-50',
        },
        {
          title: 'الأنشطة هذا الشهر',
          value: stats.monthlyBusinesses,
          subtitle: 'إضافات الشهر الحالي',
          icon: TrendingUp,
          color: 'text-green-600 bg-green-50',
        },
        {
          title: 'تجديدات معلقة',
          value: stats.pendingRenewals,
          subtitle: 'تحتاج متابعة',
          icon: RefreshCw,
          color: 'text-amber-600 bg-amber-50',
        },
        {
          title: 'العمولات المستحقة',
          value: stats.pendingCommissions,
          subtitle: 'بانتظار الصرف',
          icon: DollarSign,
          color: 'text-purple-600 bg-purple-50',
        },
      ]
    : [];

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx}>{skeletonCard}</div>
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="h-12 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="mt-4 space-y-2">
                {Array.from({ length: 2 }).map((_, idx) => (
                  <div key={idx} className="h-10 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="mt-3 h-6 w-20 bg-gray-100 rounded animate-pulse" />
              <div className="mt-3 h-6 w-16 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="mt-3 h-6 w-20 bg-gray-100 rounded animate-pulse" />
              <div className="mt-3 h-6 w-16 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    const message =
      (error as any)?.response?.data?.message || 'حدث خطأ في تحميل البيانات';
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-red-700">تعذر تحميل البيانات</h2>
        <p className="text-gray-600">{message}</p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          disabled={isFetching}
        >
          إعادة المحاولة
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>
    );
  }

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'business':
        return <Building2 className="w-5 h-5 text-blue-600" />;
      case 'renewal':
        return <RefreshCw className="w-5 h-5 text-amber-600" />;
      case 'commission':
        return <DollarSign className="w-5 h-5 text-green-600" />;
      case 'visit':
        return <MapPin className="w-5 h-5 text-purple-600" />;
      default:
        return <CheckCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusPill = (status?: string) => {
    const mapped = getStatusBadge(status);
    if (!mapped) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">غير محدد</span>
      );
    }
    return (
      <span className={`px-2 py-1 text-xs rounded-full font-medium ${mapped.bg} ${mapped.text}`}>
        {mapped.label}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
          <p className="text-gray-500">نظرة سريعة على أداء المندوب</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <TrendingUp className="w-4 h-4" />
          إنشاء تقرير سريع
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.title}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-start justify-between"
          >
            <div className="space-y-2">
              <p className="text-sm text-gray-500">{card.title}</p>
              <h3 className="text-2xl font-bold text-gray-900">{card.value}</h3>
              <p className="text-sm text-gray-500">{card.subtitle}</p>
            </div>
            <div className={`p-3 rounded-xl ${card.color}`}>
              <card.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Ownership Statistics Section */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900">إحصائيات الملكية</h2>
          <p className="text-sm text-gray-500">حالة ربط الأنشطة التجارية بالمالكين</p>
        </div>
        <OwnershipStatsCards />
      </div>

      {/* Recent Activity + Today Schedule */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">النشاطات الأخيرة</h2>
              <p className="text-sm text-gray-500">أحدث ما قمت به على النظام</p>
            </div>
            <button className="text-sm text-blue-600 hover:text-blue-700">عرض الكل</button>
          </div>

          <div className="divide-y divide-gray-100">
            {recentActivity.length === 0 && (
              <div className="p-6 text-center text-gray-500">لا يوجد نشاط حديث</div>
            )}
            {recentActivity.map((item) => (
              <div key={item.id} className="p-6 flex items-start gap-4">
                <div className="p-3 bg-gray-50 rounded-xl">{getActivityIcon(item.type)}</div>
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
                    {getStatusPill(item.status)}
                  </div>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                  <p className="text-gray-400 text-xs">{item.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900">جدول اليوم</h3>
                <p className="text-sm text-gray-500">زيارات اليوم</p>
              </div>
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div className="space-y-3">
              {todayVisits.length === 0 && (
                <p className="text-sm text-gray-500">لا توجد زيارات مجدولة اليوم</p>
              )}
              {todayVisits.map((visit) => (
                <div key={visit.id} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900">{visit.businessName}</p>
                    {getStatusPill(visit.status)}
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600 mt-2">
                    <span className="inline-flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {visit.scheduledAt}
                    </span>
                    <Link href="/dashboard/visits" className="btn btn-xs btn-primary">
                      بدء الزيارة
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900">التجديدات</h3>
                <p className="text-sm text-gray-500">متابعة حالات التجديد</p>
              </div>
              <RefreshCw className="w-5 h-5 text-amber-600" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-900 font-semibold">مكتملة</p>
                  <p className="text-xs text-gray-500">تم إنهاء الإجراء</p>
                </div>
                <div className="text-lg font-bold text-green-600">{stats?.completedRenewals ?? '-'}</div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-900 font-semibold">قيد التنفيذ</p>
                  <p className="text-xs text-gray-500">تتطلب متابعة</p>
                </div>
                <div className="text-lg font-bold text-amber-600">{stats?.pendingRenewals ?? '-'}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900">العمولات</h3>
                <p className="text-sm text-gray-500">إجمالي ومستحق</p>
              </div>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-900 font-semibold">إجمالي العمولات</p>
                  <p className="text-xs text-gray-500">بما في ذلك المدفوعة</p>
                </div>
                <div className="text-lg font-bold text-gray-900">{stats?.totalCommissions ?? '-'}</div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-900 font-semibold">مستحقة</p>
                  <p className="text-xs text-gray-500">بانتظار الصرف</p>
                </div>
                <div className="text-lg font-bold text-amber-600">{stats?.pendingCommissions ?? '-'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
