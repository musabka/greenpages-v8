'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  ArrowRight,
  Wallet,
  Building2,
  Banknote,
  Phone,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowUpCircle,
} from 'lucide-react';

const withdrawMethods = [
  {
    id: 'BANK_TRANSFER',
    name: 'تحويل بنكي',
    description: 'تحويل إلى حسابك البنكي',
    icon: Building2,
    fields: ['bankName', 'accountNumber', 'accountHolderName'],
  },
  {
    id: 'CASH',
    name: 'نقدي',
    description: 'استلام نقدي من مقر الشركة',
    icon: Banknote,
    fields: [],
  },
  {
    id: 'MOBILE_WALLET',
    name: 'محفظة إلكترونية',
    description: 'سيريتل كاش أو MTN',
    icon: Phone,
    fields: ['mobileWalletNumber'],
  },
  {
    id: 'CHECK',
    name: 'شيك',
    description: 'استلام شيك مصرفي',
    icon: FileText,
    fields: ['accountHolderName'],
  },
];

export default function WithdrawPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [mobileWalletNumber, setMobileWalletNumber] = useState('');
  const [notes, setNotes] = useState('');

  const balanceQuery = useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: async () => (await api.get('/wallet/balance')).data,
  });

  const withdrawMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/wallet/withdraw', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      router.push('/dashboard/wallet?success=withdrawal');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMethod || !amount || parseInt(amount) < 5000) return;

    const availableBalance = balanceQuery.data?.availableBalance || 0;
    if (parseInt(amount) > availableBalance) {
      alert('الرصيد المتاح غير كافٍ');
      return;
    }

    withdrawMutation.mutate({
      method: selectedMethod,
      amount: parseInt(amount),
      bankName: bankName || undefined,
      accountNumber: accountNumber || undefined,
      accountHolderName: accountHolderName || undefined,
      mobileWalletNumber: mobileWalletNumber || undefined,
      notes: notes || undefined,
    });
  };

  const selectedMethodConfig = withdrawMethods.find((m) => m.id === selectedMethod);
  const availableBalance = balanceQuery.data?.availableBalance || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/wallet"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowRight className="w-4 h-4" />
            العودة للمحفظة
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ArrowUpCircle className="w-8 h-8 text-orange-600" />
            سحب من المحفظة
          </h1>
          <p className="text-gray-500 mt-1">اختر طريقة السحب والمبلغ المراد سحبه</p>
        </div>

        {/* Current Balance */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 mb-6 text-white">
          <p className="text-orange-100 text-sm">الرصيد المتاح للسحب</p>
          <p className="text-2xl font-bold">
            {new Intl.NumberFormat('ar-SY').format(availableBalance)} ل.س
          </p>
          {balanceQuery.data?.frozenBalance > 0 && (
            <p className="text-orange-200 text-sm mt-1">
              رصيد مجمد: {new Intl.NumberFormat('ar-SY').format(balanceQuery.data.frozenBalance)} ل.س
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Method Selection */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">اختر طريقة السحب</h2>
            <div className="grid gap-4">
              {withdrawMethods.map((method) => {
                const Icon = method.icon;
                const isSelected = selectedMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setSelectedMethod(method.id)}
                    className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-right ${
                      isSelected
                        ? 'border-orange-600 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className={`p-3 rounded-xl ${
                        isSelected ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{method.name}</h3>
                      <p className="text-sm text-gray-500">{method.description}</p>
                    </div>
                    {isSelected && <CheckCircle2 className="w-6 h-6 text-orange-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">حدد المبلغ</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المبلغ المراد سحبه (ل.س)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="5000"
                max={availableBalance}
                step="1000"
                placeholder="100000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-gray-500">الحد الأدنى للسحب: 5,000 ل.س</p>
                <button
                  type="button"
                  onClick={() => setAmount(availableBalance.toString())}
                  className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                >
                  سحب كامل الرصيد
                </button>
              </div>
            </div>
          </div>

          {/* Method-specific fields */}
          {selectedMethod && selectedMethodConfig && selectedMethodConfig.fields.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">بيانات الحساب</h2>
              <div className="space-y-4">
                {selectedMethodConfig.fields.includes('bankName') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      اسم البنك
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="مثال: بنك سورية الدولي الإسلامي"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      required
                    />
                  </div>
                )}

                {selectedMethodConfig.fields.includes('accountNumber') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      رقم الحساب / IBAN
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="أدخل رقم الحساب البنكي"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      required
                    />
                  </div>
                )}

                {selectedMethodConfig.fields.includes('accountHolderName') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      اسم صاحب الحساب
                    </label>
                    <input
                      type="text"
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      placeholder="الاسم الكامل كما هو مسجل في البنك"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      required
                    />
                  </div>
                )}

                {selectedMethodConfig.fields.includes('mobileWalletNumber') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      رقم المحفظة الإلكترونية
                    </label>
                    <input
                      type="tel"
                      value={mobileWalletNumber}
                      onChange={(e) => setMobileWalletNumber(e.target.value)}
                      placeholder="09XXXXXXXX"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      required
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ملاحظات إضافية (اختياري)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="أي ملاحظات تريد إضافتها"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">ملاحظة هامة</p>
              <p className="text-sm text-yellow-700">
                سيتم تجميد المبلغ المطلوب سحبه حتى تتم معالجة الطلب. قد يستغرق
                التنفيذ من 1-3 أيام عمل.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-3 px-4 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={
                !selectedMethod ||
                !amount ||
                parseInt(amount) < 5000 ||
                parseInt(amount) > availableBalance ||
                withdrawMutation.isPending
              }
              className="flex-1 py-3 px-4 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {withdrawMutation.isPending ? (
                <>
                  <span className="animate-spin">⏳</span>
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <ArrowUpCircle className="w-5 h-5" />
                  إرسال طلب السحب
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {withdrawMutation.isError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">فشل في إرسال الطلب</p>
                <p className="text-sm text-red-600">
                  {(withdrawMutation.error as any)?.response?.data?.message ||
                    'يرجى المحاولة مرة أخرى'}
                </p>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
