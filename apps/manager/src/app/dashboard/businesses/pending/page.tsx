'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  MapPin,
  Calendar,
  User,
  ArrowRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';

interface PendingBusiness {
  id: string;
  nameAr: string;
  phone: string;
  email?: string;
  governorate: { nameAr: string };
  city: { nameAr: string };
  district?: { nameAr: string };
  categories?: Array<{ category: { nameAr: string } }>;
  createdAt: string;
}

export default function PendingBusinessesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['manager-pending-businesses', page],
    queryFn: async () => {
      const response = await api.get(
        `/governorate-manager/businesses/pending?page=${page}&limit=${limit}`
      );
      return response.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (businessId: string) => {
      await api.patch(`/governorate-manager/businesses/${businessId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-pending-businesses'] });
      queryClient.invalidateQueries({ queryKey: ['manager-dashboard'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (businessId: string) => {
      await api.patch(`/governorate-manager/businesses/${businessId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-pending-businesses'] });
      queryClient.invalidateQueries({ queryKey: ['manager-dashboard'] });
    },
  });

  const handleApprove = async (businessId: string, businessName: string) => {
    if (confirm(`هل أنت متأكد من الموافقة على "${businessName}"؟`)) {
      try {
        await approveMutation.mutateAsync(businessId);
      } catch (error) {
        alert('حدث خطأ أثناء الموافقة');
      }
    }
  };

  const handleReject = async (businessId: string, businessName: string) => {
    if (confirm(`هل أنت متأكد من رفض "${businessName}"؟`)) {
      try {
        await rejectMutation.mutateAsync(businessId);
      } catch (error) {
        alert('حدث خطأ أثناء الرفض');
      }
    }
  };

  const businesses = data?.data || [];
  const total = data?.meta?.total || 0;
  const totalPages = data?.meta?.totalPages || 1;

  const filteredBusinesses = businesses.filter((business: PendingBusiness) =>
    !search ||
    business.nameAr.toLowerCase().includes(search.toLowerCase()) ||
    business.phone.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الأعمال المعلقة</h1>
          <p className="text-gray-500">النشاطات التجارية بانتظار الموافقة</p>
        </div>
        <Link
          href="/dashboard/businesses"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          <ArrowRight className="w-5 h-5" />
          العودة
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Building2 className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">بانتظار الموافقة</p>
              <p className="text-xl font-bold text-gray-900">{total}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="البحث بالاسم أو رقم الهاتف..."
            className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredBusinesses.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد نشاطات معلقة</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      النشاط
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      الموقع
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      التصنيف
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      تاريخ الإضافة
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBusinesses.map((business: PendingBusiness) => (
                    <tr key={business.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{business.nameAr}</p>
                          <p className="text-sm text-gray-500">{business.phone}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>
                            {business.governorate.nameAr} - {business.city.nameAr}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-600">
                          {business.categories?.[0]?.category?.nameAr || '-'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(business.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/businesses/${business.id}`}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="عرض التفاصيل"
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
                          </Link>
                          <button
                            onClick={() => handleApprove(business.id, business.nameAr)}
                            disabled={approveMutation.isPending}
                            className="p-2 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
                            title="موافقة"
                          >
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </button>
                          <button
                            onClick={() => handleReject(business.id, business.nameAr)}
                            disabled={rejectMutation.isPending}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                            title="رفض"
                          >
                            <XCircle className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-gray-100">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  السابق
                </button>
                <span className="text-sm text-gray-600">
                  صفحة {page} من {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  التالي
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
