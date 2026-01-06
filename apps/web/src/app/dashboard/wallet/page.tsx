'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  CreditCard,
  History,
  Plus,
  Minus,
  RefreshCw,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Building2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface WalletBalance {
  balance: number;
  frozenBalance: number;
  availableBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalSpent: number;
  currency: string;
  status: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  descriptionAr: string;
  status: string;
  createdAt: string;
}

interface TopUpRequest {
  id: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ar-SY', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' ل.س';
};

const getStatusBadge = (status: string) => {
  const statusConfig: Record<string, { color: string; icon: React.ReactNode; text: string }> = {
    PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-3 h-3" />, text: 'قيد الانتظار' },
    APPROVED: { color: 'bg-blue-100 text-blue-800', icon: <CheckCircle2 className="w-3 h-3" />, text: 'موافق عليها' },
    COMPLETED: { color: 'bg-green-100 text-green-800', icon: <CheckCircle2 className="w-3 h-3" />, text: 'مكتملة' },
    REJECTED: { color: 'bg-red-100 text-red-800', icon: <XCircle className="w-3 h-3" />, text: 'مرفوضة' },
    CANCELLED: { color: 'bg-gray-100 text-gray-800', icon: <XCircle className="w-3 h-3" />, text: 'ملغاة' },
    PROCESSING: { color: 'bg-purple-100 text-purple-800', icon: <RefreshCw className="w-3 h-3 animate-spin" />, text: 'جاري التنفيذ' },
  };

  const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: null, text: status };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.icon}
      {config.text}
    </span>
  );
};

const getTransactionTypeInfo = (type: string) => {
  const types: Record<string, { icon: React.ReactNode; color: string; text: string }> = {
    DEPOSIT: { icon: <ArrowDownCircle className="w-5 h-5" />, color: 'text-green-600 bg-green-100', text: 'إيداع' },
    WITHDRAWAL: { icon: <ArrowUpCircle className="w-5 h-5" />, color: 'text-red-600 bg-red-100', text: 'سحب' },
    PAYMENT: { icon: <CreditCard className="w-5 h-5" />, color: 'text-blue-600 bg-blue-100', text: 'دفع' },
    REFUND: { icon: <RefreshCw className="w-5 h-5" />, color: 'text-purple-600 bg-purple-100', text: 'استرداد' },
    COMMISSION: { icon: <Plus className="w-5 h-5" />, color: 'text-emerald-600 bg-emerald-100', text: 'عمولة' },
    BONUS: { icon: <Plus className="w-5 h-5" />, color: 'text-yellow-600 bg-yellow-100', text: 'مكافأة' },
    ADJUSTMENT: { icon: <RefreshCw className="w-5 h-5" />, color: 'text-gray-600 bg-gray-100', text: 'تعديل' },
  };

  return types[type] || { icon: <History className="w-5 h-5" />, color: 'text-gray-600 bg-gray-100', text: type };
};

export default function WalletPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'transactions' | 'topups' | 'withdrawals'>('transactions');

  // جلب رصيد المحفظة
  const balanceQuery = useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: async () => (await api.get('/wallet/balance')).data as WalletBalance,
  });

  // جلب المعاملات
  const transactionsQuery = useQuery({
    queryKey: ['wallet', 'transactions'],
    queryFn: async () => {
      const response = await api.get('/wallet/transactions');
      return response.data as { data: Transaction[]; meta: any };
    },
  });

  // جلب طلبات الشحن
  const topUpsQuery = useQuery({
    queryKey: ['wallet', 'top-ups'],
    queryFn: async () => (await api.get('/wallet/top-ups')).data as TopUpRequest[],
  });

  // جلب طلبات السحب
  const withdrawalsQuery = useQuery({
    queryKey: ['wallet', 'withdrawals'],
    queryFn: async () => (await api.get('/wallet/withdrawals')).data as WithdrawalRequest[],
  });

  const balance = balanceQuery.data;
  const transactions = transactionsQuery.data?.data || [];
  const topUps = topUpsQuery.data || [];
  const withdrawals = withdrawalsQuery.data || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Wallet className="w-8 h-8 text-primary-600" />
              محفظتي
            </h1>
            <p className="text-gray-500 mt-1">إدارة رصيدك ومعاملاتك المالية</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dashboard/wallet/top-up"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">شحن المحفظة</span>
            </Link>
            <Link
              href="/dashboard/wallet/withdraw"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Minus className="w-4 h-4" />
              <span className="text-sm font-medium">سحب</span>
            </Link>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* الرصيد الحالي */}
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <span className="text-primary-100 text-sm font-medium">الرصيد المتاح</span>
              <Wallet className="w-8 h-8 text-primary-200" />
            </div>
            <p className="text-4xl font-bold mb-1">
              {balance ? formatCurrency(balance.availableBalance) : '---'}
            </p>
            {balance && balance.frozenBalance > 0 && (
              <p className="text-primary-200 text-sm">
                مجمد: {formatCurrency(balance.frozenBalance)}
              </p>
            )}
          </div>

          {/* إجمالي الإيداعات */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-500 text-sm font-medium">إجمالي الإيداعات</span>
              <div className="p-2 rounded-lg bg-green-100">
                <ArrowDownCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {balance ? formatCurrency(balance.totalDeposits) : '---'}
            </p>
          </div>

          {/* إجمالي المصروفات */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-500 text-sm font-medium">إجمالي المصروفات</span>
              <div className="p-2 rounded-lg bg-red-100">
                <ArrowUpCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {balance ? formatCurrency(balance.totalSpent + balance.totalWithdrawals) : '---'}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">إجراءات سريعة</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/dashboard/wallet/pay"
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <div className="p-3 rounded-full bg-primary-100">
                <CreditCard className="w-6 h-6 text-primary-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">دفع اشتراك</span>
            </Link>
            <Link
              href="/dashboard/wallet/top-up"
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors"
            >
              <div className="p-3 rounded-full bg-green-100">
                <Plus className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">شحن المحفظة</span>
            </Link>
            <Link
              href="/dashboard/wallet/withdraw"
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors"
            >
              <div className="p-3 rounded-full bg-orange-100">
                <Minus className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">سحب رصيد</span>
            </Link>
            <Link
              href="/dashboard/my-businesses"
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="p-3 rounded-full bg-blue-100">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">أنشطتي التجارية</span>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('transactions')}
                className={`flex-1 py-4 px-6 text-center text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'transactions'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <History className="w-4 h-4 inline-block ml-2" />
                سجل المعاملات
              </button>
              <button
                onClick={() => setActiveTab('topups')}
                className={`flex-1 py-4 px-6 text-center text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'topups'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <ArrowDownCircle className="w-4 h-4 inline-block ml-2" />
                طلبات الشحن
                {topUps.filter(t => t.status === 'PENDING').length > 0 && (
                  <span className="mr-2 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs">
                    {topUps.filter(t => t.status === 'PENDING').length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('withdrawals')}
                className={`flex-1 py-4 px-6 text-center text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'withdrawals'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <ArrowUpCircle className="w-4 h-4 inline-block ml-2" />
                طلبات السحب
                {withdrawals.filter(w => w.status === 'PENDING').length > 0 && (
                  <span className="mr-2 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs">
                    {withdrawals.filter(w => w.status === 'PENDING').length}
                  </span>
                )}
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
              <div className="space-y-4">
                {transactionsQuery.isLoading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
                    <p className="text-gray-500">جاري التحميل...</p>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">لا توجد معاملات بعد</p>
                  </div>
                ) : (
                  transactions.map((transaction) => {
                    const typeInfo = getTransactionTypeInfo(transaction.type);
                    return (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2.5 rounded-xl ${typeInfo.color}`}>
                            {typeInfo.icon}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {transaction.descriptionAr || transaction.description || typeInfo.text}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDistanceToNow(new Date(transaction.createdAt), {
                                addSuffix: true,
                                locale: ar,
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p
                            className={`font-bold ${
                              transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {transaction.amount >= 0 ? '+' : ''}
                            {formatCurrency(transaction.amount)}
                          </p>
                          <p className="text-xs text-gray-400">
                            الرصيد: {formatCurrency(transaction.balanceAfter)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Top-ups Tab */}
            {activeTab === 'topups' && (
              <div className="space-y-4">
                {topUpsQuery.isLoading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
                    <p className="text-gray-500">جاري التحميل...</p>
                  </div>
                ) : topUps.length === 0 ? (
                  <div className="text-center py-12">
                    <ArrowDownCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">لا توجد طلبات شحن</p>
                    <Link
                      href="/dashboard/wallet/top-up"
                      className="inline-block mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      شحن المحفظة الآن
                    </Link>
                  </div>
                ) : (
                  topUps.map((topUp) => (
                    <div
                      key={topUp.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-green-100">
                          <ArrowDownCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            طلب شحن - {topUp.method}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(topUp.createdAt), {
                              addSuffix: true,
                              locale: ar,
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-bold text-green-600">
                          +{formatCurrency(topUp.amount)}
                        </p>
                        {getStatusBadge(topUp.status)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Withdrawals Tab */}
            {activeTab === 'withdrawals' && (
              <div className="space-y-4">
                {withdrawalsQuery.isLoading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
                    <p className="text-gray-500">جاري التحميل...</p>
                  </div>
                ) : withdrawals.length === 0 ? (
                  <div className="text-center py-12">
                    <ArrowUpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">لا توجد طلبات سحب</p>
                    <Link
                      href="/dashboard/wallet/withdraw"
                      className="inline-block mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      طلب سحب الآن
                    </Link>
                  </div>
                ) : (
                  withdrawals.map((withdrawal) => (
                    <div
                      key={withdrawal.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-orange-100">
                          <ArrowUpCircle className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            طلب سحب - {withdrawal.method}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(withdrawal.createdAt), {
                              addSuffix: true,
                              locale: ar,
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-bold text-red-600">
                          -{formatCurrency(withdrawal.amount)}
                        </p>
                        {getStatusBadge(withdrawal.status)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
