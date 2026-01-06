'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DollarSign,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate, formatNumber } from '@/lib/format';

interface Settlement {
  id: string;
  agentProfile: {
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  totalAmount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  requestedAt: string;
  approvedAt?: string;
  completedAt?: string;
  notes?: string;
  rejectionReason?: string;
}

export default function ManagerSettlementsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['manager-settlements', page],
    queryFn: async () => {
      const response = await api.get(
        `/governorate-manager/financial/settlements/pending?page=${page}&limit=${limit}`
      );
      return response.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, receiptNumber }: { id: string; receiptNumber: string }) => {
      await api.patch(`/financial/agent-settlements/${id}/approve`, { receiptNumber });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-settlements'] });
      setSelectedSettlement(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await api.patch(`/financial/agent-settlements/${id}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-settlements'] });
      setSelectedSettlement(null);
    },
  });

  const handleApprove = () => {
    if (!selectedSettlement) return;
    const receiptNumber = prompt('أدخل رقم الإيصال:');
    if (receiptNumber) {
      approveMutation.mutate({ id: selectedSettlement.id, receiptNumber });
    }
  };

  const handleReject = () => {
    if (!selectedSettlement) return;
    const reason = prompt('أدخل سبب الرفض:');
    if (reason) {
      rejectMutation.mutate({ id: selectedSettlement.id, reason });
    }
  };

  const settlements = data?.data || [];
  const total = data?.meta?.total || 0;
  const totalPages = data?.meta?.totalPages || 1;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'COMPLETED':
        return 'text-green-600 bg-green-100';
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-100';
      case 'REJECTED':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'معلقة';
      case 'APPROVED':
        return 'معتمدة';
      case 'REJECTED':
        return 'مرفوضة';
      case 'COMPLETED':
        return 'مكتملة';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">التسويات المالية</h1>
        <p className="text-gray-500">تسليم واستلام الأموال من المندوبين</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">معلقة</p>
              <p className="text-xl font-bold text-gray-900">{total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">إجمالي المبلغ</p>
              <p className="text-xl font-bold text-gray-900">
                {formatNumber(
                  settlements.reduce(
                    (sum: number, s: Settlement) => sum + Number(s.totalAmount),
                    0
                  )
                )}{' '}
                ل.س
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : settlements.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد تسويات معلقة</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      المندوب
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      المبلغ
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      الحالة
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      تاريخ الطلب
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {settlements.map((settlement: Settlement) => (
                    <tr key={settlement.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {settlement.agentProfile.user.firstName}{' '}
                              {settlement.agentProfile.user.lastName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {settlement.agentProfile.user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-gray-900">
                          {formatNumber(settlement.totalAmount)} ل.س
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            settlement.status
                          )}`}
                        >
                          {getStatusText(settlement.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(settlement.requestedAt)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedSettlement(settlement)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                            title="عرض التفاصيل"
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
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
              <div className="flex items-center justify-between p-4 border-t">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  السابق
                </button>
                <span className="text-sm text-gray-600">
                  صفحة {page} من {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  التالي
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Settlement Details Modal */}
      {selectedSettlement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">تفاصيل التسوية</h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">المندوب</p>
                <p className="font-medium">
                  {selectedSettlement.agentProfile.user.firstName}{' '}
                  {selectedSettlement.agentProfile.user.lastName}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">المبلغ</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatNumber(selectedSettlement.totalAmount)} ل.س
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">الحالة</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    selectedSettlement.status
                  )}`}
                >
                  {getStatusText(selectedSettlement.status)}
                </span>
              </div>

              <div>
                <p className="text-sm text-gray-500">تاريخ الطلب</p>
                <p className="font-medium">{formatDate(selectedSettlement.requestedAt)}</p>
              </div>

              {selectedSettlement.notes && (
                <div>
                  <p className="text-sm text-gray-500">ملاحظات</p>
                  <p className="font-medium">{selectedSettlement.notes}</p>
                </div>
              )}

              {selectedSettlement.status === 'PENDING' && (
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleApprove}
                    disabled={approveMutation.isPending}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    موافقة
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={rejectMutation.isPending}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    رفض
                  </button>
                </div>
              )}

              <button
                onClick={() => setSelectedSettlement(null)}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
