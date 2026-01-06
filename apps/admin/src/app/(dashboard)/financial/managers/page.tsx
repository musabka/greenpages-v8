'use client';

import { useState } from 'react';
import { Users, Search, Edit, Percent, Wallet, DollarSign } from 'lucide-react';
import { useManagerBalances, useUpdateManagerCommission, useReceivePayment } from '@/lib/hooks/useFinancial';
import Link from 'next/link';

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة مدراء المحافظات</h1>
          <p className="text-gray-500">تحديد النسب واستلام الأموال</p>
        </div>
        <Link
          href="/financial"
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          العودة
        </Link>
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
              <p className="text-sm text-gray-500">إجمالي المستحق</p>
              <p className="text-xl font-bold text-gray-900">
                {managers
                  .reduce((sum: number, m: any) => sum + (m.currentBalance || 0), 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Percent className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">متوسط النسبة</p>
              <p className="text-xl font-bold text-gray-900">
                {managers.length > 0
                  ? (
                      managers.reduce((sum: number, m: any) => sum + (m.commissionRate || 0), 0) /
                      managers.length
                    ).toFixed(1)
                  : 0}
                %
              </p>
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
            placeholder="البحث بالاسم..."
            className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      المدير
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      نسبة العمولة
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      الرصيد المستحق
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      إجمالي المقبوضات
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      المُسلّم
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {managers
                    .filter((manager: any) =>
                      !search ||
                      `${manager.user?.firstName} ${manager.user?.lastName}`
                        .toLowerCase()
                        .includes(search.toLowerCase())
                    )
                    .map((manager: any) => (
                      <tr key={manager.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {manager.user?.firstName} {manager.user?.lastName}
                              </p>
                              <p className="text-sm text-gray-500">{manager.user?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {editingManager === manager.id ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={rate}
                                  onChange={(e) => setRate(e.target.value)}
                                  step="0.1"
                                  min="0"
                                  max="100"
                                  className="w-20 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-gray-500">%</span>
                              </div>
                              <input
                                type="text"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="ملاحظات..."
                                className="w-full px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          ) : (
                            <div>
                              <p className="font-medium text-blue-600">
                                {manager.commissionRate?.toFixed(1) || 0}%
                              </p>
                              {manager.commissionNotes && (
                                <p className="text-xs text-gray-500 mt-1">{manager.commissionNotes}</p>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-red-600">
                            {manager.currentBalance?.toLocaleString() || 0} ل.س
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {manager.totalCollected?.toLocaleString() || 0} ل.س
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {manager.totalSubmitted?.toLocaleString() || 0} ل.س
                        </td>
                        <td className="px-4 py-3">
                          {editingManager === manager.id ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveCommission(manager.id)}
                                disabled={updateCommission.isPending}
                                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
                              >
                                حفظ
                              </button>
                              <button
                                onClick={() => setEditingManager(null)}
                                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                              >
                                إلغاء
                              </button>
                            </div>
                          ) : receivingPayment === manager.id ? (
                            <div className="flex gap-2">
                              <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="المبلغ"
                                className="w-32 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                              />
                              <button
                                onClick={() => handleReceivePayment(manager.id)}
                                disabled={receivePayment.isPending || !amount}
                                className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50"
                              >
                                استلام
                              </button>
                              <button
                                onClick={() => setReceivingPayment(null)}
                                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                              >
                                إلغاء
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditCommission(manager)}
                                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                title="تعديل النسبة"
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                              {manager.currentBalance > 0 && (
                                <button
                                  onClick={() => setReceivingPayment(manager.id)}
                                  className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                                  title="استلام مبلغ"
                                >
                                  <DollarSign className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  عرض {(page - 1) * limit + 1} - {Math.min(page * limit, total)} من {total}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    السابق
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    التالي
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
