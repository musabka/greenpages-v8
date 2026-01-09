'use client';

import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Wallet,
  Building2,
  HandCoins
} from 'lucide-react';
import { useFinancialOverview, useManagerBalances } from '@/lib/hooks/useFinancial';
import Link from 'next/link';

export default function AdminFinancialPage() {
  const { data: overview, isLoading: overviewLoading } = useFinancialOverview();
  const { data: managers } = useManagerBalances({ limit: 5 });

  if (overviewLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">جارٍ تحميل البيانات المالية...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">النظام المالي</h1>
        <p className="text-gray-500">إدارة الحسابات المالية الشاملة</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">إجمالي الإيرادات</p>
              <p className="text-2xl font-bold text-green-600">
                {overview?.totalRevenue.toLocaleString() || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">ليرة سورية</p>
            </div>
            <div className="p-3 rounded-xl bg-green-100">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">الذمم المستحقة</p>
              <p className="text-2xl font-bold text-red-600">
                {overview?.totalOutstanding.toLocaleString() || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">من المدراء</p>
            </div>
            <div className="p-3 rounded-xl bg-red-100">
              <Wallet className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">مدراء المحافظات</p>
              <p className="text-2xl font-bold text-blue-600">
                {overview?.totalManagers || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">مدير نشط</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-100">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">إجمالي النشاطات</p>
              <p className="text-2xl font-bold text-purple-600">
                {overview?.totalBusinesses || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">نشاط تجاري</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-100">
              <Building2 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Managers with Outstanding Balances */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="font-bold text-gray-900">مدراء المحافظات - الذمم المستحقة</h2>
          <Link href="/financial/managers" className="text-sm text-blue-600 hover:text-blue-700">
            عرض الكل
          </Link>
        </div>
        <div className="p-6">
          {managers?.data?.length === 0 ? (
            <p className="text-center text-gray-500 py-8">لا يوجد مدراء</p>
          ) : (
            <div className="space-y-4">
              {managers?.data
                ?.filter((m: any) => m.currentBalance > 0)
                .map((manager: any) => (
                <div key={manager.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {manager.user?.firstName} {manager.user?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        نسبة العمولة: {manager.commissionRate}%
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-red-600">
                      {manager.currentBalance?.toLocaleString() || 0} ل.س
                    </p>
                    <p className="text-xs text-gray-500">مستحق</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link 
          href="/dashboard/financial/settlements"
          className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl p-6 hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <HandCoins className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold">التسويات المالية</h3>
              <p className="text-sm text-indigo-100 mt-1">
                تسويات مدراء المحافظات
              </p>
            </div>
          </div>
        </Link>

        <Link 
          href="/dashboard/financial/managers"
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-6 hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold">إدارة المدراء</h3>
              <p className="text-sm text-blue-100 mt-1">
                تحديد النسب واستلام الأموال
              </p>
            </div>
          </div>
        </Link>

        <Link 
          href="/dashboard/financial/transactions"
          className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl p-6 hover:from-green-700 hover:to-green-800 transition-all shadow-lg"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <DollarSign className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold">سجل المعاملات</h3>
              <p className="text-sm text-green-100 mt-1">
                عرض جميع المعاملات المالية
              </p>
            </div>
          </div>
        </Link>

        <Link 
          href="/dashboard/financial/reports"
          className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl p-6 hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold">التقارير المالية</h3>
              <p className="text-sm text-purple-100 mt-1">
                تقارير وإحصائيات شاملة
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
