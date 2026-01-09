'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Download, Printer, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// PDF Invoice Generation
function generateInvoiceHtml(invoice: any): string {
  const statusText = invoice.status === 'PAID' ? 'مدفوعة' : 
                     invoice.status === 'ISSUED' ? 'صادرة' :
                     invoice.status === 'PARTIAL' ? 'مدفوعة جزئياً' :
                     invoice.status === 'CANCELLED' ? 'ملغاة' : 'مسودة';
  
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

  const linesHtml = (invoice.lines || []).map((line: any) => `
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
      <p><strong>تاريخ الإصدار:</strong> ${formatDate(invoice.issuedAt || invoice.invoiceDate || invoice.createdAt)}</p>
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
    <tbody>${linesHtml}</tbody>
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

function printInvoice(invoice: any): void {
  const html = generateInvoiceHtml(invoice);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  }
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const invoiceId = resolvedParams.id;

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      const response = await api.get(`/agent-portal/invoices/${invoiceId}`);
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">جارٍ تحميل الفاتورة...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">الفاتورة غير موجودة</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      DRAFT: { label: 'مسودة', className: 'bg-gray-100 text-gray-800' },
      ISSUED: { label: 'صادرة', className: 'bg-blue-100 text-blue-800' },
      PARTIAL: { label: 'مدفوعة جزئياً', className: 'bg-yellow-100 text-yellow-800' },
      PAID: { label: 'مدفوعة', className: 'bg-green-100 text-green-800' },
      CANCELLED: { label: 'ملغاة', className: 'bg-red-100 text-red-800' },
    };
    const badge = badges[status] || badges.DRAFT;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.className}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">فاتورة #{invoice.invoiceNumber}</h1>
            <p className="text-gray-500">تفاصيل الفاتورة</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => printInvoice(invoice)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            تحميل PDF
          </button>
          <button 
            onClick={() => printInvoice(invoice)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Printer className="w-4 h-4" />
            طباعة
          </button>
        </div>
      </div>

      {/* Invoice Card */}
      <div className="bg-white rounded-xl shadow-sm border p-8">
        {/* Status & Date */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b">
          <div>
            {getStatusBadge(invoice.status)}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">تاريخ الإصدار</p>
            <p className="font-semibold">{new Date(invoice.invoiceDate).toLocaleDateString('ar-SY')}</p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-sm text-gray-500 mb-1">العميل</p>
            <p className="font-semibold text-lg">{invoice.customerName}</p>
            {invoice.customerEmail && (
              <p className="text-sm text-gray-600">{invoice.customerEmail}</p>
            )}
            {invoice.customerPhone && (
              <p className="text-sm text-gray-600">{invoice.customerPhone}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 mb-1">رقم الفاتورة</p>
            <p className="font-semibold text-lg">{invoice.invoiceNumber}</p>
            {invoice.dueDate && (
              <>
                <p className="text-sm text-gray-500 mt-2">تاريخ الاستحقاق</p>
                <p className="text-sm text-gray-600">
                  {new Date(invoice.dueDate).toLocaleDateString('ar-SY')}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Invoice Lines */}
        <div className="mb-8">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-700">الوصف</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700">الكمية</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700">السعر</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-700">المجموع</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoice.lines?.map((line: any, idx: number) => (
                <tr key={idx}>
                  <td className="px-4 py-4">
                    <p className="font-medium">{line.descriptionAr || line.description}</p>
                  </td>
                  <td className="px-4 py-4 text-center">{Number(line.quantity)}</td>
                  <td className="px-4 py-4 text-center">
                    {Number(line.unitPrice).toLocaleString()} {invoice.currency?.code || 'SYP'}
                  </td>
                  <td className="px-4 py-4 text-right font-medium">
                    {Number(line.total).toLocaleString()} {invoice.currency?.code || 'SYP'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="border-t pt-6">
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">المجموع الفرعي:</span>
                <span className="font-medium">
                  {Number(invoice.subtotal).toLocaleString()} {invoice.currency?.code || 'SYP'}
                </span>
              </div>
              {Number(invoice.taxTotal) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">الضريبة:</span>
                  <span className="font-medium">
                    {Number(invoice.taxTotal).toLocaleString()} {invoice.currency?.code || 'SYP'}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>الإجمالي:</span>
                <span className="text-blue-600">
                  {Number(invoice.total).toLocaleString()} {invoice.currency?.code || 'SYP'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notesAr && (
          <div className="mt-8 pt-6 border-t">
            <p className="text-sm text-gray-500 mb-2">ملاحظات:</p>
            <p className="text-gray-700">{invoice.notesAr}</p>
          </div>
        )}
      </div>
    </div>
  );
}
