'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, Loader2, Save } from 'lucide-react';
import { useCities, useDistrict, useGovernorates, useUpdateDistrict } from '@/lib/hooks';

export default function EditDistrictPage() {
  const params = useParams();
  const router = useRouter();
  const id = String((params as any)?.id ?? '');

  const { data: district, isLoading: isDistrictLoading } = useDistrict(id);
  const { data: governoratesResponse, isLoading: isGovernoratesLoading } = useGovernorates();
  const updateDistrict = useUpdateDistrict();

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
  const [isInitialized, setIsInitialized] = useState(false);

  const { data: citiesResponse, isLoading: isCitiesLoading } = useCities(governorateId || undefined);

  const governorates = useMemo(() => {
    return Array.isArray(governoratesResponse)
      ? governoratesResponse
      : Array.isArray((governoratesResponse as any)?.data)
        ? (governoratesResponse as any).data
        : [];
  }, [governoratesResponse]);

  const cities = useMemo(() => {
    return Array.isArray(citiesResponse)
      ? citiesResponse
      : Array.isArray((citiesResponse as any)?.data)
        ? (citiesResponse as any).data
        : [];
  }, [citiesResponse]);

  if (!isInitialized && district) {
    const initialGovernorateId =
      (district as any)?.city?.governorateId ?? (district as any)?.city?.governorate?.id ?? '';
    setGovernorateId(String(initialGovernorateId || ''));
    setCityId(String((district as any)?.cityId ?? ''));
    setNameAr((district as any)?.nameAr ?? '');
    setNameEn((district as any)?.nameEn ?? '');
    setSlug((district as any)?.slug ?? '');
    setDescription((district as any)?.description ?? '');
    setLatitude((district as any)?.latitude != null ? String((district as any).latitude) : '');
    setLongitude((district as any)?.longitude != null ? String((district as any).longitude) : '');
    setIsActive(Boolean((district as any)?.isActive));
    setSortOrder(typeof (district as any)?.sortOrder === 'number' ? (district as any).sortOrder : 0);
    setIsInitialized(true);
  }

  const isSaving = updateDistrict.isPending;
  const canSave = !!id && !!cityId && !!nameAr.trim() && isInitialized && !isSaving;

  const handleSave = async () => {
    if (!canSave) return;
    try {
      await updateDistrict.mutateAsync({
        id,
        data: {
          cityId,
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
      router.push('/districts');
    } catch {
      // handled in hook
    }
  };

  const isLoading = isDistrictLoading || isGovernoratesLoading || isCitiesLoading;

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
            <h1 className="page-title">تعديل حي</h1>
            <p className="text-gray-500 mt-1">حدّث بيانات الحي</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={!canSave}>
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
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
              {isLoading ? (
                <div className="flex items-center gap-2 text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري تحميل البيانات...
                </div>
              ) : !district ? (
                <div className="text-gray-600">لم يتم العثور على الحي</div>
              ) : (
                <>
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
                      >
                        <option value="">اختر المحافظة</option>
                        {governorates.map((gov: any) => (
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
                        disabled={!governorateId}
                      >
                        <option value="">اختر المدينة</option>
                        {cities.map((city: any) => (
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">الاسم (إنجليزي)</label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">خط العرض (Latitude)</label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">خط الطول (Longitude)</label>
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
                </>
              )}
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
      </div>
    </div>
  );
}
