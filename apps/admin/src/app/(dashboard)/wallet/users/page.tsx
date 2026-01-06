'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Users,
  Search,
  Wallet,
  Eye,
  CreditCard,
  Filter,
  User,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Lock,
  Unlock,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

type WalletStatus = 'ACTIVE' | 'FROZEN' | 'SUSPENDED' | 'CLOSED';

interface UserWallet {
  id: string;
  userId: string;
  balance: string;
  frozenBalance: string;
  totalDeposits: string;
  totalWithdrawals: string;
  totalSpent: string;
  currency: string;
  status: WalletStatus;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
  };
}

const statusLabels: Record<WalletStatus, { label: string; color: string }> = {
  ACTIVE: { label: 'نشطة', color: 'green' },
  FROZEN: { label: 'مجمدة', color: 'blue' },
  SUSPENDED: { label: 'موقوفة', color: 'yellow' },
  CLOSED: { label: 'مغلقة', color: 'red' },
};

const roleLabels: Record<string, string> = {
  ADMIN: 'مدير النظام',
  SUPERVISOR: 'مشرف',
  GOVERNORATE_MANAGER: 'مدير محافظة',
  AGENT: 'مندوب',
  USER: 'مستخدم',
};

export default function AdminWalletUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<WalletStatus | ''>('');
  const [page, setPage] = useState(1);
  const [selectedWallet, setSelectedWallet] = useState<UserWallet | null>(null);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditDescription, setCreditDescription] = useState('');

  const walletsQuery = useQuery({
    queryKey: ['admin', 'wallet', 'users', statusFilter, search, page],
    queryFn: async () => {
      const params: any = { limit: 20, page };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const response = await api.get('/admin/wallet/wallets', { params });
      return response.data;
    },
  });

  const creditMutation = useMutation({
    mutationFn: async (data: { userId: string; amount: number; description: string }) => {
      const response = await api.post('/admin/wallet/credit', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallet'] });
      setShowCreditModal(false);
      setSelectedWallet(null);
      setCreditAmount('');
      setCreditDescription('');
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ walletId, status }: { walletId: string; status: WalletStatus }) => {
      const response = await api.patch(`/admin/wallet/wallets/${walletId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallet'] });
    },
  });

  const handleCredit = (wallet: UserWallet) => {
    setSelectedWallet(wallet);
    setCreditAmount('');
    setCreditDescription('');
    setShowCreditModal(true);
  };

  const confirmCredit = () => {
    if (!selectedWallet || !creditAmount || !creditDescription) return;
    
    creditMutation.mutate({
      userId: selectedWallet.userId,
      amount: Number(creditAmount),
      description: creditDescription,
    });
  };

  const toggleWalletStatus = (wallet: UserWallet) => {
    const newStatus: WalletStatus = wallet.status === 'ACTIVE' ? 'FROZEN' : 'ACTIVE';
    statusMutation.mutate({ walletId: wallet.id, status: newStatus });
  };

  const wallets = walletsQuery.data?.data || [];
  const pagination = walletsQuery.data?.pagination || { total: 0, pages: 1 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            محافظ المستخدمين
          </h1>
          <p className="text-gray-500">عرض وإدارة جميع محافظ المستخدمين</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="بحث بالاسم أو البريد أو الهاتف..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as WalletStatus | '');
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">جميع الحالات</option>
              <option value="ACTIVE">نشطة</option>
              <option value="FROZEN">مجمدة</option>
              <option value="SUSPENDED">موقوفة</option>
              <option value="CLOSED">مغلقة</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">المستخدم</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">الدور</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">الرصيد</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">مجمد</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">الإيداعات</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">المصروفات</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">الحالة</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {wallets.map((wallet: UserWallet) => {
                const status = statusLabels[wallet.status];
                return (
                  <tr key={wallet.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gray-100">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {wallet.user?.name || '-'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {wallet.user?.phone || wallet.user?.email || '-'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {roleLabels[wallet.user?.role] || wallet.user?.role}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-blue-600">
                        {Number(wallet.balance).toLocaleString('ar-SY')} ل.س
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {Number(wallet.frozenBalance) > 0 ? (
                        <span className="text-orange-600">
                          {Number(wallet.frozenBalance).toLocaleString('ar-SY')} ل.س
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-green-600">
                        {Number(wallet.totalDeposits).toLocaleString('ar-SY')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-600">
                        {Number(wallet.totalSpent).toLocaleString('ar-SY')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${status.color}-100 text-${status.color}-700`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleCredit(wallet)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="شحن الرصيد"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleWalletStatus(wallet)}
                          className={`p-2 rounded-lg transition-colors ${
                            wallet.status === 'ACTIVE'
                              ? 'text-orange-600 hover:bg-orange-50'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={wallet.status === 'ACTIVE' ? 'تجميد المحفظة' : 'تفعيل المحفظة'}
                        >
                          {wallet.status === 'ACTIVE' ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            <Unlock className="w-4 h-4" />
                          )}
                        </button>
                        <Link
                          href={`/wallet/users/${wallet.userId}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {wallets.length === 0 && (
          <div className="p-12 text-center">
            <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">لا توجد محافظ</h3>
            <p className="text-gray-500">لم يتم العثور على محافظ تطابق معايير البحث</p>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              عرض {(page - 1) * 20 + 1} - {Math.min(page * 20, pagination.total)} من {pagination.total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-sm">
                {page} / {pagination.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Credit Modal */}
      {showCreditModal && selectedWallet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-green-600" />
              شحن رصيد المحفظة
            </h3>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500">المستخدم:</span>
                <span className="font-medium">{selectedWallet.user?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">الرصيد الحالي:</span>
                <span className="font-bold text-blue-600">
                  {Number(selectedWallet.balance).toLocaleString('ar-SY')} ل.س
                </span>
              </div>
            </div>

            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المبلغ (ل.س) *
                </label>
                <input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="أدخل المبلغ"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  سبب الشحن *
                </label>
                <textarea
                  value={creditDescription}
                  onChange={(e) => setCreditDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="مثال: مكافأة، تعويض، شحن يدوي..."
                />
              </div>
            </div>

            {creditAmount && creditDescription && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-green-700">
                  سيتم إضافة{' '}
                  <span className="font-bold">{Number(creditAmount).toLocaleString('ar-SY')} ل.س</span>{' '}
                  لرصيد المستخدم
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowCreditModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                إلغاء
              </button>
              <button
                onClick={confirmCredit}
                disabled={
                  creditMutation.isPending ||
                  !creditAmount ||
                  !creditDescription ||
                  Number(creditAmount) <= 0
                }
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {creditMutation.isPending ? 'جارٍ الشحن...' : 'شحن الرصيد'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
