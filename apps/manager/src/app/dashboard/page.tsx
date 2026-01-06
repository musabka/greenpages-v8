'use client';

import {
  Building2,
  Users,
  RefreshCw,
  MapPin,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  ArrowUpLeft,
  Wallet,
  PieChart,
  DollarSign,
  CreditCard,
  Award,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { getStatusBadge } from '../../../../shared/status-badge';
import { OwnershipStatsCards } from '@/components/dashboard/ownership-stats-cards';

type FinancialStats = {
  totalIncome: number;
  greenPagesProfit: number;
  delegatesProfit: number;
  currentBalance: number;
  netProfit: number;
  currency: string;
};

type DashboardData = {
  governorates: { id: string; name: string }[];
  stats: {
    businesses: { total: number; pending: number; approved: number };
    agents: { total: number; active: number };
    renewals: { pending: number; completed: number };
    visits: number;
    financial?: {
      totalSubscriptions: number;
      totalCommissions: number;
      approvedCommissions: number;
      paidCommissions: number;
      pendingCommissions: number;
      commissionsCount: number;
    };
  };
  recentBusinesses: Array<{
    id: string;
    nameAr: string;
    governorate?: { nameAr: string };
    city?: { nameAr: string };
    status?: string;
    createdAt?: string;
  }>;
  topAgents?: Array<{
    id: string;
    userId: string;
    name: string;
    email: string;
    totalCommissions: number;
    totalBusinesses: number;
    commissionRate: number;
    governorates: string[];
  }>;
  governorateStats?: Array<{
    governorateId: string;
    governorateName: string;
    businessCount: number;
    totalRevenue: number;
    totalCommissions: number;
    agentsCount: number;
  }>;
};

const skeletonCard = (
  <div className="rounded-2xl bg-white p-4 shadow-sm animate-pulse">
    <div className="h-4 w-1/3 bg-gray-200 rounded" />
    <div className="mt-3 h-6 w-1/2 bg-gray-200 rounded" />
    <div className="mt-2 h-3 w-1/3 bg-gray-200 rounded" />
  </div>
);

export default function ManagerDashboardPage() {
  const { data, isLoading, isError, refetch, error, isFetching } = useQuery({
    queryKey: ['manager-dashboard'],
    queryFn: async () => {
      const res = await api.get('/governorate-manager/dashboard');
      return res.data as DashboardData;
    },
    retry: 2,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  const { data: financialStats, isLoading: isFinancialLoading } = useQuery({
    queryKey: ['manager-financial-stats'],
    queryFn: async () => {
      const res = await api.get('/financial/manager/stats');
      return res.data as FinancialStats;
    },
    retry: 1,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white animate-pulse">
          <div className="h-4 w-32 bg-white/40 rounded" />
          <div className="mt-4 h-6 w-64 bg-white/30 rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx}>{skeletonCard}</div>
          ))}
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    const message =
      (error as any)?.response?.data?.message || 'حدث خطأ في تحميل البيانات';
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-red-700 mb-2">خطأ في التحميل</h2>
        <p className="text-red-600 mb-4">{message}</p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          إعادة المحاولة
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    {
      name: 'إجمالي الأنشطة',
      value: data.stats.businesses.total,
      icon: Building2,
      color: 'bg-blue-500',
      change: `${data.stats.businesses.pending} معلقة`,
      link: '/dashboard/businesses/pending',
    },
    {
      name: 'الأنشطة الموافق عليها',
      value: data.stats.businesses.approved,
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      name: 'المندوبين النشطين',
      value: data.stats.agents.active,
      icon: Users,
      color: 'bg-purple-500',
      change: `من ${data.stats.agents.total} مندوب`,
      link: '/dashboard/agents',
    },
    {
      name: 'التجديدات المعلقة',
      value: data.stats.renewals.pending,
      icon: RefreshCw,
      color: 'bg-amber-500',
      change: `${data.stats.renewals.completed} مكتملة`,
    },
    {
      name: 'الزيارات الميدانية',
      value: data.stats.visits,
      icon: MapPin,
      color: 'bg-rose-500',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
        <p className="text-gray-500 mt-1">مرحباً بك في لوحة تحكم مدير المحافظة</p>
      </div>

      {/* Governorates */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <MapPin className="w-6 h-6" />
          <h2 className="text-lg font-bold">المحافظات التي تديرها</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {data.governorates.map((gov) => (
            <span
              key={gov.id}
              className="bg-white/20 px-4 py-2 rounded-full text-sm font-medium"
            >
              {gov.name}
            </span>
          ))}
        </div>
      </div>

      {/* Financial Stats Grid */}
      {financialStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              name: 'الدخل الإجمالي',
              value: financialStats.totalIncome,
              icon: DollarSign,
              color: 'bg-emerald-500',
              subtitle: 'مجموع الاشتراكات',
            },
            {
              name: 'أرباح الصفحات الخضراء',
              value: financialStats.greenPagesProfit,
              icon: PieChart,
              color: 'bg-teal-500',
              subtitle: 'نسبة المركز الرئيسي',
            },
            {
              name: 'أرباح المندوبين',
              value: financialStats.delegatesProfit,
              icon: Users,
              color: 'bg-indigo-500',
              subtitle: 'عمولات المندوبين',
            },
            {
              name: 'الرصيد الحالي',
              value: financialStats.currentBalance,
              icon: Wallet,
              color: 'bg-blue-600',
              subtitle: 'الدخل - المندوبين',
            },
            {
              name: 'الربح الصافي',
              value: financialStats.netProfit,
              icon: TrendingUp,
              color: 'bg-green-600',
              subtitle: 'الرصيد - الصفحات الخضراء',
            },
          ].map((stat) => (
            <div
              key={stat.name}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-3">
                <div className={`${stat.color} p-3 rounded-xl`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">{stat.name}</p>
                  <p className="text-lg font-bold text-gray-900">
                    {Number(stat.value).toLocaleString()} {financialStats.currency}
                  </p>
                </div>
              </div>
              {stat.subtitle && (
                <div className="mt-3 pt-3 border-t border-gray-50">
                  <span className="text-xs text-gray-400">{stat.subtitle}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Ownership Statistics Section */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">إحصائيات الملكية</h2>
        <p className="text-sm text-gray-500 mb-4">حالة ربط الأنشطة التجارية بالمالكين</p>
        <OwnershipStatsCards />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => {
          const StatCard = (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`${stat.color} p-3 rounded-xl`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.name}</p>
                  {stat.change && (
                    <p className="text-xs text-gray-400 mt-1">{stat.change}</p>
                  )}
                </div>
              </div>
            </div>
          );

          return stat.link ? (
            <Link key={stat.name} href={stat.link} className="hover:opacity-80 transition-opacity">
              {StatCard}
            </Link>
          ) : (
            <div key={stat.name}>{StatCard}</div>
          );
        })}
      </div>

      {/* Top Agents & Governorate Stats */}
      {(data.topAgents && data.topAgents.length > 0) || (data.governorateStats && data.governorateStats.length > 0) ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Agents */}
          {data.topAgents && data.topAgents.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                  أفضل المندوبين
                </h2>
                <Link
                  href="/dashboard/agents/performance"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  عرض الكل
                </Link>
              </div>
              <div className="divide-y divide-gray-100">
                {data.topAgents.slice(0, 5).map((agent, index) => (
                  <div key={agent.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700' :
                        index === 1 ? 'bg-gray-100 text-gray-700' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{agent.name}</p>
                        <p className="text-xs text-gray-500">{agent.governorates.join(', ')}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-green-600">
                        {agent.totalCommissions.toLocaleString()} ل.س
                      </p>
                      <p className="text-xs text-gray-500">{agent.totalBusinesses} نشاط</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Governorate Stats */}
          {data.governorateStats && data.governorateStats.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  إحصائيات المحافظات
                </h2>
              </div>
              <div className="divide-y divide-gray-100">
                {data.governorateStats.map((gov) => (
                  <div key={gov.governorateId} className="px-6 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{gov.governorateName}</h3>
                      <span className="text-sm text-gray-500">{gov.agentsCount} مندوب</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-gray-500">الأنشطة</p>
                        <p className="text-sm font-bold text-blue-600">{gov.businessCount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">الإيرادات</p>
                        <p className="text-sm font-bold text-green-600">
                          {gov.totalRevenue.toLocaleString()} ل.س
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">العمولات</p>
                        <p className="text-sm font-bold text-purple-600">
                          {gov.totalCommissions.toLocaleString()} ل.س
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Recent Businesses */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">آخر الأنشطة المضافة</h2>
          <Link
            href="/dashboard/businesses"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
          >
            عرض الكل
            <ArrowUpLeft className="w-4 h-4" />
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {data.recentBusinesses.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              لا توجد أنشطة حديثة
            </div>
          ) : (
            data.recentBusinesses.map((business) => {
              const badge = getStatusBadge(business.status);
              return (
              <div
                key={business.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {business.nameAr}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {business.governorate?.nameAr} - {business.city?.nameAr}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      `${badge?.bg ?? 'bg-gray-100'} ${badge?.text ?? 'text-gray-700'}`
                    }`}
                  >
                    {badge?.label || business.status || 'غير محدد'}
                  </span>
                  <Link
                    href={`/dashboard/businesses/${business.id}/edit`}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <Eye className="w-4 h-4 text-gray-400" />
                  </Link>
                </div>
              </div>
            );
            })
          )}
        </div>
      </div>
    </div>
  );
}
