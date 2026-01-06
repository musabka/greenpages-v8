'use client';

import { useState } from 'react';
import { Calendar, Search, Filter, DollarSign, CheckCircle, Clock } from 'lucide-react';
import { useAgentCollections } from '@/lib/hooks/useFinancial';

export default function AgentCollectionsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useAgentCollections({
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
    limit,
  });

  const collections = data?.data || [];
  const total = data?.meta?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">سجل المقبوضات</h1>
        <p className="text-gray-500">جميع المبالغ التي قمت بتحصيلها</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">إجمالي المقبوضات</p>
              <p className="text-xl font-bold text-gray-900">
                {collections.reduce((sum: number, c: any) => sum + parseFloat(c.amount), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">معلقة</p>
              <p className="text-xl font-bold text-gray-900">
                {collections.filter((c: any) => c.status === 'COLLECTED').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">مُسلّمة</p>
              <p className="text-xl font-bold text-gray-900">
                {collections.filter((c: any) => c.status === 'SUBMITTED').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="البحث بالنشاط التجاري..."
              className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">جميع الحالات</option>
              <option value="COLLECTED">معلقة</option>
              <option value="SUBMITTED">مُسلّمة</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد مقبوضات</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      النشاط التجاري
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      الباقة
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      المبلغ
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      تاريخ التحصيل
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      الحالة
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      ملاحظات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {collections
                    .filter((c: any) => 
                      !search || c.business?.nameAr?.toLowerCase().includes(search.toLowerCase())
                    )
                    .map((collection: any) => (
                    <tr key={collection.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">
                          {collection.business?.nameAr || '-'}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {collection.package?.nameAr || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-blue-600">
                          {parseFloat(collection.amount).toLocaleString()} ل.س
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {new Date(collection.collectedAt).toLocaleDateString('ar-SA')}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                            collection.status === 'COLLECTED'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {collection.status === 'COLLECTED' ? (
                            <>
                              <Clock className="w-3 h-3" />
                              معلقة
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              مُسلّمة
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {collection.notes || '-'}
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
