'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  Building2,
  Users,
  DollarSign,
  RefreshCw,
  MapPin,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrencySYP, formatNumber } from '@/lib/format';

interface ReportData {
  summary: {
    totalBusinesses: number;
    newBusinesses: number;
    renewals: number;
    revenue: number;
    growthRate: number;
  };
  governorateStats: {
    name: string;
    businesses: number;
    agents: number;
    revenue: number;
  }[];
  monthlyTrend: {
    month: string;
    businesses: number;
    renewals: number;
    revenue: number;
  }[];
  topAgents: {
    name: string;
    businesses: number;
    revenue: number;
  }[];
}

export default function ManagerReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/governorate-manager/reports?period=${dateRange}`);
      setReportData(response.data);
    } catch (error) {
      console.error('Failed to fetch report data:', error);
      // بيانات تجريبية
      setReportData({
        summary: {
          totalBusinesses: 245,
          newBusinesses: 32,
          renewals: 45,
          revenue: 4500000,
          growthRate: 12.5,
        },
        governorateStats: [
          { name: 'دمشق', businesses: 150, agents: 8, revenue: 2800000 },
          { name: 'ريف دمشق', businesses: 95, agents: 5, revenue: 1700000 },
        ],
        monthlyTrend: [
          { month: 'أكتوبر', businesses: 18, renewals: 12, revenue: 980000 },
          { month: 'نوفمبر', businesses: 22, renewals: 15, revenue: 1200000 },
          { month: 'ديسمبر', businesses: 28, renewals: 18, revenue: 1400000 },
          { month: 'يناير', businesses: 32, renewals: 20, revenue: 920000 },
        ],
        topAgents: [
          { name: 'أحمد محمد', businesses: 12, revenue: 580000 },
          { name: 'محمد علي', businesses: 10, revenue: 450000 },
          { name: 'خالد أحمد', businesses: 8, revenue: 380000 },
        ],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get(`/governorate-manager/reports/export?period=${dateRange}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${dateRange}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">جارٍ تحميل التقارير...</p>
        </div>
      </div>
    );
  }

  if (!reportData || !reportData.summary) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">التقارير</h1>
          <p className="text-gray-500">تقارير وإحصائيات المحافظات</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm p-1">
            {['week', 'month', 'quarter', 'year'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {range === 'week' && 'أسبوع'}
                {range === 'month' && 'شهر'}
                {range === 'quarter' && 'ربع سنة'}
                {range === 'year' && 'سنة'}
              </button>
            ))}
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            تصدير
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">إجمالي النشاطات</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(reportData.summary.totalBusinesses)}
              </p>
              <p className="text-sm text-green-600 mt-1">
                +{formatNumber(reportData.summary.newBusinesses)} جديد
              </p>
            </div>
            <div className="p-3 rounded-xl bg-blue-100">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">التجديدات</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(reportData.summary.renewals)}
              </p>
              <p className="text-sm text-gray-500 mt-1">هذه الفترة</p>
            </div>
            <div className="p-3 rounded-xl bg-green-100">
              <RefreshCw className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">الإيرادات</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(Number((reportData.summary.revenue / 1000000).toFixed(1)))}M
              </p>
              <p className="text-sm text-gray-500 mt-1">ليرة سورية</p>
            </div>
            <div className="p-3 rounded-xl bg-yellow-100">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">معدل النمو</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(reportData.summary.growthRate)}%
              </p>
              <p className="text-sm text-green-600 mt-1">↑ مقارنة بالسابق</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-100">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Governorate Stats */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            إحصائيات المحافظات
          </h2>
          <div className="space-y-4">
            {reportData.governorateStats.map((gov, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">{gov.name}</h3>
                  <span className="text-sm text-gray-500">
                    {formatCurrencySYP(gov.revenue)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-500" />
                    <span className="text-gray-600">{formatNumber(gov.businesses)} نشاط</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-500" />
                    <span className="text-gray-600">{formatNumber(gov.agents)} مندوب</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            الاتجاه الشهري
          </h2>
          <div className="space-y-4">
            {reportData.monthlyTrend.map((month, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-20 text-sm font-medium text-gray-600">
                  {month.month}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="h-4 bg-blue-500 rounded"
                      style={{
                        width: `${(month.businesses / 40) * 100}%`,
                        minWidth: '20px',
                      }}
                    />
                    <span className="text-xs text-gray-500">{formatNumber(month.businesses)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-4 bg-green-500 rounded"
                      style={{
                        width: `${(month.renewals / 25) * 100}%`,
                        minWidth: '20px',
                      }}
                    />
                    <span className="text-xs text-gray-500">{formatNumber(month.renewals)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span className="text-sm text-gray-600">نشاطات جديدة</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span className="text-sm text-gray-600">تجديدات</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Agents */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-600" />
          أفضل المندوبين
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reportData.topAgents.map((agent, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl ${
                index === 0
                  ? 'bg-yellow-50 border-2 border-yellow-200'
                  : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                    index === 0
                      ? 'bg-yellow-500'
                      : index === 1
                      ? 'bg-gray-400'
                      : 'bg-orange-400'
                  }`}
                >
                  {formatNumber(index + 1)}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{agent.name}</h3>
                  <p className="text-sm text-gray-500">{formatNumber(agent.businesses)} نشاط</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-green-600">
                <DollarSign className="w-4 h-4" />
                <span className="font-medium">{formatCurrencySYP(agent.revenue)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
