'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Building2,
  ChevronLeft,
  ChevronRight,
  Download,
  BadgeCheck,
  Loader2,
} from 'lucide-react';
import { useBusinesses, useDeleteBusiness, useApproveBusiness, useRejectBusiness } from '@/lib/hooks';
import toast from 'react-hot-toast';

const statusConfig = {
  PENDING: { label: 'قيد المراجعة', class: 'badge-warning' },
  APPROVED: { label: 'مُعتمد', class: 'badge-success' },
  REJECTED: { label: 'مرفوض', class: 'badge-danger' },
  SUSPENDED: { label: 'موقوف', class: 'badge-gray' },
};

export default function BusinessesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useBusinesses({
    page,
    limit: 20,
    search: searchQuery || undefined,
    status: statusFilter || undefined,
  });

  const deleteBusiness = useDeleteBusiness();
  const approveBusiness = useApproveBusiness();
  const rejectBusiness = useRejectBusiness();

  const businesses = data?.data ?? [];
  const meta = data?.meta;

  const toggleSelectAll = () => {
    if (selectedRows.length === businesses.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(businesses.map((b: any) => b.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`هل أنت متأكد من حذف "${name}"؟`)) {
      try {
        await deleteBusiness.mutateAsync(id);
      } catch (error) {
        // Error handled in hook
      }
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveBusiness.mutateAsync(id);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectBusiness.mutateAsync({ id });
    } catch (error) {
      // Error handled in hook
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">الأنشطة التجارية</h1>
          <p className="text-gray-500 mt-1">إدارة جميع الأنشطة التجارية المسجلة</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-outline">
            <Download className="w-4 h-4" />
            تصدير
          </button>
          <Link href="/businesses/new" className="btn btn-primary">
            <Plus className="w-4 h-4" />
            إضافة نشاط
          </Link>
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
                  placeholder="البحث عن نشاط تجاري..."
                  className="input pr-10"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>
            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="select w-40"
              >
                <option value="">كل الحالات</option>
                <option value="PENDING">قيد المراجعة</option>
                <option value="APPROVED">مُعتمد</option>
                <option value="REJECTED">مرفوض</option>
                <option value="SUSPENDED">موقوف</option>
              </select>
              <button className="btn btn-outline">
                <Filter className="w-4 h-4" />
                فلاتر متقدمة
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedRows.length > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-4 flex items-center justify-between">
          <span className="text-primary-700">
            تم تحديد {selectedRows.length} عنصر
          </span>
          <div className="flex items-center gap-2">
            <button className="btn btn-sm bg-green-600 text-white hover:bg-green-700">
              <CheckCircle className="w-4 h-4" />
              اعتماد
            </button>
            <button className="btn btn-sm bg-red-600 text-white hover:bg-red-700">
              <XCircle className="w-4 h-4" />
              رفض
            </button>
            <button className="btn btn-sm btn-danger">
              <Trash2 className="w-4 h-4" />
              حذف
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="table-container">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            لا يوجد أنشطة تجارية
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th className="w-10">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === businesses.length && businesses.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th>النشاط التجاري</th>
                <th>التصنيف</th>
                <th>المدينة</th>
                <th>الحالة</th>
                <th>المشاهدات</th>
                <th>التقييم</th>
                <th>التاريخ</th>
                <th className="w-20">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {businesses.map((business: any) => (
                (() => {
                  const ratingRaw = business.averageRating;
                  const ratingNumber =
                    typeof ratingRaw === 'number'
                      ? ratingRaw
                      : ratingRaw != null
                        ? Number(ratingRaw)
                        : 0;
                  const ratingText = Number.isFinite(ratingNumber)
                    ? ratingNumber.toFixed(1)
                    : '0.0';

                  return (
                <tr key={business.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(business.id)}
                      onChange={() => toggleSelect(business.id)}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {business.nameAr}
                          </span>
                          {business.isVerified && (
                            <BadgeCheck className="w-4 h-4 text-primary-500" />
                          )}
                          {business.isFeatured && (
                            <span className="badge badge-warning text-xs">مميز</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="text-gray-600">{business.category?.nameAr}</td>
                  <td className="text-gray-600">{business.city?.nameAr ?? business.governorate?.nameAr}</td>
                  <td>
                    <span
                      className={`badge ${
                        statusConfig[business.status as keyof typeof statusConfig]?.class ?? 'badge-gray'
                      }`}
                    >
                      {statusConfig[business.status as keyof typeof statusConfig]?.label ?? business.status}
                    </span>
                  </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {(() => {
                          const categories = (business as any)?.categories as any[] | undefined;
                          const primary = categories?.find((c) => c.isPrimary)?.category ?? categories?.[0]?.category;
                          return primary?.nameAr || 'غير محدد';
                        })()}
                      </div>
                    </td>
                  <td className="text-gray-600">{(business.viewsCount ?? 0).toLocaleString()}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <span className="text-amber-500">★</span>
                      <span>{ratingText}</span>
                      <span className="text-gray-400">({business.reviewsCount ?? 0})</span>
                    </div>
                  </td>
                  <td className="text-gray-500">{new Date(business.createdAt).toLocaleDateString('ar-SY')}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      {business.status === 'PENDING' && (
                        <>
                          <button 
                            onClick={() => handleApprove(business.id)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleReject(business.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <Link
                        href={`/businesses/${business.id}`}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/businesses/${business.id}/edit`}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button 
                        onClick={() => handleDelete(business.id, business.nameAr)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                  );
                })()
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {meta && (meta.totalPages ?? 1) > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-500">
            عرض {((page - 1) * 20) + 1} - {Math.min(page * 20, meta.total)} من {meta.total} نتيجة
          </p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn btn-outline btn-sm disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-sm text-gray-600">
              صفحة {page} من {meta.totalPages ?? 1}
            </span>
            <button 
              onClick={() => setPage(p => Math.min(meta.totalPages ?? 1, p + 1))}
              disabled={page === (meta.totalPages ?? 1)}
              className="btn btn-outline btn-sm disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
