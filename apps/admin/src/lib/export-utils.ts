// Export Utilities for Admin Dashboard
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface ExportData {
  stats?: any;
  businesses?: any[];
  reviews?: any[];
  activity?: any[];
  timeRange?: string;
}

export class DashboardExporter {
  /**
   * Export dashboard data to CSV
   */
  static exportToCSV(data: ExportData) {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `dashboard-export-${timestamp}.csv`;

    // Prepare combined data
    const csvData = [];

    // Add stats summary
    if (data.stats) {
      csvData.push(['إحصائيات عامة']);
      csvData.push(['المؤشر', 'القيمة']);
      csvData.push(['إجمالي الأنشطة', data.stats.businesses?.total || 0]);
      csvData.push(['أنشطة معلقة', data.stats.businesses?.pending || 0]);
      csvData.push(['إجمالي المستخدمين', data.stats.users?.total || 0]);
      csvData.push(['مستخدمين نشطين', data.stats.users?.active || 0]);
      csvData.push(['إجمالي التقييمات', data.stats.reviews?.total || 0]);
      csvData.push(['تقييمات معلقة', data.stats.reviews?.pending || 0]);
      csvData.push(['إجمالي المشاهدات', data.stats.views?.total || 0]);
      csvData.push(['مشاهدات اليوم', data.stats.views?.today || 0]);
      csvData.push([]);
    }

    // Add pending businesses
    if (data.businesses && data.businesses.length > 0) {
      csvData.push(['الأنشطة المعلقة']);
      csvData.push(['اسم النشاط', 'التصنيف', 'الموقع', 'تاريخ الإنشاء']);
      data.businesses.forEach((business: any) => {
        csvData.push([
          business.nameAr || '',
          business.categories?.[0]?.category?.nameAr || business.category?.nameAr || '',
          business.city?.nameAr || business.governorate?.nameAr || '',
          new Date(business.createdAt).toLocaleDateString('ar-SY'),
        ]);
      });
      csvData.push([]);
    }

    // Add pending reviews
    if (data.reviews && data.reviews.length > 0) {
      csvData.push(['التقييمات المعلقة']);
      csvData.push(['النشاط', 'المستخدم', 'التقييم', 'التاريخ']);
      data.reviews.forEach((review: any) => {
        csvData.push([
          review.business?.nameAr || '',
          `${review.user?.firstName || ''} ${review.user?.lastName || ''}`,
          review.rating || 0,
          new Date(review.createdAt).toLocaleDateString('ar-SY'),
        ]);
      });
      csvData.push([]);
    }

    // Add recent activity
    if (data.activity && data.activity.length > 0) {
      csvData.push(['النشاط الأخير']);
      csvData.push(['الإجراء', 'الهدف', 'الوقت']);
      data.activity.forEach((activity: any) => {
        csvData.push([
          activity.action || '',
          activity.target || '',
          activity.time || '',
        ]);
      });
    }

    // Convert to CSV and download
    const csv = Papa.unparse(csvData);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }

  /**
   * Export dashboard data to PDF
   */
  static exportToPDF(data: ExportData) {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `dashboard-report-${timestamp}.pdf`;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Add Arabic font support (simplified - in production, use proper Arabic font)
    let yPos = 20;

    // Title
    doc.setFontSize(18);
    doc.text('تقرير لوحة التحكم - الصفحات الخضراء', 105, yPos, { align: 'center' });
    yPos += 10;

    doc.setFontSize(10);
    doc.text(`تاريخ التقرير: ${new Date().toLocaleDateString('ar-SY')}`, 105, yPos, { align: 'center' });
    yPos += 5;
    doc.text(`الفترة: ${data.timeRange === 'day' ? 'اليوم' : data.timeRange === 'week' ? 'الأسبوع' : 'الشهر'}`, 105, yPos, { align: 'center' });
    yPos += 15;

    // Stats Summary
    if (data.stats) {
      doc.setFontSize(14);
      doc.text('Statistics Summary', 20, yPos);
      yPos += 8;

      const statsData = [
        ['Total Businesses', (data.stats.businesses?.total || 0).toString()],
        ['Pending Businesses', (data.stats.businesses?.pending || 0).toString()],
        ['Total Users', (data.stats.users?.total || 0).toString()],
        ['Active Users', (data.stats.users?.active || 0).toString()],
        ['Total Reviews', (data.stats.reviews?.total || 0).toString()],
        ['Pending Reviews', (data.stats.reviews?.pending || 0).toString()],
        ['Total Views', (data.stats.views?.total || 0).toString()],
        ['Today Views', (data.stats.views?.today || 0).toString()],
      ];

      doc.autoTable({
        startY: yPos,
        head: [['Metric', 'Value']],
        body: statsData,
        theme: 'striped',
        headStyles: { fillColor: [5, 150, 105] },
        margin: { left: 20, right: 20 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Pending Businesses
    if (data.businesses && data.businesses.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.text('Pending Businesses', 20, yPos);
      yPos += 8;

      const businessData = data.businesses.map((business: any) => [
        business.nameAr || '',
        business.categories?.[0]?.category?.nameAr || business.category?.nameAr || '',
        business.city?.nameAr || business.governorate?.nameAr || '',
        new Date(business.createdAt).toLocaleDateString('en-US'),
      ]);

      doc.autoTable({
        startY: yPos,
        head: [['Business Name', 'Category', 'Location', 'Created']],
        body: businessData,
        theme: 'striped',
        headStyles: { fillColor: [5, 150, 105] },
        margin: { left: 20, right: 20 },
        styles: { fontSize: 9 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Pending Reviews
    if (data.reviews && data.reviews.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.text('Pending Reviews', 20, yPos);
      yPos += 8;

      const reviewData = data.reviews.map((review: any) => [
        review.business?.nameAr || '',
        `${review.user?.firstName || ''} ${review.user?.lastName || ''}`,
        (review.rating || 0).toString(),
        new Date(review.createdAt).toLocaleDateString('en-US'),
      ]);

      doc.autoTable({
        startY: yPos,
        head: [['Business', 'User', 'Rating', 'Date']],
        body: reviewData,
        theme: 'striped',
        headStyles: { fillColor: [5, 150, 105] },
        margin: { left: 20, right: 20 },
        styles: { fontSize: 9 },
      });
    }

    // Save PDF
    doc.save(filename);
  }
}
