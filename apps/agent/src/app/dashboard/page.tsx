'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Building2,
  Calendar,
  DollarSign,
  RefreshCw,
  TrendingUp,
  Wallet,
  MapPin,
  FileText,
  AlertCircle,
  ArrowUpLeft,
  Clock,
  Users,
  HandCoins,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAgentBalance } from '@/lib/hooks/useFinancial';

interface DashboardData {
  profile: {
    id: string;
    baseSalary: number;
    commissionRate: number;
    totalEarnings: number;
    totalCommissions: number;
    hiredAt: string;
    manager: { firstName: string; lastName: string } | null;
  };
  governorates: { id: string; name: string }[];
  stats: {
    businesses: { total: number; pending: number; approved: number };
    renewals: { pending: number; completed: number };
    commissions: { approved: number; paid: number; pending: number };
    visits: { today: number; planned: number };
  };
  recentBusinesses: Array<{
    id: string;
    nameAr: string;
    status: string;
    createdAt: string;
    governorate: { nameAr: string };
    city: { nameAr: string };
  }>;
  upcomingVisits: Array<{
    id: string;
    purpose: string;
    scheduledAt: string;
    governorate: { nameAr: string };
    city: { nameAr: string } | null;
    business: { nameAr: string } | null;
  }>;
}

export default function AgentDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['agent-dashboard'],
    queryFn: async () => {
      const res = await api.get('/agent-portal/dashboard');
      return res.data as DashboardData;
    },
    retry: 2,
    staleTime: 60_000,
  });

  // Get agent cash balance
  const { data: balance } = useAgentBalance();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SY').format(amount) + ' ل.س';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-SA', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      APPROVED: 'bg-green-100 text-green-700',
      ACTIVE: 'bg-green-100 text-green-700',
      SUSPENDED: 'bg-red-100 text-red-700',
      EXPIRED: 'bg-gray-100 text-gray-700',
    };
    const labels: Record<string, string> = {
      PENDING: 'معلق',
      APPROVED: 'فعال',
      ACTIVE: 'فعال',
      SUSPENDED: 'موقوف',
      EXPIRED: 'منتهي',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getPurposeText = (purpose: string) => {
    const map: Record<string, string> = {
      REGISTRATION: 'تسجيل جديد',
      RENEWAL: 'تجديد',
      COLLECTION: 'تحصيل',
      VISIT: 'زيارة',
      OTHER: 'أخرى',
    };
    return map[purpose] || purpose;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
              <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
              <div className="h-8 w-16 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">حدث خطأ</h3>
        <p className="text-red-600 text-sm mb-4">
          {error instanceof Error ? error.message : 'فشل في تحميل البيانات'}
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const stats = data?.stats;
  const profile = data?.profile;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
          <p className="text-gray-500">
            مرحباً بك، نسبة عمولتك: <span className="font-semibold text-green-600">{profile?.commissionRate || 0}%</span>
            {data?.governorates && data.governorates.length > 0 && (
              <span className="mr-3">
                | المحافظات: {data.governorates.map(g => g.name).join(', ')}
              </span>
            )}
          </p>
        </div>
        <Link
          href="/dashboard/businesses/new"
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Building2 className="w-5 h-5" />
          إضافة نشاط جديد
        </Link>
      </div>

      {/* Critical Alert: Cash on Hand */}
      {balance && balance.currentBalance > 0 && (
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-6 text-white shadow-lg border-2 border-red-800">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <HandCoins className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">💵 أموال نقدية بحوزتك</h3>
              <div className="flex items-baseline gap-3 mb-3">
                <span className="text-4xl font-bold">{balance.currentBalance.toLocaleString()}</span>
                <span className="text-xl">ليرة سورية</span>
              </div>
              <div className="bg-white/10 rounded-lg p-3 mb-3">
                <p className="text-sm leading-relaxed">
                  📍 هذه الأموال تم قبضها نقداً من العملاء عند التسجيل/التجديد<br />
                  ⏰ يجب تسليمها لمدير المحافظة في نهاية يوم العمل<br />
                  💰 سيتم احتساب عمولتك ({profile?.commissionRate || 0}%) عند التسليم
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard/financial"
                  className="flex items-center gap-2 px-6 py-3 bg-white text-red-600 rounded-lg font-bold hover:bg-gray-100 transition-colors shadow-lg"
                >
                  <DollarSign className="w-5 h-5" />
                  تسليم الأموال النقدية
                </Link>
                <Link
                  href="/dashboard/financial"
                  className="text-sm text-white/90 hover:text-white underline"
                >
                  عرض التفاصيل المالية
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert for pending commissions */}
      {stats && stats.commissions.approved > 0 && (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-start gap-3">
          <TrendingUp className="w-6 h-6 text-green-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-green-900 text-lg">عمولاتك المعتمدة</h3>
            <p className="text-sm text-green-700 mt-1">
              لديك <span className="font-bold">{stats.commissions.approved}</span> عمولة معتمدة في انتظار الصرف
            </p>
          </div>
          <Link
            href="/dashboard/financial"
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 font-semibold"
          >
            عرض العمولات
          </Link>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* الأنشطة التجارية */}
        <Link href="/dashboard/businesses" className="block">
          <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              {stats?.businesses.pending && stats.businesses.pending > 0 && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                  {stats.businesses.pending} معلق
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats?.businesses.total || 0}</p>
            <p className="text-sm text-gray-500">نشاط تجاري</p>
          </div>
        </Link>

        {/* التجديدات المعلقة */}
        <Link href="/dashboard/renewals" className="block">
          <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-amber-50">
                <RefreshCw className="w-5 h-5 text-amber-600" />
              </div>
              {stats?.renewals.pending && stats.renewals.pending > 0 && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full animate-pulse">
                  يحتاج متابعة
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats?.renewals.pending || 0}</p>
            <p className="text-sm text-gray-500">تجديد معلق</p>
          </div>
        </Link>

        {/* العمولات */}
        <Link href="/dashboard/financial" className="block">
          <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-green-50">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats?.commissions.approved || 0).replace(' ل.س', '')}
            </p>
            <p className="text-sm text-gray-500">عمولات مستحقة</p>
          </div>
        </Link>

        {/* زيارات اليوم */}
        <Link href="/dashboard/visits" className="block">
          <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-purple-50">
                <MapPin className="w-5 h-5 text-purple-600" />
              </div>
              {stats?.visits.planned && stats.visits.planned > 0 && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                  {stats.visits.planned} مخطط
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats?.visits.today || 0}</p>
            <p className="text-sm text-gray-500">زيارة اليوم</p>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Link
          href="/dashboard/businesses/new"
          className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50 transition-colors"
        >
          <div className="p-2 rounded-lg bg-green-100">
            <Building2 className="w-5 h-5 text-green-600" />
          </div>
          <span className="font-medium text-gray-700">إضافة نشاط</span>
        </Link>

        <Link
          href="/dashboard/renewals"
          className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-amber-200 hover:bg-amber-50 transition-colors"
        >
          <div className="p-2 rounded-lg bg-amber-100">
            <RefreshCw className="w-5 h-5 text-amber-600" />
          </div>
          <span className="font-medium text-gray-700">التجديدات</span>
        </Link>

        <Link
          href="/dashboard/financial"
          className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors"
        >
          <div className="p-2 rounded-lg bg-blue-100">
            <Wallet className="w-5 h-5 text-blue-600" />
          </div>
          <span className="font-medium text-gray-700">المالية</span>
        </Link>

        <Link
          href="/dashboard/invoices"
          className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-colors"
        >
          <div className="p-2 rounded-lg bg-purple-100">
            <FileText className="w-5 h-5 text-purple-600" />
          </div>
          <span className="font-medium text-gray-700">الفواتير</span>
        </Link>

        <Link
          href="/dashboard/visits"
          className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-teal-200 hover:bg-teal-50 transition-colors"
        >
          <div className="p-2 rounded-lg bg-teal-100">
            <MapPin className="w-5 h-5 text-teal-600" />
          </div>
          <span className="font-medium text-gray-700">الزيارات</span>
        </Link>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Businesses */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">آخر الأنشطة المسجلة</h2>
            <Link href="/dashboard/businesses" className="text-sm text-green-600 hover:text-green-700">
              عرض الكل
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {!data?.recentBusinesses || data.recentBusinesses.length === 0 ? (
              <div className="p-8 text-center">
                <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">لم تقم بتسجيل أي نشاط بعد</p>
                <Link
                  href="/dashboard/businesses/new"
                  className="inline-block mt-3 text-green-600 hover:text-green-700 text-sm"
                >
                  ابدأ بإضافة نشاط جديد
                </Link>
              </div>
            ) : (
              data.recentBusinesses.map((business) => (
                <Link
                  key={business.id}
                  href={`/dashboard/businesses/${business.id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{business.nameAr}</p>
                      <p className="text-xs text-gray-500">
                        {business.governorate?.nameAr} - {business.city?.nameAr}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    {getStatusBadge(business.status)}
                    <p className="text-xs text-gray-400 mt-1">{formatDate(business.createdAt)}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Visits */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">الزيارات القادمة</h2>
              <Link href="/dashboard/visits" className="text-sm text-green-600 hover:text-green-700">
                الكل
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {!data?.upcomingVisits || data.upcomingVisits.length === 0 ? (
                <div className="p-6 text-center">
                  <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">لا توجد زيارات مجدولة</p>
                </div>
              ) : (
                data.upcomingVisits.slice(0, 3).map((visit) => (
                  <div key={visit.id} className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {getPurposeText(visit.purpose)}
                      </span>
                    </div>
                    <p className="font-medium text-gray-900 text-sm">
                      {visit.business?.nameAr || visit.governorate?.nameAr}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(visit.scheduledAt)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Commission Summary */}
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-5 text-white">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5" />
              <h3 className="font-bold">ملخص العمولات</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-green-100">مستحقة</span>
                <span className="font-bold">{formatCurrency(stats?.commissions.approved || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-100">مدفوعة</span>
                <span className="font-bold">{formatCurrency(stats?.commissions.paid || 0)}</span>
              </div>
              <div className="border-t border-green-500 pt-3 flex justify-between items-center">
                <span className="text-green-100">إجمالي الأرباح</span>
                <span className="text-xl font-bold">
                  {formatCurrency(Number(profile?.totalCommissions) || 0)}
                </span>
              </div>
            </div>
            <Link
              href="/dashboard/financial"
              className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-sm"
            >
              <ArrowUpLeft className="w-4 h-4" />
              عرض التفاصيل
            </Link>
          </div>

          {/* Manager Info */}
          {profile?.manager && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-gray-400" />
                <h3 className="font-bold text-gray-900">مدير المحافظة</h3>
              </div>
              <p className="text-gray-700">
                {profile.manager.firstName} {profile.manager.lastName}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
