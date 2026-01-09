'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import {
  Package,
  Calendar,
  ArrowRight,
  Wallet,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useState } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function RenewPackagePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const businessId = params.businessId as string;
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [renewDetails, setRenewDetails] = useState<any>(null);

  // جلب معلومات النشاط والباقة الحالية
  const businessQuery = useQuery({
    queryKey: ['business-package', businessId],
    queryFn: async () => {
      const response = await api.get(`/user/dashboard/business/${businessId}/subscription`);
      return response.data;
    },
  });

  // جلب رصيد المحفظة
  const walletQuery = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: async () => {
      const response = await api.get('/wallet/balance');
      return response.data;
    },
  });

  // تجديد الباقة
  const renewMutation = useMutation({
    mutationFn: async (data: { businessId: string; packageId: string; durationDays?: number }) => {
      const response = await api.post('/wallet/pay', data);
      return response.data;
    },
    onSuccess: (data) => {
      setRenewDetails(data);
      setShowSuccessModal(true);
      // Refresh queries
      businessQuery.refetch();
      walletQuery.refetch();

      // Ensure accounting pages pick up the new invoice/journal entry
      // Accounting UI is managed in apps/accountant, not in user dashboard
    },
  });

  if (businessQuery.isLoading || walletQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!businessQuery.data || !businessQuery.data.currentPackage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
            خطأ
          </h2>
          <p className="text-gray-600 text-center mb-4">
            لا يمكن العثور على معلومات الباقة
          </p>
          <Link
            href="/dashboard"
            className="w-full block text-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            العودة للوحة التحكم
          </Link>
        </div>
      </div>
    );
  }

  const packageInfo = businessQuery.data.currentPackage;
  const wallet = walletQuery.data;
  const price = Number(packageInfo.price);
  const baseDuration = Number(packageInfo.durationDays);
  const duration = selectedDuration || baseDuration;
  const totalCost = baseDuration > 0 ? (price * (duration / baseDuration)) : price;
  const hasEnoughBalance = wallet && Number(wallet.balance) >= totalCost;

  const handleRenew = () => {
    if (!hasEnoughBalance) {
      alert('رصيدك غير كافي. يرجى شحن المحفظة أولاً.');
      return;
    }

    renewMutation.mutate({
      businessId,
      packageId: packageInfo.packageId,
      durationDays: duration,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للوحة التحكم</span>
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            تجديد الباقة
          </h1>
          <p className="text-gray-600">
            قم بتجديد باقة {businessQuery.data.business?.nameAr}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* معلومات الباقة */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Package Info */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                معلومات الباقة الحالية
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">اسم الباقة</span>
                  <span className="font-medium text-gray-900">
                    {packageInfo.packageName}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">تاريخ الانتهاء الحالي</span>
                  <span className="font-medium text-gray-900">
                    {format(new Date(businessQuery.data.packageExpiresAt), 'dd MMMM yyyy', { locale: ar })}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">الأيام المتبقية</span>
                  <span className={`font-bold ${
                    businessQuery.data.daysRemaining <= 7
                      ? 'text-red-600'
                      : businessQuery.data.daysRemaining <= 30
                      ? 'text-orange-600'
                      : 'text-green-600'
                  }`}>
                    {businessQuery.data.daysRemaining} يوم
                  </span>
                </div>
              </div>
            </div>

            {/* Renewal Details */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                تفاصيل التجديد
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    مدة التجديد
                  </label>
                  <select
                    value={selectedDuration || packageInfo.durationDays}
                    onChange={(e) => setSelectedDuration(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value={packageInfo.durationDays}>
                      {packageInfo.durationDays} يوم (المدة الافتراضية)
                    </option>
                    <option value={packageInfo.durationDays * 2}>
                      {packageInfo.durationDays * 2} يوم
                    </option>
                    <option value={packageInfo.durationDays * 3}>
                      {packageInfo.durationDays * 3} يوم
                    </option>
                  </select>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">سعر الباقة</span>
                    <span className="font-medium text-gray-900">
                      {price.toLocaleString('ar-EG')} جنيه
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span className="text-gray-900">الإجمالي</span>
                    <span className="text-green-600">
                      {totalCost.toLocaleString('ar-EG')} جنيه
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Wallet & Action */}
          <div className="space-y-6">
            {/* Wallet Balance */}
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-5 h-5" />
                <span className="text-sm font-medium">رصيد المحفظة</span>
              </div>
              <p className="text-3xl font-bold mb-2">
                {Number(wallet?.balance || 0).toLocaleString('ar-EG')}
                <span className="text-lg mr-2">جنيه</span>
              </p>
              {!hasEnoughBalance && (
                <Link
                  href="/dashboard/wallet/top-up"
                  className="mt-3 block text-center px-4 py-2 bg-white text-green-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  شحن المحفظة
                </Link>
              )}
            </div>

            {/* Action Button */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              {hasEnoughBalance ? (
                <button
                  onClick={handleRenew}
                  disabled={renewMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {renewMutation.isPending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>جاري التجديد...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5" />
                      <span>تأكيد التجديد</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-900 text-sm mb-1">
                        رصيد غير كافي
                      </p>
                      <p className="text-red-700 text-xs">
                        يجب شحن المحفظة بمبلغ {(totalCost - Number(wallet?.balance || 0)).toLocaleString('ar-EG')} جنيه على الأقل
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">معلومات مهمة:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• سيتم تمديد الباقة الحالية</li>
                    <li>• الدفع من رصيد المحفظة</li>
                    <li>• مرتبط بنظام المحاسبة</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && renewDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 relative animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => {
                setShowSuccessModal(false);
                router.push('/dashboard');
              }}
              className="absolute top-4 left-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                🎉 مبارك! تم التجديد بنجاح
              </h2>

              <p className="text-gray-600 mb-6">
                تم تجديد باقتك بنجاح! الآن يمكنك الاستمرار في الاستمتاع بجميع مزايا باقتك.
              </p>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 mb-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-900 font-medium">المبلغ المدفوع</span>
                    <span className="text-xl font-bold text-green-600">
                      {totalCost.toLocaleString('ar-EG')} جنيه
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">الرصيد المتبقي</span>
                    <span className="text-sm font-semibold text-gray-700">
                      {renewDetails.transaction?.balanceAfter?.toLocaleString('ar-EG')} جنيه
                    </span>
                  </div>
                  {renewDetails.subscription?.endDate && (
                    <div className="flex justify-between items-center pt-3 border-t border-green-200">
                      <span className="text-sm text-gray-600">صالحة حتى</span>
                      <span className="text-sm font-semibold text-gray-700">
                        {format(new Date(renewDetails.subscription.endDate), 'dd MMMM yyyy', { locale: ar })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-medium"
                >
                  العودة للوحة التحكم
                </button>
                
                {/* رابط الفاتورة */}
                {renewDetails.accounting?.invoiceId && (
                  <Link
                    href="/dashboard/invoices"
                    className="w-full block text-center px-6 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium border border-blue-200"
                  >
                    📄 عرض الفاتورة
                  </Link>
                )}
                
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
