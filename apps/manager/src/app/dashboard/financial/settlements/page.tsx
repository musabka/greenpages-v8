'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Search,
  Printer,
  ArrowUpRight,
} from 'lucide-react';
import { formatDate, formatNumber } from '@/lib/format';
import {
  useAgentFinancialSettlements,
  useCreateAgentSettlement,
  useConfirmAgentSettlement,
  useCancelAgentSettlement,
  useManagerFinancialSettlements,
} from '@/lib/hooks/useFinancial';
import { useAgents } from '@/lib/hooks/useAgents';

// New Settlement Modal Component
function NewSettlementModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [agentId, setAgentId] = useState('');
  const [notes, setNotes] = useState('');
  const { data: agentsData } = useAgents();
  const createMutation = useCreateAgentSettlement();

  const agents = agentsData?.data || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentId) return;

    createMutation.mutate(
      { agentId, notes: notes || undefined },
      {
        onSuccess: () => {
          onClose();
          setAgentId('');
          setNotes('');
        },
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">تسوية جديدة مع مندوب</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              اختر المندوب
            </label>
            <select
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            >
              <option value="">-- اختر المندوب --</option>
              {agents.map((agent: any) => (
                <option key={agent.id} value={agent.id}>
                  {agent.user?.firstName} {agent.user?.lastName} - {agent.user?.phone}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ملاحظات (اختياري)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="أضف ملاحظات..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={createMutation.isPending || !agentId}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
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

export default function ManagerSettlementsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'agent' | 'admin'>('agent');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('');
  const [search, setSearch] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);

  // Agent settlements (manager receives from agents)
  const { data: agentData, isLoading: loadingAgent } = useAgentFinancialSettlements({
    page,
    limit: 20,
    status: status || undefined,
    search: search || undefined,
  });

  // Manager settlements (manager delivers to admin)
  const { data: adminData, isLoading: loadingAdmin } = useManagerFinancialSettlements({
    page,
    limit: 20,
    status: status || undefined,
  });

  const confirmMutation = useConfirmAgentSettlement();
  const cancelMutation = useCancelAgentSettlement();

  const settlements = activeTab === 'agent' 
    ? (agentData?.data || [])
    : (adminData?.data || []);
  const total = activeTab === 'agent'
    ? (agentData?.meta?.total || 0)
    : (adminData?.meta?.total || 0);
  const totalPages = activeTab === 'agent'
    ? (agentData?.meta?.totalPages || 1)
    : (adminData?.meta?.totalPages || 1);
  const isLoading = activeTab === 'agent' ? loadingAgent : loadingAdmin;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'text-green-600 bg-green-100';
      case 'DRAFT':
        return 'text-gray-600 bg-gray-100';
      case 'PENDING_AGENT':
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
      case 'PENDING_AGENT':
        return 'بانتظار المندوب';
      case 'PENDING_MANAGER':
        return 'بانتظار المدير';
      case 'PENDING_ADMIN':
        return 'بانتظار الإدارة';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">التسويات المالية</h1>
          <p className="text-gray-500">إدارة التسويات مع المندوبين والإدارة</p>
        </div>
        {activeTab === 'agent' && (
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <Plus className="w-5 h-5" />
            تسوية جديدة
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => { setActiveTab('agent'); setPage(1); setStatus(''); }}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'agent'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            تسويات المندوبين
          </div>
        </button>
        <button
          onClick={() => { setActiveTab('admin'); setPage(1); setStatus(''); }}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'admin'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4" />
            تسوياتي مع الإدارة
          </div>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث برقم التسوية..."
              className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
        >
          <option value="">كل الحالات</option>
          <option value="DRAFT">مسودة</option>
          <option value="PENDING_MANAGER">بانتظار المدير</option>
          <option value="PENDING_ADMIN">بانتظار الإدارة</option>
          <option value="CONFIRMED">مؤكدة</option>
          <option value="CANCELLED">ملغية</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              <p className="text-xl font-bold text-gray-900">
                {settlements.filter((s: any) => 
                  s.status === 'PENDING_MANAGER' || s.status === 'PENDING_ADMIN'
                ).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">إجمالي المبالغ المؤكدة</p>
              <p className="text-xl font-bold text-gray-900">
                {formatNumber(
                  settlements
                    .filter((s: any) => s.status === 'CONFIRMED')
                    .reduce((sum: number, s: any) => sum + Number(s.totalAmount || 0), 0)
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
            <p className="text-gray-500">لا توجد تسويات</p>
            {activeTab === 'agent' && (
              <button
                onClick={() => setShowNewModal(true)}
                className="mt-4 text-green-600 hover:text-green-700 font-medium"
              >
                إنشاء تسوية جديدة
              </button>
            )}
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
                      {activeTab === 'agent' ? 'المندوب' : 'المستلم'}
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      المبلغ
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
                          <User className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {activeTab === 'agent'
                                ? settlement.agentName
                                : settlement.receiverName || '-'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {activeTab === 'agent'
                                ? settlement.agentPhone
                                : settlement.receiverPhone || '-'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-gray-900">
                          {formatNumber(settlement.totalAmount || 0)} ل.س
                        </p>
                        {activeTab === 'agent' && settlement.agentCommissionAmount > 0 && (
                          <p className="text-xs text-green-600">
                            عمولة: {formatNumber(settlement.agentCommissionAmount)} ل.س
                          </p>
                        )}
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
                          {activeTab === 'agent' && settlement.status === 'PENDING_MANAGER' && (
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
