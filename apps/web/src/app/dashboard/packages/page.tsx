'use client';

import { useQuery } from '@tanstack/react-query';
import { Package, Check, X, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function PackagesPage() {
  const packagesQuery = useQuery({
    queryKey: ['available-packages'],
    queryFn: async () => {
      const response = await api.get('/user/dashboard/available-packages');
      return response.data;
    },
    staleTime: 300_000, // 5 دقائق
  });

  if (packagesQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">جاري تحميل الباقات...</p>
        </div>
      </div>
    );
  }

  if (packagesQuery.isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">حدث خطأ في تحميل الباقات</p>
          <button
            onClick={() => packagesQuery.refetch()}
            className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  const packages = packagesQuery.data || [];

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

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            الباقات المتاحة
          </h1>
          <p className="text-gray-600">
            اختر الباقة المناسبة لنشاطك التجاري للحصول على مميزات إضافية
          </p>
        </div>

        {/* Packages Grid */}
        {packages.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              لا توجد باقات متاحة حالياً
            </h3>
            <p className="text-gray-600">
              يرجى المحاولة مرة أخرى لاحقاً
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg: any) => (
              <PackageCard key={pkg.id} package={pkg} />
            ))}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-start gap-3">
            <Sparkles className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                معلومات مهمة عن الباقات
              </h3>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• يتم الدفع من رصيد المحفظة</li>
                <li>• يمكنك ترقية الباقة في أي وقت</li>
                <li>• يتم تجديد الباقة تلقائياً عند الاقتراب من انتهائها</li>
                <li>• جميع المدفوعات مرتبطة بنظام المحاسبة</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PackageCardProps {
  package: any;
}

function PackageCard({ package: pkg }: PackageCardProps) {
  const price = Number(pkg.price);
  const features = pkg.features || [];
  const limits = pkg.limits || [];

  return (
    <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 hover:border-green-300 hover:shadow-md transition-all overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-600 to-green-700 p-6 text-white">
        <h3 className="text-2xl font-bold mb-2">{pkg.nameAr}</h3>
        {pkg.descriptionAr && (
          <p className="text-green-100 text-sm">{pkg.descriptionAr}</p>
        )}
        
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-4xl font-bold">
            {price.toLocaleString('ar-EG')}
          </span>
          <span className="text-green-100">جنيه</span>
          <span className="text-green-100 mr-auto">
            / {pkg.durationDays} يوم
          </span>
        </div>
      </div>

      {/* Features */}
      <div className="p-6">
        <div className="space-y-3 mb-6">
          <h4 className="font-semibold text-gray-900 text-sm mb-3">
            المميزات المتاحة:
          </h4>
          {features.length > 0 ? (
            features.map((feature: any, index: number) => (
              <div key={index} className="flex items-start gap-2">
                {feature.isEnabled ? (
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <X className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                )}
                <span className={`text-sm ${feature.isEnabled ? 'text-gray-700' : 'text-gray-400 line-through'}`}>
                  {getFeatureLabel(feature.featureKey)}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">لا توجد مميزات محددة</p>
          )}
        </div>

        {/* Limits */}
        {limits.length > 0 && (
          <div className="pt-4 border-t border-gray-100">
            <h4 className="font-semibold text-gray-900 text-sm mb-3">
              الحدود المتاحة:
            </h4>
            <div className="space-y-2">
              {limits.map((limit: any, index: number) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {getLimitLabel(limit.limitKey)}
                  </span>
                  <span className="font-medium text-gray-900">
                    {limit.limitValue === -1 ? 'غير محدود' : limit.limitValue}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <Link
          href={`/dashboard`}
          className="mt-6 w-full block text-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          اختيار هذه الباقة
        </Link>
      </div>
    </div>
  );
}

// Helper functions for labels
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

function getLimitLabel(key: string): string {
  const labels: Record<string, string> = {
    MAX_BRANCHES: 'عدد الفروع',
    MAX_PRODUCTS: 'عدد المنتجات',
    MAX_GALLERY_PHOTOS: 'عدد الصور',
    MAX_PERSONS: 'عدد الأشخاص',
    MAX_ADS: 'عدد الإعلانات',
  };
  return labels[key] || key;
}
