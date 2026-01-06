'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Save, DollarSign, Loader2, User } from 'lucide-react';
import { useAgentBalance, useSubmitPayment } from '@/lib/hooks/useFinancial';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function SubmitPaymentPage() {
  const router = useRouter();
  const { data: balance } = useAgentBalance();
  const submitPayment = useSubmitPayment();

  const [amount, setAmount] = useState('');
  const [accountantId, setAccountantId] = useState('');
  const [notes, setNotes] = useState('');

  // جلب قائمة المحاسبين
  const { data: accountants } = useQuery({
    queryKey: ['accountants'],
    queryFn: async () => {
      const response = await api.get('/users?role=ACCOUNTANT');
      return response.data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !accountantId) return;

    try {
      await submitPayment.mutateAsync({
        amount: parseFloat(amount),
        accountantId,
        notes: notes || undefined,
      });
      router.push('/dashboard/financial');
    } catch (error) {
      console.error('Failed to submit payment:', error);
    }
  };

  const canSubmit = amount && parseFloat(amount) > 0 && parseFloat(amount) <= (balance?.currentBalance || 0) && accountantId;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link
            href="/dashboard/financial"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">تسليم مبلغ للمحاسب</h1>
            <p className="text-gray-500 mt-1">سجّل عملية تسليم الأموال المقبوضة</p>
          </div>
        </div>

        {/* Current Balance Card */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-100 mb-1">رصيدك الحالي</p>
              <p className="text-3xl font-bold">
                {balance?.currentBalance.toLocaleString() || 0}
              </p>
              <p className="text-sm text-blue-100 mt-1">ليرة سورية</p>
            </div>
            <div className="p-4 bg-white/20 rounded-xl">
              <DollarSign className="w-10 h-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm">
        <div className="p-6 space-y-6">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              المبلغ المُسلّم *
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="أدخل المبلغ"
                min="0"
                max={balance?.currentBalance || 0}
                step="1000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                ل.س
              </span>
            </div>
            {parseFloat(amount) > (balance?.currentBalance || 0) && (
              <p className="text-sm text-red-600 mt-1">
                المبلغ أكبر من رصيدك الحالي
              </p>
            )}
          </div>

          {/* Accountant */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              المحاسب المستلم *
            </label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={accountantId}
                onChange={(e) => setAccountantId(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                required
              >
                <option value="">اختر المحاسب</option>
                {accountants?.data?.map((accountant: any) => (
                  <option key={accountant.id} value={accountant.id}>
                    {accountant.firstName} {accountant.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ملاحظات (اختياري)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="أي ملاحظات إضافية..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Quick Amount Buttons */}
          {balance && balance.currentBalance > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اختصارات سريعة
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setAmount((balance.currentBalance * 0.25).toString())}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                >
                  25%
                </button>
                <button
                  type="button"
                  onClick={() => setAmount((balance.currentBalance * 0.5).toString())}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => setAmount((balance.currentBalance * 0.75).toString())}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                >
                  75%
                </button>
                <button
                  type="button"
                  onClick={() => setAmount(balance.currentBalance.toString())}
                  className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition-colors"
                >
                  الكل
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t flex gap-3 justify-end">
          <Link
            href="/dashboard/financial"
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            إلغاء
          </Link>
          <button
            type="submit"
            disabled={!canSubmit || submitPayment.isPending}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitPayment.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            تسليم المبلغ
          </button>
        </div>
      </form>
    </div>
  );
}
