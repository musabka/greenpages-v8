'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, Loader2, Save } from 'lucide-react';
import { useCity, useGovernorates, useUpdateCity } from '@/lib/hooks';

export default function EditCityPage() {
  const params = useParams();
  const router = useRouter();
  const id = String((params as any)?.id ?? '');

  const { data: city, isLoading: isCityLoading } = useCity(id);
  const { data: governoratesResponse, isLoading: isGovernoratesLoading } = useGovernorates();
  const updateCity = useUpdateCity();

  const governorates = useMemo(() => {
    return Array.isArray(governoratesResponse)
      ? governoratesResponse
      : Array.isArray((governoratesResponse as any)?.data)
        ? (governoratesResponse as any).data
        : [];
  }, [governoratesResponse]);

  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [governorateId, setGovernorateId] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);

  if (!isInitialized && city) {
    setNameAr(city.nameAr ?? '');
    setNameEn(city.nameEn ?? '');
    setSlug(city.slug ?? '');
    setDescription(city.description ?? '');
    setGovernorateId(city.governorateId ?? '');
    setLatitude(city.latitude != null ? String(city.latitude) : '');
    setLongitude(city.longitude != null ? String(city.longitude) : '');
    setIsActive(Boolean(city.isActive));
    setSortOrder(typeof city.sortOrder === 'number' ? city.sortOrder : 0);
    setIsInitialized(true);
  }

  const isSaving = updateCity.isPending;
  const canSave = !!id && !!governorateId && !!nameAr.trim() && isInitialized && !isSaving;

  const handleSave = async () => {
    if (!canSave) return;
    try {
      await updateCity.mutateAsync({
        id,
        data: {
          governorateId,
          nameAr: nameAr.trim(),
          nameEn: nameEn.trim() || undefined,
          slug: slug.trim() || undefined,
          description: description.trim() || undefined,
          latitude: latitude.trim() ? Number(latitude) : undefined,
          longitude: longitude.trim() ? Number(longitude) : undefined,
          sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
          isActive,
        },
      });
      router.push('/cities');
    } catch {
      // handled in hook
    }
  };

  const isLoading = isCityLoading || isGovernoratesLoading;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Link href="/cities" className="hover:text-gray-900">
              المدن
            </Link>
            <ArrowRight className="w-4 h-4" />
            <span className="text-gray-900">تعديل مدينة</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">تعديل مدينة</h1>
          <p className="text-gray-600 mt-2">تحديث بيانات المدينة وربطها بالمحافظة</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={!canSave}>
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          حفظ
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-8">
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            جاري تحميل البيانات...
          </div>
        ) : !city ? (
          <div className="text-gray-600">لم يتم العثور على المدينة</div>
        ) : (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">معلومات أساسية</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    المحافظة <span className="text-red-500">*</span>
                  </label>
                  <select className="select" value={governorateId} onChange={(e) => setGovernorateId(e.target.value)}>
                    <option value="">اختر المحافظة</option>
                    {governorates.map((gov: any) => (
                      <option key={gov.id} value={gov.id}>
                        {gov.nameAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الاسم (عربي) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="مثال: جرمانا"
                      value={nameAr}
                      onChange={(e) => setNameAr(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">الاسم (إنجليزي)</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g., Jaramana"
                      dir="ltr"
                      value={nameEn}
                      onChange={(e) => setNameEn(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">الرابط (Slug)</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="jaramana"
                      dir="ltr"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="وصف مختصر..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">الموقع والإعدادات</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">خط العرض (Latitude)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="33.4542"
                    dir="ltr"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">خط الطول (Longitude)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="36.3456"
                    dir="ltr"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">ترتيب العرض</label>
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
        )}
      </div>
    </div>
  );
}
