'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrencySYP } from '@/lib/format';
import { useAgentsBalances } from '@/lib/hooks/useFinancial';
import {
  DollarSign,
  PieChart,
  Users,
  Wallet,
  TrendingUp,
  Calendar,
  FileText,
  HandCoins,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';

type FinancialStats = {
  totalIncome: number;
  greenPagesProfit: number;
  delegatesProfit: number;
  currentBalance: number;
  netProfit: number;
  currency: string;
};

export default function FinancialPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['manager-financial-stats'],
    queryFn: async () => {
      const res = await api.get('/financial/manager/stats');
      return res.data as FinancialStats;
    },
  });

  const { data: balancesData } = useAgentsBalances({ page: 1, limit: 5 });

  if (isLoading) {
    return <div className="p-8 text-center">جاري تحميل البيانات المالية...</div>;
  }

  if (!stats) return null;

  const pendingBalance = balancesData?.summary?.totalPendingBalance || 0;
  const agentsWithBalance = balancesData?.summary?.agentsWithBalance || 0;

  const cards = [
    {
      name: 'الدخل الإجمالي',
      value: stats.totalIncome,
      icon: DollarSign,
      color: 'bg-emerald-500',
      subtitle: 'مجموع الاشتراكات',
    },
    {
      name: 'أرباح الصفحات الخضراء',
      value: stats.greenPagesProfit,
      icon: PieChart,
      color: 'bg-teal-500',
      subtitle: 'نسبة المركز الرئيسي',
    },
    {
      name: 'أرباح المندوبين',
      value: stats.delegatesProfit,
      icon: Users,
      color: 'bg-indigo-500',
      subtitle: 'عمولات المندوبين',
    },
    {
      name: 'الرصيد الحالي',
      value: stats.currentBalance,
      icon: Wallet,
      color: 'bg-blue-600',
      subtitle: 'الدخل - المندوبين',
    },
    {
      name: 'الربح الصافي',
      value: stats.netProfit,
      icon: TrendingUp,
      color: 'bg-green-600',
      subtitle: 'الرصيد - الصفحات الخضراء',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">التقارير المالية</h1>
        <p className="text-gray-500 mt-1">ملخص الأداء المالي والأرباح</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((stat) => (
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
                  {formatCurrencySYP(Number(stat.value) || 0)}
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

      {/* Quick Actions - Receive Payments */}
      {pendingBalance > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-600 rounded-xl">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-red-900 text-lg">مبالغ معلقة في ذمة المندوبين</h3>
                <p className="text-red-800">
                  <span className="font-bold text-xl">{formatCurrencySYP(pendingBalance)}</span>
                  {' '}من <span className="font-medium">{agentsWithBalance}</span> مندوب
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/financial/receive-payments"
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors"
            >
              <HandCoins className="w-5 h-5" />
              استلام المبالغ الآن
            </Link>
          </div>
        </div>
      )}

      {/* Quick Action Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/dashboard/financial/receive-payments"
          className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl p-6 hover:from-green-700 hover:to-green-800 transition-all shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <HandCoins className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold">استلام المبالغ من المندوبين</h3>
                <p className="text-sm text-green-100 mt-1">
                  متابعة الذمم المالية واستلام المقبوضات
                </p>
              </div>
            </div>
            <ArrowLeft className="w-6 h-6" />
          </div>
        </Link>

        <Link
          href="/dashboard/financial/settlements"
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-6 hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <Wallet className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold">التسويات المالية</h3>
                <p className="text-sm text-blue-100 mt-1">
                  عرض سجل التسويات المكتملة
                </p>
              </div>
            </div>
            <ArrowLeft className="w-6 h-6" />
          </div>
        </Link>
      </div>

      {/* Detailed Reports Section (Placeholder for future expansion) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900">آخر الحركات المالية</h3>
            <button className="text-sm text-blue-600 hover:underline">عرض الكل</button>
          </div>
          <div className="space-y-4">
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>لا توجد حركات مالية حديثة</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900">التسويات المعلقة</h3>
            <button className="text-sm text-blue-600 hover:underline">عرض الكل</button>
          </div>
          <div className="space-y-4">
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>لا توجد تسويات معلقة</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
