'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { ArrowRight, FileText, Download, Search, AlertCircle, CheckCircle2, Clock, CreditCard, Receipt, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'cancelled'>('all');

  // جلب جميع الفواتير للمستخدم
  const invoicesQuery = useQuery({
    queryKey: ['user-invoices'],
    queryFn: async () => {
      console.log('🔍 جاري جلب الفواتير من API...');
      try {
        const response = await api.get('/user/accounting/invoices');
        console.log('✅ نتيجة API:', response.data);
        return response.data.data || response.data;
      } catch (error) {
        console.error('❌ خطأ في جلب الفواتير:', error);
        throw error;
      }
    },
  });

  // فلترة الفواتير
  const filteredInvoices = invoicesQuery.data?.filter((invoice: any) => {
    // فلترة حسب حالة الدفع
    if (statusFilter !== 'all') {
      if (statusFilter === 'paid' && invoice.status !== 'PAID') return false;
      if (statusFilter === 'pending' && !['DRAFT', 'ISSUED', 'PARTIALLY_PAID'].includes(invoice.status)) return false;
      if (statusFilter === 'cancelled' && invoice.status !== 'CANCELLED') return false;
    }

    // فلترة حسب البحث
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        invoice.invoiceNumber?.toLowerCase().includes(term) ||
        invoice.customerName?.toLowerCase().includes(term) ||
        invoice.businessName?.toLowerCase().includes(term) ||
        invoice.total?.toString().includes(term)
      );
    }

    return true;
  });

  // حساب الإحصائيات
  const totalInvoiced = filteredInvoices?.reduce((sum: number, inv: any) => sum + Number(inv.total), 0) || 0;
  const totalPaid = filteredInvoices?.reduce((sum: number, inv: any) => sum + Number(inv.paidAmount), 0) || 0;
  const totalPending = filteredInvoices?.reduce((sum: number, inv: any) => {
    if (inv.status === 'PAID') return sum;
    return sum + (Number(inv.total) - Number(inv.paidAmount));
  }, 0) || 0;

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      DRAFT: { text: 'مسودة', color: 'bg-gray-100 text-gray-700' },
      ISSUED: { text: 'مصدرة', color: 'bg-blue-100 text-blue-700' },
      PARTIALLY_PAID: { text: 'مدفوعة جزئيا', color: 'bg-yellow-100 text-yellow-700' },
      PAID: { text: 'مدفوعة', color: 'bg-green-100 text-green-700' },
      CANCELLED: { text: 'ملغاة', color: 'bg-red-100 text-red-700' },
    };
    return statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-700' };
  };

  const getPaymentMethodIcon = (method: string) => {
    const methodIcons: Record<string, React.ReactNode> = {
      WALLET: <CreditCard className="w-4 h-4 text-blue-600" />,
      CASH: <Receipt className="w-4 h-4 text-green-600" />,
      BANK: <CreditCard className="w-4 h-4 text-purple-600" />,
    };
    return methodIcons[method] || <CreditCard className="w-4 h-4 text-gray-400" />;
  };

  const handleDownloadInvoice = async (invoice: any) => {
    try {
      // استخدام بيانات الفاتورة مباشرة بدلاً من استدعاء endpoint منفصل
      const invoiceData = invoice;
      
      // إنشاء HTML للفاتورة
      const invoiceHtml = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <title>فاتورة ${invoiceData.invoiceNumber}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 40px; direction: rtl; }
            .header { text-align: center; margin-bottom: 40px; }
            .header h1 { color: #16a34a; margin-bottom: 10px; }
            .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .invoice-info div { flex: 1; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .table th, .table td { border: 1px solid #ddd; padding: 12px; text-align: right; }
            .table th { background-color: #f3f4f6; }
            .total { text-align: left; font-size: 1.2em; font-weight: bold; }
            .status { display: inline-block; padding: 4px 12px; border-radius: 4px; }
            .status-paid { background: #dcfce7; color: #16a34a; }
            .status-pending { background: #fef3c7; color: #d97706; }
            .footer { margin-top: 40px; text-align: center; color: #666; font-size: 0.9em; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>الصفحات الخضراء</h1>
            <p>فاتورة ضريبية مبسطة</p>
          </div>
          
          <div class="invoice-info">
            <div>
              <p><strong>رقم الفاتورة:</strong> ${invoiceData.invoiceNumber || invoiceData.id.slice(0, 8)}</p>
              <p><strong>التاريخ:</strong> ${new Date(invoiceData.createdAt).toLocaleDateString('ar-SY')}</p>
              <p><strong>الحالة:</strong> <span class="status ${invoiceData.status === 'PAID' ? 'status-paid' : 'status-pending'}">${invoiceData.status === 'PAID' ? 'مدفوعة' : 'معلقة'}</span></p>
            </div>
            <div>
              <p><strong>اسم العميل:</strong> ${invoiceData.customerName || 'عميل'}</p>
              <p><strong>البريد:</strong> ${invoiceData.customerEmail || '-'}</p>
              <p><strong>الهاتف:</strong> ${invoiceData.customerPhone || '-'}</p>
            </div>
          </div>
          
          <table class="table">
            <thead>
              <tr>
                <th>الوصف</th>
                <th>الكمية</th>
                <th>السعر</th>
                <th>المجموع</th>
              </tr>
            </thead>
            <tbody>
              ${(invoiceData.lines || []).map((line: any) => `
                <tr>
                  <td>${line.description || line.descriptionAr || 'خدمة'}</td>
                  <td>${line.quantity || 1}</td>
                  <td>${Number(line.unitPrice || 0).toLocaleString('ar-SY')} ل.س</td>
                  <td>${Number(line.total || line.unitPrice || 0).toLocaleString('ar-SY')} ل.س</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="total">
            <p>الإجمالي: ${Number(invoiceData.total || 0).toLocaleString('ar-SY')} ل.س</p>
            <p>المدفوع: ${Number(invoiceData.paidAmount || 0).toLocaleString('ar-SY')} ل.س</p>
          </div>
          
          <div class="footer">
            <p>شكراً لتعاملكم معنا</p>
            <p>الصفحات الخضراء - دليل الأنشطة التجارية في سوريا</p>
          </div>
        </body>
        </html>
      `;
      
      // فتح نافذة طباعة
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(invoiceHtml);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }
    } catch (error) {
      console.error('Failed to download invoice:', error);
      alert('حدث خطأ أثناء تنزيل الفاتورة');
    }
  };

  const handlePrintInvoice = (invoice: any) => {
    // استخدام نفس منطق التنزيل لفتح نافذة طباعة
    handleDownloadInvoice(invoice);
  };

  if (invoicesQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">جاري تحميل الفواتير...</p>
        </div>
      </div>
    );
  }

  if (invoicesQuery.isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">خطأ في تحميل الفواتير</h2>
          <p className="text-gray-600 mb-4">حدث خطأ أثناء جلب بيانات الفواتير</p>
          <button
            onClick={() => invoicesQuery.refetch()}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للوحة التحكم</span>
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">الفواتير</h1>
          <p className="text-gray-600">عرض وتحميل جميع فواتيرك</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">إجمالي الفواتير</span>
              <FileText className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {totalInvoiced.toLocaleString('ar-EG')} جنيه
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">المدفوع</span>
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-600">
              {totalPaid.toLocaleString('ar-EG')} جنيه
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">المتبقي</span>
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-yellow-600">
              {totalPending.toLocaleString('ar-EG')} جنيه
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="بحث بالرقم أو الاسم أو المبلغ..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="all">جميع الحالات</option>
                <option value="paid">المدفوعة</option>
                <option value="pending">المعلقة</option>
                <option value="cancelled">الملغاة</option>
              </select>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        {filteredInvoices && filteredInvoices.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">رقم الفاتورة</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">العميل</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الإجمالي</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">المدفوع</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">إجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.map((invoice: any) => {
                  const status = getStatusBadge(invoice.status);
                  const remaining = Number(invoice.total) - Number(invoice.paidAmount);

                  return (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</div>
                        {invoice.businessName && (
                          <div className="text-xs text-gray-500">{invoice.businessName}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {format(new Date(invoice.invoiceDate), 'dd MMMM yyyy', { locale: ar })}
                        </div>
                        <div className="text-xs text-gray-400">
                          {format(new Date(invoice.invoiceDate), 'hh:mm a', { locale: ar })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{invoice.customerName}</div>
                        {invoice.paymentMethod && (
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            {getPaymentMethodIcon(invoice.paymentMethod)}
                            {invoice.paymentMethod}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {Number(invoice.total).toLocaleString('ar-EG')} جنيه
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {Number(invoice.paidAmount).toLocaleString('ar-EG')} جنيه
                        </div>
                        {remaining > 0 && (
                          <div className="text-xs text-yellow-600">
                            متبقي: {remaining.toLocaleString('ar-EG')} جنيه
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDownloadInvoice(invoice)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="تنزيل PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handlePrintInvoice(invoice)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="طباعة"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد فواتير</h3>
            <p className="text-gray-600">لم يتم العثور على أي فواتير</p>
          </div>
        )}
      </div>
    </div>
  );
}
