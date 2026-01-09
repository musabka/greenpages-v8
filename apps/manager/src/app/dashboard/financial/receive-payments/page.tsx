'use client';

import { useState } from 'react';
import {
  DollarSign,
  Users,
  Wallet,
  CheckCircle,
  Clock,
  Search,
  Eye,
  X,
  AlertCircle,
  Receipt,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import {
  useAgentsBalances,
  useAgentPendingCollections,
  useReceivePaymentFromAgent,
} from '@/lib/hooks/useFinancial';
import { formatCurrencySYP } from '@/lib/format';

interface AgentBalance {
  id: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    avatar?: string;
  };
  governorates: string[];
  commissionRate: number;
  balance: {
    currentBalance: number;
    pendingCollectionsCount: number;
    totalCollected: number;
    totalSubmitted: number;
  };
  lastCollection: {
    amount: number;
    date: string;
  } | null;
}

interface Collection {
  id: string;
  amount: number;
  collectedAt: string;
  description?: string;
  business: {
    id: string;
    nameAr: string;
    governorate?: { nameAr: string };
  };
}

export default function ReceivePaymentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<AgentBalance | null>(null);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);

  const limit = 20;
  const { data: balancesData, isLoading } = useAgentsBalances({ page, limit });
  const { data: collectionsData, isLoading: collectionsLoading } = useAgentPendingCollections(
    selectedAgent?.id || null
  );
  const receivePayment = useReceivePaymentFromAgent();

  const agents = (balancesData?.data || []) as AgentBalance[];
  const summary = balancesData?.summary || {
    totalAgents: 0,
    totalPendingBalance: 0,
    agentsWithBalance: 0,
  };
  const totalPages = balancesData?.meta?.totalPages || 1;

  // Filter agents by search
  const filteredAgents = agents.filter((agent) => {
    if (!search) return true;
    const fullName = `${agent.user.firstName} ${agent.user.lastName}`.toLowerCase();
    return (
      fullName.includes(search.toLowerCase()) ||
      agent.user.phone?.includes(search)
    );
  });

  const handleSelectAgent = (agent: AgentBalance) => {
    setSelectedAgent(agent);
    setSelectedCollections([]);
  };

  const handleReceivePayment = async () => {
    if (!selectedAgent) return;

    try {
      await receivePayment.mutateAsync({
        agentProfileId: selectedAgent.id,
        collectionIds: selectedCollections.length > 0 ? selectedCollections : undefined,
        notes: notes || undefined,
        receiptNumber: receiptNumber || undefined,
      });

      // Reset state
      setShowReceiveModal(false);
      setSelectedAgent(null);
      setSelectedCollections([]);
      setReceiptNumber('');
      setNotes('');
    } catch (error) {
      console.error('Failed to receive payment:', error);
    }
  };

  const toggleCollection = (collectionId: string) => {
    setSelectedCollections((prev) =>
      prev.includes(collectionId)
        ? prev.filter((id) => id !== collectionId)
        : [...prev, collectionId]
    );
  };

  const selectAllCollections = () => {
    if (collectionsData?.collections) {
      setSelectedCollections(collectionsData.collections.map((c: Collection) => c.id));
    }
  };

  const getSelectedAmount = () => {
    if (!collectionsData?.collections || selectedCollections.length === 0) {
      return collectionsData?.summary?.totalAmount || 0;
    }
    return collectionsData.collections
      .filter((c: Collection) => selectedCollections.includes(c.id))
      .reduce((sum: number, c: Collection) => sum + Number(c.amount), 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">استلام المبالغ من المندوبين</h1>
          <p className="text-gray-500 mt-1">متابعة الذمم المالية واستلام المقبوضات</p>
        </div>
        <Link
          href="/dashboard/financial"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>العودة للمالية</span>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">إجمالي المندوبين</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalAgents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-xl">
              <Wallet className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">إجمالي المبالغ المعلقة</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrencySYP(summary.totalPendingBalance)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-xl">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">مندوبين بذمم معلقة</p>
              <p className="text-2xl font-bold text-yellow-600">{summary.agentsWithBalance}</p>
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-600 rounded-xl">
            <Receipt className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-green-900 mb-2">آلية استلام المبالغ</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-green-800">
              <div className="bg-white/60 rounded-lg p-3">
                <div className="font-semibold mb-1">1. اختر المندوب</div>
                <p className="text-xs text-green-700">
                  اختر المندوب من القائمة لمشاهدة المقبوضات المعلقة
                </p>
              </div>
              <div className="bg-white/60 rounded-lg p-3">
                <div className="font-semibold mb-1">2. راجع المقبوضات</div>
                <p className="text-xs text-green-700">
                  راجع تفاصيل المقبوضات واختر المراد استلامها
                </p>
              </div>
              <div className="bg-white/60 rounded-lg p-3">
                <div className="font-semibold mb-1">3. أكّد الاستلام</div>
                <p className="text-xs text-green-700">
                  أدخل رقم الإيصال وأكّد الاستلام لتحديث النظام
                </p>
              </div>
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

      {/* Main Content - Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agents List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-bold text-gray-900">المندوبين وأرصدتهم</h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">لا يوجد مندوبين</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {filteredAgents.map((agent) => (
                <div
                  key={agent.id}
                  onClick={() => handleSelectAgent(agent)}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedAgent?.id === agent.id
                      ? 'bg-green-50 border-r-4 border-green-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-bold">
                          {agent.user.firstName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {agent.user.firstName} {agent.user.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{agent.user.phone}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p
                        className={`font-bold ${
                          agent.balance.currentBalance > 0 ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {formatCurrencySYP(agent.balance.currentBalance)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {agent.balance.pendingCollectionsCount} مقبوضات
                      </p>
                    </div>
                  </div>
                  {agent.balance.currentBalance > 1000000 && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      <span>مبلغ كبير يجب استلامه</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50"
              >
                السابق
              </button>
              <span className="text-sm text-gray-600">
                صفحة {page} من {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50"
              >
                التالي
              </button>
            </div>
          )}
        </div>

        {/* Agent Details & Collections */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {!selectedAgent ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Eye className="w-16 h-16 text-gray-200 mb-4" />
              <p className="text-gray-500">اختر مندوباً لعرض تفاصيل المقبوضات</p>
            </div>
          ) : (
            <>
              {/* Agent Header */}
              <div className="p-4 border-b bg-gradient-to-r from-green-600 to-green-700 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-xl font-bold">
                        {selectedAgent.user.firstName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">
                        {selectedAgent.user.firstName} {selectedAgent.user.lastName}
                      </h3>
                      <p className="text-sm text-green-100">{selectedAgent.user.phone}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedAgent(null)}
                    className="p-2 hover:bg-white/10 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-sm text-green-100">الرصيد المعلق</p>
                    <p className="text-2xl font-bold">
                      {formatCurrencySYP(selectedAgent.balance.currentBalance)}
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-sm text-green-100">عدد المقبوضات</p>
                    <p className="text-2xl font-bold">
                      {selectedAgent.balance.pendingCollectionsCount}
                    </p>
                  </div>
                </div>
              </div>

              {/* Collections List */}
              <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                <h4 className="font-medium text-gray-900">المقبوضات غير المسلّمة</h4>
                {collectionsData?.collections?.length > 0 && (
                  <button
                    onClick={selectAllCollections}
                    className="text-sm text-green-600 hover:text-green-700"
                  >
                    تحديد الكل
                  </button>
                )}
              </div>

              {collectionsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : collectionsData?.collections?.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-4" />
                  <p className="text-gray-500">لا توجد مقبوضات معلقة</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                  {collectionsData?.collections?.map((collection: Collection) => (
                    <div
                      key={collection.id}
                      onClick={() => toggleCollection(collection.id)}
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedCollections.includes(collection.id)
                          ? 'bg-green-50'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedCollections.includes(collection.id)}
                          onChange={() => toggleCollection(collection.id)}
                          className="w-5 h-5 text-green-600 rounded border-gray-300"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {collection.business?.nameAr || 'نشاط تجاري'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(collection.collectedAt).toLocaleDateString('ar-SA')}
                          </p>
                        </div>
                        <p className="font-bold text-blue-600">
                          {formatCurrencySYP(collection.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Receive Button */}
              {collectionsData?.collections?.length > 0 && (
                <div className="p-4 border-t bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-gray-600">المبلغ المحدد للاستلام:</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrencySYP(getSelectedAmount())}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowReceiveModal(true)}
                    className="w-full py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <DollarSign className="w-5 h-5" />
                    تأكيد استلام المبلغ
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Receive Modal */}
      {showReceiveModal && selectedAgent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b">
              <h3 className="text-lg font-bold text-gray-900">تأكيد استلام المبلغ</h3>
              <p className="text-sm text-gray-500 mt-1">
                استلام المبلغ من {selectedAgent.user.firstName} {selectedAgent.user.lastName}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-sm text-green-600 mb-1">المبلغ المستلم</p>
                <p className="text-3xl font-bold text-green-700">
                  {formatCurrencySYP(getSelectedAmount())}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم الإيصال (اختياري)
                </label>
                <input
                  type="text"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  placeholder="مثال: RCP-2026-001"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ملاحظات (اختياري)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="أي ملاحظات إضافية..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex gap-3">
              <button
                onClick={() => setShowReceiveModal(false)}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
              >
                إلغاء
              </button>
              <button
                onClick={handleReceivePayment}
                disabled={receivePayment.isPending}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {receivePayment.isPending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    تأكيد الاستلام
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
