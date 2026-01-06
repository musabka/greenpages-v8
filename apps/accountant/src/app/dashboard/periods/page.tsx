'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Period {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'OPEN' | 'CLOSED';
  closedAt?: string;
  closedBy?: string;
  notes?: string;
  createdAt: string;
}

export default function PeriodsPage() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Create Period Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPeriod, setNewPeriod] = useState({
    name: '',
    startDate: '',
    endDate: '',
    notes: '',
  });

  // Close Period Modal
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  const [closeNotes, setCloseNotes] = useState('');

  useEffect(() => {
    fetchPeriods();
  }, []);

  const fetchPeriods = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await axios.get(`${baseUrl}/api/v1/admin/accounting/periods`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPeriods(response.data);
    } catch (error) {
      console.error('Error fetching periods:', error);
      alert('فشل في تحميل الفترات المحاسبية');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePeriod = async () => {
    if (!newPeriod.name || !newPeriod.startDate || !newPeriod.endDate) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (new Date(newPeriod.startDate) >= new Date(newPeriod.endDate)) {
      alert('تاريخ البداية يجب أن يكون قبل تاريخ النهاية');
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      await axios.post(
        `${baseUrl}/api/v1/admin/accounting/periods`,
        {
          name: newPeriod.name,
          startDate: new Date(newPeriod.startDate).toISOString(),
          endDate: new Date(newPeriod.endDate).toISOString(),
          notes: newPeriod.notes || undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('تم إنشاء الفترة المحاسبية بنجاح');
      setShowCreateModal(false);
      setNewPeriod({ name: '', startDate: '', endDate: '', notes: '' });
      fetchPeriods();
    } catch (error: any) {
      console.error('Error creating period:', error);
      alert(error.response?.data?.message || 'فشل في إنشاء الفترة المحاسبية');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClosePeriod = async () => {
    if (!selectedPeriod) return;
    if (!closeNotes.trim()) {
      alert('يرجى إدخال ملاحظات الإقفال');
      return;
    }

    if (!confirm('هل أنت متأكد من إقفال هذه الفترة؟ لن يمكن التعديل عليها بعد الإقفال.')) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      await axios.post(
        `${baseUrl}/api/v1/admin/accounting/periods/${selectedPeriod.id}/close`,
        { notes: closeNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('تم إقفال الفترة المحاسبية بنجاح');
      setShowCloseModal(false);
      setSelectedPeriod(null);
      setCloseNotes('');
      fetchPeriods();
    } catch (error: any) {
      console.error('Error closing period:', error);
      alert(error.response?.data?.message || 'فشل في إقفال الفترة المحاسبية');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الفترات المحاسبية</h1>
          <p className="text-sm text-gray-600 mt-1">إدارة الفترات المالية وإقفالها</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          + إنشاء فترة جديدة
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">إجمالي الفترات</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{periods.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">فترات مفتوحة</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {periods.filter((p) => p.status === 'OPEN').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">فترات مقفلة</p>
          <p className="text-2xl font-bold text-gray-600 mt-1">
            {periods.filter((p) => p.status === 'CLOSED').length}
          </p>
        </div>
      </div>

      {/* Periods Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">اسم الفترة</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ البداية</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ النهاية</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ الإقفال</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {periods.length > 0 ? (
                periods.map((period) => (
                  <tr key={period.id}>
                    <td className="px-4 py-3 text-sm font-medium">{period.name}</td>
                    <td className="px-4 py-3 text-sm">
                      {format(new Date(period.startDate), 'dd MMM yyyy', { locale: ar })}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {format(new Date(period.endDate), 'dd MMM yyyy', { locale: ar })}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(period.status)}`}>
                        {period.status === 'OPEN' ? 'مفتوحة' : 'مقفلة'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {period.closedAt
                        ? format(new Date(period.closedAt), 'dd MMM yyyy', { locale: ar })
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {period.status === 'OPEN' && (
                        <button
                          onClick={() => {
                            setSelectedPeriod(period);
                            setShowCloseModal(true);
                          }}
                          className="text-red-600 hover:underline"
                        >
                          إقفال الفترة
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    لا توجد فترات محاسبية. قم بإنشاء فترة جديدة.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">ملاحظات هامة:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• الفترة المحاسبية تحدد نطاق التقارير المالية</li>
          <li>• لا يمكن تعديل أو حذف القيود في الفترات المقفلة</li>
          <li>• يُنصح بإقفال الفترات بعد مراجعة جميع القيود والتقارير</li>
          <li>• يتم تسجيل إقفال الفترة في سجل التدقيق (Audit Log)</li>
        </ul>
      </div>

      {/* Create Period Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">إنشاء فترة محاسبية جديدة</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم الفترة <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPeriod.name}
                  onChange={(e) => setNewPeriod({ ...newPeriod, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="مثال: يناير 2025"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  تاريخ البداية <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={newPeriod.startDate}
                  onChange={(e) => setNewPeriod({ ...newPeriod, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  تاريخ النهاية <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={newPeriod.endDate}
                  onChange={(e) => setNewPeriod({ ...newPeriod, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات (اختياري)</label>
                <textarea
                  value={newPeriod.notes}
                  onChange={(e) => setNewPeriod({ ...newPeriod, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleCreatePeriod}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {actionLoading ? 'جاري الإنشاء...' : 'إنشاء الفترة'}
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewPeriod({ name: '', startDate: '', endDate: '', notes: '' });
                }}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Period Modal */}
      {showCloseModal && selectedPeriod && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">إقفال الفترة المحاسبية</h3>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>تحذير:</strong> بعد إقفال الفترة، لن تتمكن من:
              </p>
              <ul className="text-sm text-yellow-800 mt-2 space-y-1">
                <li>• إضافة قيود جديدة في هذه الفترة</li>
                <li>• تعديل القيود الموجودة</li>
                <li>• حذف القيود</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">اسم الفترة:</span>
                  <span className="font-medium">{selectedPeriod.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">من:</span>
                  <span className="font-medium">
                    {format(new Date(selectedPeriod.startDate), 'dd MMM yyyy', { locale: ar })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">إلى:</span>
                  <span className="font-medium">
                    {format(new Date(selectedPeriod.endDate), 'dd MMM yyyy', { locale: ar })}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ملاحظات الإقفال <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={4}
                  placeholder="اذكر سبب الإقفال وأي ملاحظات مهمة..."
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleClosePeriod}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400"
              >
                {actionLoading ? 'جاري الإقفال...' : 'تأكيد الإقفال'}
              </button>
              <button
                onClick={() => {
                  setShowCloseModal(false);
                  setSelectedPeriod(null);
                  setCloseNotes('');
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
