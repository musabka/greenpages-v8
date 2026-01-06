'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ReconciliationItem {
  id: string;
  date: string;
  description: string;
  walletAmount: number;
  accountingAmount: number;
  difference: number;
  status: 'PENDING' | 'RECONCILED';
  notes?: string;
}

export default function ReconciliationPage() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ReconciliationItem[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFixModal, setShowFixModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ReconciliationItem | null>(null);
  const [fixNotes, setFixNotes] = useState('');
  const [fixLoading, setFixLoading] = useState(false);

  // Summary
  const [summary, setSummary] = useState({
    totalItems: 0,
    totalDifference: 0,
    reconciledItems: 0,
    pendingItems: 0,
  });

  useEffect(() => {
    // Set default dates (last month)
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    setDateFrom(format(lastMonth, 'yyyy-MM-dd'));
    setDateTo(format(lastMonthEnd, 'yyyy-MM-dd'));
  }, []);

  const fetchReconciliationData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const params = new URLSearchParams();
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const response = await axios.get(
        `${baseUrl}/api/v1/admin/accounting/reconciliation?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setItems(response.data.items || []);
      
      // Calculate summary
      const totalDiff = response.data.items.reduce((sum: number, item: ReconciliationItem) => 
        sum + Math.abs(item.difference), 0
      );
      const reconciled = response.data.items.filter((i: ReconciliationItem) => i.status === 'RECONCILED').length;
      const pending = response.data.items.filter((i: ReconciliationItem) => i.status === 'PENDING').length;

      setSummary({
        totalItems: response.data.items.length,
        totalDifference: totalDiff,
        reconciledItems: reconciled,
        pendingItems: pending,
      });
    } catch (error) {
      console.error('Error fetching reconciliation data:', error);
      alert('فشل في تحميل بيانات التسوية');
    } finally {
      setLoading(false);
    }
  };

  const handleReconcileFix = async () => {
    if (!selectedItem) return;
    if (!fixNotes.trim()) {
      alert('يرجى إدخال ملاحظات التسوية');
      return;
    }

    setFixLoading(true);
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      await axios.post(
        `${baseUrl}/api/v1/admin/accounting/reconciliation/${selectedItem.id}/fix`,
        { notes: fixNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('تم إنشاء قيد تسوية بنجاح');
      setShowFixModal(false);
      setSelectedItem(null);
      setFixNotes('');
      fetchReconciliationData();
    } catch (error: any) {
      console.error('Error creating reconciliation entry:', error);
      alert(error.response?.data?.message || 'فشل في إنشاء قيد التسوية');
    } finally {
      setFixLoading(false);
    }
  };

  const handleAutoReconcile = async () => {
    if (!confirm('هل تريد إنشاء قيود تسوية تلقائية لجميع الفروقات المعلقة؟')) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const params = new URLSearchParams();
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      await axios.post(
        `${baseUrl}/api/v1/admin/accounting/reconciliation/auto-fix?${params.toString()}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('تم إنشاء قيود التسوية التلقائية بنجاح');
      fetchReconciliationData();
    } catch (error: any) {
      console.error('Error auto reconciling:', error);
      alert(error.response?.data?.message || 'فشل في التسوية التلقائية');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">التسويات المحاسبية</h1>
        <p className="text-sm text-gray-600 mt-1">مطابقة المحفظة مع السجلات المحاسبية</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">إجمالي البنود</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{summary.totalItems}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">إجمالي الفروقات</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{summary.totalDifference.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">تم التسوية</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{summary.reconciledItems}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">معلق</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{summary.pendingItems}</p>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">من تاريخ</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">إلى تاريخ</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchReconciliationData}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'جاري التحميل...' : 'عرض البيانات'}
            </button>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleAutoReconcile}
              disabled={loading || summary.pendingItems === 0}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
              تسوية تلقائية
            </button>
          </div>
        </div>
      </div>

      {/* Reconciliation Items Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الوصف</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">رصيد المحفظة</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الرصيد المحاسبي</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الفرق</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.length > 0 ? (
                items.map((item) => (
                  <tr key={item.id} className={item.status === 'RECONCILED' ? 'bg-green-50' : ''}>
                    <td className="px-4 py-3 text-sm">
                      {format(new Date(item.date), 'dd MMM yyyy', { locale: ar })}
                    </td>
                    <td className="px-4 py-3 text-sm">{item.description}</td>
                    <td className="px-4 py-3 text-sm font-medium">{item.walletAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm font-medium">{item.accountingAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`font-bold ${
                          Math.abs(item.difference) < 0.01 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {item.difference.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          item.status === 'RECONCILED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {item.status === 'RECONCILED' ? 'تم التسوية' : 'معلق'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {item.status === 'PENDING' && Math.abs(item.difference) > 0.01 && (
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setShowFixModal(true);
                          }}
                          className="text-blue-600 hover:underline"
                        >
                          إنشاء قيد تسوية
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    لا توجد بيانات للعرض. اختر الفترة واضغط "عرض البيانات"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reconciliation Notes */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">ملاحظات هامة:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• يتم عرض الفروقات بين رصيد المحفظة والرصيد المحاسبي</li>
          <li>• قيد التسوية يتم إنشاؤه تلقائياً لضبط الرصيد المحاسبي</li>
          <li>• التسوية التلقائية تنشئ قيود لجميع الفروقات المعلقة دفعة واحدة</li>
          <li>• جميع قيود التسوية تُسجل في سجل التدقيق (Audit Log)</li>
        </ul>
      </div>

      {/* Fix Modal */}
      {showFixModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">إنشاء قيد تسوية</h3>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">التاريخ:</span>
                  <span className="font-medium">
                    {format(new Date(selectedItem.date), 'dd MMM yyyy', { locale: ar })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">الوصف:</span>
                  <span className="font-medium">{selectedItem.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">رصيد المحفظة:</span>
                  <span className="font-medium">{selectedItem.walletAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">الرصيد المحاسبي:</span>
                  <span className="font-medium">{selectedItem.accountingAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600 font-semibold">الفرق (سيتم تسويته):</span>
                  <span className="font-bold text-red-600">{selectedItem.difference.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ملاحظات التسوية <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={fixNotes}
                  onChange={(e) => setFixNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={4}
                  placeholder="اذكر سبب الفرق وسبب التسوية..."
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleReconcileFix}
                disabled={fixLoading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
              >
                {fixLoading ? 'جاري الإنشاء...' : 'إنشاء قيد التسوية'}
              </button>
              <button
                onClick={() => {
                  setShowFixModal(false);
                  setSelectedItem(null);
                  setFixNotes('');
                }}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
