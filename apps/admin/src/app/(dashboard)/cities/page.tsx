'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit, Trash2, MapPin, Building2, Loader2 } from 'lucide-react';
import { useCities, useGovernorates, useDeleteCity } from '@/lib/hooks';

export default function CitiesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [governorateFilter, setGovernorateFilter] = useState('');

  const { data: citiesResponse, isLoading } = useCities(governorateFilter || undefined);
  const { data: governoratesResponse } = useGovernorates();
  const deleteCity = useDeleteCity();

  const cities = Array.isArray(citiesResponse)
    ? citiesResponse
    : Array.isArray((citiesResponse as any)?.data)
      ? (citiesResponse as any).data
      : [];

  const governorates = Array.isArray(governoratesResponse)
    ? governoratesResponse
    : Array.isArray((governoratesResponse as any)?.data)
      ? (governoratesResponse as any).data
      : [];

  const query = searchQuery.trim();
  const queryLower = query.toLowerCase();

  const filteredCities = query
    ? cities.filter((city: any) => {
        const nameAr = city.nameAr ?? '';
        const nameEn = (city.nameEn ?? '').toLowerCase();
        return nameAr.includes(query) || nameEn.includes(queryLower);
      })
    : cities;

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`هل أنت متأكد من حذف "${name}"؟`)) {
      try {
        await deleteCity.mutateAsync(id);
      } catch (error) {
        // Error handled in hook
      }
    }
  };

  const totalDistricts = filteredCities.reduce((sum: number, c: any) => sum + (c._count?.districts ?? 0), 0);
  const totalBusinesses = filteredCities.reduce((sum: number, c: any) => sum + (c._count?.businesses ?? 0), 0);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">المدن</h1>
          <p className="text-gray-500 mt-1">إدارة المدن والمناطق</p>
        </div>
        <Link href="/cities/new" className="btn btn-primary">
          <Plus className="w-4 h-4" />
          إضافة مدينة
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-card-icon bg-primary-100 text-primary-600">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <p className="stat-card-value">{cities.length}</p>
              <p className="stat-card-label">مدينة</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-card-icon bg-blue-100 text-blue-600">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <p className="stat-card-value">{totalDistricts}</p>
              <p className="stat-card-label">حي</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-card-icon bg-amber-100 text-amber-600">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="stat-card-value">{totalBusinesses.toLocaleString()}</p>
              <p className="stat-card-label">نشاط تجاري</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="البحث عن مدينة..."
                  className="input pr-10"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>
            <select
              value={governorateFilter}
              onChange={(e) => setGovernorateFilter(e.target.value)}
              className="select w-48"
            >
              <option value="">كل المحافظات</option>
              {governorates.map((gov: any) => (
                <option key={gov.id} value={gov.id}>
                  {gov.nameAr}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : filteredCities.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد مدن</p>
          </div>
        ) : (
        <table className="table">
          <thead>
            <tr>
              <th>المدينة</th>
              <th>المحافظة</th>
              <th>الأحياء</th>
              <th>الأنشطة</th>
              <th>الحالة</th>
              <th className="w-20">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredCities.map((city: any) => (
              <tr key={city.id}>
                <td>
                  <div>
                    <span className="font-medium text-gray-900">{city.nameAr}</span>
                    <span className="text-sm text-gray-500 block">{city.nameEn}</span>
                  </div>
                </td>
                <td className="text-gray-600">{city.governorate?.nameAr ?? '-'}</td>
                <td>
                  <Link
                    href={`/districts?cityId=${city.id}`}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    {city._count?.districts ?? 0} حي
                  </Link>
                </td>
                <td className="text-gray-600">{(city._count?.businesses ?? 0).toLocaleString()}</td>
                <td>
                  <span
                    className={`badge ${city.isActive ? 'badge-success' : 'badge-gray'}`}
                  >
                    {city.isActive ? 'نشط' : 'معطل'}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/cities/${city.id}/edit`}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button 
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      onClick={() => handleDelete(city.id, city.nameAr)}
                      disabled={deleteCity.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
}
