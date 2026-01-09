'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Receipt, Search, Eye, DollarSign, Calendar, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { api } from '@/lib/api';

interface InvoiceLine {
  description: string;
  descriptionAr?: string;
  quantity: number;
  unitPrice: number;
  total?: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  total: number;
  paidAmount: number;
  createdAt: string;
  issuedAt: string | null;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  lines?: InvoiceLine[];
  currency: {
    code: string;
    symbol: string;
  };
}

const statusLabels: Record<string, string> = {
  DRAFT: 'مسودة',
  ISSUED: 'صادرة',
  PARTIAL: 'مدفوعة جزئياً',
  PAID: 'مدفوعة',
  CANCELLED: 'ملغية',
};

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  ISSUED: 'bg-blue-100 text-blue-700',
  PARTIAL: 'bg-yellow-100 text-yellow-700',
  PAID: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

// PDF Invoice Generation
function generateInvoiceHtml(invoice: Invoice): string {
  const statusText = statusLabels[invoice.status] || invoice.status;
  const statusClass = invoice.status === 'PAID' ? 'status-paid' : 
                      invoice.status === 'CANCELLED' ? 'status-cancelled' : 'status-pending';

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('ar-SY', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (amount: number) => {
    return Number(amount || 0).toLocaleString('ar-SY');
  };

  const linesHtml = (invoice.lines || []).map((line) => `
    <tr>
      <td>${line.descriptionAr || line.description || 'خدمة'}</td>
      <td class="text-center">${line.quantity || 1}</td>
      <td class="text-left">${formatCurrency(line.unitPrice)} ل.س</td>
      <td class="text-left">${formatCurrency(line.total || (line.quantity * line.unitPrice))} ل.س</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>فاتورة ${invoice.invoiceNumber}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 40px; direction: rtl; background: #fff; color: #333; }
    .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #16a34a; }
    .header h1 { color: #16a34a; margin-bottom: 8px; }
    .invoice-meta { display: flex; justify-content: space-between; margin-bottom: 30px; gap: 20px; }
    .invoice-meta .section { flex: 1; padding: 20px; background: #f9fafb; border-radius: 8px; }
    .invoice-meta h3 { color: #16a34a; margin-bottom: 12px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
    .invoice-meta p { margin-bottom: 6px; }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    .table th, .table td { border: 1px solid #e5e7eb; padding: 14px 12px; text-align: right; }
    .table th { background-color: #16a34a; color: #fff; }
    .text-center { text-align: center; }
    .text-left { text-align: left; }
    .totals { display: flex; justify-content: flex-end; margin-bottom: 30px; }
    .totals-box { background: #f9fafb; border-radius: 8px; padding: 20px 30px; min-width: 300px; }
    .totals-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
    .totals-row.total { font-size: 1.3em; font-weight: bold; color: #16a34a; border-top: 2px solid #16a34a; padding-top: 10px; margin-top: 10px; }
    .status { display: inline-block; padding: 6px 16px; border-radius: 20px; font-weight: 600; }
    .status-paid { background: #dcfce7; color: #16a34a; }
    .status-pending { background: #fef3c7; color: #d97706; }
    .status-cancelled { background: #fee2e2; color: #dc2626; }
    .footer { margin-top: 50px; text-align: center; color: #6b7280; padding-top: 30px; border-top: 1px solid #e5e7eb; }
    .footer .brand { color: #16a34a; font-weight: 600; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>🌿 الصفحات الخضراء</h1>
    <p>فاتورة ضريبية مبسطة</p>
  </div>
  
  <div class="invoice-meta">
    <div class="section">
      <h3>معلومات الفاتورة</h3>
      <p><strong>رقم الفاتورة:</strong> ${invoice.invoiceNumber}</p>
      <p><strong>تاريخ الإصدار:</strong> ${formatDate(invoice.issuedAt || invoice.createdAt)}</p>
      <p><strong>الحالة:</strong> <span class="status ${statusClass}">${statusText}</span></p>
    </div>
    
    <div class="section">
      <h3>معلومات العميل</h3>
      <p><strong>الاسم:</strong> ${invoice.customerName || 'عميل'}</p>
      ${invoice.customerEmail ? `<p><strong>البريد:</strong> ${invoice.customerEmail}</p>` : ''}
      ${invoice.customerPhone ? `<p><strong>الهاتف:</strong> ${invoice.customerPhone}</p>` : ''}
    </div>
  </div>
  
  <table class="table">
    <thead>
      <tr>
        <th style="width: 50%">الوصف</th>
        <th style="width: 15%" class="text-center">الكمية</th>
        <th style="width: 17%" class="text-left">سعر الوحدة</th>
        <th style="width: 18%" class="text-left">المجموع</th>
      </tr>
    </thead>
    <tbody>${linesHtml || '<tr><td colspan="4" style="text-align: center; color: #999;">لا توجد بنود</td></tr>'}</tbody>
  </table>
  
  <div class="totals">
    <div class="totals-box">
      <div class="totals-row"><span>المجموع:</span><span>${formatCurrency(invoice.total)} ل.س</span></div>
      <div class="totals-row"><span>المدفوع:</span><span style="color: #16a34a">${formatCurrency(invoice.paidAmount)} ل.س</span></div>
      <div class="totals-row total"><span>الإجمالي:</span><span>${formatCurrency(invoice.total)} ل.س</span></div>
    </div>
  </div>
  
  <div class="footer">
    <p>شكراً لتعاملكم معنا 🙏</p>
    <p class="brand">الصفحات الخضراء - دليل الأنشطة التجارية في سوريا</p>
  </div>
</body>
</html>`;
}

function printInvoice(invoice: Invoice): void {
  const html = generateInvoiceHtml(invoice);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  }
}

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const fetchInvoices = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      const res = await api.get(`/admin/accounting/invoices?${params.toString()}`);
      setInvoices(res.data.data || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    // تجاهل الفواتير المسودة إلا إذا كان المستخدم يبحث عنها تحديداً
    if (statusFilter !== 'DRAFT' && statusFilter !== 'ALL' && inv.status === 'DRAFT') {
      return false;
    }
    
    // إذا كان الفلتر "جميع الحالات" فتجاهل المسودات
    if (statusFilter === 'ALL' && inv.status === 'DRAFT') {
      return false;
    }
    
    return inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // حساب الإحصائيات (تجاهل المسودات)
  const nonDraftInvoices = invoices.filter(inv => inv.status !== 'DRAFT');
  const totalAmount = nonDraftInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);
  const totalPaid = nonDraftInvoices.reduce((sum, inv) => sum + Number(inv.paidAmount), 0);
  const totalOutstanding = totalAmount - totalPaid;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">الفواتير</h1>
          <p className="text-gray-600 mt-2">إدارة وعرض جميع الفواتير</p>
        </div>
      </div>

      {/* Notice about draft exclusion */}
      {statusFilter !== 'DRAFT' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Receipt className="w-5 h-5 text-blue-600 ml-2" />
            <p className="text-blue-800">
              <strong>ملاحظة:</strong> الفواتير المسودة مستبعدة من العرض والحسابات. لعرض المسودات، اختر "مسودة" من قائمة الحالات.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="رقم الفاتورة..."
              className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="ALL">جميع الحالات (بدون المسودات)</option>
            <option value="DRAFT">مسودة</option>
            <option value="ISSUED">صادرة</option>
            <option value="PARTIAL">مدفوعة جزئياً</option>
            <option value="PAID">مدفوعة</option>
            <option value="CANCELLED">ملغية</option>
          </select>
        </div>
      </div>

      {/* Statistics */}
      {!loading && statusFilter !== 'DRAFT' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي المبلغ</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalAmount.toLocaleString('ar-SY')} ل.س
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">المبلغ المدفوع</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalPaid.toLocaleString('ar-SY')} ل.س
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-red-100">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">المبلغ المستحق</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalOutstanding.toLocaleString('ar-SY')} ل.س
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    رقم الفاتورة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    التاريخ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    المبلغ الإجمالي
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    المبلغ المدفوع
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Receipt className="w-5 h-5 text-gray-400 ml-2" />
                        <span className="text-sm font-medium">{invoice.invoiceNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 ml-1" />
                        {invoice.issuedAt
                          ? format(new Date(invoice.issuedAt), 'dd/MM/yyyy', { locale: ar })
                          : format(new Date(invoice.createdAt), 'dd/MM/yyyy', { locale: ar })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">
                        {Number(invoice.total).toLocaleString('ar-SY')} {invoice.currency.symbol}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {Number(invoice.paidAmount).toLocaleString('ar-SY')} {invoice.currency.symbol}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          statusColors[invoice.status]
                        }`}
                      >
                        {statusLabels[invoice.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/dashboard/invoices/${invoice.id}`)}
                          className="text-blue-600 hover:text-blue-800"
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => printInvoice(invoice)}
                          className="text-green-600 hover:text-green-800"
                          title="تنزيل PDF"
                        >
                          <Download className="w-5 h-5" />
                        </button>
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
  );
}
