'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Phone,
  User,
  Building2,
  Calendar,
  MapPin,
  MessageSquare,
  Filter,
  ChevronDown,
  ChevronUp,
  Loader2,
  Users,
  TrendingUp,
  AlertCircle,
  PhoneCall,
} from 'lucide-react';
import {
  useRenewals,
  useRenewalStatistics,
  useAssignRenewalAgent,
  useBulkAssignRenewalAgent,
  useGenerateRenewals,
  useUsers,
} from '@/lib/hooks';

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'بانتظار التواصل', color: 'bg-gray-100 text-gray-700', icon: Clock },
  CONTACTED: { label: 'تم التواصل', color: 'bg-blue-100 text-blue-700', icon: Phone },
  VISIT_SCHEDULED: { label: 'موعد زيارة', color: 'bg-purple-100 text-purple-700', icon: Calendar },
  VISITED: { label: 'تمت الزيارة', color: 'bg-indigo-100 text-indigo-700', icon: MapPin },
  RENEWED: { label: 'تم التجديد', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  DECLINED: { label: 'رفض التجديد', color: 'bg-red-100 text-red-700', icon: XCircle },
  POSTPONED: { label: 'تم التأجيل', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  NO_RESPONSE: { label: 'لا يوجد رد', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
  EXPIRED: { label: 'انتهت بدون تجديد', color: 'bg-red-100 text-red-700', icon: AlertCircle },
};

const PRIORITY_MAP: Record<number, { label: string; color: string }> = {
  0: { label: 'عادي', color: 'bg-gray-100 text-gray-600' },
  1: { label: 'متوسط', color: 'bg-yellow-100 text-yellow-700' },
  2: { label: 'عاجل', color: 'bg-orange-100 text-orange-700' },
  3: { label: 'حرج', color: 'bg-red-100 text-red-700' },
};

export default function RenewalsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [agentFilter, setAgentFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const { data: renewalsData, isLoading } = useRenewals({
    status: statusFilter || undefined,
    agentId: agentFilter || undefined,
    priority: priorityFilter ? parseInt(priorityFilter) : undefined,
    page,
    limit: 20,
  });

  const { data: statistics, isLoading: statsLoading } = useRenewalStatistics();
  const { data: usersData } = useUsers({ role: 'AGENT', limit: 100 });
  const agents = Array.isArray(usersData) ? usersData : usersData?.data || [];

  const assignAgent = useAssignRenewalAgent();
  const bulkAssign = useBulkAssignRenewalAgent();
  const generateRenewals = useGenerateRenewals();

  const renewals = renewalsData?.data || [];
  const meta = renewalsData?.meta;

  const handleSelectAll = () => {
    if (selectedRecords.length === renewals.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(renewals.map((r: any) => r.id));
    }
  };

  const handleSelect = (id: string) => {
    setSelectedRecords((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleBulkAssign = async (agentId: string) => {
    if (selectedRecords.length === 0) return;
    await bulkAssign.mutateAsync({ renewalRecordIds: selectedRecords, agentId });
    setSelectedRecords([]);
  };

  const getDaysRemaining = (expiryDate: string) => {
    const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">متابعة التجديدات</h1>
          <p className="text-gray-500 mt-1">إدارة تجديد اشتراكات الأنشطة التجارية</p>
        </div>
        <button
          onClick={() => generateRenewals.mutate()}
          disabled={generateRenewals.isPending}
          className="btn-primary flex items-center gap-2"
        >
          {generateRenewals.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          إنشاء سجلات التجديد
        </button>
      </div>

      {/* Statistics Cards */}
      {!statsLoading && statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm">بانتظار التواصل</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{statistics.byStatus.pending}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 text-blue-500 mb-2">
              <Phone className="w-4 h-4" />
              <span className="text-sm">تم التواصل</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{statistics.byStatus.contacted}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 text-indigo-500 mb-2">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">تمت الزيارة</span>
            </div>
            <p className="text-2xl font-bold text-indigo-600">{statistics.byStatus.visited}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 text-green-500 mb-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">تم التجديد</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{statistics.byStatus.renewed}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 text-red-500 mb-2">
              <XCircle className="w-4 h-4" />
              <span className="text-sm">رفض التجديد</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{statistics.byStatus.declined}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 text-primary-500 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">نسبة التجديد</span>
            </div>
            <p className="text-2xl font-bold text-primary-600">{statistics.renewalRate}</p>
          </div>
        </div>
      )}

      {/* Follow-ups Today Alert */}
      {statistics && statistics.followUpsToday > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PhoneCall className="w-5 h-5 text-amber-600" />
            <span className="text-amber-800">
              لديك <strong>{statistics.followUpsToday}</strong> متابعة مطلوبة اليوم
            </span>
          </div>
          <button
            onClick={() => {
              setStatusFilter('');
              setPriorityFilter('');
            }}
            className="text-amber-700 hover:text-amber-900 text-sm font-medium"
          >
            عرض الكل
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full px-4 py-3 flex items-center justify-between text-gray-700 hover:bg-gray-50"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span>الفلاتر</span>
          </div>
          {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showFilters && (
          <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-200 pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field"
              >
                <option value="">الكل</option>
                {Object.entries(STATUS_MAP).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المندوب</label>
              <select
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
                className="input-field"
              >
                <option value="">الكل</option>
                <option value="unassigned">غير معين</option>
                {agents.map((agent: any) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.firstName} {agent.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الأولوية</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="input-field"
              >
                <option value="">الكل</option>
                {Object.entries(PRIORITY_MAP).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedRecords.length > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-4 flex items-center justify-between">
          <span className="text-primary-800">
            تم تحديد <strong>{selectedRecords.length}</strong> سجل
          </span>
          <div className="flex items-center gap-2">
            <select
              onChange={(e) => e.target.value && handleBulkAssign(e.target.value)}
              className="input-field !w-auto"
              defaultValue=""
            >
              <option value="">تعيين مندوب...</option>
              {agents.map((agent: any) => (
                <option key={agent.id} value={agent.id}>
                  {agent.firstName} {agent.lastName}
                </option>
              ))}
            </select>
            <button
              onClick={() => setSelectedRecords([])}
              className="btn-secondary"
            >
              إلغاء التحديد
            </button>
          </div>
        </div>
      )}

      {/* Renewals Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : renewals.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <RefreshCw className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>لا توجد سجلات تجديد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-right">
                    <input
                      type="checkbox"
                      checked={selectedRecords.length === renewals.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">النشاط التجاري</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">الباقة</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">تاريخ الانتهاء</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">الأولوية</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">الحالة</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">المندوب</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">المتابعات</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {renewals.map((renewal: any) => {
                  const status = STATUS_MAP[renewal.status] || STATUS_MAP.PENDING;
                  const priority = PRIORITY_MAP[renewal.priority] || PRIORITY_MAP[0];
                  const daysRemaining = getDaysRemaining(renewal.expiryDate);
                  const StatusIcon = status.icon;

                  return (
                    <tr key={renewal.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedRecords.includes(renewal.id)}
                          onChange={() => handleSelect(renewal.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {renewal.business.logo ? (
                            <img
                              src={renewal.business.logo}
                              alt={renewal.business.nameAr}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <Link
                              href={`/businesses/${renewal.businessId}`}
                              className="font-medium text-gray-900 hover:text-primary-600"
                            >
                              {renewal.business.nameAr}
                            </Link>
                            {renewal.business.phone && (
                              <p className="text-sm text-gray-500">{renewal.business.phone}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900">{renewal.currentPackage.nameAr}</span>
                        <p className="text-xs text-gray-500">
                          {Number(renewal.currentPackage.price).toLocaleString('ar-SY')} ل.س
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <p className="text-gray-900">
                            {new Date(renewal.expiryDate).toLocaleDateString('ar-SY')}
                          </p>
                          <p className={`text-xs ${daysRemaining <= 0 ? 'text-red-600 font-bold' : daysRemaining <= 7 ? 'text-orange-600' : 'text-gray-500'}`}>
                            {daysRemaining <= 0 ? 'منتهية' : `${daysRemaining} يوم متبقي`}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${priority.color}`}>
                          {priority.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {renewal.assignedAgent ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                              <User className="w-3 h-3 text-primary-600" />
                            </div>
                            <span className="text-sm text-gray-900">
                              {renewal.assignedAgent.firstName} {renewal.assignedAgent.lastName}
                            </span>
                          </div>
                        ) : (
                          <select
                            onChange={(e) => e.target.value && assignAgent.mutate({ id: renewal.id, agentId: e.target.value })}
                            className="input-field !py-1 !text-sm"
                            defaultValue=""
                          >
                            <option value="">تعيين مندوب</option>
                            {agents.map((agent: any) => (
                              <option key={agent.id} value={agent.id}>
                                {agent.firstName} {agent.lastName}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MessageSquare className="w-4 h-4" />
                          <span>{renewal.followUpCount}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/renewals/${renewal.id}`}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          التفاصيل
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages && meta.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              صفحة {meta.page} من {meta.totalPages} (إجمالي {meta.total} سجل)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary !py-1 !px-3 disabled:opacity-50"
              >
                السابق
              </button>
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages || 1, p + 1))}
                disabled={page === meta.totalPages}
                className="btn-secondary !py-1 !px-3 disabled:opacity-50"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
