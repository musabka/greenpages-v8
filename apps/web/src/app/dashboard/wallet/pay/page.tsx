'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  ArrowRight,
  Wallet,
  CreditCard,
  Building2,
  CheckCircle2,
  AlertCircle,
  Package,
} from 'lucide-react';

interface Business {
  id: string;
  nameAr: string;
  slug: string;
  status: string;
}

interface PackageOption {
  id: string;
  nameAr: string;
  nameEn: string;
  price: number;
  durationDays: number;
  descriptionAr: string;
}

interface Capability {
  id: string;
  businessId: string;
  business: {
    id: string;
    nameAr: string;
    slug: string;
    status: string;
  };
}

export default function WalletPayPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  // جلب رصيد المحفظة
  const balanceQuery = useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: async () => (await api.get('/wallet/balance')).data,
  });

  // جلب الأنشطة التجارية التي يملكها المستخدم
  const capabilitiesQuery = useQuery({
    queryKey: ['capabilities', 'me'],
    queryFn: async () => {
      const response = await api.get('/capabilities/me');
      return response.data as Capability[];
    },
  });

  // جلب الباقات المتاحة
  const packagesQuery = useQuery({
    queryKey: ['packages'],
    queryFn: async () => {
      const response = await api.get('/packages');
      return response.data.data as PackageOption[];
    },
  });

  const payMutation = useMutation({
    mutationFn: async (data: { businessId: string; packageId: string }) => {
      const response = await api.post('/wallet/pay', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['capabilities'] });
      router.push('/dashboard/wallet?success=payment');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusiness || !selectedPackage) return;

    const selectedPkg = packagesQuery.data?.find((p) => p.id === selectedPackage);
    if (!selectedPkg) return;

    if ((balanceQuery.data?.availableBalance || 0) < selectedPkg.price) {
      alert('الرصيد المتاح غير كافٍ');
      return;
    }

    payMutation.mutate({
      businessId: selectedBusiness,
      packageId: selectedPackage,
    });
  };

  const businesses = capabilitiesQuery.data?.map((c) => c.business) || [];
  const packages = packagesQuery.data || [];
  const selectedPkg = packages.find((p) => p.id === selectedPackage);
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
            <CreditCard className="w-8 h-8 text-blue-600" />
            دفع اشتراك
          </h1>
          <p className="text-gray-500 mt-1">
            ادفع اشتراك نشاطك التجاري من رصيد المحفظة
          </p>
        </div>

        {/* Current Balance */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 mb-6 text-white">
          <p className="text-blue-100 text-sm">الرصيد المتاح</p>
          <p className="text-2xl font-bold">
            {new Intl.NumberFormat('ar-SY').format(availableBalance)} ل.س
          </p>
        </div>

        {businesses.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              لا يوجد أنشطة تجارية
            </h3>
            <p className="text-gray-500 mb-4">
              يجب أن تمتلك نشاطاً تجارياً لدفع اشتراكه
            </p>
            <Link
              href="/dashboard/my-businesses"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Building2 className="w-4 h-4" />
              إضافة نشاط تجاري
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Selection */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                اختر النشاط التجاري
              </h2>
              <div className="grid gap-3">
                {businesses.map((business) => {
                  const isSelected = selectedBusiness === business.id;
                  return (
                    <button
                      key={business.id}
                      type="button"
                      onClick={() => setSelectedBusiness(business.id)}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-right ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div
                        className={`p-3 rounded-xl ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{business.nameAr}</h3>
                        <p className="text-sm text-gray-500">/{business.slug}</p>
                      </div>
                      {isSelected && <CheckCircle2 className="w-6 h-6 text-blue-600" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Package Selection */}
            {selectedBusiness && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  اختر الباقة
                </h2>
                <div className="grid gap-4">
                  {packages.map((pkg) => {
                    const isSelected = selectedPackage === pkg.id;
                    const canAfford = availableBalance >= pkg.price;
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => canAfford && setSelectedPackage(pkg.id)}
                        disabled={!canAfford}
                        className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-right ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50'
                            : canAfford
                            ? 'border-gray-200 hover:border-gray-300'
                            : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div
                          className={`p-3 rounded-xl ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <Package className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">{pkg.nameAr}</h3>
                            <span className="font-bold text-blue-600">
                              {new Intl.NumberFormat('ar-SY').format(pkg.price)} ل.س
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {pkg.durationDays} يوم
                          </p>
                          {pkg.descriptionAr && (
                            <p className="text-xs text-gray-400 mt-1">
                              {pkg.descriptionAr}
                            </p>
                          )}
                          {!canAfford && (
                            <p className="text-xs text-red-500 mt-1">
                              الرصيد غير كافٍ
                            </p>
                          )}
                        </div>
                        {isSelected && <CheckCircle2 className="w-6 h-6 text-blue-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Summary */}
            {selectedPackage && selectedPkg && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-semibold text-blue-900 mb-2">ملخص الدفع</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">الباقة:</span>
                    <span className="font-medium text-blue-900">{selectedPkg.nameAr}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">المدة:</span>
                    <span className="font-medium text-blue-900">{selectedPkg.durationDays} يوم</span>
                  </div>
                  <div className="flex justify-between border-t border-blue-200 pt-2">
                    <span className="text-blue-700">المبلغ:</span>
                    <span className="font-bold text-blue-900 text-lg">
                      {new Intl.NumberFormat('ar-SY').format(selectedPkg.price)} ل.س
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">الرصيد بعد الدفع:</span>
                    <span className="font-medium text-blue-900">
                      {new Intl.NumberFormat('ar-SY').format(availableBalance - selectedPkg.price)} ل.س
                    </span>
                  </div>
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
                disabled={!selectedBusiness || !selectedPackage || payMutation.isPending}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {payMutation.isPending ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    جاري الدفع...
                  </>
                ) : (
                  <>
                    <Wallet className="w-5 h-5" />
                    دفع من المحفظة
                  </>
                )}
              </button>
            </div>

            {/* Error Message */}
            {payMutation.isError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">فشل في عملية الدفع</p>
                  <p className="text-sm text-red-600">
                    {(payMutation.error as any)?.response?.data?.message ||
                      'يرجى المحاولة مرة أخرى'}
                  </p>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
