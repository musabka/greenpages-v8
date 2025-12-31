'use client';

import Link from 'next/link';
import { useMemo, useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Save, Image as ImageIcon, Eye, Calendar, Loader2, Globe, MapPin, X } from 'lucide-react';
import { uploadApi, cityApi } from '@/lib/api';
import { useBusinesses, useCategories, useCreateAd, useGovernorates } from '@/lib/hooks';

const positions = [
  { id: 'HOME_TOP', label: 'أعلى الصفحة الرئيسية' },
  { id: 'HOME_MIDDLE', label: 'منتصف الصفحة الرئيسية' },
  { id: 'HOME_BOTTOM', label: 'أسفل الصفحة الرئيسية' },
  { id: 'SIDEBAR', label: 'الشريط الجانبي' },
  { id: 'CATEGORY_TOP', label: 'أعلى صفحة التصنيف' },
  { id: 'SEARCH_RESULTS', label: 'نتائج البحث' },
  { id: 'BUSINESS_PAGE', label: 'صفحة النشاط' },
];

export default function NewAdPage() {
  const router = useRouter();
  const createAd = useCreateAd();

  const { data: businessesResponse, isLoading: businessesLoading } = useBusinesses({ page: 1, limit: 200 });
  const { data: governorates, isLoading: governoratesLoading } = useGovernorates();
  const { data: categoriesResponse, isLoading: categoriesLoading } = useCategories();

  const businessOptions = useMemo(() => businessesResponse?.data ?? [], [businessesResponse]);
  const categoryOptions = useMemo(() => {
    if (!categoriesResponse) return [];
    return Array.isArray(categoriesResponse)
      ? categoriesResponse
      : categoriesResponse.data ?? [];
  }, [categoriesResponse]);

  const [titleAr, setTitleAr] = useState('');
  const [businessId, setBusinessId] = useState('');
  const [position, setPosition] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActiveNow, setIsActiveNow] = useState(true);
  const [priority, setPriority] = useState<number>(0);

  // Geographic Targeting
  const [targetAllLocations, setTargetAllLocations] = useState(true);
  const [selectedGovernorateIds, setSelectedGovernorateIds] = useState<string[]>([]);
  const [selectedCityIds, setSelectedCityIds] = useState<string[]>([]);
  const [tempGovernorateId, setTempGovernorateId] = useState('');
  const [cities, setCities] = useState<any[]>([]);
  const [tempCityId, setTempCityId] = useState('');
  
  // Category Targeting
  const [targetCategoryId, setTargetCategoryId] = useState('');

  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // تحميل المدن عند اختيار محافظة
  useEffect(() => {
    if (tempGovernorateId) {
      cityApi.getAll({ governorateId: tempGovernorateId }).then(res => {
        const data = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
        setCities(data);
      }).catch(() => setCities([]));
    } else {
      setCities([]);
    }
    setTempCityId('');
  }, [tempGovernorateId]);

  const addGovernorate = () => {
    if (tempGovernorateId && !selectedGovernorateIds.includes(tempGovernorateId)) {
      setSelectedGovernorateIds([...selectedGovernorateIds, tempGovernorateId]);
      setTempGovernorateId('');
    }
  };

  const removeGovernorate = (id: string) => {
    setSelectedGovernorateIds(selectedGovernorateIds.filter(gId => gId !== id));
  };

  const addCity = () => {
    if (tempCityId && !selectedCityIds.includes(tempCityId)) {
      setSelectedCityIds([...selectedCityIds, tempCityId]);
      setTempCityId('');
    }
  };

  const removeCity = (id: string) => {
    setSelectedCityIds(selectedCityIds.filter(cId => cId !== id));
  };

  const getGovernorateName = (id: string) => {
    return (governorates ?? []).find((g: any) => g.id === id)?.nameAr || id;
  };

  const getCityName = (id: string) => {
    return cities.find((c: any) => c.id === id)?.nameAr || id;
  };

  const canSave =
    !!titleAr.trim() &&
    !!businessId &&
    !!position &&
    !!startDate &&
    !!endDate &&
    !isUploading &&
    !createAd.isPending;

  const handlePickImage = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const res = await uploadApi.uploadImage(file, 'ads');
      setImageUrl(res.data.url);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!canSave) return;
    try {
      await createAd.mutateAsync({
        businessId: businessId || undefined,
        type: 'BANNER',
        position: position as any,
        titleAr: titleAr.trim(),
        linkUrl: linkUrl.trim() || undefined,
        imageDesktop: imageUrl.trim() || undefined,
        imageMobile: imageUrl.trim() || undefined,
        status: isActiveNow ? 'ACTIVE' : 'DRAFT',
        priority: Number.isFinite(priority) ? priority : 0,
        startDate,
        endDate,
        // Geographic targeting
        targetAllLocations,
        targetGovernorateIds: targetAllLocations ? [] : selectedGovernorateIds,
        targetCityIds: targetAllLocations ? [] : selectedCityIds,
      });
      router.push('/ads');
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
            href="/ads"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="page-title">إنشاء إعلان</h1>
            <p className="text-gray-500 mt-1">إنشاء حملة إعلانية جديدة</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-outline" type="button">
            <Eye className="w-4 h-4" />
            معاينة
          </button>
          <button className="btn btn-primary" type="button" onClick={handleSave} disabled={!canSave}>
            {createAd.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            حفظ
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="font-bold text-gray-900">معلومات الإعلان</h2>
            </div>
            <div className="card-body space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  عنوان الإعلان <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="مثال: إعلان مطعم الشام - الصفحة الرئيسية"
                  value={titleAr}
                  onChange={(e) => setTitleAr(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  النشاط التجاري <span className="text-red-500">*</span>
                </label>
                <select className="select" value={businessId} onChange={(e) => setBusinessId(e.target.value)}>
                  <option value="">اختر النشاط التجاري</option>
                  {businessesLoading ? (
                    <option value="" disabled>
                      جاري التحميل...
                    </option>
                  ) : (
                    businessOptions.map((biz: any) => (
                      <option key={biz.id} value={biz.id}>
                        {biz.nameAr}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  موضع الإعلان <span className="text-red-500">*</span>
                </label>
                <select className="select" value={position} onChange={(e) => setPosition(e.target.value)}>
                  <option value="">اختر موضع الإعلان</option>
                  {positions.map((pos) => (
                    <option key={pos.id} value={pos.id}>
                      {pos.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رابط الوجهة
                </label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://..."
                  dir="ltr"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />
                <p className="text-sm text-gray-500 mt-1">
                  اتركه فارغاً للانتقال لصفحة النشاط التجاري
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="font-bold text-gray-900">صورة الإعلان</h2>
            </div>
            <div className="card-body">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <div
                className="h-48 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-primary-500 transition-colors cursor-pointer"
                onClick={handlePickImage}
              >
                <div className="text-center">
                  {isUploading ? (
                    <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-2" />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  )}
                  <p className="text-gray-500">
                    {imageUrl ? 'تم رفع الصورة' : 'اسحب الصورة هنا أو انقر للرفع'}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">PNG, JPG حتى 2MB</p>
                  <p className="text-sm text-gray-400">الحجم الموصى به: 1200x400 بكسل</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <h2 className="font-bold text-gray-900">فترة العرض</h2>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تاريخ البداية <span className="text-red-500">*</span>
                </label>
                <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تاريخ الانتهاء <span className="text-red-500">*</span>
                </label>
                <input type="date" className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="font-bold text-gray-900">الإعدادات</h2>
            </div>
            <div className="card-body space-y-4">
              <div className="flex items-center justify-between py-2">
                <label className="text-gray-700">نشط فوراً</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={isActiveNow}
                    onChange={(e) => setIsActiveNow(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الأولوية
                </label>
                <input
                  type="number"
                  className="input"
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value || '0', 10))}
                  min={0}
                  max={100}
                />
                <p className="text-sm text-gray-500 mt-1">الأعلى = أولوية أكبر</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-400" />
              <h2 className="font-bold text-gray-900">الاستهداف الجغرافي</h2>
            </div>
            <div className="card-body space-y-4">
              <div className="flex items-center justify-between py-2">
                <label className="text-gray-700 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  جميع المناطق
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={targetAllLocations}
                    onChange={(e) => setTargetAllLocations(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              {!targetAllLocations && (
                <>
                  <div className="pt-3 border-t border-gray-100">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      استهداف محافظات
                    </label>
                    <div className="flex gap-2">
                      <select
                        className="select flex-1"
                        value={tempGovernorateId}
                        onChange={(e) => setTempGovernorateId(e.target.value)}
                        disabled={governoratesLoading}
                      >
                        <option value="">اختر محافظة</option>
                        {(governorates ?? []).map((g: any) => (
                          <option key={g.id} value={g.id} disabled={selectedGovernorateIds.includes(g.id)}>
                            {g.nameAr}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={addGovernorate}
                        disabled={!tempGovernorateId}
                        className="btn btn-primary px-3"
                      >
                        +
                      </button>
                    </div>
                    {selectedGovernorateIds.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {selectedGovernorateIds.map(id => (
                          <span key={id} className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                            {getGovernorateName(id)}
                            <button type="button" onClick={() => removeGovernorate(id)} className="hover:text-primary-900">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-gray-100">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      استهداف مدن (اختياري)
                    </label>
                    <div className="flex gap-2">
                      <select
                        className="select flex-1"
                        value={tempCityId}
                        onChange={(e) => setTempCityId(e.target.value)}
                        disabled={!tempGovernorateId}
                      >
                        <option value="">{tempGovernorateId ? 'اختر مدينة' : 'اختر محافظة أولاً'}</option>
                        {cities.map((c: any) => (
                          <option key={c.id} value={c.id} disabled={selectedCityIds.includes(c.id)}>
                            {c.nameAr}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={addCity}
                        disabled={!tempCityId}
                        className="btn btn-primary px-3"
                      >
                        +
                      </button>
                    </div>
                    {selectedCityIds.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {selectedCityIds.map(id => (
                          <span key={id} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                            {getCityName(id)}
                            <button type="button" onClick={() => removeCity(id)} className="hover:text-blue-900">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
              
              <p className="text-xs text-gray-500 mt-2">
                الإعلان سيظهر للمستخدمين في المناطق المحددة فقط
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="font-bold text-gray-900">استهداف التصنيف</h2>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  التصنيف (اختياري)
                </label>
                <select
                  className="select"
                  value={targetCategoryId}
                  onChange={(e) => setTargetCategoryId(e.target.value)}
                  disabled={categoriesLoading}
                >
                  <option value="">كل التصنيفات</option>
                  {categoryOptions.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.nameAr}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
