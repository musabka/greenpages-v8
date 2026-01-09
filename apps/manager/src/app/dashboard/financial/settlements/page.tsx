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
import { useAgentsBalances } from '@/lib/hooks/useFinancial';

// Settlement Preview Component
function SettlementPreview({ agent }: { agent: any }) {
  if (!agent) return null;
  
  const pendingAmount = Number(agent.pendingAmount || 0);
  const pendingCommissions = Number(agent.pendingCommissions || 0);
  const netToReceive = pendingAmount - pendingCommissions;
  
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mt-4">
      <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
        <DollarSign className="w-5 h-5" />
        معاينة التسوية
      </h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-600">النقد في ذمة المندوب:</p>
          <p className="text-xl font-bold text-green-600">{pendingAmount.toLocaleString()} ل.س</p>
        </div>
        <div>
          <p className="text-gray-600">العمولات المستحقة:</p>
          <p className="text-xl font-bold text-purple-600">{pendingCommissions.toLocaleString()} ل.س</p>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-blue-200">
        <p className="text-gray-600">صافي المبلغ الذي ستستلمه:</p>
        <p className="text-2xl font-bold text-blue-700">{netToReceive.toLocaleString()} ل.س</p>
      </div>
      {pendingAmount === 0 && (
        <div className="mt-3 p-2 bg-yellow-100 text-yellow-700 rounded text-sm">
          ⚠️ لا يوجد مبالغ في ذمة هذا المندوب حالياً
        </div>
      )}
    </div>
  );
}

// New Settlement Modal Component
function NewSettlementModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [agentProfileId, setAgentProfileId] = useState('');
  const [notes, setNotes] = useState('');
  const { data: agentsData, isLoading: loadingAgents } = useAgentsBalances({ limit: 100 });
  const createMutation = useCreateAgentSettlement();

  const agents = agentsData?.data || [];
  const selectedAgent = agents.find((a: any) => a.id === agentProfileId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentProfileId) return;

    createMutation.mutate(
      { agentProfileId, notes: notes || undefined },
      {
        onSuccess: () => {
          onClose();
          setAgentProfileId('');
          setNotes('');
        },
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-2">تسوية مالية جديدة</h2>
        <p className="text-sm text-gray-500 mb-4">
          اختر المندوب لإنشاء تسوية مالية واستلام الأموال المحصّلة
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              اختر المندوب
            </label>
            {loadingAgents ? (
              <div className="text-center py-4 text-gray-500">جاري تحميل المندوبين...</div>
            ) : (
              <select
                value={agentProfileId}
                onChange={(e) => setAgentProfileId(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              >
                <option value="">-- اختر المندوب --</option>
                {agents.map((agent: any) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.user?.firstName} {agent.user?.lastName} - {Number(agent.pendingAmount || 0).toLocaleString()} ل.س
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Settlement Preview */}
          <SettlementPreview agent={selectedAgent} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ملاحظات (اختياري)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
              disabled={createMutation.isPending || !agentProfileId}
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
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Agent settlements (manager receives from agents)
  const { data: agentData, isLoading: loadingAgent } = useAgentFinancialSettlements({
    page,
    limit: 20,
    status: status || undefined,
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

  // Filter settlements based on search and date
  const filteredSettlements = settlements.filter((s: any) => {
    const matchesSearch = !search || s.settlementNumber?.toLowerCase().includes(search.toLowerCase());
    const settlementDate = new Date(s.createdAt);
    const matchesDateFrom = !dateFrom || settlementDate >= new Date(dateFrom);
    const matchesDateTo = !dateTo || settlementDate <= new Date(dateTo + 'T23:59:59');
    return matchesSearch && matchesDateFrom && matchesDateTo;
  });

  // Calculate statistics
  const statistics = {
    total: filteredSettlements.length,
    pending: filteredSettlements.filter((s: any) => 
      s.status === 'PENDING_MANAGER' || s.status === 'PENDING_ADMIN'
    ).length,
    confirmed: filteredSettlements.filter((s: any) => s.status === 'CONFIRMED').length,
    cancelled: filteredSettlements.filter((s: any) => s.status === 'CANCELLED').length,
    totalAmount: filteredSettlements
      .filter((s: any) => s.status === 'CONFIRMED')
      .reduce((sum: number, s: any) => sum + Number(s.totalAmount || 0), 0),
    pendingAmount: filteredSettlements
      .filter((s: any) => s.status === 'PENDING_MANAGER' || s.status === 'PENDING_ADMIN')
      .reduce((sum: number, s: any) => sum + Number(s.totalAmount || 0), 0),
    totalCommissions: filteredSettlements
      .filter((s: any) => s.status === 'CONFIRMED')
      .reduce((sum: number, s: any) => sum + Number(s.agentCommissionAmount || 0), 0),
  };

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
            {statistics.pending > 0 && (
              <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
                {statistics.pending}
              </span>
            )}
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

      {/* Pending Settlements Alert */}
      {activeTab === 'agent' && statistics.pending > 0 && (
        <div className="bg-yellow-50 border-r-4 border-yellow-500 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Clock className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-yellow-900 mb-1">
                لديك {statistics.pending} تسوية معلقة بانتظار التأكيد
              </h3>
              <p className="text-sm text-yellow-700 mb-3">
                هذه التسويات بحاجة لمراجعتك وتأكيدك. المبلغ الإجمالي المعلق: {formatNumber(statistics.pendingAmount)} ل.س
              </p>
              <button
                onClick={() => setStatus('PENDING_MANAGER')}
                className="text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
              >
                عرض التسويات المعلقة فقط ←
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Search className="w-5 h-5" />
          البحث والفلترة
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              رقم التسوية
            </label>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث برقم التسوية..."
                className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الحالة
            </label>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
            >
              <option value="">كل الحالات</option>
              <option value="DRAFT">مسودة</option>
              <option value="PENDING_MANAGER">بانتظار المدير</option>
              <option value="PENDING_ADMIN">بانتظار الإدارة</option>
              <option value="CONFIRMED">مؤكدة</option>
              <option value="CANCELLED">ملغية</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              من تاريخ
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              إلى تاريخ
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {(search || status || dateFrom || dateTo) && (
          <div className="mt-4 pt-4 border-t flex items-center justify-between">
            <p className="text-sm text-gray-600">
              عدد النتائج: <span className="font-bold text-gray-900">{filteredSettlements.length}</span>
            </p>
            <button
              onClick={() => {
                setSearch('');
                setStatus('');
                setDateFrom('');
                setDateTo('');
              }}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              مسح الفلاتر
            </button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-sm p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium mb-1">إجمالي التسويات</p>
              <p className="text-3xl font-bold text-blue-900">{statistics.total}</p>
              <p className="text-xs text-blue-600 mt-1">من أصل {total} تسوية</p>
            </div>
            <div className="p-3 bg-white/50 rounded-lg">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg shadow-sm p-4 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700 font-medium mb-1">بانتظار التأكيد</p>
              <p className="text-3xl font-bold text-yellow-900">{statistics.pending}</p>
              <p className="text-xs text-yellow-600 mt-1">
                {formatNumber(statistics.pendingAmount)} ل.س
              </p>
            </div>
            <div className="p-3 bg-white/50 rounded-lg">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium mb-1">تسويات مؤكدة</p>
              <p className="text-3xl font-bold text-green-900">{statistics.confirmed}</p>
              <p className="text-xs text-green-600 mt-1">
                {formatNumber(statistics.totalAmount)} ل.س
              </p>
            </div>
            <div className="p-3 bg-white/50 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-sm p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium mb-1">العمولات المدفوعة</p>
              <p className="text-2xl font-bold text-purple-900">
                {formatNumber(statistics.totalCommissions)}
              </p>
              <p className="text-xs text-purple-600 mt-1">ليرة سورية</p>
            </div>
            <div className="p-3 bg-white/50 rounded-lg">
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Additional Statistics */}
      {activeTab === 'agent' && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="font-medium text-gray-900 mb-4">إحصائيات تفصيلية</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">تسويات ملغية</p>
                <p className="text-xl font-bold text-gray-900">{statistics.cancelled}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">متوسط مبلغ التسوية</p>
                <p className="text-xl font-bold text-gray-900">
                  {statistics.confirmed > 0 
                    ? formatNumber(Math.round(statistics.totalAmount / statistics.confirmed))
                    : '0'} ل.س
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-teal-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">متوسط العمولة</p>
                <p className="text-xl font-bold text-gray-900">
                  {statistics.confirmed > 0
                    ? formatNumber(Math.round(statistics.totalCommissions / statistics.confirmed))
                    : '0'} ل.س
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredSettlements.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {search || status || dateFrom || dateTo 
                ? 'لا توجد نتائج تطابق معايير البحث'
                : 'لا توجد تسويات'}
            </p>
            {activeTab === 'agent' && !search && !status && !dateFrom && !dateTo && (
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
                  {filteredSettlements.map((settlement: any) => (
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
