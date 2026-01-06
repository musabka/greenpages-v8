'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  Search,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Phone,
  Mail,
  Building2,
  TrendingUp,
  Plus,
} from 'lucide-react';
import { api } from '@/lib/api';

interface Agent {
  id: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  governorates?: { governorate: { nameAr: string } }[];
  commissionRate?: number;
  _count?: {
    commissions?: number;
    visits?: number;
  };
  isActive: boolean;
}

export default function ManagerAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    fetchAgents();
  }, [page, statusFilter]);

  const fetchAgents = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (statusFilter === 'active') params.append('isActive', 'true');
      if (statusFilter === 'inactive') params.append('isActive', 'false');
      if (search) params.append('search', search);

      const response = await api.get(`/governorate-manager/agents?${params}`);
      setAgents(response.data.data || response.data);
      setTotal(response.data.meta?.total ?? response.data.total ?? response.data.length ?? 0);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      // بيانات تجريبية
      setAgents([
        {
          id: '1',
          user: {
            firstName: 'أحمد',
            lastName: 'محمد',
            email: 'ahmed@greenpages.sy',
            phone: '0911234567',
          },
          governorates: [{ governorate: { nameAr: 'دمشق' } }, { governorate: { nameAr: 'ريف دمشق' } }],
          commissionRate: 10,
          _count: { commissions: 45, visits: 8 },
          isActive: true,
        },
        {
          id: '2',
          user: {
            firstName: 'محمد',
            lastName: 'علي',
            email: 'mohammad@greenpages.sy',
            phone: '0922345678',
          },
          governorates: [{ governorate: { nameAr: 'ريف دمشق' } }],
          commissionRate: 12,
          _count: { commissions: 32, visits: 5 },
          isActive: true,
        },
        {
          id: '3',
          user: {
            firstName: 'خالد',
            lastName: 'أحمد',
            email: 'khaled@greenpages.sy',
            phone: '0933456789',
          },
          governorates: [{ governorate: { nameAr: 'دمشق' } }],
          commissionRate: 10,
          _count: { commissions: 18, visits: 3 },
          isActive: false,
        },
      ]);
      setTotal(3);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchAgents();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">المندوبين</h1>
          <p className="text-gray-500">إدارة المندوبين في محافظاتك</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            إجمالي: {total} مندوب
          </div>
          <Link
            href="/dashboard/agents/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            إضافة مندوب
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="البحث بالاسم أو البريد..."
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
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
            </select>
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            بحث
          </button>
        </form>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-3 bg-gray-200 rounded" />
                <div className="h-3 bg-gray-200 rounded" />
              </div>
            </div>
          ))
        ) : agents.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">لا يوجد مندوبين</p>
          </div>
        ) : (
          agents.map((agent) => (
            <div key={agent.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    agent.isActive ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <User className={`w-6 h-6 ${agent.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {`${agent.user.firstName ?? ''} ${agent.user.lastName ?? ''}`.trim() || '—'}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      agent.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {agent.isActive ? 'نشط' : 'غير نشط'}
                    </span>
                  </div>
                </div>
                <Link
                  href={`/dashboard/agents/${agent.id}`}
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <Eye className="w-5 h-5" />
                </Link>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{agent.user.email}</span>
                </div>
                {agent.user.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span dir="ltr">{agent.user.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {(agent.governorates ?? [])
                      .map((g) => g.governorate?.nameAr)
                      .filter(Boolean)
                      .join('، ') || '—'}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-gray-900">{agent._count?.commissions ?? 0}</p>
                  <p className="text-xs text-gray-500">إجمالي</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-green-600">{agent._count?.visits ?? 0}</p>
                  <p className="text-xs text-gray-500">هذا الشهر</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-blue-600">{agent.commissionRate ?? 0}%</p>
                  <p className="text-xs text-gray-500">العمولة</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-xl shadow-sm px-4 py-3">
          <p className="text-sm text-gray-500">
            عرض {(page - 1) * limit + 1} - {Math.min(page * limit, total)} من {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-600">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
