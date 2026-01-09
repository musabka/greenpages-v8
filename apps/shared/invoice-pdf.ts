/**
 * Invoice PDF Generation Utility
 * مُنشئ فواتير PDF مشترك بين جميع لوحات التحكم
 */

export interface InvoiceLine {
  description: string;
  descriptionAr?: string;
  quantity: number;
  unitPrice: number;
  total?: number;
}

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  status: string;
  total: number;
  paidAmount: number;
  createdAt: string;
  issuedAt?: string;
  paidAt?: string;
  lines: InvoiceLine[];
  businessName?: string;
  createdByName?: string;
}

/**
 * Generates HTML for an invoice to be printed/saved as PDF
 */
export function generateInvoiceHtml(invoice: InvoiceData): string {
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

  const linesHtml = (invoice.lines || []).map(line => `
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
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>فاتورة ${invoice.invoiceNumber}</title>
  <style>
    * { 
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body { 
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif; 
      padding: 40px; 
      direction: rtl;
      background: #fff;
      color: #333;
      line-height: 1.6;
    }
    
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: #fff;
    }
    
    .header { 
      text-align: center; 
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #16a34a;
    }
    
    .header h1 { 
      color: #16a34a; 
      margin-bottom: 8px;
      font-size: 2em;
    }
    
    .header p {
      color: #666;
      font-size: 1.1em;
    }
    
    .invoice-meta {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      gap: 20px;
    }
    
    .invoice-meta .section {
      flex: 1;
      padding: 20px;
      background: #f9fafb;
      border-radius: 8px;
    }
    
    .invoice-meta h3 {
      color: #16a34a;
      margin-bottom: 12px;
      font-size: 1em;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 8px;
    }
    
    .invoice-meta p {
      margin-bottom: 6px;
      font-size: 0.95em;
    }
    
    .invoice-meta strong {
      color: #374151;
    }
    
    .table-container {
      margin-bottom: 30px;
      overflow-x: auto;
    }
    
    .table { 
      width: 100%; 
      border-collapse: collapse;
    }
    
    .table th, .table td { 
      border: 1px solid #e5e7eb; 
      padding: 14px 12px; 
      text-align: right; 
    }
    
    .table th { 
      background-color: #16a34a;
      color: #fff;
      font-weight: 600;
    }
    
    .table tbody tr:nth-child(even) {
      background-color: #f9fafb;
    }
    
    .table tbody tr:hover {
      background-color: #f3f4f6;
    }
    
    .text-center { text-align: center; }
    .text-left { text-align: left; }
    
    .totals {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 30px;
    }
    
    .totals-box {
      background: #f9fafb;
      border-radius: 8px;
      padding: 20px 30px;
      min-width: 300px;
    }
    
    .totals-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      font-size: 1em;
    }
    
    .totals-row.total {
      font-size: 1.3em;
      font-weight: bold;
      color: #16a34a;
      border-top: 2px solid #16a34a;
      padding-top: 10px;
      margin-top: 10px;
    }
    
    .status { 
      display: inline-block; 
      padding: 6px 16px; 
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.9em;
    }
    
    .status-paid { 
      background: #dcfce7; 
      color: #16a34a; 
    }
    
    .status-pending { 
      background: #fef3c7; 
      color: #d97706; 
    }
    
    .status-cancelled {
      background: #fee2e2;
      color: #dc2626;
    }
    
    .footer { 
      margin-top: 50px; 
      text-align: center; 
      color: #6b7280; 
      font-size: 0.9em;
      padding-top: 30px;
      border-top: 1px solid #e5e7eb;
    }
    
    .footer p {
      margin-bottom: 5px;
    }
    
    .footer .brand {
      color: #16a34a;
      font-weight: 600;
    }
    
    @media print { 
      body { 
        padding: 20px; 
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .invoice-container {
        max-width: 100%;
      }
      
      .no-print {
        display: none;
      }
    }
    
    @media screen and (max-width: 600px) {
      body {
        padding: 20px;
      }
      
      .invoice-meta {
        flex-direction: column;
      }
      
      .totals-box {
        min-width: auto;
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <h1>🌿 الصفحات الخضراء</h1>
      <p>فاتورة ضريبية مبسطة</p>
    </div>
    
    <div class="invoice-meta">
      <div class="section">
        <h3>معلومات الفاتورة</h3>
        <p><strong>رقم الفاتورة:</strong> ${invoice.invoiceNumber || invoice.id.slice(0, 8).toUpperCase()}</p>
        <p><strong>تاريخ الإصدار:</strong> ${formatDate(invoice.issuedAt || invoice.createdAt)}</p>
        ${invoice.paidAt ? `<p><strong>تاريخ الدفع:</strong> ${formatDate(invoice.paidAt)}</p>` : ''}
        <p><strong>الحالة:</strong> <span class="status ${statusClass}">${statusText}</span></p>
      </div>
      
      <div class="section">
        <h3>معلومات العميل</h3>
        <p><strong>الاسم:</strong> ${invoice.customerName || 'عميل'}</p>
        ${invoice.customerEmail ? `<p><strong>البريد:</strong> ${invoice.customerEmail}</p>` : ''}
        ${invoice.customerPhone ? `<p><strong>الهاتف:</strong> ${invoice.customerPhone}</p>` : ''}
        ${invoice.businessName ? `<p><strong>النشاط التجاري:</strong> ${invoice.businessName}</p>` : ''}
      </div>
    </div>
    
    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th style="width: 50%">الوصف</th>
            <th style="width: 15%" class="text-center">الكمية</th>
            <th style="width: 17%" class="text-left">سعر الوحدة</th>
            <th style="width: 18%" class="text-left">المجموع</th>
          </tr>
        </thead>
        <tbody>
          ${linesHtml || `
            <tr>
              <td colspan="4" class="text-center" style="color: #999;">لا توجد بنود</td>
            </tr>
          `}
        </tbody>
      </table>
    </div>
    
    <div class="totals">
      <div class="totals-box">
        <div class="totals-row">
          <span>المجموع الفرعي:</span>
          <span>${formatCurrency(invoice.total)} ل.س</span>
        </div>
        <div class="totals-row">
          <span>المدفوع:</span>
          <span style="color: #16a34a">${formatCurrency(invoice.paidAmount)} ل.س</span>
        </div>
        <div class="totals-row">
          <span>المتبقي:</span>
          <span style="color: ${invoice.total - invoice.paidAmount > 0 ? '#dc2626' : '#16a34a'}">
            ${formatCurrency(invoice.total - invoice.paidAmount)} ل.س
          </span>
        </div>
        <div class="totals-row total">
          <span>الإجمالي:</span>
          <span>${formatCurrency(invoice.total)} ل.س</span>
        </div>
      </div>
    </div>
    
    <div class="footer">
      <p>شكراً لتعاملكم معنا 🙏</p>
      <p class="brand">الصفحات الخضراء - دليل الأنشطة التجارية في سوريا</p>
      <p style="margin-top: 10px; font-size: 0.85em;">
        تم إنشاء هذه الفاتورة إلكترونياً وهي صالحة بدون توقيع
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Opens a print window with the invoice
 */
export function printInvoice(invoice: InvoiceData): void {
  const html = generateInvoiceHtml(invoice);
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then trigger print
    setTimeout(() => {
      printWindow.print();
    }, 300);
  }
}

/**
 * Downloads the invoice as a PDF file using print to PDF
 * Note: This opens print dialog where user can choose "Save as PDF"
 */
export function downloadInvoiceAsPdf(invoice: InvoiceData): void {
  const html = generateInvoiceHtml(invoice);
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    
    // Add a small delay to ensure content is loaded
    setTimeout(() => {
      printWindow.print();
    }, 300);
  }
}
