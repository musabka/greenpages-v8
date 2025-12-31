'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Loader2, Save } from 'lucide-react';
import { useCities, useCreateDistrict, useGovernorates } from '@/lib/hooks';
import type { City, Governorate } from '@/lib/api';

export default function NewDistrictPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialGovernorateId = searchParams.get('governorateId') ?? '';
  const initialCityId = searchParams.get('cityId') ?? '';

  const { data: governoratesResponse, isLoading: isGovernoratesLoading } = useGovernorates();

  const [governorateId, setGovernorateId] = useState('');
  const [cityId, setCityId] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState<number>(0);

  const { data: citiesResponse, isLoading: isCitiesLoading } = useCities(governorateId || undefined);
  const createDistrict = useCreateDistrict();

  useEffect(() => {
    if (initialGovernorateId && !governorateId) setGovernorateId(initialGovernorateId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialGovernorateId]);

  useEffect(() => {
    if (initialCityId && !cityId) setCityId(initialCityId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCityId]);

  const governorates = useMemo<Governorate[]>(() => {
    return Array.isArray(governoratesResponse)
      ? (governoratesResponse as Governorate[])
      : Array.isArray((governoratesResponse as any)?.data)
        ? ((governoratesResponse as any).data as Governorate[])
        : [];
  }, [governoratesResponse]);

  const cities = useMemo<City[]>(() => {
    return Array.isArray(citiesResponse)
      ? (citiesResponse as City[])
      : Array.isArray((citiesResponse as any)?.data)
        ? ((citiesResponse as any).data as City[])
        : [];
  }, [citiesResponse]);

  const isSaving = createDistrict.isPending;
  const canSave = !!cityId && !!nameAr.trim() && !isSaving;

  const handleSave = async () => {
    if (!canSave) return;
    try {
      await createDistrict.mutateAsync({
        cityId,
        nameAr: nameAr.trim(),
        nameEn: nameEn.trim() || undefined,
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
        latitude: latitude.trim() ? Number(latitude) : undefined,
        longitude: longitude.trim() ? Number(longitude) : undefined,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
        isActive,
      });
      router.push('/districts');
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
            href="/districts"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="page-title">إضافة حي</h1>
            <p className="text-gray-500 mt-1">أضف حي جديد</p>
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
              <h2 className="font-bold text-gray-900">معلومات الحي</h2>
            </div>
            <div className="card-body space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    المحافظة <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="select"
                    value={governorateId}
                    onChange={(e) => {
                      setGovernorateId(e.target.value);
                      setCityId('');
                    }}
                    disabled={isGovernoratesLoading}
                  >
                    <option value="">اختر المحافظة</option>
                    {governorates.map((gov) => (
                      <option key={gov.id} value={gov.id}>
                        {gov.nameAr}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    المدينة <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="select"
                    value={cityId}
                    onChange={(e) => setCityId(e.target.value)}
                    disabled={isCitiesLoading || !governorateId}
                  >
                    <option value="">اختر المدينة</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.nameAr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الاسم (عربي) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="مثال: المزة"
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
                    placeholder="e.g., Mezzeh"
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
                    placeholder="mezzeh"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    خط العرض (Latitude)
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="33.4942"
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
                    placeholder="36.2356"
                    dir="ltr"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                  />
                </div>
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
