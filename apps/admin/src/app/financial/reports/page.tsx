'use client';

import { useState } from 'react';
import { ArrowLeft, BarChart3, Download, FileText, TrendingUp, Calendar } from 'lucide-react';
import Link from 'next/link';
import { formatNumber } from '@/lib/format';

export default function AdminReportsPage() {
  const [dateRange, setDateRange] = useState('month');

  // Mock data
  const mockStats = {
    totalSettlements: 145,
    totalAmount: 2500000,
    averageAmount: 17241,
    pendingCount: 12,
  };

  const mockReports = [
    {
      id: '1',
      name: 'تقرير التسويات الشهري',
      description: 'ملخص جميع التسويات المكتملة والمعلقة',
      generated: new Date(),
      type: 'SETTLEMENTS',
    },
    {
      id: '2',
      name: 'تقرير العمولات',
      description: 'تفاصيل العمولات المدفوعة والمستحقة',
      generated: new Date(Date.now() - 86400000),
      type: 'COMMISSIONS',
    },
  ];

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    console.log(`Exporting reports as ${format}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Link href="/financial" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="w-4 h-4" />
                  العودة
                </Link>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">التقارير المالية</h1>
              <p className="text-gray-500">عرض وتحليل التقارير المالية الشاملة</p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">إجمالي التسويات</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{mockStats.totalSettlements}</p>
                </div>
                <BarChart3 className="w-10 h-10 text-blue-100 bg-blue-50 rounded-lg p-2" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">إجمالي المبلغ</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(mockStats.totalAmount)}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-100 bg-green-50 rounded-lg p-2" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">المتوسط</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(mockStats.averageAmount)}</p>
                </div>
                <BarChart3 className="w-10 h-10 text-purple-100 bg-purple-50 rounded-lg p-2" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">معلقة</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">{mockStats.pendingCount}</p>
                </div>
                <Calendar className="w-10 h-10 text-orange-100 bg-orange-50 rounded-lg p-2" />
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Download className="w-5 h-5" />
              تصدير التقارير
            </h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleExport('pdf')}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition"
              >
                تصدير PDF
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 transition"
              >
                تصدير Excel
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition"
              >
                تصدير CSV
              </button>
            </div>
          </div>

          {/* Available Reports */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                التقارير المتاحة
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {mockReports.map((report) => (
                <div key={report.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{report.name}</h4>
                      <p className="text-gray-500 text-sm mt-1">{report.description}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        تم الإنشاء: {report.generated.toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                        عرض
                      </button>
                      <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                        تحميل
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
