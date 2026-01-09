'use client';

import { useState } from 'react';
import { ArrowLeft, Download, Filter, BarChart3, TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function AdminReportsPage() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reportType, setReportType] = useState('SUMMARY');

  // Mock data
  const mockReport = {
    totalSettlements: 45,
    totalAmount: 1250000,
    totalCommissions: 62500,
    managersCount: 14,
    agentsCount: 342,
    period: {
      from: '2026-01-01',
      to: '2026-01-31',
    }
  };

  const handleDownloadPDF = () => {
    // سيتم استبدال هذا بـ API call حقيقي لإنشاء PDF
    console.log('Downloading PDF report...');
  };

  const handleDownloadExcel = () => {
    // سيتم استبدال هذا بـ API call حقيقي لإنشاء Excel
    console.log('Downloading Excel report...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">التقارير المالية</h1>
          <p className="text-gray-500">عرض وتحليل التقارير المالية الشاملة</p>
        </div>
        <Link
          href="/financial"
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          العودة
        </Link>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Filter className="w-5 h-5" />
          معايير التقرير
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">نوع التقرير</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="SUMMARY">ملخص عام</option>
              <option value="DETAILED">تقرير مفصل</option>
              <option value="SETTLEMENTS">التسويات</option>
              <option value="COMMISSIONS">العمولات</option>
              <option value="COLLECTIONS">التحصيلات</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">من تاريخ</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">إلى تاريخ</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={handleDownloadPDF}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
            <button
              onClick={handleDownloadExcel}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Excel
            </button>
          </div>
        </div>
      </div>

      {/* Report Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-sm p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium mb-1">عدد التسويات</p>
              <p className="text-2xl font-bold text-blue-900">{mockReport.totalSettlements}</p>
            </div>
            <div className="p-3 bg-white/60 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium mb-1">إجمالي المبالغ</p>
              <p className="text-xl font-bold text-green-900">{mockReport.totalAmount.toLocaleString()} ل.س</p>
            </div>
            <div className="p-3 bg-white/60 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-sm p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium mb-1">إجمالي العمولات</p>
              <p className="text-xl font-bold text-purple-900">{mockReport.totalCommissions.toLocaleString()} ل.س</p>
            </div>
            <div className="p-3 bg-white/60 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow-sm p-4 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700 font-medium mb-1">عدد المدراء</p>
              <p className="text-2xl font-bold text-orange-900">{mockReport.managersCount}</p>
            </div>
            <div className="p-3 bg-white/60 rounded-lg">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="p-2 bg-blue-100 rounded-lg h-fit">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-blue-900 mb-1">معلومات الفترة</h3>
            <p className="text-sm text-blue-700">
              التقرير يغطي الفترة من {new Date(mockReport.period.from).toLocaleDateString('ar-SA')} 
              {' '}إلى{' '}
              {new Date(mockReport.period.to).toLocaleDateString('ar-SA')}
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-medium text-gray-900">تفاصيل التقرير</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">البند</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">المبلغ/العدد</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">النسبة المئوية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">إجمالي التسويات</td>
                <td className="px-4 py-3 text-gray-600">{mockReport.totalSettlements} تسوية</td>
                <td className="px-4 py-3 text-gray-600">100%</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">إجمالي المبالغ المحصلة</td>
                <td className="px-4 py-3 font-bold text-green-600">{mockReport.totalAmount.toLocaleString()} ل.س</td>
                <td className="px-4 py-3 text-gray-600">100%</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">العمولات المدفوعة</td>
                <td className="px-4 py-3 font-bold text-purple-600">{mockReport.totalCommissions.toLocaleString()} ل.س</td>
                <td className="px-4 py-3 text-gray-600">
                  {((mockReport.totalCommissions / mockReport.totalAmount) * 100).toFixed(2)}%
                </td>
              </tr>
              <tr className="hover:bg-gray-50 bg-gray-50">
                <td className="px-4 py-3 font-bold text-gray-900">الصافي</td>
                <td className="px-4 py-3 font-bold text-blue-600">
                  {(mockReport.totalAmount - mockReport.totalCommissions).toLocaleString()} ل.س
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {(((mockReport.totalAmount - mockReport.totalCommissions) / mockReport.totalAmount) * 100).toFixed(2)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
