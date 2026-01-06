'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, Loader2, Save } from 'lucide-react';
import { useGovernorate, useUpdateGovernorate } from '@/lib/hooks';

export default function EditGovernoratePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data: governorate, isLoading, isError } = useGovernorate(id);
  const updateGovernorate = useUpdateGovernorate();

  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState<number>(0);

  useEffect(() => {
    if (!governorate) return;
    setNameAr(governorate.nameAr ?? '');
    setNameEn(governorate.nameEn ?? '');
    setSlug(governorate.slug ?? '');
    setDescription((governorate as any).description ?? '');
    setLatitude(governorate.latitude != null ? String(governorate.latitude) : '');
    setLongitude(governorate.longitude != null ? String(governorate.longitude) : '');
    setIsActive(Boolean(governorate.isActive));
    setSortOrder(typeof (governorate as any).sortOrder === 'number' ? (governorate as any).sortOrder : 0);
  }, [governorate]);

  const isSaving = updateGovernorate.isPending;
  const canSave = !!nameAr.trim() && !!slug.trim() && !isSaving;

  const handleSave = async () => {
    if (!canSave) return;
    try {
      await updateGovernorate.mutateAsync({
        id,
        data: {
          nameAr: nameAr.trim(),
          nameEn: nameEn.trim() || undefined,
          slug: slug.trim(),
          description: description.trim() || undefined,
          latitude: latitude.trim() ? Number(latitude) : undefined,
          longitude: longitude.trim() ? Number(longitude) : undefined,
          sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
          isActive,
        },
      });
      router.push('/governorates');
    } catch {
      // handled in hook
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-4">
          <Link
            href="/governorates"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="page-title">تعديل محافظة</h1>
            <p className="text-gray-500 mt-1">تعديل بيانات المحافظة</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={!canSave || isLoading}>
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          حفظ
        </button>
      </div>

      {isLoading && (
        <div className="card">
          <div className="card-body flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
            <span className="text-gray-600">جاري تحميل بيانات المحافظة...</span>
          </div>
        </div>
      )}

      {!isLoading && isError && (
        <div className="card">
          <div className="card-body">
            <p className="text-red-600">فشل في تحميل بيانات المحافظة</p>
          </div>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    <input type="text" className="input" value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الاسم (إنجليزي)
                    </label>
                    <input type="text" className="input" dir="ltr" value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الرابط (Slug) <span className="text-red-500">*</span>
                  </label>
                  <input type="text" className="input" dir="ltr" value={slug} onChange={(e) => setSlug(e.target.value)} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
                  <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">خط العرض (Latitude)</label>
                    <input type="text" className="input" dir="ltr" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">خط الطول (Longitude)</label>
                    <input type="text" className="input" dir="ltr" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h2 className="font-bold text-gray-900">الإعدادات</h2>
              </div>
              <div className="card-body space-y-4">
                <div className="flex items-center justify-between py-2">
                  <label className="text-gray-700">نشط</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ترتيب العرض</label>
                  <input type="number" className="input" min={0} value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
