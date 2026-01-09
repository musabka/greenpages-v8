'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Wallet,
  ArrowUpCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useState } from 'react';

type TransactionType =
  | 'DEPOSIT'
  | 'PAYMENT'
  | 'REFUND'
  | 'COMMISSION'
  | 'BONUS'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'FEE'
  | 'ADJUSTMENT';

type TransactionStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REVERSED';

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description?: string;
  descriptionAr?: string;
  status: TransactionStatus;
  createdAt: string;
}

const transactionTypeLabels: Record<TransactionType, string> = {
  DEPOSIT: 'إيداع',
  PAYMENT: 'دفع',
  REFUND: 'استرداد',
  COMMISSION: 'عمولة',
  BONUS: 'مكافأة',
  TRANSFER_IN: 'تحويل وارد',
  TRANSFER_OUT: 'تحويل صادر',
  FEE: 'رسوم',
  ADJUSTMENT: 'تعديل',
};

const statusLabels: Record<TransactionStatus, string> = {
  PENDING: 'قيد الانتظار',
  COMPLETED: 'مكتمل',
  FAILED: 'فشل',
  CANCELLED: 'ملغى',
  REVERSED: 'مُسترجع',
};

const statusColors: Record<TransactionStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-700',
  REVERSED: 'bg-orange-100 text-orange-700',
};

const typeIcons: Record<string, any> = {
  DEPOSIT: ArrowUpCircle,
  PAYMENT: CreditCard,
  REFUND: TrendingUp,
  COMMISSION: TrendingUp,
  BONUS: TrendingUp,
};

export default function WalletPage() {
  const [filter, setFilter] = useState<TransactionType | 'ALL'>('ALL');

  // Fetch wallet balance
  const walletQuery = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: async () => {
      const response = await api.get('/wallet/balance');
      return response.data;
    },
    staleTime: 30_000,
  });

  // Fetch transactions
  const transactionsQuery = useQuery({
    queryKey: ['wallet-transactions', filter],
    queryFn: async () => {
      const response = await api.get('/wallet/transactions', {
        params: filter !== 'ALL' ? { type: filter } : {},
      });
      // إذا كان الرد يحتوي على data فقط
      if (response.data?.data) return response.data.data;
      return response.data;
    },
    staleTime: 30_000,
  });

  // Fetch top-up requests (pending deposits)
  const topUpRequestsQuery = useQuery({
    queryKey: ['wallet-topup-requests'],
    queryFn: async () => {
      const response = await api.get('/wallet/top-ups');
      return response.data;
    },
    staleTime: 30_000,
  });

  const wallet = walletQuery.data;
  const transactionsData = transactionsQuery.data;
  
  // Handle top-up requests data structure - show only PENDING requests
  let topUpRequests: any[] = [];
  if (Array.isArray(topUpRequestsQuery.data)) {
    topUpRequests = topUpRequestsQuery.data.filter((req: any) => req.status === 'PENDING');
  } else if (topUpRequestsQuery.data?.data && Array.isArray(topUpRequestsQuery.data.data)) {
    topUpRequests = topUpRequestsQuery.data.data.filter((req: any) => req.status === 'PENDING');
  }

  // Debug: Log the actual response to understand the structure
  if (transactionsData && !Array.isArray(transactionsData)) {
    console.log('Transactions API response is not an array:', transactionsData);
  }
  
  const transactions: Transaction[] = Array.isArray(transactionsData) ? transactionsData : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">العودة للوحة التحكم</span>
          </Link>

          <h1 className="text-3xl font-bold text-gray-900">محفظتي</h1>
          <p className="text-gray-500 mt-1">إدارة رصيدك والعمليات المالية</p>
        </div>

        {/* Wallet Balance Card */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-8 shadow-xl text-white mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-green-100 text-sm font-medium mb-2">
                الرصيد المتاح
              </p>
              <p className="text-5xl font-bold">
                {(
                  (wallet?.balance || 0) - (wallet?.frozenBalance || 0)
                ).toLocaleString('ar-SY')}
              </p>
              <p className="text-green-100 text-sm mt-1">ليرة سورية</p>
            </div>
            <div className="p-4 rounded-xl bg-white/20 backdrop-blur">
              <Wallet className="w-10 h-10" />
            </div>
          </div>

          {wallet?.frozenBalance && wallet.frozenBalance > 0 && (
            <div className="mb-6 p-3 bg-white/10 rounded-lg">
              <p className="text-sm text-green-100">
                رصيد مجمد: {wallet.frozenBalance.toLocaleString('ar-SY')} ل.س
              </p>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-green-100 text-xs mb-1">إجمالي الإيداعات</p>
              <p className="text-xl font-bold">
                {(wallet?.totalDeposits || 0).toLocaleString('ar-SY')}
              </p>
            </div>
            <div>
              <p className="text-green-100 text-xs mb-1">إجمالي المصروفات</p>
              <p className="text-xl font-bold">
                {(wallet?.totalSpent || 0).toLocaleString('ar-SY')}
              </p>
            </div>
          </div>

          {/* Action Buttons - بسيطة للجميع */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/dashboard/wallet/top-up"
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-white/20 hover:bg-white/30 transition-all"
            >
              <ArrowUpCircle className="w-6 h-6" />
              <span className="text-sm font-medium">شحن المحفظة</span>
            </Link>

            <Link
              href="/dashboard"
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-white/20 hover:bg-white/30 transition-all"
            >
              <CreditCard className="w-6 h-6" />
              <span className="text-sm font-medium">لوحة التحكم</span>
            </Link>
          </div>
        </div>

        {/* طلبات الشحن المعلقة */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-bold text-yellow-800 mb-4 flex items-center gap-2">
            <ArrowUpCircle className="w-5 h-5 text-yellow-600" />
            طلبات الشحن المعلقة
          </h2>
          {topUpRequestsQuery.isLoading ? (
            <div className="text-center py-6 text-yellow-700">جاري التحميل...</div>
          ) : topUpRequests.length === 0 ? (
            <div className="text-center py-6 text-yellow-700">لا توجد طلبات معلقة حالياً</div>
          ) : (
            <div className="space-y-3">
              {topUpRequests.map((req: any) => (
                <div key={req.id} className="flex items-center gap-4 p-4 border border-yellow-200 rounded-lg bg-white">
                  <ArrowUpCircle className="w-5 h-5 text-yellow-600" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{req.amount.toLocaleString('ar-SY')} ل.س</span>
                      <span className="px-2 py-0.5 text-xs rounded-full font-medium bg-yellow-100 text-yellow-700">{req.status === 'PENDING' ? 'قيد التدقيق' : req.status}</span>
                    </div>
                    <p className="text-xs text-gray-500">طريقة الشحن: {req.method}</p>
                    {req.createdAt && (
                      <p className="text-xs text-gray-400 mt-1">بتاريخ: {new Date(req.createdAt).toLocaleString('ar-SY')}</p>
                    )}
                    {req.notes && (
                      <p className="text-xs text-gray-600 mt-1">ملاحظات: {req.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transactions Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">سجل العمليات</h2>

            {/* Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="ALL">جميع العمليات</option>
              <option value="DEPOSIT">الإيداعات</option>
              <option value="PAYMENT">المدفوعات</option>
              <option value="REFUND">الاستردادات</option>
              <option value="COMMISSION">العمولات</option>
            </select>
          </div>

          {/* Transactions List */}
          {transactionsQuery.isLoading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">جاري التحميل...</p>
            </div>
          ) : transactionsQuery.isError ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
              <p className="text-red-600 mb-2">خطأ في تحميل العمليات</p>
              <button
                onClick={() => transactionsQuery.refetch()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">لا توجد عمليات بعد</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => {
                const IconComponent = typeIcons[tx.type] || CreditCard;
                const isPositive = ['DEPOSIT', 'REFUND', 'COMMISSION', 'BONUS', 'TRANSFER_IN'].includes(tx.type);

                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`p-3 rounded-lg ${
                        isPositive ? 'bg-green-50' : 'bg-red-50'
                      }`}
                    >
                      <IconComponent
                        className={`w-5 h-5 ${
                          isPositive ? 'text-green-600' : 'text-red-600'
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900">
                          {transactionTypeLabels[tx.type]}
                        </p>
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                            statusColors[tx.status]
                          }`}
                        >
                          {statusLabels[tx.status]}
                        </span>
                      </div>

                      {tx.descriptionAr && (
                        <p className="text-sm text-gray-600 truncate">
                          {tx.descriptionAr}
                        </p>
                      )}

                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(tx.createdAt).toLocaleString('ar-SY', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    <div className="text-left">
                      <p
                        className={`text-lg font-bold ${
                          isPositive ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {isPositive ? '+' : '-'}
                        {tx.amount.toLocaleString('ar-SY')}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        الرصيد: {tx.balanceAfter.toLocaleString('ar-SY')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
