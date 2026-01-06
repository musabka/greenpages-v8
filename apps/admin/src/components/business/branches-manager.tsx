'use client';

import { useState, useMemo } from 'react';
import { Plus, X, Building2, Loader2, Map, MapPin } from 'lucide-react';
import type { City, District, Governorate, BusinessBranch } from '@/lib/api';
import { LocationPicker } from '@/components/map/location-picker';

interface BranchesManagerProps {
  branches: BusinessBranch[];
  onChange: (branches: BusinessBranch[]) => void;
  governorates: Governorate[];
  cities: City[];
  districts: District[];
  selectedGovernorate?: string;
  onGovernorateChange?: (govId: string) => void;
  selectedCity?: string;
  onCityChange?: (cityId: string) => void;
  maxBranches?: number;
}

export function BranchesManager({
  branches,
  onChange,
  governorates,
  cities,
  districts,
  selectedGovernorate = '',
  onGovernorateChange,
  selectedCity = '',
  onCityChange,
  maxBranches = 1,
}: BranchesManagerProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const canAddMore = branches.length < maxBranches;

  const addBranch = () => {
    if (!canAddMore) {
      alert(`⚠️ وصلت للحد الأقصى المسموح به في الباقة الحالية (${maxBranches} ${maxBranches === 1 ? 'فرع' : 'فروع'})`);
      return;
    }
    
    const defaultCityId = selectedCity || (branches[0]?.cityId) || '';
    
    if (!defaultCityId) {
      alert('⚠️ الرجاء تحديد المدينة أولاً في تبويب "الموقع" قبل إضافة فرع');
      return;
    }
    
    onChange([
      ...branches,
      {
        id: `temp-${Date.now()}`,
        businessId: '',
        nameAr: '',
        nameEn: '',
        cityId: defaultCityId,
        districtId: '',
        addressAr: '',
        addressEn: '',
        latitude: undefined,
        longitude: undefined,
        phone: '',
        isMain: false,
        isActive: true,
        sortOrder: branches.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
  };

  const removeBranch = (index: number) => {
    onChange(branches.filter((_, i) => i !== index));
  };

  const updateBranch = (index: number, field: keyof BusinessBranch, value: any) => {
    const updated = [...branches];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const updateBranchFields = (index: number, patch: Partial<BusinessBranch>) => {
    const updated = [...branches];
    updated[index] = { ...updated[index], ...patch };
    onChange(updated);
  };

  const getCityName = (cityId: string) => {
    const city = cities.find((c) => c.id === cityId);
    return city?.nameAr || '-';
  };

  const getDistrictName = (districtId?: string | null) => {
    if (!districtId) return '-';
    const district = districts.find((d) => d.id === districtId);
    return district?.nameAr || '-';
  };

  return (
    <div className="space-y-4">
      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <p className="font-semibold mb-1">💡 ملاحظة هامة:</p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>عنوان النشاط الرئيسي:</strong> يتم تحديده في تبويب "الموقع" ويظهر كعنوان أساسي للنشاط</li>
          <li><strong>الفروع:</strong> تُستخدم عندما يكون للنشاط مواقع إضافية (فروع متعددة في مدن مختلفة)</li>
          <li>إذا لم يكن لديك فروع، لا داعي لإضافة أي شيء هنا - سيُعرض عنوان النشاط الرئيسي فقط</li>
        </ul>
      </div>
      
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          الفروع ({branches.length} / {maxBranches})
        </h3>
        <button
          onClick={addBranch}
          disabled={!canAddMore}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            canAddMore 
              ? 'bg-primary-500 text-white hover:bg-primary-600' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Plus className="w-4 h-4" />
          إضافة فرع
        </button>
      </div>

      {!canAddMore && branches.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
          <span className="text-2xl">✋</span>
          <p className="text-sm text-amber-800">
            <strong>وصلت للحد الأقصى:</strong> الباقة الحالية تسمح بإضافة {maxBranches} {maxBranches === 1 ? 'فرع' : 'فروع'} فقط. لإضافة المزيد، يرجى ترقية الباقة.
          </p>
        </div>
      )}

      {branches.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium mb-1">لا توجد فروع مضافة</p>
          <p className="text-sm text-gray-500 mb-4">
            عنوان النشاط الرئيسي المحدد في تبويب "الموقع" سيظهر كعنوان أساسي
          </p>
          <button
            onClick={addBranch}
            disabled={!canAddMore}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              canAddMore 
                ? 'bg-primary-500 text-white hover:bg-primary-600' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Plus className="w-4 h-4" />
            إضافة أول فرع
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {branches.map((branch, index) => (
            <div key={`${branch.id}-${index}`} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Branch Header - Summary */}
              <div
                className="bg-gray-50 p-4 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900">{branch.nameAr || 'فرع بدون اسم'}</h4>
                    {!branch.isActive && <span className="text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded">معطّل</span>}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {getCityName(branch.cityId)} • {getDistrictName(branch.districtId)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {typeof branch.latitude === 'number' && typeof branch.longitude === 'number' && (
                    <a
                      href={`https://www.google.com/maps?q=${branch.latitude},${branch.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      title="عرض على خريطة غوغل"
                    >
                      <MapPin className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeBranch(index);
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Branch Details - Expanded */}
              {expandedIndex === index && (
                <div className="border-t border-gray-200 p-4 bg-white space-y-4">
                  {/* Active Checkbox */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={`active-${index}`}
                      checked={branch.isActive}
                      onChange={(e) => updateBranch(index, 'isActive', e.target.checked)}
                      className="w-4 h-4 rounded text-primary-500"
                    />
                    <label htmlFor={`active-${index}`} className="text-sm font-medium text-gray-700">
                      نشط
                    </label>
                  </div>

                  {/* Names */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        اسم الفرع (عربي) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={branch.nameAr}
                        onChange={(e) => updateBranch(index, 'nameAr', e.target.value)}
                        placeholder="مثال: فرع دمشق"
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                          !branch.nameAr?.trim() 
                            ? 'border-red-300 bg-red-50' 
                            : 'border-gray-300'
                        }`}
                      />
                      {!branch.nameAr?.trim() && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <span>⚠️</span>
                          <span>الاسم العربي مطلوب - لن يتم حفظ الفرع بدونه</span>
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        اسم الفرع (إنجليزي)
                      </label>
                      <input
                        type="text"
                        value={branch.nameEn || ''}
                        onChange={(e) => updateBranch(index, 'nameEn', e.target.value)}
                        placeholder="e.g., Damascus Branch"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  {/* Location Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        المدينة
                      </label>
                      <select
                        value={branch.cityId}
                        onChange={(e) => updateBranch(index, 'cityId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">اختر المدينة</option>
                        {cities.map((city) => (
                          <option key={city.id} value={city.id}>
                            {city.nameAr}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        الحي/المنطقة
                      </label>
                      <select
                        value={branch.districtId || ''}
                        onChange={(e) => updateBranch(index, 'districtId', e.target.value || null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">اختر الحي (اختياري)</option>
                        {districts.map((district) => (
                          <option key={district.id} value={district.id}>
                            {district.nameAr}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        العنوان (عربي)
                      </label>
                      <textarea
                        value={branch.addressAr || ''}
                        onChange={(e) => updateBranch(index, 'addressAr', e.target.value)}
                        placeholder="شارع الرئيس، البناء رقم 25"
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        العنوان (إنجليزي)
                      </label>
                      <textarea
                        value={branch.addressEn || ''}
                        onChange={(e) => updateBranch(index, 'addressEn', e.target.value)}
                        placeholder="President St., Building 25"
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                      />
                    </div>
                  </div>

                  {/* Coordinates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        خط العرض (Latitude)
                      </label>
                      <input
                        type="text"
                        value={typeof branch.latitude === 'number' ? branch.latitude.toFixed(6) : ''}
                        onChange={(e) => {
                          const val = e.target.value ? parseFloat(e.target.value) : undefined;
                          updateBranch(index, 'latitude', val);
                        }}
                        placeholder="33.5138"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        خط الطول (Longitude)
                      </label>
                      <input
                        type="text"
                        value={typeof branch.longitude === 'number' ? branch.longitude.toFixed(6) : ''}
                        onChange={(e) => {
                          const val = e.target.value ? parseFloat(e.target.value) : undefined;
                          updateBranch(index, 'longitude', val);
                        }}
                        placeholder="36.2765"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  {/* Map */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      تحديد الموقع على الخريطة
                    </label>
                    <LocationPicker
                      latitude={typeof branch.latitude === 'number' ? branch.latitude : undefined}
                      longitude={typeof branch.longitude === 'number' ? branch.longitude : undefined}
                      onLocationChange={(receivedLat, receivedLng) => {
                        // Important: update both fields in a single state update to avoid clobbering
                        updateBranchFields(index, { latitude: receivedLat, longitude: receivedLng });
                      }}
                      height="350px"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      رقم الهاتف
                    </label>
                    <input
                      type="tel"
                      value={branch.phone || ''}
                      onChange={(e) => updateBranch(index, 'phone', e.target.value)}
                      placeholder="+963 11 123 4567"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {/* Sort Order */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ترتيب العرض
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={branch.sortOrder}
                      onChange={(e) => updateBranch(index, 'sortOrder', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
