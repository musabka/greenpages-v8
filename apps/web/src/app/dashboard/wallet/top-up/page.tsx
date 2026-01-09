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
  CreditCard,
  Upload,
  Phone,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const topUpMethods = [
  {
    id: 'BANK_TRANSFER',
    name: 'تحويل بنكي',
    description: 'تحويل من حسابك البنكي',
    icon: Building2,
    instructions: [
      'قم بتحويل المبلغ إلى حسابنا البنكي',
      'رقم الحساب: 123-456-789',
      'البنك: بنك سورية الدولي الإسلامي',
      'ارفق صورة إيصال التحويل',
    ],
  },
  {
    id: 'CASH_DEPOSIT',
    name: 'إيداع نقدي',
    description: 'إيداع نقدي في مقر الشركة',
    icon: CreditCard,
    instructions: [
      'توجه إلى أقرب فرع لنا',
      'قدم المبلغ للموظف المختص',
      'احصل على إيصال الإيداع',
      'سيتم إضافة الرصيد فوراً',
    ],
  },
  {
    id: 'MOBILE_WALLET',
    name: 'محفظة إلكترونية',
    description: 'سيريتل كاش أو MTN',
    icon: Phone,
    instructions: [
      'أرسل المبلغ إلى الرقم: 0912345678',
      'ارفق رقم العملية',
      'سيتم إضافة الرصيد خلال ساعة',
    ],
  },
];

export default function TopUpPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [proofImage, setProofImage] = useState('');

  const balanceQuery = useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: async () => (await api.get('/wallet/balance')).data,
  });

  const topUpMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/wallet/top-up', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      router.push('/dashboard/wallet?success=topup');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMethod || !amount || parseInt(amount) < 1000) return;

    topUpMutation.mutate({
      method: selectedMethod,
      amount: parseInt(amount),
      receiptNumber: receiptNumber || undefined,
      proofImage: proofImage || undefined,
      notes: notes || undefined,
    });
  };

  const quickAmounts = [10000, 25000, 50000, 100000, 250000, 500000];

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
            <Wallet className="w-8 h-8 text-green-600" />
            شحن المحفظة
          </h1>
          <p className="text-gray-500 mt-1">
            اشحن رصيدك للاستفادة من خدمات الصفحات الخضراء
          </p>
        </div>

        {/* Current Balance */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-4 mb-6 text-white">
          <p className="text-green-100 text-sm">رصيدك الحالي</p>
          <p className="text-2xl font-bold">
            {balanceQuery.data
              ? new Intl.NumberFormat('ar-SY').format(balanceQuery.data.balance) + ' ل.س'
              : '---'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Method Selection */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              اختر طريقة الشحن
            </h2>
            <div className="grid gap-4">
              {topUpMethods.map((method) => {
                const Icon = method.icon;
                const isSelected = selectedMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setSelectedMethod(method.id)}
                    className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-right ${
                      isSelected
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className={`p-3 rounded-xl ${
                        isSelected ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{method.name}</h3>
                      <p className="text-sm text-gray-500">{method.description}</p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              حدد المبلغ
            </h2>
            
            {/* Quick amounts */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {quickAmounts.map((quickAmount) => (
                <button
                  key={quickAmount}
                  type="button"
                  onClick={() => setAmount(quickAmount.toString())}
                  className={`py-3 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
                    amount === quickAmount.toString()
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  {new Intl.NumberFormat('ar-SY').format(quickAmount)}
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                أو أدخل مبلغ مخصص (ل.س)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1000"
                step="1000"
                placeholder="50000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">الحد الأدنى للشحن: 1,000 ل.س</p>
            </div>
          </div>

          {/* Instructions & Details */}
          {selectedMethod && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                تعليمات الشحن
              </h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <ul className="space-y-2">
                  {topUpMethods
                    .find((m) => m.id === selectedMethod)
                    ?.instructions.map((instruction, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-blue-800">
                        <span className="font-bold">{index + 1}.</span>
                        {instruction}
                      </li>
                    ))}
                </ul>
              </div>

              {/* Receipt Number */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم الإيصال / رقم العملية (اختياري)
                </label>
                <input
                  type="text"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  placeholder="أدخل رقم الإيصال أو رقم العملية"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ملاحظات إضافية (اختياري)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="أي ملاحظات تريد إضافتها"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
          )}

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
              disabled={!selectedMethod || !amount || parseInt(amount) < 1000 || topUpMutation.isPending}
              className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {topUpMutation.isPending ? (
                <>
                  <span className="animate-spin">⏳</span>
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <Wallet className="w-5 h-5" />
                  إرسال طلب الشحن
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {topUpMutation.isError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">فشل في إرسال الطلب</p>
                <p className="text-sm text-red-600">يرجى المحاولة مرة أخرى</p>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
