'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Printer,
  DollarSign,
  User,
  Phone,
  MapPin,
  Calendar,
  Hash,
} from 'lucide-react';
import { useAgentFinancialSettlementDetails } from '@/lib/hooks/useFinancial';

type SettlementStatus = 'DRAFT' | 'PENDING_AGENT' | 'PENDING_MANAGER' | 'CONFIRMED' | 'CANCELLED';

const statusConfig = {
  DRAFT: { label: 'مسودة', color: 'bg-gray-100 text-gray-700', icon: FileText },
  PENDING_AGENT: { label: 'بانتظار تأكيدك', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  PENDING_MANAGER: { label: 'بانتظار المدير', color: 'bg-blue-100 text-blue-700', icon: Clock },
  CONFIRMED: { label: 'مؤكدة', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  CANCELLED: { label: 'ملغاة', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function SettlementDetailsPage() {
  const params = useParams();
  const settlementId = params.id as string;

  const { data: settlement, isLoading } = useAgentFinancialSettlementDetails(settlementId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">جارٍ تحميل التسوية...</p>
        </div>
      </div>
    );
  }

  if (!settlement) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">التسوية غير موجودة</p>
        <Link
          href="/dashboard/financial/settlements"
          className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          العودة للتسويات
        </Link>
      </div>
    );
  }

  const status = settlement.status as SettlementStatus;
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">تفاصيل التسوية</h1>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
              <StatusIcon className="w-4 h-4" />
              {config.label}
            </span>
          </div>
          <p className="text-blue-600 font-mono font-bold mt-1">{settlement.settlementNumber}</p>
        </div>
        <div className="flex items-center gap-2">
          {settlement.status === 'CONFIRMED' && (
            <Link
              href={`/dashboard/financial/settlements/${settlementId}/print`}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Printer className="w-5 h-5" />
              طباعة
            </Link>
          )}
          <Link
            href="/dashboard/financial/settlements"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>العودة</span>
          </Link>
        </div>
      </div>

      {/* Main Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Info */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            بيانات المندوب
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">الاسم:</span>
              <span className="font-medium">{settlement.agentName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">الهاتف:</span>
              <span className="font-medium" dir="ltr">{settlement.agentPhone}</span>
            </div>
          </div>
        </div>

        {/* Manager Info */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-green-600" />
            بيانات مدير المحافظة
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">الاسم:</span>
              <span className="font-medium">{settlement.managerName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">الهاتف:</span>
              <span className="font-medium" dir="ltr">{settlement.managerPhone}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">المحافظة:</span>
              <span className="font-medium">{settlement.governorateName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <h2 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          الملخص المالي
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/60 rounded-lg p-4">
            <p className="text-sm text-blue-700">إجمالي المقبوضات</p>
            <p className="text-xl font-bold text-blue-900">
              {Number(settlement.totalCollected).toLocaleString()} ل.س
            </p>
          </div>
          <div className="bg-white/60 rounded-lg p-4">
            <p className="text-sm text-blue-700">النقد بحوزة المندوب</p>
            <p className="text-xl font-bold text-red-600">
              {Number(settlement.cashOnHand).toLocaleString()} ل.س
            </p>
          </div>
          <div className="bg-white/60 rounded-lg p-4">
            <p className="text-sm text-blue-700">المسلم سابقاً</p>
            <p className="text-xl font-bold text-gray-700">
              {Number(settlement.previouslyDelivered).toLocaleString()} ل.س
            </p>
          </div>
          <div className="bg-white/60 rounded-lg p-4">
            <p className="text-sm text-blue-700">إجمالي العمولات المستحقة</p>
            <p className="text-xl font-bold text-purple-700">
              {Number(settlement.totalCommissions).toLocaleString()} ل.س
            </p>
          </div>
        </div>
      </div>

      {/* Settlement Amounts */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-bold text-gray-900 mb-4">مبالغ هذه التسوية</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-600 rounded-lg">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-700">المبلغ المُسلّم للمدير</p>
                <p className="text-2xl font-bold text-green-700">
                  {Number(settlement.amountDelivered).toLocaleString()} ل.س
                </p>
              </div>
            </div>
            <p className="text-xs text-green-600 mt-2">
              عدد التحصيلات: {settlement.collectionsCount}
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-600 rounded-lg">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-700">العمولات المدفوعة لك</p>
                <p className="text-2xl font-bold text-purple-700">
                  {Number(settlement.commissionsPaid).toLocaleString()} ل.س
                </p>
              </div>
            </div>
            <p className="text-xs text-purple-600 mt-2">
              عدد العمولات: {settlement.commissionsCount}
            </p>
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-600" />
          التواريخ
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">تاريخ الإنشاء</p>
            <p className="font-medium">
              {new Date(settlement.createdAt).toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          {settlement.confirmedAt && (
            <div>
              <p className="text-sm text-gray-500">تاريخ التأكيد</p>
              <p className="font-medium">
                {new Date(settlement.confirmedAt).toLocaleDateString('ar-SA', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Collections List */}
      {settlement.collections && settlement.collections.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">التحصيلات المشمولة</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {settlement.collections.map((collection: any) => (
              <div key={collection.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {collection.business?.nameAr || 'تحصيل نقدي'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(collection.collectedAt).toLocaleDateString('ar-SA')}
                  </p>
                </div>
                <p className="font-bold text-blue-600">
                  {Number(collection.amount).toLocaleString()} ل.س
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {settlement.notes && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-2">ملاحظات</h2>
          <p className="text-gray-600 whitespace-pre-line">{settlement.notes}</p>
        </div>
      )}
    </div>
  );
}
