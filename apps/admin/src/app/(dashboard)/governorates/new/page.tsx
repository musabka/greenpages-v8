'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, Save } from 'lucide-react';
import { useCreateGovernorate } from '@/lib/hooks';

export default function NewGovernoratePage() {
  const router = useRouter();
  const createGovernorate = useCreateGovernorate();

  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState<number>(0);

  const isSaving = createGovernorate.isPending;
  const canSave = !!nameAr.trim() && !!slug.trim() && !isSaving;

  const handleSave = async () => {
    if (!canSave) return;
    try {
      await createGovernorate.mutateAsync({
        nameAr: nameAr.trim(),
        nameEn: nameEn.trim() || undefined,
        slug: slug.trim(),
        description: description.trim() || undefined,
        latitude: latitude.trim() ? Number(latitude) : undefined,
        longitude: longitude.trim() ? Number(longitude) : undefined,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
        isActive,
      });
      router.push('/governorates');
    } catch {
      // handled in hook
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          <Link
            href="/governorates"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="page-title">إضافة محافظة</h1>
            <p className="text-gray-500 mt-1">أضف محافظة جديدة</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={!canSave}>
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          حفظ
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h2 className="font-bold text-gray-900">معلومات المحافظة</h2>
            </div>
            <div className="card-body space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الاسم (عربي) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="مثال: دمشق"
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الاسم (إنجليزي)
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., Damascus"
                    dir="ltr"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الرابط (Slug) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="damascus"
                  maxLength={100}
                  dir="ltr"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
                <p className="text-sm text-gray-500 mt-1">مُعرّف نصي فريد للمحافظة</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="وصف مختصر للمحافظة..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    خط العرض (Latitude)
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="33.5138"
                    dir="ltr"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    خط الطول (Longitude)
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="36.2765"
                    dir="ltr"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                  />
                </div>
              </div>

              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">خريطة لتحديد مركز المحافظة</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="font-bold text-gray-900">الإعدادات</h2>
            </div>
            <div className="card-body space-y-4">
              <div className="flex items-center justify-between py-2">
                <label className="text-gray-700">نشط</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ترتيب العرض
                </label>
                <input
                  type="number"
                  className="input"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  min={0}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
