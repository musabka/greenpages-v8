'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DollarSign,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  Plus,
  FileText,
  Printer,
  Building2,
  ArrowLeft,
  TrendingUp,
  Receipt,
} from 'lucide-react';
import {
  useAllManagerSettlements,
  useManagerBalances,
  useCreateManagerSettlement,
  useConfirmManagerSettlement,
  useCancelManagerSettlement,
} from '@/lib/hooks/useFinancial';

// New Settlement Modal Component
function NewSettlementModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [managerId, setManagerId] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [notes, setNotes] = useState('');
  const { data: managersData, isLoading: loadingManagers } = useManagerBalances({ limit: 100 });
  const createMutation = useCreateManagerSettlement();

  const managers = managersData?.data || [];
  const selectedManager = managers.find((m: any) => m.id === managerId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managerId || !periodStart || !periodEnd) return;

    createMutation.mutate(
      { managerId, periodStart, periodEnd, notes: notes || undefined },
      {
        onSuccess: () => {
          onClose();
          setManagerId('');
          setPeriodStart('');
          setPeriodEnd('');
          setNotes('');
        },
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-2">تسوية مالية مع مدير محافظة</h2>
        <p className="text-sm text-gray-500 mb-4">
          اختر مدير المحافظة والفترة الزمنية لإنشاء تسوية مالية
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              مدير المحافظة
            </label>
            {loadingManagers ? (
              <div className="text-center py-4 text-gray-500">جاري تحميل المدراء...</div>
            ) : (
              <select
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">-- اختر مدير المحافظة --</option>
                {managers.map((manager: any) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.user?.firstName} {manager.user?.lastName} - {manager.governorate?.nameAr}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedManager && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                معلومات المدير
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">المحافظة:</p>
                  <p className="font-bold text-gray-900">{selectedManager.governorate?.nameAr}</p>
                </div>
                <div>
                  <p className="text-gray-600">نسبة الشركة:</p>
                  <p className="font-bold text-gray-900">{selectedManager.companyCommissionRate}%</p>
                </div>
                <div>
                  <p className="text-gray-600">الرصيد الحالي:</p>
                  <p className="font-bold text-green-600">
                    {Number(selectedManager.balance || 0).toLocaleString()} ل.س
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                بداية الفترة
              </label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                نهاية الفترة
              </label>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ملاحظات (اختياري)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="أضف ملاحظات على هذه التسوية..."
            />
          </div>

          {createMutation.isError && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              ❌ {(createMutation.error as any)?.response?.data?.message || 'حدث خطأ أثناء إنشاء التسوية'}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={createMutation.isPending || !managerId || !periodStart || !periodEnd}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {createMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء التسوية'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminSettlementsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('');
  const [showNewModal, setShowNewModal] = useState(false);

  const { data: settlementsData, isLoading } = useAllManagerSettlements({
    page,
    limit: 20,
    status: status || undefined,
  });

  const confirmMutation = useConfirmManagerSettlement();
  const cancelMutation = useCancelManagerSettlement();

  const settlements = settlementsData?.data || [];
  const total = settlementsData?.meta?.total || 0;
  const totalPages = settlementsData?.meta?.totalPages || 1;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ar-SY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatNumber = (num: number) => {
    return (num || 0).toLocaleString('ar-SY');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'text-green-600 bg-green-100';
      case 'DRAFT':
        return 'text-gray-600 bg-gray-100';
      case 'PENDING_MANAGER':
      case 'PENDING_ADMIN':
        return 'text-yellow-600 bg-yellow-100';
      case 'CANCELLED':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'مسودة';
      case 'PENDING_MANAGER':
        return 'بانتظار المدير';
      case 'PENDING_ADMIN':
        return 'بانتظار التأكيد';
      case 'CONFIRMED':
        return 'مؤكدة';
      case 'CANCELLED':
        return 'ملغية';
      default:
        return status;
    }
  };

  const handleConfirm = (id: string) => {
    if (confirm('هل أنت متأكد من تأكيد هذه التسوية؟')) {
      confirmMutation.mutate({ settlementId: id });
    }
  };

  const handleCancel = (id: string) => {
    const reason = prompt('أدخل سبب الإلغاء:');
    if (reason) {
      cancelMutation.mutate(id);
    }
  };

  // Calculate summary
  const confirmedSettlements = settlements.filter((s: any) => s.status === 'CONFIRMED');
  const pendingSettlements = settlements.filter((s: any) => 
    s.status === 'PENDING_MANAGER' || s.status === 'PENDING_ADMIN'
  );
  const totalConfirmedAmount = confirmedSettlements.reduce(
    (sum: number, s: any) => sum + Number(s.amountDelivered || 0), 0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/financial"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">تسويات مدراء المحافظات</h1>
            <p className="text-gray-500">إدارة التسويات المالية مع مدراء المحافظات</p>
          </div>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          تسوية جديدة
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-600 rounded-xl">
            <Receipt className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-blue-900 mb-2">ما هي تسوية مدير المحافظة؟</h3>
            <p className="text-sm text-blue-800">
              التسوية المالية هي عملية تصفية حساب بين الشركة ومدير المحافظة. تشمل:
            </p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
              <li>استلام حصة الشركة من إيرادات المحافظة</li>
              <li>احتساب عمولات المندوبين المدفوعة</li>
              <li>تحديد صافي ربح مدير المحافظة</li>
              <li>توثيق التسوية كوثيقة رسمية</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">إجمالي التسويات</p>
              <p className="text-xl font-bold text-gray-900">{total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">بانتظار التأكيد</p>
              <p className="text-xl font-bold text-gray-900">{pendingSettlements.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">تسويات مؤكدة</p>
              <p className="text-xl font-bold text-gray-900">{confirmedSettlements.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">إجمالي المُستلم</p>
              <p className="text-xl font-bold text-gray-900">{formatNumber(totalConfirmedAmount)} ل.س</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">كل الحالات</option>
          <option value="DRAFT">مسودة</option>
          <option value="PENDING_MANAGER">بانتظار المدير</option>
          <option value="PENDING_ADMIN">بانتظار التأكيد</option>
          <option value="CONFIRMED">مؤكدة</option>
          <option value="CANCELLED">ملغية</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : settlements.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد تسويات</p>
            <button
              onClick={() => setShowNewModal(true)}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              إنشاء تسوية جديدة
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      رقم التسوية
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      المدير / المحافظة
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      الفترة
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      المبلغ المستلم
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      الحالة
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      التاريخ
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {settlements.map((settlement: any) => (
                    <tr key={settlement.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-gray-900">
                          {settlement.settlementNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {settlement.managerName || settlement.governorateManager?.user?.firstName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {settlement.governorateName || settlement.governorateManager?.governorate?.nameAr}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <p className="text-gray-900">{formatDate(settlement.periodStart)}</p>
                          <p className="text-gray-500">إلى {formatDate(settlement.periodEnd)}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-green-600">
                          {formatNumber(settlement.amountDelivered || 0)} ل.س
                        </p>
                        <p className="text-xs text-gray-500">
                          حصة الشركة: {formatNumber(settlement.companyShareAmount || 0)} ل.س
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
                          <span>{formatDate(settlement.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/dashboard/financial/settlements/${settlement.id}`)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                            title="عرض التفاصيل"
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
                          </button>
                          {settlement.status === 'CONFIRMED' && (
                            <button
                              onClick={() => router.push(`/dashboard/financial/settlements/${settlement.id}/print`)}
                              className="p-2 hover:bg-gray-100 rounded-lg"
                              title="طباعة"
                            >
                              <Printer className="w-4 h-4 text-gray-600" />
                            </button>
                          )}
                          {(settlement.status === 'PENDING_MANAGER' || settlement.status === 'PENDING_ADMIN') && (
                            <>
                              <button
                                onClick={() => handleConfirm(settlement.id)}
                                className="p-2 hover:bg-green-100 rounded-lg"
                                title="تأكيد"
                                disabled={confirmMutation.isPending}
                              >
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              </button>
                              <button
                                onClick={() => handleCancel(settlement.id)}
                                className="p-2 hover:bg-red-100 rounded-lg"
                                title="إلغاء"
                                disabled={cancelMutation.isPending}
                              >
                                <XCircle className="w-4 h-4 text-red-600" />
                              </button>
                            </>
                          )}
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

      {/* New Settlement Modal */}
      <NewSettlementModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
      />
    </div>
  );
}
