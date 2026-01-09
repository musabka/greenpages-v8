'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { useAgentSettlementDetails } from '@/lib/hooks/useFinancial';

export default function PrintSettlementPage() {
  const params = useParams();
  const router = useRouter();
  const settlementId = params.id as string;

  const { data: settlement, isLoading } = useAgentSettlementDetails(settlementId);

  useEffect(() => {
    if (settlement && !isLoading) {
      // Auto print after page loads
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [settlement, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">جارٍ تحميل التسوية...</p>
        </div>
      </div>
    );
  }

  if (!settlement) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">التسوية غير موجودة</p>
      </div>
    );
  }

  const netAmount = Number(settlement.amountDelivered || 0) - Number(settlement.commissionsPaid || 0);

  return (
    <>
      {/* Print Controls - Hidden when printing */}
      <div className="print:hidden fixed top-4 right-4 flex gap-2 z-50">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg"
        >
          <Printer className="w-5 h-5" />
          طباعة
        </button>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-lg"
        >
          <ArrowLeft className="w-5 h-5" />
          رجوع
        </button>
      </div>

      {/* Print Document */}
      <div className="max-w-3xl mx-auto p-8 bg-white print:p-0 print:max-w-none" dir="rtl">
        {/* Header */}
        <div className="text-center border-b-2 border-gray-800 pb-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">الصفحات الخضراء</h1>
          <h2 className="text-xl font-semibold text-gray-700">كشف تسوية مالية - مندوب</h2>
          <p className="text-lg font-mono font-bold text-green-600 mt-2">{settlement.settlementNumber}</p>
          <p className="text-sm text-gray-500 mt-1">
            تاريخ التسوية: {new Date(settlement.confirmedAt || settlement.createdAt).toLocaleDateString('ar-SA', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Settlement Info */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Agent Info */}
          <div className="border border-gray-300 rounded-lg p-4">
            <h3 className="font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">بيانات المندوب (المُسلِّم)</h3>
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-1 text-gray-600">الاسم:</td>
                  <td className="py-1 font-medium text-left">{settlement.agentName}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">الهاتف:</td>
                  <td className="py-1 font-medium text-left" dir="ltr">{settlement.agentPhone}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Manager Info */}
          <div className="border border-gray-300 rounded-lg p-4">
            <h3 className="font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">بيانات مدير المحافظة (المُستلِم)</h3>
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-1 text-gray-600">الاسم:</td>
                  <td className="py-1 font-medium text-left">{settlement.managerName}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">الهاتف:</td>
                  <td className="py-1 font-medium text-left" dir="ltr">{settlement.managerPhone}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">المحافظة:</td>
                  <td className="py-1 font-medium text-left">{settlement.governorateName}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="border border-gray-300 rounded-lg p-4 mb-6">
          <h3 className="font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">الملخص المالي قبل التسوية</h3>
          <table className="w-full">
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="py-2 text-gray-600">إجمالي مقبوضات المندوب:</td>
                <td className="py-2 font-bold text-left">{Number(settlement.totalCollected || 0).toLocaleString()} ل.س</td>
              </tr>
              <tr>
                <td className="py-2 text-gray-600">النقد بحوزة المندوب (قبل التسوية):</td>
                <td className="py-2 font-bold text-left">{Number(settlement.cashOnHand || 0).toLocaleString()} ل.س</td>
              </tr>
              <tr>
                <td className="py-2 text-gray-600">المسلّم سابقاً:</td>
                <td className="py-2 font-bold text-left">{Number(settlement.previouslyDelivered || 0).toLocaleString()} ل.س</td>
              </tr>
              <tr>
                <td className="py-2 text-gray-600">إجمالي العمولات المستحقة للمندوب:</td>
                <td className="py-2 font-bold text-left">{Number(settlement.totalCommissions || 0).toLocaleString()} ل.س</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Settlement Amounts */}
        <div className="bg-gray-50 border-2 border-gray-800 rounded-lg p-4 mb-6">
          <h3 className="font-bold text-gray-900 text-center mb-4">مبالغ هذه التسوية</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center border border-gray-300 rounded p-3 bg-white">
              <p className="text-sm text-gray-600">المبلغ المستلم من المندوب</p>
              <p className="text-2xl font-bold text-green-700">{Number(settlement.amountDelivered || 0).toLocaleString()} ل.س</p>
              <p className="text-xs text-gray-500 mt-1">({settlement.collectionsCount || 0} تحصيل)</p>
            </div>
            <div className="text-center border border-gray-300 rounded p-3 bg-white">
              <p className="text-sm text-gray-600">العمولات المدفوعة للمندوب</p>
              <p className="text-2xl font-bold text-purple-700">{Number(settlement.commissionsPaid || 0).toLocaleString()} ل.س</p>
              <p className="text-xs text-gray-500 mt-1">({settlement.commissionsCount || 0} عمولة)</p>
            </div>
            <div className="text-center border-2 border-blue-500 rounded p-3 bg-blue-50">
              <p className="text-sm text-blue-700 font-medium">صافي المبلغ المستلم</p>
              <p className="text-2xl font-bold text-blue-700">{netAmount.toLocaleString()} ل.س</p>
              <p className="text-xs text-blue-600 mt-1">(بعد خصم العمولات)</p>
            </div>
          </div>
        </div>

        {/* Collections Details */}
        {settlement.collections && settlement.collections.length > 0 && (
          <div className="border border-gray-300 rounded-lg overflow-hidden mb-6">
            <h3 className="font-bold text-gray-900 bg-gray-100 px-4 py-2 border-b border-gray-300">
              تفاصيل التحصيلات المشمولة ({settlement.collections.length})
            </h3>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-right border-b border-gray-200">#</th>
                  <th className="px-4 py-2 text-right border-b border-gray-200">النشاط التجاري</th>
                  <th className="px-4 py-2 text-right border-b border-gray-200">التاريخ</th>
                  <th className="px-4 py-2 text-left border-b border-gray-200">المبلغ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {settlement.collections.map((collection: any, index: number) => (
                  <tr key={collection.id}>
                    <td className="px-4 py-2">{index + 1}</td>
                    <td className="px-4 py-2">{collection.business?.nameAr || 'تحصيل نقدي'}</td>
                    <td className="px-4 py-2">{new Date(collection.collectedAt).toLocaleDateString('ar-SA')}</td>
                    <td className="px-4 py-2 text-left font-medium">{Number(collection.amount).toLocaleString()} ل.س</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Notes */}
        {settlement.notes && (
          <div className="border border-gray-300 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-gray-900 border-b border-gray-200 pb-2 mb-2">ملاحظات</h3>
            <p className="text-gray-700 whitespace-pre-line">{settlement.notes}</p>
          </div>
        )}

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
          <div>
            <span className="text-gray-600">تاريخ إنشاء التسوية: </span>
            <span className="font-medium">
              {new Date(settlement.createdAt).toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
          {settlement.confirmedAt && (
            <div>
              <span className="text-gray-600">تاريخ التأكيد: </span>
              <span className="font-medium">
                {new Date(settlement.confirmedAt).toLocaleDateString('ar-SA', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          )}
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t-2 border-gray-800">
          <div className="text-center">
            <p className="font-bold text-gray-900 mb-16">توقيع المندوب (المُسلِّم)</p>
            <div className="border-t-2 border-gray-400 pt-2">
              <p className="text-sm text-gray-600">{settlement.agentName}</p>
            </div>
          </div>
          <div className="text-center">
            <p className="font-bold text-gray-900 mb-16">توقيع مدير المحافظة (المُستلِم)</p>
            <div className="border-t-2 border-gray-400 pt-2">
              <p className="text-sm text-gray-600">{settlement.managerName}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
          <p>تم إنشاء هذا الكشف إلكترونياً من نظام الصفحات الخضراء</p>
          <p className="mt-1">رقم التسوية: {settlement.settlementNumber}</p>
          <p className="mt-1">هذا الكشف وثيقة رسمية لإثبات التسليم والاستلام</p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </>
  );
}
