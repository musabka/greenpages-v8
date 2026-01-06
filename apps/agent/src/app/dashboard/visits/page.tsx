'use client';

import { useState, useEffect } from 'react';
import {
  MapPin,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Building2,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  FileText,
} from 'lucide-react';
import { api } from '@/lib/api';

interface Visit {
  id: string;
  business: {
    name: string;
    city: { name: string };
    district?: { name: string };
  };
  purpose: 'REGISTRATION' | 'RENEWAL' | 'COLLECTION' | 'OTHER';
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  date: string;
  notes?: string;
  outcome?: string;
}

export default function AgentVisitsPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    fetchVisits();
  }, [page, statusFilter]);

  const fetchVisits = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await api.get(`/agent-portal/visits?${params}`);
      setVisits(response.data.data || response.data);
      setTotal(response.data.total || response.data.length);
    } catch (error) {
      console.error('Failed to fetch visits:', error);
      // بيانات تجريبية
      setVisits([
        {
          id: '1',
          business: {
            name: 'مطعم البيت الدمشقي',
            city: { name: 'دمشق' },
            district: { name: 'المزة' },
          },
          purpose: 'REGISTRATION',
          status: 'COMPLETED',
          date: '2024-01-05',
          outcome: 'تم تسجيل النشاط بنجاح',
        },
        {
          id: '2',
          business: {
            name: 'صيدلية النور',
            city: { name: 'ريف دمشق' },
          },
          purpose: 'RENEWAL',
          status: 'SCHEDULED',
          date: '2024-01-10',
          notes: 'موعد لتجديد الاشتراك',
        },
      ]);
      setTotal(2);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-700';
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-700';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'مكتملة';
      case 'SCHEDULED':
        return 'مجدولة';
      case 'CANCELLED':
        return 'ملغية';
      default:
        return status;
    }
  };

  const getPurposeText = (purpose: string) => {
    switch (purpose) {
      case 'REGISTRATION':
        return 'تسجيل جديد';
      case 'RENEWAL':
        return 'تجديد اشتراك';
      case 'COLLECTION':
        return 'تحصيل';
      case 'OTHER':
        return 'أخرى';
      default:
        return purpose;
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الزيارات الميدانية</h1>
          <p className="text-gray-500">جدول الزيارات وسجل النشاط الميداني</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
          <Plus className="w-5 h-5" />
          تسجيل زيارة جديدة
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">جميع الحالات</option>
            <option value="SCHEDULED">مجدولة</option>
            <option value="COMPLETED">مكتملة</option>
            <option value="CANCELLED">ملغية</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : visits.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد زيارات مسجلة</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                    النشاط
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                    الغرض
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                    التاريخ
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
                {visits.map((visit) => (
                  <tr key={visit.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {visit.business.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1 mr-6">
                          <MapPin className="w-3 h-3" />
                          <span>
                            {visit.business.city.name}
                            {visit.business.district && ` - ${visit.business.district.name}`}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {getPurposeText(visit.purpose)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {new Date(visit.date).toLocaleDateString('ar-SA')}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getStatusStyle(
                          visit.status
                        )}`}
                      >
                        {getStatusText(visit.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {(visit.notes || visit.outcome) ? (
                        <div className="flex items-center gap-1 text-sm text-gray-600" title={visit.outcome || visit.notes}>
                          <FileText className="w-4 h-4" />
                          <span className="truncate max-w-[200px]">
                            {visit.outcome || visit.notes}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
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
    </div>
  );
}
