'use client';

import { ArrowLeft, Printer, Download } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function SettlementDetailPage() {
  const params = useParams();
  const settlementId = params.id as string;

  // Mock data - سيتم استبداله بـ API call
  const settlement = {
    id: settlementId,
    settlementNumber: 'SET-2026-001',
    managerName: 'أحمد محمد',
    governorate: 'محافظة حلب',
    periodStart: '2025-12-01',
    periodEnd: '2025-12-31',
    totalCollected: 50000,
    collectionsCount: 245,
    totalCommissions: 2500,
    commissionsCount: 12,
    status: 'CONFIRMED',
    createdAt: '2026-01-01T10:30:00Z',
    confirmedAt: '2026-01-02T14:20:00Z',
    notes: 'تسوية سنوية',
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    console.log('Downloading settlement PDF...');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link
                href="/financial/settlements"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                العودة
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{settlement.settlementNumber}</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Printer className="w-4 h-4" />
              طباعة
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              تحميل PDF
            </button>
          </div>
        </div>

        {/* Document */}
        <div className="bg-white rounded-lg shadow-sm p-8 print:shadow-none print:p-0">
          {/* Invoice Header */}
          <div className="border-b pb-6 mb-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">وثيقة التسوية المالية</h2>
                <p className="text-gray-500 mt-1">Settlement Document</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">رقم التسوية</p>
                <p className="text-2xl font-bold text-gray-900">{settlement.settlementNumber}</p>
              </div>
            </div>
          </div>

          {/* Settlement Info */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-gray-900 mb-4">معلومات مدير المحافظة</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-gray-600">الاسم</dt>
                  <dd className="font-medium text-gray-900">{settlement.managerName}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">المحافظة</dt>
                  <dd className="font-medium text-gray-900">{settlement.governorate}</dd>
                </div>
              </dl>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-4">تاريخات التسوية</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-gray-600">فترة التسوية</dt>
                  <dd className="font-medium text-gray-900">
                    {new Date(settlement.periodStart).toLocaleDateString('ar-SA')} إلى{' '}
                    {new Date(settlement.periodEnd).toLocaleDateString('ar-SA')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">تاريخ التأكيد</dt>
                  <dd className="font-medium text-gray-900">
                    {new Date(settlement.confirmedAt).toLocaleDateString('ar-SA')}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Details Table */}
          <div className="mb-8">
            <h3 className="font-bold text-gray-900 mb-4">تفاصيل التسوية</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-900">
                  <th className="text-right py-3 px-4 font-bold text-gray-900">البند</th>
                  <th className="text-right py-3 px-4 font-bold text-gray-900">العدد/المبلغ</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-4 text-gray-700">عدد التحصيلات</td>
                  <td className="py-3 px-4 text-gray-900 font-medium">{settlement.collectionsCount}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-4 text-gray-700">إجمالي المبالغ المحصلة</td>
                  <td className="py-3 px-4 text-gray-900 font-bold text-lg">
                    {settlement.totalCollected.toLocaleString()} ل.س
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-4 text-gray-700">عدد العمولات</td>
                  <td className="py-3 px-4 text-gray-900 font-medium">{settlement.commissionsCount}</td>
                </tr>
                <tr className="bg-yellow-50 border-b-2 border-gray-900">
                  <td className="py-3 px-4 text-gray-700 font-medium">إجمالي العمولات المدفوعة</td>
                  <td className="py-3 px-4 text-gray-900 font-bold text-lg">
                    {settlement.totalCommissions.toLocaleString()} ل.س
                  </td>
                </tr>
                <tr className="bg-green-50 border-b-2 border-gray-900">
                  <td className="py-3 px-4 text-gray-900 font-bold">الصافي المستحق</td>
                  <td className="py-3 px-4 text-gray-900 font-bold text-xl">
                    {(settlement.totalCollected - settlement.totalCommissions).toLocaleString()} ل.س
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Status */}
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">
              <span className="font-bold">حالة التسوية:</span> مؤكدة بنجاح في{' '}
              {new Date(settlement.confirmedAt).toLocaleDateString('ar-SA')}
            </p>
          </div>

          {/* Notes */}
          {settlement.notes && (
            <div className="mb-8">
              <h3 className="font-bold text-gray-900 mb-2">ملاحظات</h3>
              <p className="text-gray-700">{settlement.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t pt-6 text-center text-sm text-gray-500">
            <p>وثيقة رسمية من نظام إدارة التسويات المالية</p>
            <p>تم إنشاؤها بتاريخ: {new Date().toLocaleDateString('ar-SA')}</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white;
            padding: 0;
            margin: 0;
          }
          .print\\:shadow-none {
            box-shadow: none;
          }
          .print\\:p-0 {
            padding: 0;
          }
          button {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
