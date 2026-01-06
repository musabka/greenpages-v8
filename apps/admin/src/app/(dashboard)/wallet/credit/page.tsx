'use client';

import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
  CreditCard,
  Search,
  User,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';

interface UserResult {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  wallet?: {
    id: string;
    balance: string;
  };
}

export default function AdminCreditWalletPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // البحث عن المستخدمين
  const usersQuery = useQuery({
    queryKey: ['admin', 'users', 'search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return { data: [] };
      const response = await api.get('/admin/users', {
        params: { search: searchQuery, limit: 10 },
      });
      return response.data;
    },
    enabled: searchQuery.length >= 2,
  });

  const creditMutation = useMutation({
    mutationFn: async (data: { userId: string; amount: number; description: string }) => {
      const response = await api.post('/admin/wallet/credit', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallet'] });
      setShowSuccess(true);
      setTimeout(() => {
        router.push('/wallet/users');
      }, 2000);
    },
  });

  const handleSelectUser = (user: UserResult) => {
    setSelectedUser(user);
    setSearchQuery('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !amount || !description) return;
    
    creditMutation.mutate({
      userId: selectedUser.id,
      amount: Number(amount),
      description,
    });
  };

  const quickAmounts = [10000, 25000, 50000, 100000, 250000, 500000];

  if (showSuccess) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">تم شحن الرصيد بنجاح!</h2>
          <p className="text-gray-500 mb-4">
            تم إضافة {Number(amount).toLocaleString('ar-SY')} ل.س لرصيد {selectedUser?.name}
          </p>
          <p className="text-sm text-gray-400">جارٍ إعادة التوجيه...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/wallet"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowRight className="w-4 h-4" />
          العودة للمحفظة
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-green-600" />
          شحن محفظة مستخدم
        </h1>
        <p className="text-gray-500">إضافة رصيد لمحفظة مستخدم بشكل يدوي</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* User Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">اختر المستخدم</h2>

          {selectedUser ? (
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-green-600 text-white">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{selectedUser.name}</p>
                  <p className="text-sm text-gray-500">{selectedUser.phone || selectedUser.email}</p>
                </div>
              </div>
              <div className="text-left">
                <p className="text-sm text-gray-500">الرصيد الحالي</p>
                <p className="font-bold text-blue-600">
                  {selectedUser.wallet
                    ? Number(selectedUser.wallet.balance).toLocaleString('ar-SY')
                    : 0}{' '}
                  ل.س
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                تغيير
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث بالاسم أو رقم الهاتف أو البريد الإلكتروني..."
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Search Results */}
              {usersQuery.isLoading && searchQuery.length >= 2 && (
                <div className="text-center py-4 text-gray-500">جارٍ البحث...</div>
              )}

              {usersQuery.data?.data?.length > 0 && (
                <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 max-h-64 overflow-y-auto">
                  {usersQuery.data.data.map((user: UserResult) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelectUser(user)}
                      className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-right"
                    >
                      <div className="p-2 rounded-lg bg-gray-100">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">
                          {user.phone || user.email}
                        </p>
                      </div>
                      {user.wallet && (
                        <span className="text-sm text-blue-600">
                          {Number(user.wallet.balance).toLocaleString('ar-SY')} ل.س
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {searchQuery.length >= 2 && usersQuery.data?.data?.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  لم يتم العثور على مستخدمين
                </div>
              )}
            </div>
          )}
        </div>

        {/* Amount */}
        {selectedUser && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">المبلغ</h2>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {quickAmounts.map((quickAmount) => (
                <button
                  key={quickAmount}
                  type="button"
                  onClick={() => setAmount(quickAmount.toString())}
                  className={`py-3 rounded-xl border-2 font-medium transition-all ${
                    amount === quickAmount.toString()
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  {quickAmount.toLocaleString('ar-SY')}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                أو أدخل مبلغاً مخصصاً
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-bold"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  ل.س
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        {selectedUser && amount && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">سبب الشحن</h2>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="أدخل سبب شحن الرصيد (مثال: مكافأة، تعويض، شحن يدوي...)"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}

        {/* Summary */}
        {selectedUser && amount && description && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <h3 className="font-semibold text-green-900 mb-2">ملخص العملية</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">المستخدم:</span>
                <span className="font-medium text-green-900">{selectedUser.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">الرصيد الحالي:</span>
                <span className="font-medium text-green-900">
                  {selectedUser.wallet
                    ? Number(selectedUser.wallet.balance).toLocaleString('ar-SY')
                    : 0}{' '}
                  ل.س
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">المبلغ المضاف:</span>
                <span className="font-bold text-green-700">
                  +{Number(amount).toLocaleString('ar-SY')} ل.س
                </span>
              </div>
              <div className="flex justify-between border-t border-green-200 pt-2">
                <span className="text-green-700">الرصيد الجديد:</span>
                <span className="font-bold text-green-900 text-lg">
                  {(
                    Number(selectedUser.wallet?.balance || 0) + Number(amount)
                  ).toLocaleString('ar-SY')}{' '}
                  ل.س
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {creditMutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">حدث خطأ</p>
              <p className="text-sm text-red-600">
                {(creditMutation.error as any)?.response?.data?.message ||
                  'يرجى المحاولة مرة أخرى'}
              </p>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-4">
          <Link
            href="/wallet"
            className="flex-1 py-3 px-4 bg-white border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 text-center"
          >
            إلغاء
          </Link>
          <button
            type="submit"
            disabled={
              !selectedUser ||
              !amount ||
              !description ||
              Number(amount) <= 0 ||
              creditMutation.isPending
            }
            className="flex-1 py-3 px-4 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {creditMutation.isPending ? (
              <>
                <span className="animate-spin">⏳</span>
                جارٍ الشحن...
              </>
            ) : (
              <>
                <Wallet className="w-5 h-5" />
                شحن الرصيد
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
