'use client';

import { useState, useEffect } from 'react';
import {
  RefreshCw,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar,
  DollarSign,
  Building2,
  CheckCircle,
  Clock,
  XCircle,
  User,
} from 'lucide-react';
import { api } from '@/lib/api';

interface Renewal {
  id: string;
  business: {
    id: string;
    name: string;
  };
  package: {
    name: string;
    price: number;
  };
  agent?: {
    user: { name: string };
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  expiresAt: string;
  createdAt: string;
  amount: number;
}

export default function ManagerRenewalsPage() {
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    fetchRenewals();
  }, [page, statusFilter]);

  const fetchRenewals = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (search) params.append('search', search);

      const response = await api.get(`/governorate-manager/renewals?${params}`);
      setRenewals(response.data.data || response.data);
      setTotal(response.data.total || response.data.length);
    } catch (error) {
      console.error('Failed to fetch renewals:', error);
      // بيانات تجريبية
      setRenewals([
        {
          id: '1',
          business: { id: '1', name: 'مطعم البيت الدمشقي' },
          package: { name: 'الباقة الذهبية', price: 150000 },
          agent: { user: { name: 'أحمد محمد' } },
          status: 'PENDING',
          expiresAt: '2024-01-15',
          createdAt: '2024-01-01',
          amount: 150000,
        },
        {
          id: '2',
          business: { id: '2', name: 'صيدلية النور' },
          package: { name: 'الباقة الفضية', price: 75000 },
          agent: { user: { name: 'محمد علي' } },
          status: 'APPROVED',
          expiresAt: '2024-01-20',
          createdAt: '2024-01-02',
          amount: 75000,
        },
        {
          id: '3',
          business: { id: '3', name: 'مكتبة العلم' },
          package: { name: 'الباقة البرونزية', price: 35000 },
          status: 'EXPIRED',
          expiresAt: '2024-01-01',
          createdAt: '2023-12-15',
          amount: 35000,
        },
      ]);
      setTotal(3);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRenewals();
  };

  const handleApprove = async (id: string) => {
    try {
      await api.put(`/governorate-manager/renewals/${id}/approve`);
      fetchRenewals();
    } catch (error) {
      console.error('Failed to approve renewal:', error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.put(`/governorate-manager/renewals/${id}/reject`);
      fetchRenewals();
    } catch (error) {
      console.error('Failed to reject renewal:', error);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-700';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'REJECTED':
        return 'bg-red-100 text-red-700';
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'موافق عليه';
      case 'PENDING':
        return 'قيد الانتظار';
      case 'REJECTED':
        return 'مرفوض';
      case 'EXPIRED':
        return 'منتهي';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return CheckCircle;
      case 'PENDING':
        return Clock;
      case 'REJECTED':
      case 'EXPIRED':
        return XCircle;
      default:
        return Clock;
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">التجديدات</h1>
          <p className="text-gray-500">إدارة طلبات التجديد</p>
        </div>
        <div className="text-sm text-gray-500">
          إجمالي: {total} طلب
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="البحث باسم النشاط..."
              className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">جميع الحالات</option>
              <option value="PENDING">قيد الانتظار</option>
              <option value="APPROVED">موافق عليه</option>
              <option value="REJECTED">مرفوض</option>
              <option value="EXPIRED">منتهي</option>
            </select>
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            بحث
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : renewals.length === 0 ? (
          <div className="text-center py-12">
            <RefreshCw className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد طلبات تجديد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                    النشاط
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                    الباقة
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                    المبلغ
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                    المندوب
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                    تاريخ الانتهاء
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                    الحالة
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {renewals.map((renewal) => {
                  const StatusIcon = getStatusIcon(renewal.status);
                  return (
                    <tr key={renewal.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {renewal.business.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {renewal.package.name}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-gray-900">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          {renewal.amount.toLocaleString()} ل.س
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {renewal.agent ? (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <User className="w-4 h-4" />
                            {renewal.agent.user.name}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {new Date(renewal.expiresAt).toLocaleDateString('ar-SA')}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusStyle(
                            renewal.status
                          )}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {getStatusText(renewal.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {renewal.status === 'PENDING' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApprove(renewal.id)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="موافقة"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleReject(renewal.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="رفض"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <p className="text-sm text-gray-500">
              عرض {(page - 1) * limit + 1} - {Math.min(page * limit, total)} من {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-600">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
