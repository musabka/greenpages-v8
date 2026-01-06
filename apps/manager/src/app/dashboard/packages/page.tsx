'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Package, Check, X } from 'lucide-react';

type PackageFeature = {
  featureKey: string;
  isEnabled: boolean;
};

type PackageLimit = {
  limitKey: string;
  limitValue: number;
};

type PackageData = {
  id: string;
  nameAr: string;
  descriptionAr: string;
  price: number;
  durationDays: number;
  features: PackageFeature[];
  limits: PackageLimit[];
  isDefault: boolean;
};

export default function PackagesPage() {
  const { data: packages, isLoading, isError } = useQuery({
    queryKey: ['packages'],
    queryFn: async () => {
      const res = await api.get('/packages');
      return res.data as PackageData[];
    },
  });

  if (isLoading) {
    return <div className="p-8 text-center">جاري تحميل الباقات...</div>;
  }

  if (isError) {
    return <div className="p-8 text-center text-red-600">حدث خطأ أثناء تحميل الباقات</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">باقات الاشتراك</h1>
          <p className="text-gray-500 mt-1">عرض تفاصيل الباقات والميزات المتاحة</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages?.map((pkg) => (
          <div key={pkg.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-50 bg-gray-50/50">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                  <Package className="w-6 h-6" />
                </div>
                {pkg.isDefault && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    افتراضي
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-gray-900">{pkg.nameAr}</h3>
              <p className="text-gray-500 mt-2 text-sm line-clamp-2">{pkg.descriptionAr}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-blue-600">{Number(pkg.price).toLocaleString()}</span>
                <span className="text-gray-500">د.ع</span>
                <span className="text-gray-400 text-sm">/ {pkg.durationDays} يوم</span>
              </div>
            </div>

            <div className="p-6 flex-1">
              <h4 className="font-medium text-gray-900 mb-4">الميزات والحدود:</h4>
              <ul className="space-y-3">
                {pkg.limits.map((limit) => (
                  <li key={limit.limitKey} className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    <span>{formatLimitKey(limit.limitKey)}: <strong>{limit.limitValue}</strong></span>
                  </li>
                ))}
                {pkg.features.map((feature) => (
                  <li key={feature.featureKey} className="flex items-center gap-3 text-sm text-gray-600">
                    {feature.isEnabled ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <X className="w-4 h-4 text-red-400" />
                    )}
                    <span>{formatFeatureKey(feature.featureKey)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatLimitKey(key: string) {
  const map: Record<string, string> = {
    MAX_BRANCHES: 'عدد الفروع',
    MAX_PERSONS: 'عدد الأشخاص',
    MAX_ADS: 'عدد الإعلانات',
    MAX_GALLERY_PHOTOS: 'صور المعرض',
    MAX_PRODUCTS: 'عدد المنتجات',
  };
  return map[key] || key;
}

function formatFeatureKey(key: string) {
  const map: Record<string, string> = {
    AD_ALLOWED: 'إمكانية الإعلان',
    SHOW_DESCRIPTION: 'عرض الوصف',
    SHOW_GALLERY: 'معرض الصور',
    SHOW_TEAM: 'فريق العمل',
    SHOW_PRODUCTS: 'المنتجات والخدمات',
    SHOW_BRANCHES: 'الفروع',
    SHOW_WORKING_HOURS: 'ساعات العمل',
    SHOW_REVIEWS: 'التقييمات',
    SHOW_PHONE: 'رقم الهاتف',
    SHOW_WHATSAPP: 'واتساب',
    SHOW_EMAIL: 'البريد الإلكتروني',
    SHOW_WEBSITE: 'الموقع الإلكتروني',
    SHOW_SOCIAL_LINKS: 'وسائل التواصل',
    SHOW_MAP: 'الخريطة',
    SHOW_ADDRESS: 'العنوان',
  };
  return map[key] || key;
}
