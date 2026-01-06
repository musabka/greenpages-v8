'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  ArrowUpRight,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Eye,
  Image as ImageIcon,
  User,
  Calendar,
  Receipt,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

type TopUpStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';

interface TopUp {
  id: string;
  walletId: string;
  amount: string;
  method: string;
  status: TopUpStatus;
  receiptNumber: string | null;
  proofImage: string | null;
  notes: string | null;
  adminNotes: string | null;
  createdAt: string;
  processedAt: string | null;
  wallet: {
    user: {
      id: string;
      name: string;
      email: string;
      phone: string;
    };
  };
  processedByUser: {
    id: string;
    name: string;
  } | null;
}

const statusLabels: Record<TopUpStatus, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'معلق', color: 'yellow', icon: Clock },
  APPROVED: { label: 'موافق عليه', color: 'blue', icon: CheckCircle2 },
  REJECTED: { label: 'مرفوض', color: 'red', icon: XCircle },
  COMPLETED: { label: 'مكتمل', color: 'green', icon: CheckCircle2 },
  CANCELLED: { label: 'ملغي', color: 'gray', icon: XCircle },
};

const methodLabels: Record<string, string> = {
  BANK_TRANSFER: 'تحويل بنكي',
  CASH_DEPOSIT: 'إيداع نقدي',
  MOBILE_WALLET: 'محفظة إلكترونية',
  CREDIT_CARD: 'بطاقة ائتمان',
  AGENT_COLLECTION: 'تحصيل مندوب',
  ADMIN_CREDIT: 'إضافة إدارية',
};

export default function AdminTopUpsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TopUpStatus | ''>('');
  const [selectedTopUp, setSelectedTopUp] = useState<TopUp | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<'approve' | 'reject' | null>(null);

  const topUpsQuery = useQuery({
    queryKey: ['admin', 'wallet', 'top-ups', statusFilter, search],
    queryFn: async () => {
      const params: any = { limit: 50 };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const response = await api.get('/admin/wallet/top-ups', { params });
      return response.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const response = await api.post(`/admin/wallet/top-ups/${id}/approve`, { notes });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallet'] });
      setShowModal(false);
      setSelectedTopUp(null);
      setAdminNotes('');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const response = await api.post(`/admin/wallet/top-ups/${id}/reject`, { reason: notes || 'مرفوض' });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallet'] });
      setShowModal(false);
      setSelectedTopUp(null);
      setAdminNotes('');
    },
  });

  const handleAction = (topUp: TopUp, action: 'approve' | 'reject') => {
    setSelectedTopUp(topUp);
    setModalAction(action);
    setAdminNotes('');
    setShowModal(true);
  };

  const confirmAction = () => {
    if (!selectedTopUp || !modalAction) return;
    
    if (modalAction === 'approve') {
      approveMutation.mutate({ id: selectedTopUp.id, notes: adminNotes });
    } else {
      rejectMutation.mutate({ id: selectedTopUp.id, notes: adminNotes });
    }
  };

  const topUps = topUpsQuery.data?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <ArrowUpRight className="w-8 h-8 text-green-600" />
            طلبات شحن المحفظة
          </h1>
          <p className="text-gray-500">إدارة والموافقة على طلبات شحن محافظ المستخدمين</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="بحث بالاسم أو رقم الإيصال..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TopUpStatus | '')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">جميع الحالات</option>
              <option value="PENDING">معلق</option>
              <option value="APPROVED">موافق عليه</option>
              <option value="COMPLETED">مكتمل</option>
              <option value="REJECTED">مرفوض</option>
              <option value="CANCELLED">ملغي</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">المستخدم</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">المبلغ</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">الطريقة</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">رقم الإيصال</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">التاريخ</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">الحالة</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topUps.map((topUp: TopUp) => {
                const status = statusLabels[topUp.status];
                const StatusIcon = status.icon;
                return (
                  <tr key={topUp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gray-100">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {topUp.wallet?.user?.name || '-'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {topUp.wallet?.user?.phone || '-'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-green-600">
                        +{Number(topUp.amount).toLocaleString('ar-SY')} ل.س
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {methodLabels[topUp.method] || topUp.method}
                    </td>
                    <td className="px-4 py-3">
                      {topUp.receiptNumber ? (
                        <span className="text-gray-900">{topUp.receiptNumber}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(topUp.createdAt).toLocaleDateString('ar-SY')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-${status.color}-100 text-${status.color}-700`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {topUp.proofImage && (
                          <button
                            onClick={() => window.open(topUp.proofImage!, '_blank')}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="عرض الإثبات"
                          >
                            <ImageIcon className="w-4 h-4" />
                          </button>
                        )}
                        {topUp.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleAction(topUp, 'approve')}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="موافقة"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleAction(topUp, 'reject')}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="رفض"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {topUps.length === 0 && (
          <div className="p-12 text-center">
            <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">لا توجد طلبات</h3>
            <p className="text-gray-500">لم يتم العثور على طلبات شحن تطابق معايير البحث</p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showModal && selectedTopUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {modalAction === 'approve' ? 'تأكيد الموافقة' : 'تأكيد الرفض'}
            </h3>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500">المستخدم:</span>
                <span className="font-medium">{selectedTopUp.wallet?.user?.name}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500">المبلغ:</span>
                <span className="font-bold text-green-600">
                  +{Number(selectedTopUp.amount).toLocaleString('ar-SY')} ل.س
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">الطريقة:</span>
                <span>{methodLabels[selectedTopUp.method]}</span>
              </div>
            </div>

            {modalAction === 'approve' ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <p className="text-sm text-green-700">
                  سيتم إضافة المبلغ لرصيد المستخدم فوراً
                </p>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">
                  سيتم رفض الطلب ولن يتم إضافة أي رصيد
                </p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ملاحظات (اختياري)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="أضف ملاحظاتك هنا..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                إلغاء
              </button>
              <button
                onClick={confirmAction}
                disabled={approveMutation.isPending || rejectMutation.isPending}
                className={`flex-1 px-4 py-2 rounded-lg text-white ${
                  modalAction === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50`}
              >
                {approveMutation.isPending || rejectMutation.isPending
                  ? 'جارٍ المعالجة...'
                  : modalAction === 'approve'
                  ? 'موافقة'
                  : 'رفض'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
