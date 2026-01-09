'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowRight,
  Wallet,
  AlertCircle,
  TrendingUp,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useState } from 'react';

export default function UpgradePackagePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const businessId = params.businessId as string;
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [upgradeDetails, setUpgradeDetails] = useState<any>(null);

  // جلب معلومات النشاط والباقة الحالية
  const businessQuery = useQuery({
    queryKey: ['business-package', businessId],
    queryFn: async () => {
      const response = await api.get(`/user/dashboard/business/${businessId}/subscription`);
      return response.data;
    },
  });

  // جلب الباقات المتاحة
  const packagesQuery = useQuery({
    queryKey: ['available-packages'],
    queryFn: async () => {
      const response = await api.get('/user/dashboard/available-packages');
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

  // ترقية الباقة
  const upgradeMutation = useMutation({
    mutationFn: async (data: { businessId: string; packageId: string }) => {
      const response = await api.post('/wallet/pay', data);
      return response.data;
    },
    onSuccess: (data) => {
      setUpgradeDetails(data);
      setShowSuccessModal(true);
      // Refresh queries
      businessQuery.refetch();
      walletQuery.refetch();

      // Ensure accounting pages pick up the new invoice/journal entry
      // Accounting UI is managed in apps/accountant, not in user dashboard
    },
  });

  if (businessQuery.isLoading || packagesQuery.isLoading || walletQuery.isLoading) {
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
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">خطأ</h2>
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

  const currentPackageData = businessQuery.data.currentPackage;
  const currentPrice = Number(currentPackageData.price);
  const availablePackages = packagesQuery.data || [];
  
  // فلترة الباقات التي سعرها أعلى من الباقة الحالية (ترقية فقط)
  const upgradePackages = availablePackages.filter(
    (pkg: any) => Number(pkg.price) > currentPrice && pkg.id !== currentPackageData.packageId
  );

  const selectedPackage = upgradePackages.find((pkg: any) => pkg.id === selectedPackageId);
  const wallet = walletQuery.data;
  
  // حساب الأيام المتبقية والتكلفة الفعلية
  let remainingDays = 0;
  let remainingValue = 0;
  let upgradeCost = selectedPackage ? Number(selectedPackage.price) : 0;
  
  if (currentPackageData && selectedPackage) {
    const now = new Date();
    const endDate = new Date(currentPackageData.endDate);
    const daysDiff = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    remainingDays = Math.max(0, daysDiff);
    
    // حساب قيمة الأيام المتبقية
    const currentPackagePrice = Number(currentPackageData.package.price);
    const currentPackageDuration = Number(currentPackageData.package.durationDays);
    const dailyRate = currentPackagePrice / currentPackageDuration;
    remainingValue = dailyRate * remainingDays;
    
    // التكلفة الفعلية = سعر الباقة الجديدة - قيمة الأيام المتبقية
    upgradeCost = Math.max(0, Number(selectedPackage.price) - remainingValue);
  }
  
  const hasEnoughBalance = wallet && Number(wallet.balance) >= upgradeCost;

  const handleUpgrade = () => {
    if (!selectedPackageId) {
      alert('يرجى اختيار باقة أولاً');
      return;
    }

    if (!hasEnoughBalance) {
      alert('رصيدك غير كافي. يرجى شحن المحفظة أولاً.');
      return;
    }

    upgradeMutation.mutate({
      businessId,
      packageId: selectedPackageId,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للوحة التحكم</span>
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">ترقية الباقة</h1>
          <p className="text-gray-600">
            قم بترقية باقة {businessQuery.data.business?.nameAr} للحصول على مميزات إضافية
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* الباقات المتاحة */}
          <div className="lg:col-span-3">
            {upgradePackages.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
                <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  أنت تستخدم أفضل باقة متاحة!
                </h3>
                <p className="text-gray-600">
                  لا توجد باقات أعلى من باقتك الحالية ({currentPackageData.packageName})
                </p>
              </div>
            ) : (
              <>
                {/* Current Package */}
                <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-300 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                      الباقة الحالية
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {currentPackageData.packageName}
                  </h3>
                  <p className="text-2xl font-bold text-gray-600">
                    {currentPrice.toLocaleString('ar-EG')} جنيه
                  </p>
                  {remainingDays > 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                      متبقي {remainingDays} يوم • قيمة {Math.round(remainingValue).toLocaleString('ar-EG')} جنيه
                    </p>
                  )}
                </div>

                {/* Available Upgrades */}
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  الباقات المتاحة للترقية
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {upgradePackages.map((pkg: any) => (
                    <UpgradePackageCard
                      key={pkg.id}
                      package={pkg}
                      isSelected={selectedPackageId === pkg.id}
                      onSelect={() => setSelectedPackageId(pkg.id)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Wallet Balance */}
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white sticky top-4">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-5 h-5" />
                <span className="text-sm font-medium">رصيد المحفظة</span>
              </div>
              <p className="text-3xl font-bold mb-4">
                {Number(wallet?.balance || 0).toLocaleString('ar-EG')}
                <span className="text-lg mr-2">جنيه</span>
              </p>

              {selectedPackage && (
                <>
                  <div className="pt-4 border-t border-green-400 mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span>تكلفة الترقية</span>
                      <span className="font-bold">
                        {upgradeCost.toLocaleString('ar-EG')} جنيه
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>الرصيد بعد الدفع</span>
                      <span className="font-bold">
                        {(Number(wallet?.balance || 0) - upgradeCost).toLocaleString('ar-EG')} جنيه
                      </span>
                    </div>
                  </div>

                  {hasEnoughBalance ? (
                    <button
                      onClick={handleUpgrade}
                      disabled={upgradeMutation.isPending}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white text-green-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {upgradeMutation.isPending ? (
                        <>
                          <div className="w-5 h-5 border-2 border-green-700 border-t-transparent rounded-full animate-spin" />
                          <span>جاري الترقية...</span>
                        </>
                      ) : (
                        <>
                          <TrendingUp className="w-5 h-5" />
                          <span>تأكيد الترقية</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div className="p-3 bg-red-500 bg-opacity-20 rounded-lg text-sm text-white">
                        <AlertCircle className="w-4 h-4 inline ml-1" />
                        رصيد غير كافي
                      </div>
                      <Link
                        href="/dashboard/wallet/top-up"
                        className="block text-center px-4 py-2 bg-white text-green-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        شحن المحفظة
                      </Link>
                    </div>
                  )}
                </>
              )}

              {!selectedPackage && upgradePackages.length > 0 && (
                <p className="text-sm text-green-100">
                  اختر باقة للترقية
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && upgradeDetails && (
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
                <Sparkles className="w-8 h-8 text-white" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                🎉 مبارك! تمت الترقية بنجاح
              </h2>

              <p className="text-gray-600 mb-6">
                تهانينا! لقد قمت بترقية باقتك بنجاح. الآن يمكنك الاستمتاع بجميع المزايا الجديدة!
              </p>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 mb-6">
                <div className="space-y-3">
                  {remainingDays > 0 && remainingValue > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">قيمة الأيام المتبقية ({remainingDays} يوم)</span>
                      <span className="text-sm font-semibold text-green-700">
                        -{Math.round(remainingValue).toLocaleString('ar-EG')} جنيه
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 border-t border-green-200">
                    <span className="text-gray-900 font-medium">المبلغ المدفوع</span>
                    <span className="text-xl font-bold text-green-600">
                      {Math.round(upgradeCost).toLocaleString('ar-EG')} جنيه
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">الرصيد المتبقي</span>
                    <span className="text-sm font-semibold text-gray-700">
                      {upgradeDetails.transaction?.balanceAfter?.toLocaleString('ar-EG')} جنيه
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-medium"
                >
                  العودة للوحة التحكم
                </button>
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

interface UpgradePackageCardProps {
  package: any;
  isSelected: boolean;
  onSelect: () => void;
}

function UpgradePackageCard({ package: pkg, isSelected, onSelect }: UpgradePackageCardProps) {
  const price = Number(pkg.price);

  return (
    <div
      onClick={onSelect}
      className={`bg-white rounded-xl p-5 border-2 cursor-pointer transition-all ${
        isSelected
          ? 'border-green-500 shadow-md'
          : 'border-gray-200 hover:border-green-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-gray-900 text-lg">{pkg.nameAr}</h3>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {price.toLocaleString('ar-EG')} جنيه
          </p>
        </div>
        <div
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
            isSelected
              ? 'border-green-500 bg-green-500'
              : 'border-gray-300'
          }`}
        >
          {isSelected && <Check className="w-4 h-4 text-white" />}
        </div>
      </div>

      {pkg.descriptionAr && (
        <p className="text-sm text-gray-600 mb-3">{pkg.descriptionAr}</p>
      )}

      <div className="space-y-1.5">
        {pkg.features?.slice(0, 4).map((feature: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            {feature.isEnabled ? (
              <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            )}
            <span className={feature.isEnabled ? 'text-gray-700' : 'text-gray-400 line-through'}>
              {getFeatureLabel(feature.featureKey)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function getFeatureLabel(key: string): string {
  const labels: Record<string, string> = {
    CAN_ADD_BRANCHES: 'إضافة فروع',
    CAN_ADD_PRODUCTS: 'إضافة منتجات',
    CAN_ADD_GALLERY: 'إضافة معرض صور',
    CAN_ADD_PERSONS: 'إضافة أشخاص',
    CAN_CREATE_ADS: 'إنشاء إعلانات',
    CAN_FEATURE_BUSINESS: 'النشاط مميز',
    CAN_USE_ANALYTICS: 'التحليلات والإحصائيات',
    CAN_EXPORT_DATA: 'تصدير البيانات',
    PRIORITY_SUPPORT: 'دعم فني مميز',
  };
  return labels[key] || key;
}
