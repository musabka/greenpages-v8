'use client';

import { useFinancialOverview, useManagerBalances } from '@/lib/hooks/useFinancial';
import { ArrowLeft, DollarSign, TrendingUp, AlertCircle, Activity } from 'lucide-react';
import Link from 'next/link';
import { formatNumber } from '@/lib/format';

export default function AdminFinancialPage() {
  const { data: overview, isLoading } = useFinancialOverview();
  const { data: managers, isLoading: managersLoading } = useManagerBalances();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="w-4 h-4" />
                  العودة
                </Link>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">إدارة المالية</h1>
              <p className="text-gray-500">عرض ملخص شامل للمعاملات والتسويات والعمولات</p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">إجمالي التسويات</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {isLoading ? '...' : overview?.totalSettlements || 0}
                  </p>
                </div>
                <DollarSign className="w-10 h-10 text-blue-100 bg-blue-50 rounded-lg p-2" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">المبلغ الإجمالي</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {isLoading ? '...' : formatNumber(overview?.totalAmount || 0)}
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-100 bg-green-50 rounded-lg p-2" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">المعلقة</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">
                    {isLoading ? '...' : overview?.pendingCount || 0}
                  </p>
                </div>
                <AlertCircle className="w-10 h-10 text-orange-100 bg-orange-50 rounded-lg p-2" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">عدد المديرين</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">
                    {managersLoading ? '...' : managers?.length || 0}
                  </p>
                </div>
                <Activity className="w-10 h-10 text-purple-100 bg-purple-50 rounded-lg p-2" />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link href="/financial/settlements" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">التسويات</h3>
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-gray-500 text-sm">إدارة التسويات والمعاملات المالية</p>
            </Link>

            <Link href="/financial/managers" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">المديرين</h3>
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-gray-500 text-sm">إدارة مديري المحافظ والعمولات</p>
            </Link>

            <Link href="/financial/transactions" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">المعاملات</h3>
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-gray-500 text-sm">عرض سجل المعاملات المالية</p>
            </Link>

            <Link href="/financial/reports" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">التقارير</h3>
                <AlertCircle className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-gray-500 text-sm">التقارير المالية الشاملة والتحليلات</p>
            </Link>
          </div>

          {/* Managers Balance */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                أرصدة المديرين
              </h3>
            </div>
            {managersLoading ? (
              <div className="p-6 text-center text-gray-500">جاري التحميل...</div>
            ) : managers && managers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">اسم المدير</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">المحافظة</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">الرصيد الحالي</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">العمولة المتراكمة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {managers && Array.isArray(managers) ? managers.slice(0, 5).map((manager: any) => (
                      <tr key={manager.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{manager.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{manager.governorate || '-'}</td>
                        <td className="px-4 py-3 font-bold text-gray-900">{formatNumber(manager.currentBalance || 0)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatNumber(manager.accumulatedCommission || 0)}</td>
                      </tr>
                    )) : null}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">لا توجد بيانات متاحة</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
