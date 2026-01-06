'use client';

import { useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Info, Clock, Calendar } from 'lucide-react';
import { usePackages, useBusinessPackage } from '@/lib/hooks';
import type { Package } from '@/lib/api';
import { PackageExpiryAlert } from './package-expiry-alert';

interface PackageSelectorProps {
  businessId?: string;
  selectedPackageId?: string;
  onPackageSelect: (packageId: string) => void;
  durationDays?: number;
  onDurationDaysChange?: (days: number) => void;
  customExpiryDate?: string;
  onCustomExpiryDateChange?: (date: string) => void;
}

const DURATION_OPTIONS = [
  { label: 'شهر', days: 30 },
  { label: '3 شهور', days: 90 },
  { label: '6 شهور', days: 180 },
  { label: '9 شهور', days: 270 },
  { label: 'سنة', days: 365 },
];

export function PackageSelector({ 
  businessId, 
  selectedPackageId, 
  onPackageSelect, 
  durationDays,
  onDurationDaysChange,
  customExpiryDate, 
  onCustomExpiryDateChange 
}: PackageSelectorProps) {
  const { data: packagesData, isLoading: isLoadingPackages } = usePackages({ status: 'ACTIVE' });
  const { data: currentPackage } = useBusinessPackage(businessId || '');

  const packages = Array.isArray(packagesData)
    ? (packagesData as Package[])
    : Array.isArray((packagesData as any)?.data)
      ? ((packagesData as any).data as Package[])
      : [];

  const activePackages = packages.filter(pkg => pkg.status === 'ACTIVE' && pkg.isPublic);

  const selectedPackage = activePackages.find(p => p.id === selectedPackageId);
  const isDefaultPackage = selectedPackage?.isDefault;
  const isExtension = currentPackage && currentPackage.packageId === selectedPackageId && currentPackage.isActive;

  // Reset duration when package changes
  useEffect(() => {
    if (selectedPackage && onDurationDaysChange) {
      onDurationDaysChange(selectedPackage.durationDays);
    }
    if (onCustomExpiryDateChange) {
      onCustomExpiryDateChange('');
    }
  }, [selectedPackageId]); // Only when the ID changes

  if (isLoadingPackages) {
    return <div className="text-gray-500">جارٍ تحميل الباقات...</div>;
  }

  if (activePackages.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
        <Info className="w-5 h-5 inline ml-2" />
        لا توجد باقات نشطة متاحة حالياً
      </div>
    );
  }

  const getFeatureLabel = (key: string) => {
    const labels: Record<string, string> = {
      // إعلانات
      AD_ALLOWED: 'السماح بالإعلانات',
      // محتوى
      SHOW_DESCRIPTION: 'عرض الوصف التفصيلي',
      SHOW_GALLERY: 'معرض الصور',
      SHOW_TEAM: 'عرض فريق العمل',
      SHOW_PRODUCTS: 'المنتجات والخدمات',
      SHOW_BRANCHES: 'عرض الفروع',
      SHOW_WORKING_HOURS: 'ساعات العمل',
      SHOW_REVIEWS: 'عرض التقييمات',
      // تواصل
      SHOW_PHONE: 'عرض رقم الهاتف',
      SHOW_WHATSAPP: 'عرض واتساب',
      SHOW_EMAIL: 'عرض البريد الإلكتروني',
      SHOW_WEBSITE: 'عرض الموقع الإلكتروني',
      SHOW_SOCIAL_LINKS: 'روابط التواصل الاجتماعي',
      // موقع
      SHOW_MAP: 'عرض الخريطة',
      SHOW_ADDRESS: 'عرض العنوان',
      // أخرى
      VERIFIED_BADGE: 'شارة التحقق',
      FEATURED_LISTING: 'ظهور مميز',
      PRIORITY_SUPPORT: 'دعم ذو أولوية',
      ANALYTICS_DASHBOARD: 'لوحة الإحصائيات',
    };
    return labels[key] || key;
  };

  const getLimitLabel = (key: string) => {
    const labels: Record<string, string> = {
      MAX_BRANCHES: 'عدد الفروع',
      MAX_PERSONS: 'عدد الموظفين',
      MAX_ADS: 'عدد الإعلانات',
      MAX_GALLERY_PHOTOS: 'عدد الصور',
      MAX_PRODUCTS: 'عدد المنتجات',
    };
    return labels[key] || key;
  };

  return (
    <div className="space-y-4">
      {/* Expiry Alert */}
      {currentPackage && (
        <PackageExpiryAlert
          endDate={currentPackage.endDate}
          isActive={currentPackage.isActive}
          packageName={currentPackage.package?.nameAr}
        />
      )}

      {/* Current Package Info */}
      {currentPackage && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-900 font-medium mb-3">
            <Shield className="w-5 h-5" />
            الباقة الحالية
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-blue-900">{currentPackage.package?.nameAr}</span>
              {currentPackage.isActive ? (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">نشطة</span>
              ) : (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">منتهية</span>
              )}
            </div>
            {currentPackage.startDate && (
              <div className="text-sm text-blue-700">
                📅 بدأت: {new Date(currentPackage.startDate).toLocaleDateString('ar-SY', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            )}
            {currentPackage.endDate ? (
              <div className="text-sm text-blue-700">
                ⏰ تنتهي: {new Date(currentPackage.endDate).toLocaleDateString('ar-SY', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            ) : (
              <div className="text-sm text-blue-700">
                ♾️ باقة دائمة (لا تنتهي)
              </div>
            )}
            {currentPackage.endDate && currentPackage.isActive && (() => {
              const now = new Date();
              const end = new Date(currentPackage.endDate);
              const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              if (daysLeft > 0) {
                return (
                  <div className="text-xs text-blue-600 font-medium">
                    ⏳ متبقي {daysLeft} {daysLeft === 1 ? 'يوم' : 'أيام'}
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>
      )}

      {/* Package Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activePackages.map((pkg) => {
          const isSelected = selectedPackageId === pkg.id || (!selectedPackageId && pkg.isDefault);
          
          return (
            <button
              key={pkg.id}
              type="button"
              onClick={() => onPackageSelect(pkg.id)}
              className={`text-right border-2 rounded-lg p-4 transition-all ${
                isSelected
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900">{pkg.nameAr}</h4>
                  {pkg.nameEn && (
                    <p className="text-sm text-gray-500">{pkg.nameEn}</p>
                  )}
                  {pkg.isDefault && (
                    <span className="inline-block mt-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      افتراضية
                    </span>
                  )}
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-primary-600">
                    {Number(pkg.price).toLocaleString('ar-SY')}
                  </div>
                  <div className="text-xs text-gray-500">ل.س / {pkg.durationDays} يوم</div>
                </div>
              </div>

              {pkg.descriptionAr && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {pkg.descriptionAr}
                </p>
              )}

              {/* Features - عرض الميزات المفعلة فقط */}
              {(() => {
                const enabledFeatures = (pkg.features || []).filter(f => f.isEnabled);
                if (enabledFeatures.length === 0) return null;
                
                return (
                  <div className="mb-3 space-y-1.5">
                    {enabledFeatures.slice(0, 4).map((feature) => (
                      <div
                        key={feature.featureKey}
                        className="flex items-center gap-2 text-sm text-gray-700"
                      >
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span>{getFeatureLabel(feature.featureKey)}</span>
                      </div>
                    ))}
                    {enabledFeatures.length > 4 && (
                      <div className="text-xs text-primary-600 font-medium mr-6">
                        + {enabledFeatures.length - 4} ميزة إضافية
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Limits */}
              {pkg.limits && pkg.limits.length > 0 && (
                <div className="pt-3 border-t border-gray-200 space-y-1.5">
                  {pkg.limits.slice(0, 3).map((limit) => (
                    <div
                      key={limit.limitKey}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-600">{getLimitLabel(limit.limitKey)}</span>
                      <span className="font-semibold text-primary-700">{limit.limitValue}</span>
                    </div>
                  ))}
                  {pkg.limits.length > 3 && (
                    <div className="text-xs text-gray-500">
                      + {pkg.limits.length - 3} قيود أخرى
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Duration Selection (Only for non-default packages) */}
      {selectedPackageId && !isDefaultPackage && onDurationDaysChange && (
        <div className="bg-white border-2 border-primary-100 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-primary-900 font-semibold">
              <Clock className="w-5 h-5" />
              {isExtension ? 'تمديد الاشتراك' : 'مدة الاشتراك'}
            </div>
            {!isExtension && currentPackage && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                سيتم بدء اشتراك جديد من اليوم
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {DURATION_OPTIONS.map((option) => (
              <button
                key={option.days}
                type="button"
                onClick={() => {
                  onDurationDaysChange(option.days);
                  if (onCustomExpiryDateChange) onCustomExpiryDateChange('');
                }}
                className={`px-4 py-2.5 rounded-lg border-2 transition-all text-sm font-medium ${
                  durationDays === option.days && !customExpiryDate
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {isExtension && currentPackage?.endDate && (
            <p className="text-xs text-gray-500 mt-3">
              💡 سيتم إضافة المدة المختارة إلى تاريخ الانتهاء الحالي ({new Date(currentPackage.endDate).toLocaleDateString('ar-SY')})
            </p>
          )}
        </div>
      )}

      {/* Custom Expiry Date */}
      {selectedPackageId && !isDefaultPackage && onCustomExpiryDateChange && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-5">
          <div className="flex items-center gap-2 text-purple-900 font-semibold mb-3">
            <Calendar className="w-5 h-5" />
            تحديد تاريخ انتهاء مخصص
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تاريخ الانتهاء المخصص (اختياري)
              </label>
              <input
                type="date"
                value={customExpiryDate || ''}
                onChange={(e) => {
                  onCustomExpiryDateChange(e.target.value);
                  if (onDurationDaysChange) onDurationDaysChange(0);
                }}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2.5 border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                dir="ltr"
              />
              <p className="text-xs text-gray-600 mt-2">
                💡 إذا لم تحدد تاريخاً، سيتم استخدام المدة المختارة أعلاه أو المدة الافتراضية للباقة.
                {customExpiryDate && (
                  <span className="block mt-1 text-purple-700 font-medium">
                    ✅ تنتهي الباقة في: {new Date(customExpiryDate).toLocaleDateString('ar-SY', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                )}
              </p>
            </div>
            {customExpiryDate && (
              <button
                type="button"
                onClick={() => onCustomExpiryDateChange('')}
                className="text-sm text-purple-600 hover:text-purple-800 underline"
              >
                إلغاء التاريخ المخصص واستخدام المدة المحددة
              </button>
            )}
          </div>
        </div>
      )}

      {/* Default Package Info */}
      {isDefaultPackage && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-5">
          <div className="flex items-center gap-2 text-yellow-900 font-semibold mb-2">
            <Shield className="w-5 h-5" />
            باقة دائمة
          </div>
          <p className="text-sm text-yellow-800">
            هذه هي الباقة الافتراضية للنظام، وهي باقة دائمة لا تنتهي صلاحيتها.
          </p>
        </div>
      )}

      {/* Help Text */}
      <div className="text-sm text-gray-500">
        <Info className="w-4 h-4 inline ml-1" />
        اختر الباقة المناسبة للنشاط التجاري. يمكن تغيير الباقة لاحقاً من صفحة التعديل.
      </div>
    </div>
  );
}
