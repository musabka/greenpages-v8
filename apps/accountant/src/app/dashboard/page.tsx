'use client';

import { useEffect, useState } from 'react';
import {
  FileText,
  Receipt,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface DashboardStats {
  journalEntries: {
    total: number;
    draft: number;
    posted: number;
    void: number;
  };
  invoices: {
    total: number;
    draft: number;
    issued: number;
    paid: number;
    cancelled: number;
  };
  financialSummary: {
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
  };
  periods: {
    total: number;
    open: number;
    closed: number;
  };
  recentJournalEntries?: any[];
  recentInvoices?: any[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(`${baseUrl}/api/v1/admin/accounting/dashboard-stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('فشل جلب البيانات');

      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جارٍ تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 ml-2" />
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'القيود المحاسبية',
      value: stats?.journalEntries.total || 0,
      icon: FileText,
      color: 'blue',
      details: [
        { label: 'مسودة', value: stats?.journalEntries.draft || 0 },
        { label: 'مرحّل', value: stats?.journalEntries.posted || 0 },
        { label: 'ملغي', value: stats?.journalEntries.void || 0 },
      ],
    },
    {
      title: 'الفواتير',
      value: (stats?.invoices.total || 0) - (stats?.invoices.draft || 0), // استبعاد المسودات
      icon: Receipt,
      color: 'green',
      details: [
        { label: 'صادرة', value: stats?.invoices.issued || 0 },
        { label: 'مدفوعة', value: stats?.invoices.paid || 0 },
        { label: 'مسودة (مستبعدة)', value: stats?.invoices.draft || 0 },
      ],
    },
    {
      title: 'صافي الدخل',
      value: `${(stats?.financialSummary.netIncome || 0).toLocaleString('ar-SY')} ل.س`,
      icon: TrendingUp,
      color: 'purple',
      details: [
        {
          label: 'الإيرادات',
          value: `${(stats?.financialSummary.totalRevenue || 0).toLocaleString('ar-SY')}`,
        },
        {
          label: 'المصروفات',
          value: `${(stats?.financialSummary.totalExpenses || 0).toLocaleString('ar-SY')}`,
        },
      ],
    },
    {
      title: 'الفترات المحاسبية',
      value: stats?.periods.total || 0,
      icon: Clock,
      color: 'orange',
      details: [
        { label: 'مفتوحة', value: stats?.periods.open || 0 },
        { label: 'مغلقة', value: stats?.periods.closed || 0 },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">لوحة تحكم المحاسب</h1>
        <p className="text-gray-600 mt-2">نظرة شاملة على البيانات المحاسبية</p>
      </div>

      {/* Notice about draft exclusion */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-amber-600 ml-2" />
          <p className="text-amber-800">
            <strong>ملاحظة مهمة:</strong> الفواتير المسودة مستبعدة من الإحصائيات والحسابات المالية لضمان دقة البيانات.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          const colors = {
            blue: 'bg-blue-100 text-blue-600',
            green: 'bg-green-100 text-green-600',
            purple: 'bg-purple-100 text-purple-600',
            orange: 'bg-orange-100 text-orange-600',
          };

          return (
            <div
              key={card.title}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${colors[card.color as keyof typeof colors]}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>

              <h3 className="text-gray-600 text-sm font-medium mb-1">{card.title}</h3>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>

              {card.details && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                  {card.details.map((detail) => (
                    <div key={detail.label} className="flex justify-between text-sm">
                      <span className="text-gray-600">{detail.label}</span>
                      <span className="font-medium text-gray-900">{detail.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Journal Entries */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            آخر القيود المحاسبية
          </h2>
          {stats?.recentJournalEntries && stats.recentJournalEntries.length > 0 ? (
            <div className="space-y-3">
              {stats.recentJournalEntries.map((entry: any) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {entry.description || entry.code}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(entry.occurredAt).toLocaleDateString('ar-SY')}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    entry.status === 'POSTED' ? 'bg-green-100 text-green-700' :
                    entry.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {entry.status === 'POSTED' ? 'مرحّل' : entry.status === 'DRAFT' ? 'مسودة' : 'ملغي'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>لا توجد قيود محاسبية بعد</p>
            </div>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">آخر الفواتير</h2>
          {stats?.recentInvoices && stats.recentInvoices.length > 0 ? (
            <div className="space-y-3">
              {stats.recentInvoices.map((invoice: any) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <Receipt className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {invoice.code}
                      </p>
                      <p className="text-xs text-gray-500">
                        {invoice.totalAmount?.toLocaleString('ar-SY')} {invoice.currency?.code || 'ل.س'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    invoice.status === 'PAID' ? 'bg-green-100 text-green-700' :
                    invoice.status === 'ISSUED' ? 'bg-blue-100 text-blue-700' :
                    invoice.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {invoice.status === 'PAID' ? 'مدفوعة' : 
                     invoice.status === 'ISSUED' ? 'صادرة' : 
                     invoice.status === 'DRAFT' ? 'مسودة' : 'ملغاة'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Receipt className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>لا توجد فواتير بعد</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">إجراءات سريعة</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
            <FileText className="w-8 h-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">قيد جديد</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
            <Receipt className="w-8 h-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">فاتورة جديدة</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
            <TrendingUp className="w-8 h-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">تقرير مالي</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
            <Clock className="w-8 h-8 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">إغلاق فترة</span>
          </button>
        </div>
      </div>
    </div>
  );
}
