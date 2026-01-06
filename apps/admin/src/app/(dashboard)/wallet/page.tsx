'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Users,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
} from 'lucide-react';
import Link from 'next/link';

interface WalletStats {
  totalWallets: number;
  activeWallets: number;
  totalBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalSpent: number;
  pendingTopUps: number;
  pendingTopUpsAmount: number;
  pendingWithdrawals: number;
  pendingWithdrawalsAmount: number;
}

export default function AdminWalletPage() {
  const statsQuery = useQuery<WalletStats>({
    queryKey: ['admin', 'wallet', 'stats'],
    queryFn: async () => {
      const response = await api.get('/admin/wallet/stats');
      return response.data;
    },
  });

  const recentTopUpsQuery = useQuery({
    queryKey: ['admin', 'wallet', 'top-ups', 'recent'],
    queryFn: async () => {
      const response = await api.get('/admin/wallet/top-ups', {
        params: { limit: 5, status: 'PENDING' },
      });
      return response.data;
    },
  });

  const recentWithdrawalsQuery = useQuery({
    queryKey: ['admin', 'wallet', 'withdrawals', 'recent'],
    queryFn: async () => {
      const response = await api.get('/admin/wallet/withdrawals', {
        params: { limit: 5, status: 'PENDING' },
      });
      return response.data;
    },
  });

  const stats = statsQuery.data;

  if (statsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">جارٍ تحميل بيانات المحفظة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Wallet className="w-8 h-8 text-blue-600" />
            نظام المحفظة
          </h1>
          <p className="text-gray-500">إدارة محافظ المستخدمين والمعاملات المالية</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">إجمالي الرصيد</p>
              <p className="text-2xl font-bold text-blue-600">
                {(stats?.totalBalance || 0).toLocaleString('ar-SY')}
              </p>
              <p className="text-xs text-gray-500">ليرة سورية</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-100">
              <Wallet className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">إجمالي الإيداعات</p>
              <p className="text-2xl font-bold text-green-600">
                {(stats?.totalDeposits || 0).toLocaleString('ar-SY')}
              </p>
              <p className="text-xs text-gray-500">ليرة سورية</p>
            </div>
            <div className="p-3 rounded-xl bg-green-100">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">إجمالي المصروفات</p>
              <p className="text-2xl font-bold text-orange-600">
                {(stats?.totalSpent || 0).toLocaleString('ar-SY')}
              </p>
              <p className="text-xs text-gray-500">ليرة سورية</p>
            </div>
            <div className="p-3 rounded-xl bg-orange-100">
              <CreditCard className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">المحافظ النشطة</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats?.activeWallets || 0}
              </p>
              <p className="text-xs text-gray-500">من {stats?.totalWallets || 0} محفظة</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-100">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Pending Requests Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pending Top-ups */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-green-900 flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5" />
              طلبات الشحن المعلقة
            </h3>
            <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold">
              {stats?.pendingTopUps || 0}
            </span>
          </div>
          <p className="text-green-700 text-sm mb-4">
            إجمالي المبلغ: {(stats?.pendingTopUpsAmount || 0).toLocaleString('ar-SY')} ل.س
          </p>
          <Link
            href="/wallet/top-ups"
            className="inline-flex items-center gap-2 text-green-700 hover:text-green-900 font-medium text-sm"
          >
            عرض الكل
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Pending Withdrawals */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-red-900 flex items-center gap-2">
              <ArrowDownRight className="w-5 h-5" />
              طلبات السحب المعلقة
            </h3>
            <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
              {stats?.pendingWithdrawals || 0}
            </span>
          </div>
          <p className="text-red-700 text-sm mb-4">
            إجمالي المبلغ: {(stats?.pendingWithdrawalsAmount || 0).toLocaleString('ar-SY')} ل.س
          </p>
          <Link
            href="/wallet/withdrawals"
            className="inline-flex items-center gap-2 text-red-700 hover:text-red-900 font-medium text-sm"
          >
            عرض الكل
            <ArrowDownRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Recent Requests Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Top-ups */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">آخر طلبات الشحن</h3>
            <Link
              href="/wallet/top-ups"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              عرض الكل
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentTopUpsQuery.data?.data?.length > 0 ? (
              recentTopUpsQuery.data.data.map((topUp: any) => (
                <div key={topUp.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100">
                      <ArrowUpRight className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {topUp.wallet?.user?.name || 'مستخدم'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(topUp.createdAt).toLocaleDateString('ar-SY')}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-green-600">
                      +{Number(topUp.amount).toLocaleString('ar-SY')}
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" />
                      معلق
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                لا توجد طلبات معلقة
              </div>
            )}
          </div>
        </div>

        {/* Recent Withdrawals */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">آخر طلبات السحب</h3>
            <Link
              href="/wallet/withdrawals"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              عرض الكل
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentWithdrawalsQuery.data?.data?.length > 0 ? (
              recentWithdrawalsQuery.data.data.map((withdrawal: any) => (
                <div key={withdrawal.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-100">
                      <ArrowDownRight className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {withdrawal.wallet?.user?.name || 'مستخدم'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(withdrawal.createdAt).toLocaleDateString('ar-SY')}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-red-600">
                      -{Number(withdrawal.amount).toLocaleString('ar-SY')}
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" />
                      معلق
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                لا توجد طلبات معلقة
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">إجراءات سريعة</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Link
            href="/wallet/users"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <Users className="w-8 h-8 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">محافظ المستخدمين</span>
          </Link>
          <Link
            href="/wallet/top-ups"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-green-50 hover:bg-green-100 transition-colors"
          >
            <ArrowUpRight className="w-8 h-8 text-green-600" />
            <span className="text-sm font-medium text-green-900">طلبات الشحن</span>
          </Link>
          <Link
            href="/wallet/withdrawals"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-red-50 hover:bg-red-100 transition-colors"
          >
            <ArrowDownRight className="w-8 h-8 text-red-600" />
            <span className="text-sm font-medium text-red-900">طلبات السحب</span>
          </Link>
          <Link
            href="/wallet/credit"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors"
          >
            <CreditCard className="w-8 h-8 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">شحن محفظة</span>
          </Link>
          <Link
            href="/wallet/bulk-credit"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors"
          >
            <Users className="w-8 h-8 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-900">شحن جماعي</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
