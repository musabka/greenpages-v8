'use client';

import { useState } from 'react';
import { ArrowLeft, Search, Filter, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function AdminTransactionsPage() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  // Mock data - سيتم استبداله بـ API calls حقيقية
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
    {
      id: '2',
      type: 'COMMISSION',
      amount: 2500,
      description: 'عمولة لمندوب محمد علي',
      actor: 'نظام التسويات',
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

  const totalIncome = transactions
    .filter(t => t.type === 'DEPOSIT')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => ['COMMISSION', 'REFUND'].includes(t.type))
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">المعاملات المالية</h1>
          <p className="text-gray-500">عرض وتتبع جميع المعاملات المالية</p>
        </div>
        <Link
          href="/financial"
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          العودة
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium mb-1">إجمالي الإيرادات</p>
              <p className="text-2xl font-bold text-green-900">{totalIncome.toLocaleString()} ل.س</p>
            </div>
            <div className="p-3 bg-white/60 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow-sm p-4 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 font-medium mb-1">إجمالي المصاريف</p>
              <p className="text-2xl font-bold text-red-900">{totalExpense.toLocaleString()} ل.س</p>
            </div>
            <div className="p-3 bg-white/60 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-sm p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium mb-1">الرصيد الصافي</p>
              <p className="text-2xl font-bold text-blue-900">{(totalIncome - totalExpense).toLocaleString()} ل.س</p>
            </div>
            <div className="p-3 bg-white/60 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Filter className="w-5 h-5" />
          البحث والفلترة
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
        </div>
      </div>

      {/* Transactions Table */}
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
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">الحالة</th>
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
                    <td className="px-4 py-3 font-bold text-gray-900">{transaction.amount.toLocaleString()} ل.س</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{transaction.actor}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(transaction.createdAt).toLocaleDateString('ar-SA')}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                        مكتملة
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
