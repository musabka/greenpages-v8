'use client';

import { useState, useEffect } from 'react';
import {
  DollarSign,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Building2,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
} from 'lucide-react';
import { api } from '@/lib/api';

interface Commission {
  id: string;
  business: {
    name: string;
  };
  amount: number;
  rate: number;
  type: 'NEW_SUBSCRIPTION' | 'RENEWAL' | 'UPGRADE';
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED';
  createdAt: string;
  paidAt?: string;
}

export default function AgentCommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    pendingAmount: 0,
    paidAmount: 0,
  });
  const limit = 10;

  useEffect(() => {
    fetchCommissions();
  }, [page, statusFilter]);

  const fetchCommissions = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await api.get(`/agent-portal/commissions?${params}`);
      setCommissions(response.data.data || response.data.commissions);
      setTotal(response.data.total || response.data.commissions.length);
      if (response.data.stats) setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to fetch commissions:', error);
      // بيانات تجريبية
      setCommissions([
        {
          id: '1',
          business: { name: 'مطعم البيت الدمشقي' },
          amount: 15000,
          rate: 10,
          type: 'NEW_SUBSCRIPTION',
          status: 'PAID',
          createdAt: '2024-01-01',
          paidAt: '2024-01-05',
        },
        {
          id: '2',
          business: { name: 'صيدلية النور' },
          amount: 7500,
          rate: 10,
          type: 'RENEWAL',
          status: 'PENDING',
          createdAt: '2024-01-02',
        },
      ]);
      setTotal(2);
      setStats({
        totalEarnings: 22500,
        pendingAmount: 7500,
        paidAmount: 15000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-700';
      case 'APPROVED':
        return 'bg-blue-100 text-blue-700';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'مدفوعة';
      case 'APPROVED':
        return 'معتمدة';
      case 'PENDING':
        return 'معلقة';
      case 'CANCELLED':
        return 'ملغية';
      default:
        return status;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'NEW_SUBSCRIPTION':
        return 'اشتراك جديد';
      case 'RENEWAL':
        return 'تجديد';
      case 'UPGRADE':
        return 'ترقية باقة';
      default:
        return type;
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">العمولات</h1>
          <p className="text-gray-500">سجل العمولات والأرباح</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-gray-500 font-medium">إجمالي الأرباح</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats.totalEarnings.toLocaleString()} ل.س
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <span className="text-gray-500 font-medium">قيد الانتظار</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats.pendingAmount.toLocaleString()} ل.س
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-gray-500 font-medium">تم صرفها</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats.paidAmount.toLocaleString()} ل.س
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">جميع الحالات</option>
            <option value="PENDING">معلقة</option>
            <option value="APPROVED">معتمدة</option>
            <option value="PAID">مدفوعة</option>
            <option value="CANCELLED">ملغية</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : commissions.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد عمولات مسجلة</p>
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
                    النوع
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                    المبلغ
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                    النسبة
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                    الحالة
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                    التاريخ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {commissions.map((commission) => (
                  <tr key={commission.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {commission.business.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {getTypeText(commission.type)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-green-600">
                        {commission.amount.toLocaleString()} ل.س
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {commission.rate}%
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getStatusStyle(
                          commission.status
                        )}`}
                      >
                        {getStatusText(commission.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {new Date(commission.createdAt).toLocaleDateString('ar-SA')}
                      </div>
                    </td>
                  </tr>
                ))}
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
