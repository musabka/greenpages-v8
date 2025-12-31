'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit, Trash2, MapPin, Building2, Loader2 } from 'lucide-react';
import { useGovernorates, useDeleteGovernorate } from '@/lib/hooks';

export default function GovernoratesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: governoratesResponse, isLoading } = useGovernorates();
  const deleteGovernorate = useDeleteGovernorate();

  const governorates = Array.isArray(governoratesResponse)
    ? governoratesResponse
    : Array.isArray((governoratesResponse as any)?.data)
      ? (governoratesResponse as any).data
      : [];

  const query = searchQuery.trim();
  const queryLower = query.toLowerCase();

  const filteredGovernorates = query
    ? governorates.filter((gov: any) => {
        const nameAr = gov.nameAr ?? '';
        const nameEn = (gov.nameEn ?? '').toLowerCase();
        const slug = (gov.slug ?? '').toLowerCase();
        return nameAr.includes(query) || nameEn.includes(queryLower) || slug.includes(queryLower);
      })
    : governorates;

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`هل أنت متأكد من حذف "${name}"؟`)) {
      try {
        await deleteGovernorate.mutateAsync(id);
      } catch (error) {
        // Error handled in hook
      }
    }
  };

  const totalCities = filteredGovernorates.reduce((sum: number, g: any) => sum + (g._count?.cities ?? 0), 0);
  const totalBusinesses = filteredGovernorates.reduce((sum: number, g: any) => sum + (g._count?.businesses ?? 0), 0);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">المحافظات</h1>
          <p className="text-gray-500 mt-1">إدارة المحافظات السورية</p>
        </div>
        <Link href="/governorates/new" className="btn btn-primary">
          <Plus className="w-4 h-4" />
          إضافة محافظة
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
              <p className="stat-card-value">{filteredGovernorates.length}</p>
              <p className="stat-card-label">محافظة</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-card-icon bg-blue-100 text-blue-600">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <p className="stat-card-value">{totalCities}</p>
              <p className="stat-card-label">مدينة</p>
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

      {/* Search */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="relative max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث عن محافظة..."
              className="input pr-10"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : filteredGovernorates.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            لا توجد محافظات
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>المحافظة</th>
                <th>الرمز</th>
                <th>المدن</th>
                <th>الأنشطة</th>
                <th>الحالة</th>
                <th className="w-20">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredGovernorates.map((gov: any) => (
                <tr key={gov.id}>
                  <td>
                    <div>
                      <span className="font-medium text-gray-900">{gov.nameAr}</span>
                      <span className="text-sm text-gray-500 block">{gov.nameEn}</span>
                    </div>
                  </td>
                  <td>
                    <span className="font-mono text-gray-600">{gov.slug}</span>
                  </td>
                  <td>
                    <Link
                      href={`/cities?governorateId=${gov.id}`}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      {gov._count?.cities ?? 0} مدينة
                    </Link>
                  </td>
                  <td className="text-gray-600">{(gov._count?.businesses ?? 0).toLocaleString()}</td>
                  <td>
                    <span
                      className={`badge ${gov.isActive ? 'badge-success' : 'badge-gray'}`}
                    >
                      {gov.isActive ? 'نشط' : 'معطل'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/governorates/${gov.id}/edit`}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button 
                        onClick={() => handleDelete(gov.id, gov.nameAr)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
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
