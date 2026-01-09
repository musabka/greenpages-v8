'use client';

import { useState } from 'react';
import { Users, Search, Edit, Percent, Wallet, DollarSign, ArrowLeft, Filter } from 'lucide-react';
import { useManagerBalances, useUpdateManagerCommission, useReceivePayment } from '@/lib/hooks/useFinancial';
import Link from 'next/link';
import { formatNumber } from '@/lib/format';

export default function AdminManagersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editingManager, setEditingManager] = useState<string | null>(null);
  const [rate, setRate] = useState('');
  const [notes, setNotes] = useState('');
  const [receivingPayment, setReceivingPayment] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  
  const limit = 20;
  const { data, isLoading } = useManagerBalances({ page, limit });
  const updateCommission = useUpdateManagerCommission();
  const receivePayment = useReceivePayment();

  const managers = data?.data || [];
  const total = data?.meta?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const handleEditCommission = (manager: any) => {
    setEditingManager(manager.id);
    setRate(manager.commissionRate?.toString() || '10');
    setNotes(manager.commissionNotes || '');
  };

  const handleSaveCommission = async (managerId: string) => {
    try {
      await updateCommission.mutateAsync({
        managerId,
        rate: parseFloat(rate),
        notes: notes || undefined,
      });
      setEditingManager(null);
    } catch (error) {
      console.error('Failed to update commission:', error);
    }
  };

  const handleReceivePayment = async (managerId: string) => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    try {
      await receivePayment.mutateAsync({
        managerId,
        amount: parseFloat(amount),
        notes: notes || undefined,
      });
      setReceivingPayment(null);
      setAmount('');
      setNotes('');
    } catch (error) {
      console.error('Failed to receive payment:', error);
    }
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
              <h1 className="text-2xl font-bold text-gray-900">إدارة مدراء المحافظات</h1>
              <p className="text-gray-500">تحديث النسب واستلام الأموال</p>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">إجمالي المدراء</p>
                  <p className="text-xl font-bold text-gray-900">{total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Wallet className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">إجمالي الذمم المستحقة</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatNumber(managers.reduce((sum: number, m: any) => sum + (m.currentBalance || 0), 0))} ل.س
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">متوسط النسبة</p>
                  <p className="text-xl font-bold text-gray-900">
                    {managers.length > 0 
                      ? (managers.reduce((sum: number, m: any) => sum + (m.commissionRate || 0), 0) / managers.length).toFixed(1)
                      : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Filter className="w-5 h-5" />
              البحث
            </h3>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث باسم المدير أو المحافظة..."
                className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : managers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">لا يوجد مدراء</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">المدير</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">المحافظة</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">النسبة</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">الرصيد المستحق</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {managers.map((manager: any) => (
                      <tr key={manager.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">
                            {manager.user?.firstName} {manager.user?.lastName}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {manager.governorate?.nameAr}
                        </td>
                        <td className="px-4 py-3">
                          {editingManager === manager.id ? (
                            <input
                              type="number"
                              value={rate}
                              onChange={(e) => setRate(e.target.value)}
                              className="w-16 border rounded px-2 py-1"
                              step="0.1"
                            />
                          ) : (
                            <span className="font-medium text-gray-900">{manager.commissionRate}%</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-red-600">
                            {formatNumber(manager.currentBalance || 0)} ل.س
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {editingManager === manager.id ? (
                              <>
                                <button
                                  onClick={() => handleSaveCommission(manager.id)}
                                  className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                  حفظ
                                </button>
                                <button
                                  onClick={() => setEditingManager(null)}
                                  className="text-sm px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                >
                                  إلغاء
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleEditCommission(manager)}
                                  className="p-2 hover:bg-blue-100 rounded-lg"
                                  title="تعديل النسبة"
                                >
                                  <Edit className="w-4 h-4 text-blue-600" />
                                </button>
                                {manager.currentBalance > 0 && (
                                  <button
                                    onClick={() => setReceivingPayment(manager.id)}
                                    className="p-2 hover:bg-green-100 rounded-lg"
                                    title="استلام دفع"
                                  >
                                    <Wallet className="w-4 h-4 text-green-600" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  السابق
                </button>
                <span className="text-sm text-gray-600">
                  صفحة {page} من {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  التالي
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
