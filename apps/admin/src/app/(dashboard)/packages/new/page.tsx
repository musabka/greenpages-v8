'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Save, Loader2, Star } from 'lucide-react';
import { useCreatePackage } from '@/lib/hooks';
import type { FeatureKey, LimitKey, PackageStatus } from '@/lib/api';

interface FeatureGroup {
  title: string;
  description: string;
  features: Array<{ key: FeatureKey; label: string; description: string }>;
}

const FEATURE_GROUPS: FeatureGroup[] = [
  {
    title: 'الإعلانات',
    description: 'السماح بإنشاء إعلانات مدفوعة',
    features: [
      { key: 'AD_ALLOWED', label: 'السماح بالإعلانات', description: 'السماح للنشاط بإنشاء إعلانات مدفوعة في المنصة' },
    ],
  },
  {
    title: 'عناصر المحتوى',
    description: 'التحكم بالمحتوى المعروض في صفحة النشاط',
    features: [
      { key: 'SHOW_DESCRIPTION', label: 'عرض الوصف التفصيلي', description: 'إظهار الوصف الكامل للنشاط' },
      { key: 'SHOW_GALLERY', label: 'عرض معرض الصور', description: 'إظهار معرض صور النشاط' },
      { key: 'SHOW_TEAM', label: 'عرض فريق العمل', description: 'إظهار قائمة أعضاء الفريق' },
      { key: 'SHOW_PRODUCTS', label: 'عرض المنتجات والخدمات', description: 'إظهار قائمة المنتجات والخدمات' },
      { key: 'SHOW_BRANCHES', label: 'عرض الفروع', description: 'إظهار قائمة فروع النشاط' },
      { key: 'SHOW_WORKING_HOURS', label: 'عرض ساعات العمل', description: 'إظهار جدول ساعات العمل' },
      { key: 'SHOW_REVIEWS', label: 'عرض التقييمات', description: 'إظهار قسم التقييمات والمراجعات' },
    ],
  },
  {
    title: 'عناصر التواصل',
    description: 'التحكم بمعلومات التواصل المعروضة',
    features: [
      { key: 'SHOW_PHONE', label: 'عرض أرقام الهاتف', description: 'إظهار أرقام الهاتف والموبايل' },
      { key: 'SHOW_WHATSAPP', label: 'عرض واتساب', description: 'إظهار رقم واتساب وزر التواصل' },
      { key: 'SHOW_EMAIL', label: 'عرض البريد الإلكتروني', description: 'إظهار البريد الإلكتروني' },
      { key: 'SHOW_WEBSITE', label: 'عرض الموقع الإلكتروني', description: 'إظهار رابط الموقع الإلكتروني' },
      { key: 'SHOW_SOCIAL_LINKS', label: 'عرض التواصل الاجتماعي', description: 'إظهار روابط فيسبوك، انستغرام، تويتر، إلخ' },
    ],
  },
  {
    title: 'عناصر الموقع',
    description: 'التحكم بمعلومات الموقع الجغرافي',
    features: [
      { key: 'SHOW_MAP', label: 'عرض الخريطة', description: 'إظهار موقع النشاط على الخريطة التفاعلية' },
      { key: 'SHOW_ADDRESS', label: 'عرض العنوان التفصيلي', description: 'إظهار العنوان الكامل للنشاط' },
    ],
  },
];

const ALL_FEATURE_KEYS: FeatureKey[] = FEATURE_GROUPS.flatMap(g => g.features.map(f => f.key));

const LIMITS: Array<{ key: LimitKey; label: string; description: string; defaultValue: number }> = [
  { key: 'MAX_BRANCHES', label: 'عدد الفروع', description: 'الحد الأقصى لعدد الفروع المسموح بها', defaultValue: 1 },
  { key: 'MAX_PERSONS', label: 'عدد أعضاء الفريق', description: 'الحد الأقصى لأعضاء فريق العمل', defaultValue: 5 },
  { key: 'MAX_ADS', label: 'عدد الإعلانات', description: 'الحد الأقصى للإعلانات النشطة', defaultValue: 1 },
  { key: 'MAX_GALLERY_PHOTOS', label: 'عدد صور المعرض', description: 'الحد الأقصى للصور في المعرض', defaultValue: 10 },
  { key: 'MAX_PRODUCTS', label: 'عدد المنتجات', description: 'الحد الأقصى للمنتجات والخدمات', defaultValue: 10 },
];

export default function NewPackagePage() {
  const router = useRouter();
  const createPackage = useCreatePackage();

  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [price, setPrice] = useState('0');
  const [durationDays, setDurationDays] = useState('365');
  const [status, setStatus] = useState<PackageStatus>('ACTIVE');
  const [isPublic, setIsPublic] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [sortOrder, setSortOrder] = useState('0');

  const [features, setFeatures] = useState<Record<FeatureKey, boolean>>(
    ALL_FEATURE_KEYS.reduce((acc, key) => ({ ...acc, [key]: false }), {} as Record<FeatureKey, boolean>)
  );

  const [limits, setLimits] = useState<Record<LimitKey, number>>(
    LIMITS.reduce((acc, l) => ({ ...acc, [l.key]: l.defaultValue }), {} as Record<LimitKey, number>)
  );

  const toggleAllInGroup = (group: FeatureGroup, enable: boolean) => {
    const updated = { ...features };
    group.features.forEach(f => {
      updated[f.key] = enable;
    });
    setFeatures(updated);
  };

  const isGroupAllEnabled = (group: FeatureGroup) => 
    group.features.every(f => features[f.key]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim() || !slug.trim()) return;

    const payload = {
      nameAr: nameAr.trim(),
      nameEn: nameEn.trim() || undefined,
      slug: slug.trim(),
      descriptionAr: descriptionAr.trim() || undefined,
      descriptionEn: descriptionEn.trim() || undefined,
      price: Number(price),
      durationDays: Number(durationDays),
      status,
      isPublic,
      isDefault,
      sortOrder: Number(sortOrder),
      features: ALL_FEATURE_KEYS.map(key => ({
        featureKey: key,
        isEnabled: features[key] || false,
      })),
      limits: LIMITS.map(l => ({
        limitKey: l.key,
        limitValue: limits[l.key] || l.defaultValue,
      })),
    };

    console.log('📤 Creating package with payload:', JSON.stringify(payload, null, 2));

    try {
      await createPackage.mutateAsync(payload as any);
      router.push('/packages');
    } catch (error: any) {
      console.error('Failed to create package:', error);
      console.error('Error response:', error?.response?.data);
      if (error?.response?.data?.message) {
        alert(`خطأ: ${JSON.stringify(error.response.data.message)}`);
      }
    }
  };

  const canSubmit = !!nameAr.trim() && !!slug.trim() && !createPackage.isPending;

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-4">
          <Link href="/packages" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="page-title">إضافة باقة جديدة</h1>
            <p className="text-gray-500 mt-1">قم بإنشاء باقة اشتراك جديدة مع تحديد الميزات والقيود</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-5xl space-y-6">
        {/* Basic Info */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-bold text-gray-900">المعلومات الأساسية</h2>
          </div>
          <div className="card-body space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم الباقة (عربي) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="input"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder="مثال: الباقة الذهبية"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم الباقة (إنجليزي)
                </label>
                <input
                  type="text"
                  className="input"
                  dir="ltr"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g., Gold Package"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المعرف (Slug) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="input"
                dir="ltr"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                placeholder="gold-package"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الوصف (عربي)</label>
                <textarea
                  className="input"
                  rows={3}
                  value={descriptionAr}
                  onChange={(e) => setDescriptionAr(e.target.value)}
                  placeholder="وصف مفصل للباقة..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الوصف (إنجليزي)</label>
                <textarea
                  className="input"
                  rows={3}
                  dir="ltr"
                  value={descriptionEn}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                  placeholder="Package description..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">السعر (ل.س)</label>
                <input
                  type="number"
                  className="input"
                  dir="ltr"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المدة (بالأيام)</label>
                <input
                  type="number"
                  className="input"
                  dir="ltr"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
                <select
                  className="select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PackageStatus)}
                >
                  <option value="ACTIVE">نشطة</option>
                  <option value="INACTIVE">غير نشطة</option>
                  <option value="ARCHIVED">مؤرشفة</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ترتيب العرض</label>
                <input
                  type="number"
                  className="input"
                  dir="ltr"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  min="0"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">ظاهرة للعموم</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                />
                <Star className={`w-4 h-4 ${isDefault ? 'text-amber-500 fill-amber-500' : 'text-gray-400'}`} />
                <span className="text-sm font-medium text-gray-700">
                  الباقة الافتراضية
                  <span className="text-xs text-gray-500 mr-1">(تُفعّل عند انتهاء الاشتراك)</span>
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Features by Group */}
        {FEATURE_GROUPS.map((group) => (
          <div key={group.title} className="card">
            <div className="card-header flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900">{group.title}</h2>
                <p className="text-sm text-gray-500 mt-1">{group.description}</p>
              </div>
              <button
                type="button"
                className="text-sm text-primary-600 hover:text-primary-700"
                onClick={() => toggleAllInGroup(group, !isGroupAllEnabled(group))}
              >
                {isGroupAllEnabled(group) ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
              </button>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.features.map((feature) => (
                  <label
                    key={feature.key}
                    className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                      features[feature.key]
                        ? 'border-primary-300 bg-primary-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={features[feature.key]}
                      onChange={(e) => setFeatures({ ...features, [feature.key]: e.target.checked })}
                      className="mt-1 w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{feature.label}</div>
                      <div className="text-sm text-gray-500 mt-0.5">{feature.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Limits */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-bold text-gray-900">القيود الكمية</h2>
            <p className="text-sm text-gray-500 mt-1">حدد الحد الأقصى لكل عنصر</p>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {LIMITS.map((limit) => (
                <div key={limit.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {limit.label}
                  </label>
                  <p className="text-xs text-gray-500 mb-2">{limit.description}</p>
                  <input
                    type="number"
                    className="input"
                    dir="ltr"
                    value={limits[limit.key]}
                    onChange={(e) => setLimits({ ...limits, [limit.key]: Number(e.target.value) })}
                    min="0"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <Link href="/packages" className="btn btn-outline">
            إلغاء
          </Link>
          <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
            {createPackage.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            حفظ الباقة
          </button>
        </div>
      </form>
    </div>
  );
}
