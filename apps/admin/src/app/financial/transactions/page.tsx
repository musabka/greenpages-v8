'use client';

import { useState } from 'react';
import { ArrowLeft, Search, Filter, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import Link from 'next/link';
import { formatNumber } from '@/lib/format';

export default function AdminTransactionsPage() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);

  // Mock data
  const mockTransactions = [
    {
      id: '1',
      type: 'DEPOSIT',
      amount: 50000,
      description: 'تسديد من مدير محافظة حلب',
      actor: 'مدير حلب',
      createdAt: new Date().toISOString(),
      status: 'COMPLETED',
    },
  ];

  const transactions = mockTransactions;

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'DEPOSIT': 'إيداع',
      'COMMISSION': 'عمولة',
      'SETTLEMENT': 'تسوية',
      'REFUND': 'استرجاع',
      'PAYMENT': 'دفع',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'DEPOSIT': 'text-green-600 bg-green-100',
      'COMMISSION': 'text-purple-600 bg-purple-100',
      'SETTLEMENT': 'text-blue-600 bg-blue-100',
      'REFUND': 'text-red-600 bg-red-100',
      'PAYMENT': 'text-orange-600 bg-orange-100',
    };
    return colors[type] || 'text-gray-600 bg-gray-100';
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
              <h1 className="text-2xl font-bold text-gray-900">المعاملات المالية</h1>
              <p className="text-gray-500">عرض وتتبع جميع المعاملات المالية</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Filter className="w-5 h-5" />
              البحث والفلترة
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">البحث</label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="ابحث برقم المعاملة..."
                    className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع المعاملة</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">الكل</option>
                  <option value="DEPOSIT">إيداع</option>
                  <option value="COMMISSION">عمولة</option>
                  <option value="SETTLEMENT">تسوية</option>
                  <option value="REFUND">استرجاع</option>
                  <option value="PAYMENT">دفع</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">لا توجد معاملات</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">الرقم</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">النوع</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">الوصف</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">المبلغ</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">من</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-sm text-gray-900">{transaction.id}</td>
                        <td className="px-4 py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(transaction.type)}`}>
                            {getTypeLabel(transaction.type)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{transaction.description}</td>
                        <td className="px-4 py-3 font-bold text-gray-900">{formatNumber(transaction.amount)} ل.س</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{transaction.actor}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(transaction.createdAt).toLocaleDateString('ar-SA')}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
