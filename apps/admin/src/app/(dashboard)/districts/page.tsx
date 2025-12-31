'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit, Trash2, MapPin, Building2, Loader2 } from 'lucide-react';
import { useDistricts, useCities, useDeleteDistrict } from '@/lib/hooks';

export default function DistrictsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('');

  const { data: districtsResponse, isLoading } = useDistricts(cityFilter || undefined);
  const { data: citiesResponse } = useCities();
  const deleteDistrict = useDeleteDistrict();

  const districts = Array.isArray(districtsResponse)
    ? districtsResponse
    : Array.isArray((districtsResponse as any)?.data)
      ? (districtsResponse as any).data
      : [];

  const cities = Array.isArray(citiesResponse)
    ? citiesResponse
    : Array.isArray((citiesResponse as any)?.data)
      ? (citiesResponse as any).data
      : [];

  const query = searchQuery.trim();
  const queryLower = query.toLowerCase();

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`هل أنت متأكد من حذف "${name}"؟`)) {
      try {
        await deleteDistrict.mutateAsync(id);
      } catch (error) {
        // Error handled in hook
      }
    }
  };

  const filteredDistricts = query
    ? districts.filter((district: any) => {
        const nameAr = district.nameAr ?? '';
        const nameEn = (district.nameEn ?? '').toLowerCase();
        return nameAr.includes(query) || nameEn.includes(queryLower);
      })
    : districts;

  const totalBusinesses = filteredDistricts.reduce((sum: number, d: any) => sum + (d._count?.businesses ?? 0), 0);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">الأحياء</h1>
          <p className="text-gray-500 mt-1">إدارة الأحياء والمناطق الفرعية</p>
        </div>
        <Link href="/districts/new" className="btn btn-primary">
          <Plus className="w-4 h-4" />
          إضافة حي
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-card-icon bg-primary-100 text-primary-600">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <p className="stat-card-value">{districts.length}</p>
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
                  placeholder="البحث عن حي..."
                  className="input pr-10"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="select w-48"
            >
              <option value="">كل المدن</option>
              {cities.map((city: any) => (
                <option key={city.id} value={city.id}>
                  {city.nameAr}
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
        ) : filteredDistricts.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد أحياء</p>
          </div>
        ) : (
        <table className="table">
          <thead>
            <tr>
              <th>الحي</th>
              <th>المدينة</th>
              <th>المحافظة</th>
              <th>الأنشطة</th>
              <th>الحالة</th>
              <th className="w-20">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredDistricts.map((district: any) => (
              <tr key={district.id}>
                <td>
                  <div>
                    <span className="font-medium text-gray-900">{district.nameAr}</span>
                    <span className="text-sm text-gray-500 block">{district.nameEn}</span>
                  </div>
                </td>
                <td className="text-gray-600">{district.city?.nameAr ?? '-'}</td>
                <td className="text-gray-600">{district.city?.governorate?.nameAr ?? '-'}</td>
                <td className="text-gray-600">{(district._count?.businesses ?? 0).toLocaleString()}</td>
                <td>
                  <span
                    className={`badge ${district.isActive ? 'badge-success' : 'badge-gray'}`}
                  >
                    {district.isActive ? 'نشط' : 'معطل'}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/districts/${district.id}/edit`}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button 
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      onClick={() => handleDelete(district.id, district.nameAr)}
                      disabled={deleteDistrict.isPending}
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
