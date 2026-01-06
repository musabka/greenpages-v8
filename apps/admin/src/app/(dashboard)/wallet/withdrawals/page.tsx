'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  ArrowDownRight,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  User,
  Building2,
  Smartphone,
  Receipt,
  AlertCircle,
  Loader2,
} from 'lucide-react';

type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';

interface Withdrawal {
  id: string;
  walletId: string;
  amount: string;
  method: string;
  status: WithdrawalStatus;
  bankName: string | null;
  accountNumber: string | null;
  accountHolderName: string | null;
  mobileWalletNumber: string | null;
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

const statusLabels: Record<WithdrawalStatus, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'معلق', color: 'yellow', icon: Clock },
  APPROVED: { label: 'موافق عليه', color: 'blue', icon: CheckCircle2 },
  PROCESSING: { label: 'قيد المعالجة', color: 'indigo', icon: Loader2 },
  COMPLETED: { label: 'مكتمل', color: 'green', icon: CheckCircle2 },
  REJECTED: { label: 'مرفوض', color: 'red', icon: XCircle },
  CANCELLED: { label: 'ملغي', color: 'gray', icon: XCircle },
};

const methodLabels: Record<string, { label: string; icon: any }> = {
  BANK_TRANSFER: { label: 'تحويل بنكي', icon: Building2 },
  CASH: { label: 'نقدي', icon: Receipt },
  MOBILE_WALLET: { label: 'محفظة إلكترونية', icon: Smartphone },
  CHECK: { label: 'شيك', icon: Receipt },
};

export default function AdminWithdrawalsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<WithdrawalStatus | ''>('');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<'approve' | 'reject' | null>(null);

  const withdrawalsQuery = useQuery({
    queryKey: ['admin', 'wallet', 'withdrawals', statusFilter, search],
    queryFn: async () => {
      const params: any = { limit: 50 };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const response = await api.get('/admin/wallet/withdrawals', { params });
      return response.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const response = await api.post(`/admin/wallet/withdrawals/${id}/approve`, { 
        notes,
        receiptNumber: `W-${new Date().getTime()}` // رقم إيصال تلقائي
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallet'] });
      setShowModal(false);
      setSelectedWithdrawal(null);
      setAdminNotes('');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const response = await api.post(`/admin/wallet/withdrawals/${id}/reject`, { 
        reason: notes || 'مرفوض' 
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallet'] });
      setShowModal(false);
      setSelectedWithdrawal(null);
      setAdminNotes('');
    },
  });

  const handleAction = (withdrawal: Withdrawal, action: 'approve' | 'reject') => {
    setSelectedWithdrawal(withdrawal);
    setModalAction(action);
    setAdminNotes('');
    setShowModal(true);
  };

  const confirmAction = () => {
    if (!selectedWithdrawal || !modalAction) return;
    
    if (modalAction === 'approve') {
      approveMutation.mutate({ id: selectedWithdrawal.id, notes: adminNotes });
    } else {
      rejectMutation.mutate({ id: selectedWithdrawal.id, notes: adminNotes });
    }
  };

  const withdrawals = withdrawalsQuery.data?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <ArrowDownRight className="w-8 h-8 text-red-600" />
            طلبات السحب
          </h1>
          <p className="text-gray-500">إدارة والموافقة على طلبات سحب الأرصدة</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="بحث بالاسم أو رقم الحساب..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as WithdrawalStatus | '')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">جميع الحالات</option>
              <option value="PENDING">معلق</option>
              <option value="APPROVED">موافق عليه</option>
              <option value="PROCESSING">قيد المعالجة</option>
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
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">بيانات التحويل</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">التاريخ</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">الحالة</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {withdrawals.map((withdrawal: Withdrawal) => {
                const status = statusLabels[withdrawal.status];
                const StatusIcon = status.icon;
                const method = methodLabels[withdrawal.method] || { label: withdrawal.method, icon: Receipt };
                const MethodIcon = method.icon;
                
                return (
                  <tr key={withdrawal.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gray-100">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {withdrawal.wallet?.user?.name || '-'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {withdrawal.wallet?.user?.phone || '-'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-red-600">
                        -{Number(withdrawal.amount).toLocaleString('ar-SY')} ل.س
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <MethodIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">{method.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {withdrawal.method === 'BANK_TRANSFER' && (
                        <div className="text-sm">
                          <p className="text-gray-900">{withdrawal.bankName}</p>
                          <p className="text-gray-500">{withdrawal.accountNumber}</p>
                          <p className="text-gray-500">{withdrawal.accountHolderName}</p>
                        </div>
                      )}
                      {withdrawal.method === 'MOBILE_WALLET' && (
                        <p className="text-gray-900">{withdrawal.mobileWalletNumber}</p>
                      )}
                      {withdrawal.method === 'CHECK' && (
                        <p className="text-gray-900">{withdrawal.accountHolderName}</p>
                      )}
                      {withdrawal.method === 'CASH' && (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(withdrawal.createdAt).toLocaleDateString('ar-SY')}
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
                        {withdrawal.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleAction(withdrawal, 'approve')}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="موافقة"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleAction(withdrawal, 'reject')}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="رفض"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {withdrawal.status === 'APPROVED' && (
                          <span className="text-sm text-gray-500">بانتظار التنفيذ</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {withdrawals.length === 0 && (
          <div className="p-12 text-center">
            <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">لا توجد طلبات</h3>
            <p className="text-gray-500">لم يتم العثور على طلبات سحب تطابق معايير البحث</p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showModal && selectedWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {modalAction === 'approve' ? 'تأكيد الموافقة على السحب' : 'تأكيد رفض السحب'}
            </h3>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500">المستخدم:</span>
                <span className="font-medium">{selectedWithdrawal.wallet?.user?.name}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500">المبلغ:</span>
                <span className="font-bold text-red-600">
                  -{Number(selectedWithdrawal.amount).toLocaleString('ar-SY')} ل.س
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">الطريقة:</span>
                <span>{methodLabels[selectedWithdrawal.method]?.label}</span>
              </div>
              {selectedWithdrawal.method === 'BANK_TRANSFER' && (
                <div className="mt-3 pt-3 border-t border-gray-200 space-y-1 text-sm">
                  <p><span className="text-gray-500">البنك:</span> {selectedWithdrawal.bankName}</p>
                  <p><span className="text-gray-500">رقم الحساب:</span> {selectedWithdrawal.accountNumber}</p>
                  <p><span className="text-gray-500">اسم صاحب الحساب:</span> {selectedWithdrawal.accountHolderName}</p>
                </div>
              )}
            </div>

            {modalAction === 'approve' ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <p className="text-sm text-green-700">
                  سيتم خصم المبلغ من رصيد المستخدم وتحويله حسب البيانات المذكورة
                </p>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">
                  سيتم رفض الطلب وإعادة الرصيد المجمد للمستخدم
                </p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ملاحظات {modalAction === 'reject' ? '(مطلوب)' : '(اختياري)'}
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={modalAction === 'reject' ? 'سبب الرفض...' : 'أضف ملاحظاتك هنا...'}
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
                disabled={
                  approveMutation.isPending ||
                  rejectMutation.isPending ||
                  (modalAction === 'reject' && !adminNotes.trim())
                }
                className={`flex-1 px-4 py-2 rounded-lg text-white ${
                  modalAction === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50`}
              >
                {approveMutation.isPending || rejectMutation.isPending
                  ? 'جارٍ المعالجة...'
                  : modalAction === 'approve'
                  ? 'موافقة وتنفيذ'
                  : 'رفض الطلب'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
