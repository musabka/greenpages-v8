/**
 * Package Features Helper
 * يوفر دوال للتحقق من الميزات المتاحة للنشاط التجاري بناءً على باقته
 */

export type FeatureKey =
  // Ads
  | 'AD_ALLOWED'
  // عناصر المحتوى
  | 'SHOW_DESCRIPTION'
  | 'SHOW_GALLERY'
  | 'SHOW_TEAM'
  | 'SHOW_PRODUCTS'
  | 'SHOW_BRANCHES'
  | 'SHOW_WORKING_HOURS'
  | 'SHOW_REVIEWS'
  // عناصر التواصل
  | 'SHOW_PHONE'
  | 'SHOW_WHATSAPP'
  | 'SHOW_EMAIL'
  | 'SHOW_WEBSITE'
  | 'SHOW_SOCIAL_LINKS'
  // عناصر الموقع
  | 'SHOW_MAP'
  | 'SHOW_ADDRESS';

export interface PackageFeature {
  featureKey: FeatureKey;
  isEnabled: boolean;
}

export interface BusinessPackage {
  id?: string;
  packageId?: string;
  isActive?: boolean;
  overrideEnabled?: boolean;
  package?: {
    features?: PackageFeature[];
  };
}

/**
 * يتحقق من توفر ميزة معينة في باقة النشاط
 * التطبيق الصارم: إذا لم توجد باقة نشطة، نعرض المحتوى الأساسي فقط
 */
export function hasFeature(
  businessPackage: BusinessPackage | null | undefined,
  featureKey: FeatureKey
): boolean {
  // إذا كان التجاوز الإداري مفعّل، نعرض كل شيء
  if (businessPackage?.overrideEnabled) {
    return true;
  }

  // إذا لم توجد باقة، نطبق سياسة صارمة: المحتوى الأساسي فقط
  if (!businessPackage || !businessPackage.package) {
    // الميزات الأساسية المتاحة بدون باقة
    const freeFeatures: FeatureKey[] = [
      'SHOW_PHONE',
      'SHOW_ADDRESS',
    ];
    return freeFeatures.includes(featureKey);
  }

  // إذا كانت الباقة غير نشطة، نعرض فقط المحتوى الأساسي
  if (businessPackage.isActive === false) {
    const basicFeatures: FeatureKey[] = [
      'SHOW_PHONE',
      'SHOW_ADDRESS',
    ];
    return basicFeatures.includes(featureKey);
  }

  const features = businessPackage.package.features || [];
  const feature = features.find(f => f.featureKey === featureKey);

  // إذا لم توجد الميزة في قائمة الباقة، نعتبرها غير متاحة (سياسة صارمة)
  return feature ? feature.isEnabled : false;
}

/**
 * يتحقق من عدة ميزات دفعة واحدة
 */
export function hasAnyFeature(
  businessPackage: BusinessPackage | null | undefined,
  featureKeys: FeatureKey[]
): boolean {
  return featureKeys.some(key => hasFeature(businessPackage, key));
}

/**
 * يتحقق من جميع الميزات المطلوبة
 */
export function hasAllFeatures(
  businessPackage: BusinessPackage | null | undefined,
  featureKeys: FeatureKey[]
): boolean {
  return featureKeys.every(key => hasFeature(businessPackage, key));
}

/**
 * يجلب جميع الميزات المفعلة
 */
export function getEnabledFeatures(
  businessPackage: BusinessPackage | null | undefined
): FeatureKey[] {
  if (!businessPackage || !businessPackage.package) {
    return [];
  }

  const features = businessPackage.package.features || [];
  return features
    .filter(f => f.isEnabled)
    .map(f => f.featureKey);
}

/**
 * يعيد رسالة توضيحية عن سبب إخفاء الميزة
 */
export function getFeatureBlockMessage(
  businessPackage: BusinessPackage | null | undefined,
  featureKey: FeatureKey
): string {
  if (!businessPackage || !businessPackage.package) {
    return 'هذه الميزة متاحة فقط للباقات المدفوعة';
  }

  if (businessPackage.isActive === false) {
    return 'الباقة الحالية غير نشطة. يرجى تجديد الاشتراك';
  }

  return 'هذه الميزة غير متاحة في باقتك الحالية';
}
