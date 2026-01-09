'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Calendar,
  TrendingUp,
  Printer,
  Eye,
} from 'lucide-react';
import {
  useAgentFinancialSettlements,
  useAgentFinancialSettlementsSummary,
} from '@/lib/hooks/useFinancial';

type SettlementStatus = 'DRAFT' | 'PENDING_AGENT' | 'PENDING_MANAGER' | 'CONFIRMED' | 'CANCELLED';

interface Settlement {
  id: string;
  settlementNumber: string;
  totalCollected: number;
  cashOnHand: number;
  previouslyDelivered: number;
  totalCommissions: number;
  amountDelivered: number;
  commissionsPaid: number;
  collectionsCount: number;
  commissionsCount: number;
  status: SettlementStatus;
  createdAt: string;
  confirmedAt?: string;
  managerName: string;
  governorateName: string;
}

const statusConfig = {
  DRAFT: { label: 'مسودة', color: 'bg-gray-100 text-gray-700', icon: FileText },
  PENDING_AGENT: { label: 'بانتظار تأكيدك', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  PENDING_MANAGER: { label: 'بانتظار المدير', color: 'bg-blue-100 text-blue-700', icon: Clock },
  CONFIRMED: { label: 'مؤكدة', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  CANCELLED: { label: 'ملغاة', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function AgentSettlementsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  const { data: settlementsData, isLoading } = useAgentFinancialSettlements({
    status: statusFilter || undefined,
    page,
    limit: 20,
  });
  
  const { data: summary } = useAgentFinancialSettlementsSummary();

  const settlements = (settlementsData?.data || []) as Settlement[];
  const totalPages = settlementsData?.meta?.totalPages || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">التسويات المالية</h1>
          <p className="text-gray-500 mt-1">سجل التسويات المالية المكتملة والمعلقة</p>
        </div>
        <Link
          href="/dashboard/financial"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>العودة</span>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">تسويات مؤكدة</p>
              <p className="text-2xl font-bold text-gray-900">{summary?.confirmedCount || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-xl">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">تسويات معلقة</p>
              <p className="text-2xl font-bold text-yellow-600">{summary?.pendingCount || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">إجمالي المُسلّم</p>
              <p className="text-xl font-bold text-blue-600">
                {(summary?.totalDelivered || 0).toLocaleString()} ل.س
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">إجمالي العمولات المدفوعة</p>
              <p className="text-xl font-bold text-purple-600">
                {(summary?.totalCommissionsPaid || 0).toLocaleString()} ل.س
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-600 rounded-xl">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-blue-900 mb-2">ما هي التسوية المالية؟</h3>
            <p className="text-sm text-blue-800">
              التسوية المالية هي عملية تصفية حساب بينك وبين مدير المحافظة. عند إجراء التسوية:
            </p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
              <li>يتم استلام كامل الأموال النقدية التي بحوزتك</li>
              <li>يتم دفع كامل عمولاتك المستحقة</li>
              <li>تُصفّر العدادات وتبدأ دورة مالية جديدة</li>
              <li>تُحفظ التسوية كوثيقة رسمية يمكن طباعتها</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === ''
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            الكل
          </button>
          <button
            onClick={() => setStatusFilter('CONFIRMED')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'CONFIRMED'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            المؤكدة
          </button>
          <button
            onClick={() => setStatusFilter('PENDING_MANAGER')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'PENDING_MANAGER'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            المعلقة
          </button>
        </div>
      </div>

      {/* Settlements List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : settlements.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد تسويات مالية</p>
            <p className="text-sm text-gray-400 mt-1">
              ستظهر التسويات هنا عند إجراء تسوية مالية مع مدير المحافظة
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {settlements.map((settlement) => {
              const config = statusConfig[settlement.status];
              const StatusIcon = config.icon;

              return (
                <div
                  key={settlement.id}
                  className="p-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-sm font-bold text-blue-600">
                          {settlement.settlementNumber}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {config.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-gray-500">المبلغ المُسلّم</p>
                          <p className="font-bold text-green-600">
                            {Number(settlement.amountDelivered).toLocaleString()} ل.س
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">العمولات المدفوعة</p>
                          <p className="font-bold text-purple-600">
                            {Number(settlement.commissionsPaid).toLocaleString()} ل.س
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">عدد التحصيلات</p>
                          <p className="font-medium text-gray-900">{settlement.collectionsCount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">مدير المحافظة</p>
                          <p className="font-medium text-gray-900">{settlement.managerName}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(settlement.createdAt).toLocaleDateString('ar-SA')}
                        </span>
                        <span>{settlement.governorateName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/financial/settlements/${settlement.id}`}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="عرض التفاصيل"
                      >
                        <Eye className="w-5 h-5" />
                      </Link>
                      {settlement.status === 'CONFIRMED' && (
                        <Link
                          href={`/dashboard/financial/settlements/${settlement.id}/print`}
                          className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="طباعة"
                        >
                          <Printer className="w-5 h-5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-100">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              السابق
            </button>
            <span className="text-sm text-gray-500">
              صفحة {page} من {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              التالي
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
