'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  taxRate?: number;
  taxAmount?: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  type: 'SALE' | 'PURCHASE' | 'CREDIT_NOTE';
  status: 'DRAFT' | 'ISSUED' | 'PARTIAL' | 'PAID' | 'CANCELLED';
  entityType: 'Agent' | 'Manager' | 'Customer' | 'Supplier';
  entityId: string;
  entity?: {
    id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
  };
  issueDate?: string;
  dueDate?: string;
  currencyId: string;
  currency?: {
    code: string;
    name: string;
  };
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  notes?: string;
  journalEntry?: {
    id: string;
    entryNumber: string;
    status: string;
  };
  lines: InvoiceLine[];
  payments: Array<{
    id: string;
    paymentDate: string;
    amount: number;
    paymentMethod: string;
    reference?: string;
    notes?: string;
    journalEntry?: {
      id: string;
      entryNumber: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function InvoiceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'CASH',
    reference: '',
    notes: '',
  });

  // Cancel Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    fetchInvoice();
  }, [params.id]);

  const fetchInvoice = async () => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await axios.get(`${baseUrl}/api/v1/admin/accounting/invoices/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInvoice(response.data);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      alert('فشل في تحميل الفاتورة');
    } finally {
      setLoading(false);
    }
  };

  const handleIssueInvoice = async () => {
    if (!confirm('هل أنت متأكد من إصدار هذه الفاتورة؟')) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      await axios.post(
        `${baseUrl}/api/v1/admin/accounting/invoices/${params.id}/issue`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('تم إصدار الفاتورة بنجاح');
      fetchInvoice();
    } catch (error: any) {
      console.error('Error issuing invoice:', error);
      alert(error.response?.data?.message || 'فشل في إصدار الفاتورة');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      alert('يرجى إدخال مبلغ صحيح');
      return;
    }

    if (parseFloat(paymentData.amount) > (invoice?.amountDue || 0)) {
      alert('المبلغ المدخل أكبر من المبلغ المستحق');
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      await axios.post(
        `${baseUrl}/api/v1/admin/accounting/invoices/${params.id}/payments`,
        {
          amount: parseFloat(paymentData.amount),
          paymentMethod: paymentData.paymentMethod,
          reference: paymentData.reference || undefined,
          notes: paymentData.notes || undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('تم تسجيل الدفعة بنجاح');
      setShowPaymentModal(false);
      setPaymentData({ amount: '', paymentMethod: 'CASH', reference: '', notes: '' });
      fetchInvoice();
    } catch (error: any) {
      console.error('Error recording payment:', error);
      alert(error.response?.data?.message || 'فشل في تسجيل الدفعة');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelInvoice = async () => {
    if (!cancelReason.trim()) {
      alert('يرجى إدخال سبب الإلغاء');
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      await axios.post(
        `${baseUrl}/api/v1/admin/accounting/invoices/${params.id}/cancel`,
        { reason: cancelReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('تم إلغاء الفاتورة بنجاح');
      setShowCancelModal(false);
      setCancelReason('');
      fetchInvoice();
    } catch (error: any) {
      console.error('Error cancelling invoice:', error);
      alert(error.response?.data?.message || 'فشل في إلغاء الفاتورة');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      DRAFT: 'bg-gray-100 text-gray-800',
      ISSUED: 'bg-blue-100 text-blue-800',
      PARTIAL: 'bg-yellow-100 text-yellow-800',
      PAID: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      SALE: 'فاتورة مبيعات',
      PURCHASE: 'فاتورة مشتريات',
      CREDIT_NOTE: 'إشعار دائن',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getEntityName = (invoice: Invoice) => {
    if (!invoice.entity) return invoice.entityId;
    if ('name' in invoice.entity && invoice.entity.name) return invoice.entity.name;
    if ('firstName' in invoice.entity && 'lastName' in invoice.entity) {
      return `${invoice.entity.firstName} ${invoice.entity.lastName}`;
    }
    return invoice.entityId;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">جاري التحميل...</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">لم يتم العثور على الفاتورة</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">تفاصيل الفاتورة</h1>
          <p className="text-sm text-gray-600 mt-1">رقم الفاتورة: {invoice.invoiceNumber}</p>
        </div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          رجوع
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-2 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        {invoice.status === 'DRAFT' && (
          <button
            onClick={handleIssueInvoice}
            disabled={actionLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {actionLoading ? 'جاري الإصدار...' : 'إصدار الفاتورة'}
          </button>
        )}
        
        {(invoice.status === 'ISSUED' || invoice.status === 'PARTIAL') && invoice.amountDue > 0 && (
          <button
            onClick={() => setShowPaymentModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            تسجيل دفعة
          </button>
        )}

        {invoice.status !== 'CANCELLED' && invoice.status !== 'PAID' && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            إلغاء الفاتورة
          </button>
        )}

        {invoice.journalEntry && (
          <button
            onClick={() => router.push(`/dashboard/journal-entries/${invoice.journalEntry!.id}`)}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            عرض القيد المحاسبي
          </button>
        )}
      </div>

      {/* Invoice Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Main Info */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">المعلومات الأساسية</h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-600">نوع الفاتورة:</span>
              <p className="font-medium">{getTypeLabel(invoice.type)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">الحالة:</span>
              <div className="mt-1">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                  {invoice.status}
                </span>
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-600">العميل/المورد:</span>
              <p className="font-medium">{getEntityName(invoice)}</p>
              <p className="text-xs text-gray-500">{invoice.entityType}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">العملة:</span>
              <p className="font-medium">{invoice.currency?.code || invoice.currencyId}</p>
            </div>
          </div>
        </div>

        {/* Dates & Amounts */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">التواريخ والمبالغ</h2>
          <div className="space-y-3">
            {invoice.issueDate && (
              <div>
                <span className="text-sm text-gray-600">تاريخ الإصدار:</span>
                <p className="font-medium">
                  {format(new Date(invoice.issueDate), 'dd MMM yyyy', { locale: ar })}
                </p>
              </div>
            )}
            {invoice.dueDate && (
              <div>
                <span className="text-sm text-gray-600">تاريخ الاستحقاق:</span>
                <p className="font-medium">
                  {format(new Date(invoice.dueDate), 'dd MMM yyyy', { locale: ar })}
                </p>
              </div>
            )}
            <div className="border-t pt-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">المجموع الفرعي:</span>
                <span className="font-medium">{invoice.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">الضريبة:</span>
                <span className="font-medium">{invoice.taxAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold">الإجمالي:</span>
                <span className="font-bold text-lg">{invoice.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">المبلغ المدفوع:</span>
                <span className="font-medium text-green-600">{invoice.amountPaid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold">المبلغ المستحق:</span>
                <span className="font-bold text-red-600">{invoice.amountDue.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Lines */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">بنود الفاتورة</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الوصف</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الكمية</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">سعر الوحدة</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">نسبة الضريبة</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الضريبة</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجمالي</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoice.lines.map((line) => (
                <tr key={line.id}>
                  <td className="px-4 py-3 text-sm">{line.description}</td>
                  <td className="px-4 py-3 text-sm">{line.quantity}</td>
                  <td className="px-4 py-3 text-sm">{line.unitPrice.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm">{line.taxRate ? `${line.taxRate}%` : '-'}</td>
                  <td className="px-4 py-3 text-sm">{line.taxAmount?.toLocaleString() || '0'}</td>
                  <td className="px-4 py-3 text-sm font-medium">{line.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payments History */}
      {invoice.payments && invoice.payments.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">سجل الدفعات</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">المبلغ</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">طريقة الدفع</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">المرجع</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">القيد المحاسبي</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoice.payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-4 py-3 text-sm">
                      {format(new Date(payment.paymentDate), 'dd MMM yyyy', { locale: ar })}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-green-600">
                      {payment.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm">{payment.paymentMethod}</td>
                    <td className="px-4 py-3 text-sm">{payment.reference || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      {payment.journalEntry ? (
                        <button
                          onClick={() => router.push(`/dashboard/journal-entries/${payment.journalEntry!.id}`)}
                          className="text-blue-600 hover:underline"
                        >
                          {payment.journalEntry.entryNumber}
                        </button>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Notes */}
      {invoice.notes && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-2">ملاحظات</h2>
          <p className="text-gray-700">{invoice.notes}</p>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">تسجيل دفعة</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  المبلغ (المستحق: {invoice.amountDue.toLocaleString()})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">طريقة الدفع</label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="CASH">نقدي</option>
                  <option value="BANK_TRANSFER">تحويل بنكي</option>
                  <option value="CHECK">شيك</option>
                  <option value="CARD">بطاقة</option>
                  <option value="OTHER">أخرى</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المرجع (اختياري)</label>
                <input
                  type="text"
                  value={paymentData.reference}
                  onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="رقم الإيصال أو الشيك"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات (اختياري)</label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleRecordPayment}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
              >
                {actionLoading ? 'جاري الحفظ...' : 'تسجيل الدفعة'}
              </button>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentData({ amount: '', paymentMethod: 'CASH', reference: '', notes: '' });
                }}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">إلغاء الفاتورة</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">سبب الإلغاء</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={4}
                  placeholder="اذكر السبب..."
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleCancelInvoice}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400"
              >
                {actionLoading ? 'جاري الإلغاء...' : 'تأكيد الإلغاء'}
              </button>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
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
