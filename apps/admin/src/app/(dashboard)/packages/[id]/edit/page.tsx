'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Save, Loader2 } from 'lucide-react';
import { usePackage, useUpdatePackage } from '@/lib/hooks';
import type { FeatureKey, LimitKey, PackageStatus } from '@/lib/api';

const FEATURE_GROUPS = [
  {
    title: 'الإعلانات',
    features: [
      { key: 'AD_ALLOWED', label: 'السماح بالإعلانات' },
    ],
  },
  {
    title: 'عناصر المحتوى',
    features: [
      { key: 'SHOW_DESCRIPTION', label: 'عرض الوصف التفصيلي' },
      { key: 'SHOW_GALLERY', label: 'عرض معرض الصور' },
      { key: 'SHOW_TEAM', label: 'عرض فريق العمل' },
      { key: 'SHOW_PRODUCTS', label: 'عرض المنتجات والخدمات' },
      { key: 'SHOW_BRANCHES', label: 'عرض الفروع' },
      { key: 'SHOW_WORKING_HOURS', label: 'عرض ساعات العمل' },
      { key: 'SHOW_REVIEWS', label: 'عرض التقييمات' },
    ],
  },
  {
    title: 'عناصر التواصل',
    features: [
      { key: 'SHOW_PHONE', label: 'عرض أرقام الهاتف' },
      { key: 'SHOW_WHATSAPP', label: 'عرض واتساب' },
      { key: 'SHOW_EMAIL', label: 'عرض البريد الإلكتروني' },
      { key: 'SHOW_WEBSITE', label: 'عرض الموقع الإلكتروني' },
      { key: 'SHOW_SOCIAL_LINKS', label: 'عرض التواصل الاجتماعي' },
    ],
  },
  {
    title: 'عناصر الموقع',
    features: [
      { key: 'SHOW_MAP', label: 'عرض الخريطة' },
      { key: 'SHOW_ADDRESS', label: 'عرض العنوان التفصيلي' },
    ],
  },
];

const LIMITS = [
  { key: 'MAX_BRANCHES', label: 'عدد الفروع', defaultValue: 1 },
  { key: 'MAX_PERSONS', label: 'عدد أعضاء الفريق', defaultValue: 5 },
  { key: 'MAX_ADS', label: 'عدد الإعلانات', defaultValue: 1 },
  { key: 'MAX_GALLERY_PHOTOS', label: 'عدد صور المعرض', defaultValue: 10 },
  { key: 'MAX_PRODUCTS', label: 'عدد المنتجات', defaultValue: 10 },
];

export default function EditPackagePage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id ?? '');

  const { data: packageData, isLoading } = usePackage(id);
  const updatePackage = useUpdatePackage();

  const [initialized, setInitialized] = useState(false);
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [price, setPrice] = useState('0');
  const [durationDays, setDurationDays] = useState('365');
  const [status, setStatus] = useState<PackageStatus>('ACTIVE');
  const [isPublic, setIsPublic] = useState(true);
  const [sortOrder, setSortOrder] = useState('0');

  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [limits, setLimits] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!packageData || initialized) return;

    setNameAr(packageData.nameAr ?? '');
    setNameEn(packageData.nameEn ?? '');
    setSlug(packageData.slug ?? '');
    setDescriptionAr(packageData.descriptionAr ?? '');
    setDescriptionEn(packageData.descriptionEn ?? '');
    setPrice(String(packageData.price ?? 0));
    setDurationDays(String(packageData.durationDays ?? 365));
    setStatus(packageData.status ?? 'ACTIVE');
    setIsPublic(packageData.isPublic ?? true);
    setSortOrder(String(packageData.sortOrder ?? 0));

    const featuresMap: Record<string, boolean> = {};
    (packageData.features || []).forEach((f: any) => {
      featuresMap[f.featureKey] = f.isEnabled;
    });
    setFeatures(featuresMap);

    const limitsMap: Record<string, number> = {};
    (packageData.limits || []).forEach((l: any) => {
      limitsMap[l.limitKey] = l.limitValue;
    });
    setLimits(limitsMap);

    setInitialized(true);
  }, [packageData, initialized]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim() || !slug.trim()) return;

    try {
      await updatePackage.mutateAsync({
        id,
        data: {
          nameAr: nameAr.trim(),
          nameEn: nameEn.trim() || undefined,
          slug: slug.trim(),
          descriptionAr: descriptionAr.trim() || undefined,
          descriptionEn: descriptionEn.trim() || undefined,
          price: Number(price),
          durationDays: Number(durationDays),
          status,
          isPublic,
          sortOrder: Number(sortOrder),
          features: Object.entries(features).map(([key, enabled]) => ({
            featureKey: key as FeatureKey,
            isEnabled: enabled,
          })),
          limits: Object.entries(limits).map(([key, value]) => ({
            limitKey: key as LimitKey,
            limitValue: value,
          })),
        } as any,
      });

      router.push('/packages');
    } catch {
      // handled by hook
    }
  };

  const canSubmit = !!nameAr.trim() && !!slug.trim() && !updatePackage.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-4">
          <Link href="/packages" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="page-title">تعديل الباقة</h1>
            <p className="text-gray-500 mt-1">تحديث بيانات الباقة وميزاتها</p>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="btn btn-primary"
        >
          {updatePackage.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          حفظ التغييرات
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <div className="card-header">
            <h2 className="font-bold text-gray-900">المعلومات الأساسية</h2>
          </div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">اسم الباقة (عربي) *</label>
                <input
                  type="text"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">اسم الباقة (إنجليزي)</label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="label">Slug *</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="input"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">الوصف (عربي)</label>
                <textarea
                  value={descriptionAr}
                  onChange={(e) => setDescriptionAr(e.target.value)}
                  className="textarea"
                  rows={3}
                />
              </div>
              <div>
                <label className="label">الوصف (إنجليزي)</label>
                <textarea
                  value={descriptionEn}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                  className="textarea"
                  rows={3}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">السعر (ل.س)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="input"
                  min="0"
                />
              </div>
              <div>
                <label className="label">المدة (أيام)</label>
                <input
                  type="number"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  className="input"
                  min="1"
                />
              </div>
              <div>
                <label className="label">ترتيب العرض</label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="input"
                  min="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">الحالة</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PackageStatus)}
                  className="select"
                >
                  <option value="ACTIVE">نشطة</option>
                  <option value="INACTIVE">غير نشطة</option>
                  <option value="ARCHIVED">مؤرشفة</option>
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="checkbox"
                  />
                  <span>عرض للعامة</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="font-bold text-gray-900">الميزات</h2>
          </div>
          <div className="card-body space-y-6">
            {FEATURE_GROUPS.map((group) => (
              <div key={group.title}>
                <h3 className="font-semibold text-gray-900 mb-3">{group.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {group.features.map((feature) => (
                    <label key={feature.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={features[feature.key] ?? false}
                        onChange={(e) =>
                          setFeatures({ ...features, [feature.key]: e.target.checked })
                        }
                        className="checkbox"
                      />
                      <span>{feature.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="font-bold text-gray-900">القيود والحدود</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {LIMITS.map((limit) => (
                <div key={limit.key}>
                  <label className="label">{limit.label}</label>
                  <input
                    type="number"
                    value={limits[limit.key] ?? limit.defaultValue}
                    onChange={(e) =>
                      setLimits({ ...limits, [limit.key]: Number(e.target.value) })
                    }
                    className="input"
                    min="0"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
