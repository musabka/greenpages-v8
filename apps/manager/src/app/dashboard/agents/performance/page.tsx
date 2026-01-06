'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  TrendingUp,
  Building2,
  DollarSign,
  Wallet,
  Eye,
  ArrowUpDown,
  Calendar,
  Award,
  Target,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatNumber } from '@/lib/format';

interface AgentPerformance {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  baseSalary: number;
  commissionRate: number;
  governorates: Array<{
    governorate: { nameAr: string };
  }>;
  performance: {
    businessesCreated: number;
    commissionsEarned: number;
    commissionsCount: number;
    collectionsTotal: number;
    collectionsCount: number;
    pendingCollections: number;
    visitsCount: number;
  };
}

export default function AgentsPerformancePage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [sortBy, setSortBy] = useState<'businesses' | 'commissions' | 'collections'>(
    'businesses'
  );
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, error } = useQuery({
    queryKey: ['agents-performance', period, sortBy, page],
    queryFn: async () => {
      const response = await api.get(
        `/governorate-manager/agents/performance?period=${period}&sortBy=${sortBy}&page=${page}&limit=${limit}`
      );
      console.log('Performance API Response:', response.data);
      return response.data;
    },
  });

  const agents: AgentPerformance[] = data?.data || [];
  const summary = data?.summary || {
    totalAgents: 0,
    totalBusinesses: 0,
    totalCommissions: 0,
    totalCollections: 0,
    totalVisits: 0,
    averageBusinessesPerAgent: 0,
  };
  const meta = data?.meta || { total: 0, page: 1, totalPages: 1 };

  const getPeriodText = () => {
    switch (period) {
      case 'week':
        return 'هذا الأسبوع';
      case 'year':
        return 'هذا العام';
      case 'month':
      default:
        return 'هذا الشهر';
    }
  };

  const getTopPerformer = () => {
    if (agents.length === 0) return null;
    return agents[0];
  };

  const topPerformer = getTopPerformer();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">تقارير أداء المندوبين</h1>
          <p className="text-gray-500">تحليل شامل لأداء المندوبين</p>
        </div>
        <Link
          href="/dashboard/agents"
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          قائمة المندوبين
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-wrap gap-4">
          {/* Period Filter */}
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="week">هذا الأسبوع</option>
              <option value="month">هذا الشهر</option>
              <option value="year">هذا العام</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-5 h-5 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="businesses">الأنشطة المضافة</option>
              <option value="commissions">العمولات المكتسبة</option>
              <option value="collections">المبالغ المحصلة</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">إجمالي المندوبين</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalAgents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Building2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">إجمالي الأنشطة</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalBusinesses}</p>
              <p className="text-xs text-gray-400">
                معدل {summary.averageBusinessesPerAgent.toFixed(1)} لكل مندوب
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">إجمالي العمولات</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(summary.totalCommissions)}
              </p>
              <p className="text-xs text-gray-400">ل.س</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-lg">
              <Wallet className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">إجمالي التحصيلات</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(summary.totalCollections)}
              </p>
              <p className="text-xs text-gray-400">ل.س</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performer */}
      {topPerformer && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg shadow-sm p-6 border border-amber-200">
          <div className="flex items-center gap-3 mb-4">
            <Award className="w-6 h-6 text-amber-600" />
            <h2 className="text-lg font-bold text-gray-900">
              المندوب المتميز - {getPeriodText()}
            </h2>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  {topPerformer.user.firstName.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">
                  {topPerformer.user.firstName} {topPerformer.user.lastName}
                </p>
                <p className="text-sm text-gray-500">{topPerformer.user.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-600">
                  {topPerformer.performance.businessesCreated}
                </p>
                <p className="text-xs text-gray-500">نشاط</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-600">
                  {formatNumber(topPerformer.performance.commissionsEarned)}
                </p>
                <p className="text-xs text-gray-500">ل.س عمولة</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-600">
                  {topPerformer.performance.visitsCount}
                </p>
                <p className="text-xs text-gray-500">زيارة</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agents Performance Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-4" />
            <p className="text-red-600">حدث خطأ: {(error as any).message}</p>
          </div>
        ) : agents.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">لا يوجد بيانات للعرض</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      #
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      المندوب
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      المحافظات
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      الأنشطة
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      العمولات
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      التحصيلات
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      الزيارات
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {agents.map((agent, index) => (
                    <tr key={agent.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="text-gray-500 font-medium">
                          {(page - 1) * limit + index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 font-bold">
                              {agent.user.firstName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {agent.user.firstName} {agent.user.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{agent.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {agent.governorates.slice(0, 2).map((gov, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                            >
                              {gov.governorate.nameAr}
                            </span>
                          ))}
                          {agent.governorates.length > 2 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                              +{agent.governorates.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="font-bold text-gray-900">
                            {agent.performance.businessesCreated}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-bold text-green-600">
                            {formatNumber(agent.performance.commissionsEarned)} ل.س
                          </p>
                          <p className="text-xs text-gray-400">
                            {agent.performance.commissionsCount} عملية
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-bold text-blue-600">
                            {formatNumber(agent.performance.collectionsTotal)} ل.س
                          </p>
                          <p className="text-xs text-gray-400">
                            {agent.performance.collectionsCount} تحصيل
                          </p>
                          {Number(agent.performance.pendingCollections) > 0 && (
                            <p className="text-xs text-amber-600">
                              {formatNumber(agent.performance.pendingCollections)} معلق
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Activity className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {agent.performance.visitsCount}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/agents/${agent.id}`}
                          className="p-2 hover:bg-gray-100 rounded-lg inline-flex"
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  السابق
                </button>
                <span className="text-sm text-gray-600">
                  صفحة {meta.page} من {meta.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                  disabled={page === meta.totalPages}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  التالي
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
