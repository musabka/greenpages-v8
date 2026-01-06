'use client';

import { useState } from 'react';
import { 
  DollarSign, 
  Wallet, 
  TrendingUp, 
  HandCoins,
  History,
  AlertCircle 
} from 'lucide-react';
import { useAgentBalance, useAgentCollections, useAgentCommissions } from '@/lib/hooks/useFinancial';
import Link from 'next/link';

export default function AgentFinancialPage() {
  const { data: balance, isLoading: balanceLoading } = useAgentBalance();
  const { data: collections } = useAgentCollections({ limit: 5 });
  const { data: commissions } = useAgentCommissions({ limit: 5 });

  if (balanceLoading) {
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
        <h1 className="text-2xl font-bold text-gray-900">الحسابات المالية</h1>
        <p className="text-gray-500">إدارة المقبوضات والمدفوعات</p>
      </div>

      {/* Alert if balance is high */}
      {balance?.currentBalance > 5000000 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-900">تنبيه: رصيد مرتفع</h3>
            <p className="text-sm text-yellow-700 mt-1">
              لديك رصيد مستحق قدره {balance.currentBalance.toLocaleString()} ل.س. يرجى تسليمه للمحاسب في أقرب وقت.
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">الرصيد الحالي</p>
              <p className="text-2xl font-bold text-red-600">
                {balance?.currentBalance.toLocaleString() || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">ليرة سورية</p>
            </div>
            <div className="p-3 rounded-xl bg-red-100">
              <Wallet className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">إجمالي المقبوضات</p>
              <p className="text-2xl font-bold text-blue-600">
                {balance?.totalCollected.toLocaleString() || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">ليرة سورية</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-100">
              <HandCoins className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">إجمالي المسلّم</p>
              <p className="text-2xl font-bold text-green-600">
                {balance?.totalSubmitted.toLocaleString() || 0}
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
              <p className="text-sm text-gray-500 mb-1">إجمالي العمولات</p>
              <p className="text-2xl font-bold text-purple-600">
                {balance?.totalCommissions.toLocaleString() || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">ليرة سورية</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-100">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Collections */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="font-bold text-gray-900">آخر المقبوضات</h2>
            <Link href="/dashboard/financial/collections" className="text-sm text-blue-600 hover:text-blue-700">
              عرض الكل
            </Link>
          </div>
          <div className="p-6">
            {collections?.data?.length === 0 ? (
              <p className="text-center text-gray-500 py-8">لا توجد مقبوضات بعد</p>
            ) : (
              <div className="space-y-4">
                {collections?.data?.map((collection: any) => (
                  <div key={collection.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{collection.business?.nameAr}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(collection.collectedAt).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-blue-600">
                        {collection.amount.toLocaleString()} ل.س
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        collection.status === 'COLLECTED' 
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {collection.status === 'COLLECTED' ? 'معلق' : 'مُسلّم'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Commissions */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="font-bold text-gray-900">آخر العمولات</h2>
            <Link href="/dashboard/financial/commissions" className="text-sm text-blue-600 hover:text-blue-700">
              عرض الكل
            </Link>
          </div>
          <div className="p-6">
            {commissions?.data?.length === 0 ? (
              <p className="text-center text-gray-500 py-8">لا توجد عمولات بعد</p>
            ) : (
              <div className="space-y-4">
                {commissions?.data?.map((commission: any) => (
                  <div key={commission.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {commission.type === 'NEW_SUBSCRIPTION' && 'اشتراك جديد'}
                        {commission.type === 'RENEWAL' && 'تجديد'}
                        {commission.type === 'UPGRADE' && 'ترقية'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {commission.business?.nameAr || 'نشاط تجاري'}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-purple-600">
                        {Number(commission.commissionAmount || 0).toLocaleString('en-US')} ل.س
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        commission.status === 'PENDING' 
                          ? 'bg-yellow-100 text-yellow-700'
                          : commission.status === 'APPROVED'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {commission.status === 'PENDING' ? 'معلقة' : 
                         commission.status === 'APPROVED' ? 'موافق عليها' : 'مدفوعة'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link 
          href="/dashboard/financial/submit-payment"
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-6 hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <DollarSign className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold">تسليم مبلغ للمحاسب</h3>
              <p className="text-sm text-blue-100 mt-1">
                سجّل عملية تسليم الأموال المقبوضة
              </p>
            </div>
          </div>
        </Link>

        <Link 
          href="/dashboard/financial/collections"
          className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl p-6 hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <History className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold">سجل المقبوضات</h3>
              <p className="text-sm text-purple-100 mt-1">
                عرض كافة المبالغ المقبوضة
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
