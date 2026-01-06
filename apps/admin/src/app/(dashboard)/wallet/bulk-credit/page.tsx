'use client';

import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
  Users,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Wallet,
  MapPin,
} from 'lucide-react';
import Link from 'next/link';

type TargetType = 'ALL' | 'GOVERNORATE' | 'SPECIFIC_USERS';

interface Governorate {
  id: string;
  nameAr: string;
  nameEn: string;
}

export default function BulkCreditPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [targetType, setTargetType] = useState<TargetType>('ALL');
  const [selectedGovernorate, setSelectedGovernorate] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [affectedUsers, setAffectedUsers] = useState(0);

  // جلب المحافظات
  const governoratesQuery = useQuery({
    queryKey: ['governorates'],
    queryFn: async () => {
      const response = await api.get('/governorates');
      return response.data;
    },
  });

  const bulkCreditMutation = useMutation({
    mutationFn: async (data: {
      targetType: TargetType;
      governorateId?: string;
      amount: number;
      description: string;
    }) => {
      const response = await api.post('/admin/wallet/bulk-credit', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallet'] });
      setAffectedUsers(data.affectedUsers || 0);
      setShowSuccess(true);
      setTimeout(() => {
        router.push('/wallet');
      }, 3000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    const data: any = {
      targetType,
      amount: Number(amount),
      description,
    };

    if (targetType === 'GOVERNORATE' && selectedGovernorate) {
      data.governorateId = selectedGovernorate;
    }

    bulkCreditMutation.mutate(data);
  };

  const quickAmounts = [5000, 10000, 25000, 50000, 100000];

  if (showSuccess) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">تم الشحن بنجاح!</h2>
          <p className="text-gray-500 mb-4">
            تم إضافة {Number(amount).toLocaleString('ar-SY')} ل.س لـ {affectedUsers} مستخدم
          </p>
          <p className="text-sm text-gray-400">جارٍ إعادة التوجيه...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
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
          <Users className="w-8 h-8 text-blue-600" />
          شحن جماعي للمحافظ
        </h1>
        <p className="text-gray-500">إضافة رصيد لمجموعة من المستخدمين</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Target Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">اختر المستهدفين</h2>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setTargetType('ALL')}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-right ${
                targetType === 'ALL'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div
                className={`p-3 rounded-xl ${
                  targetType === 'ALL' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Users className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">جميع المستخدمين</h3>
                <p className="text-sm text-gray-500">إضافة الرصيد لجميع المستخدمين في النظام</p>
              </div>
              {targetType === 'ALL' && <CheckCircle2 className="w-6 h-6 text-blue-600" />}
            </button>

            <button
              type="button"
              onClick={() => setTargetType('GOVERNORATE')}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-right ${
                targetType === 'GOVERNORATE'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div
                className={`p-3 rounded-xl ${
                  targetType === 'GOVERNORATE'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <MapPin className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">محافظة معينة</h3>
                <p className="text-sm text-gray-500">إضافة الرصيد لمستخدمي محافظة محددة</p>
              </div>
              {targetType === 'GOVERNORATE' && <CheckCircle2 className="w-6 h-6 text-blue-600" />}
            </button>
          </div>

          {/* Governorate Selection */}
          {targetType === 'GOVERNORATE' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اختر المحافظة
              </label>
              <select
                value={selectedGovernorate}
                onChange={(e) => setSelectedGovernorate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">-- اختر المحافظة --</option>
                {governoratesQuery.data?.data?.map((gov: Governorate) => (
                  <option key={gov.id} value={gov.id}>
                    {gov.nameAr}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Amount */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">المبلغ لكل مستخدم</h2>

          <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-4">
            {quickAmounts.map((quickAmount) => (
              <button
                key={quickAmount}
                type="button"
                onClick={() => setAmount(quickAmount.toString())}
                className={`py-3 rounded-xl border-2 font-medium transition-all ${
                  amount === quickAmount.toString()
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
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
                required
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                ل.س
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">سبب الشحن</h2>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="مثال: مكافأة العيد، حملة ترويجية، هدية للمستخدمين..."
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-700">
            <p className="font-medium mb-1">تنبيه مهم</p>
            <p>
              سيتم إضافة المبلغ المحدد لكل مستخدم من المستخدمين المستهدفين. هذه العملية لا يمكن
              التراجع عنها.
            </p>
          </div>
        </div>

        {/* Summary */}
        {amount && description && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-semibold text-blue-900 mb-2">ملخص العملية</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">المستهدفين:</span>
                <span className="font-medium text-blue-900">
                  {targetType === 'ALL'
                    ? 'جميع المستخدمين'
                    : targetType === 'GOVERNORATE'
                    ? governoratesQuery.data?.data?.find(
                        (g: Governorate) => g.id === selectedGovernorate
                      )?.nameAr || 'محافظة محددة'
                    : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">المبلغ لكل مستخدم:</span>
                <span className="font-bold text-blue-900 text-lg">
                  {Number(amount).toLocaleString('ar-SY')} ل.س
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">السبب:</span>
                <span className="font-medium text-blue-900">{description}</span>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {bulkCreditMutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">حدث خطأ</p>
              <p className="text-sm text-red-600">
                {(bulkCreditMutation.error as any)?.response?.data?.message ||
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
              !amount ||
              !description ||
              Number(amount) <= 0 ||
              (targetType === 'GOVERNORATE' && !selectedGovernorate) ||
              bulkCreditMutation.isPending
            }
            className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {bulkCreditMutation.isPending ? (
              <>
                <span className="animate-spin">⏳</span>
                جارٍ الشحن...
              </>
            ) : (
              <>
                <Wallet className="w-5 h-5" />
                تنفيذ الشحن الجماعي
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
