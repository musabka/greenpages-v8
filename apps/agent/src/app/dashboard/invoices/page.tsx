'use client';

import { useState, Suspense, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  X,
} from 'lucide-react';
import { useAgentInvoices, useAgentBusinesses } from '@/lib/hooks/useFinancial';

const statusOptions = [
  { value: '', label: 'جميع الحالات' },
  { value: 'DRAFT', label: 'مسودة' },
  { value: 'ISSUED', label: 'صادرة' },
  { value: 'PARTIAL', label: 'مدفوعة جزئياً' },
  { value: 'PAID', label: 'مدفوعة' },
  { value: 'CANCELLED', label: 'ملغاة' },
];

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
      <p><strong>تاريخ الإصدار:</strong> ${formatDate(invoice.issuedAt || invoice.createdAt)}</p>
      <p><strong>الحالة:</strong> <span class="status ${statusClass}">${statusText}</span></p>
    </div>
    
    <div class="section">
      <h3>معلومات العميل</h3>
      <p><strong>الاسم:</strong> ${invoice.business?.nameAr || 'عميل نقدي'}</p>
      <p><strong>العنوان:</strong> ${invoice.business?.addressAr || '-'}</p>
      <p><strong>الهاتف:</strong> ${invoice.business?.contacts?.[0]?.value || '-'}</p>
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

export default function AgentInvoicesPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AgentInvoicesPage />
    </Suspense>
  );
}

function AgentInvoicesPage() {
  const searchParams = useSearchParams();
  const initialBusinessId = searchParams.get('businessId') || undefined;
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | undefined>(initialBusinessId);
  const limit = 10;

  // Fetch businesses for filter
  const { data: businessesData } = useAgentBusinesses({ limit: 100 });
  const businesses = businessesData?.data || [];

  // Sync selectedBusinessId if URL param changes
  useEffect(() => {
    if (initialBusinessId) setSelectedBusinessId(initialBusinessId);
  }, [initialBusinessId]);

  const { data, isLoading, isError, error, refetch } = useAgentInvoices({
    page,
    limit,
    status: statusFilter || undefined,
    businessId: selectedBusinessId,
  });

  const invoices = data?.data || [];
  const total = data?.meta?.total || 0;
  const totalPages = data?.meta?.totalPages || 1;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SY').format(amount) + ' ل.س';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'مسودة' },
      ISSUED: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'صادرة' },
      PARTIAL: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'مدفوعة جزئياً' },
      PAID: { bg: 'bg-green-100', text: 'text-green-700', label: 'مدفوعة' },
      CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', label: 'ملغاة' },
    };
    const style = styles[status] || styles.DRAFT;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    );
  };

  const getInvoiceTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      SUBSCRIPTION: 'اشتراك',
      RENEWAL: 'تجديد',
      UPGRADE: 'ترقية',
      DOWNGRADE: 'تخفيض',
      OTHER: 'أخرى',
    };
    return types[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">الفواتير</h1>
            {selectedBusinessId && (
              <button
                onClick={() => setSelectedBusinessId(undefined)}
                className="flex items-center gap-1 text-sm bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-full text-gray-600 transition-colors"
              >
                <X className="w-3 h-3" />
                إلغاء الفلترة
              </button>
            )}
          </div>
          <p className="text-gray-500">
            {selectedBusinessId
              ? `عرض فواتير النشاط التجاري المحدد`
              : `الفواتير الصادرة للأنشطة التي قمت بتسجيلها`}
          </p>
        </div>
        <div className="text-sm text-gray-500">
          إجمالي: {total} فاتورة
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 text-right">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">تصفية حسب النشاط التجاري</label>
            <select
              value={selectedBusinessId || ''}
              onChange={(e) => {
                setSelectedBusinessId(e.target.value || undefined);
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">جميع الأنشطة</option>
              {businesses.map((b: any) => (
                <option key={b.id} value={b.id}>{b.nameAr}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">تصفية حسب الحالة</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isError ? (
          <div className="text-center py-12">
            <XCircle className="w-12 h-12 text-red-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">حدث خطأ في تحميل الفواتير</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد فواتير</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      رقم الفاتورة
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      النشاط التجاري
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      النوع
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      المبلغ
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      الحالة
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      التاريخ
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      إجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.map((invoice: any) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">
                            {invoice.business?.nameAr || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-600">
                        {getInvoiceTypeLabel(invoice.invoiceType)}
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(Number(invoice.total))}
                        </p>
                        {invoice.paidAmount > 0 && invoice.paidAmount < invoice.total && (
                          <p className="text-xs text-green-600">
                            مدفوع: {formatCurrency(Number(invoice.paidAmount))}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(invoice.status)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {formatDate(invoice.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/invoices/${invoice.id}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="عرض التفاصيل"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => printInvoice(invoice)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="تنزيل PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  صفحة {page} من {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
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
