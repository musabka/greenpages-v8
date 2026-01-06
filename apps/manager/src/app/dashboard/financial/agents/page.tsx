'use client';

import { useState } from 'react';
import { Users, Search, Edit, DollarSign, Percent, Wallet } from 'lucide-react';
import { useManagerAgents, useUpdateAgentSettings } from '@/lib/hooks/useFinancial';

export default function ManagerAgentsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editingAgent, setEditingAgent] = useState<string | null>(null);
  const [baseSalary, setBaseSalary] = useState('');
  const [commissionRate, setCommissionRate] = useState('');
  
  const limit = 20;
  const { data, isLoading } = useManagerAgents({ page, limit });
  const updateSettings = useUpdateAgentSettings();

  const agents = data?.data || [];
  const total = data?.meta?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const handleEdit = (agent: any) => {
    setEditingAgent(agent.id);
    setBaseSalary(agent.baseSalary.toString());
    setCommissionRate(agent.commissionRate.toString());
  };

  const handleSave = async (agentId: string) => {
    try {
      await updateSettings.mutateAsync({
        agentId,
        baseSalary: parseFloat(baseSalary),
        commissionRate: parseFloat(commissionRate),
      });
      setEditingAgent(null);
    } catch (error) {
      console.error('Failed to update agent settings:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">إدارة المندوبين</h1>
        <p className="text-gray-500">تحديد الرواتب والنسب المئوية</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">إجمالي المندوبين</p>
              <p className="text-xl font-bold text-gray-900">{total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">متوسط الراتب</p>
              <p className="text-xl font-bold text-gray-900">
                {agents.length > 0
                  ? Math.round(
                      agents.reduce((sum: number, a: any) => sum + parseFloat(a.baseSalary), 0) /
                        agents.length
                    ).toLocaleString()
                  : 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Percent className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">متوسط العمولة</p>
              <p className="text-xl font-bold text-gray-900">
                {agents.length > 0
                  ? (
                      agents.reduce((sum: number, a: any) => sum + parseFloat(a.commissionRate), 0) /
                      agents.length
                    ).toFixed(1)
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="البحث بالاسم..."
            className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : agents.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">لا يوجد مندوبين</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      المندوب
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      الراتب الأساسي
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      نسبة العمولة
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      الرصيد الحالي
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      النشاطات
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      التجديدات
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {agents
                    .filter((agent: any) =>
                      !search ||
                      `${agent.user.firstName} ${agent.user.lastName}`
                        .toLowerCase()
                        .includes(search.toLowerCase())
                    )
                    .map((agent: any) => (
                      <tr key={agent.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-green-600" />
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
                          {editingAgent === agent.id ? (
                            <input
                              type="number"
                              value={baseSalary}
                              onChange={(e) => setBaseSalary(e.target.value)}
                              className="w-32 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            />
                          ) : (
                            <p className="font-medium text-gray-900">
                              {parseFloat(agent.baseSalary).toLocaleString()} ل.س
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingAgent === agent.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={commissionRate}
                                onChange={(e) => setCommissionRate(e.target.value)}
                                step="0.1"
                                min="0"
                                max="100"
                                className="w-20 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                              />
                              <span className="text-gray-500">%</span>
                            </div>
                          ) : (
                            <p className="font-medium text-purple-600">
                              {parseFloat(agent.commissionRate).toFixed(1)}%
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-red-600">
                            {agent.currentBalance?.toLocaleString() || 0} ل.س
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {agent.totalBusinesses}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {agent.totalRenewals}
                        </td>
                        <td className="px-4 py-3">
                          {editingAgent === agent.id ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSave(agent.id)}
                                disabled={updateSettings.isPending}
                                className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50"
                              >
                                حفظ
                              </button>
                              <button
                                onClick={() => setEditingAgent(null)}
                                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                              >
                                إلغاء
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEdit(agent)}
                              className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  عرض {(page - 1) * limit + 1} - {Math.min(page * limit, total)} من {total}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    السابق
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    التالي
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
