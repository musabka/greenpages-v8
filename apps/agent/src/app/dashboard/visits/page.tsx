'use client';

import { useState } from 'react';
import {
  MapPin,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Building2,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  Play,
  Phone,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { useAgentVisits, useCreateVisit, useUpdateVisit, usePackages } from '@/lib/hooks/useFinancial';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const statusOptions = [
  { value: '', label: 'جميع الحالات' },
  { value: 'PLANNED', label: 'مخطط' },
  { value: 'IN_PROGRESS', label: 'جارية' },
  { value: 'COMPLETED', label: 'مكتملة' },
  { value: 'CANCELLED', label: 'ملغية' },
];

const purposeOptions = [
  { value: 'NEW_REGISTRATION', label: 'تسجيل نشاط جديد' },
  { value: 'RENEWAL', label: 'تجديد اشتراك' },
  { value: 'UPDATE_DATA', label: 'تحديث بيانات' },
  { value: 'COMPLAINT', label: 'شكوى' },
  { value: 'SUPPORT', label: 'دعم فني' },
  { value: 'VERIFICATION', label: 'تحقق' },
];

export default function AgentVisitsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const limit = 10;

  const { data, isLoading, isError, refetch } = useAgentVisits({
    page,
    limit,
    status: statusFilter || undefined,
  });

  const createVisit = useCreateVisit();
  const updateVisit = useUpdateVisit();

  const visits = data?.data || [];
  const total = data?.meta?.total || 0;
  const totalPages = data?.meta?.totalPages || 1;

  // Get agent's governorates from profile
  const { data: profile } = useQuery({
    queryKey: ['agent-profile'],
    queryFn: async () => {
      const res = await api.get('/agent-portal/profile');
      return res.data;
    },
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      PLANNED: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'مخطط' },
      IN_PROGRESS: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'جارية' },
      COMPLETED: { bg: 'bg-green-100', text: 'text-green-700', label: 'مكتملة' },
      CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', label: 'ملغية' },
    };
    const style = styles[status] || styles.PLANNED;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    );
  };

  const getPurposeLabel = (purpose: string) => {
    const map: Record<string, string> = {
      NEW_REGISTRATION: 'تسجيل نشاط جديد',
      RENEWAL: 'تجديد اشتراك',
      UPDATE_DATA: 'تحديث بيانات',
      COMPLAINT: 'شكوى',
      SUPPORT: 'دعم فني',
      VERIFICATION: 'تحقق',
    };
    return map[purpose] || purpose;
  };

  const handleStartVisit = async (visit: any) => {
    try {
      await updateVisit.mutateAsync({
        visitId: visit.id,
        status: 'IN_PROGRESS',
      });
      refetch();
    } catch (error) {
      console.error('Error starting visit:', error);
    }
  };

  const handleCompleteVisit = async (visitId: string, outcome: string, notes: string) => {
    try {
      await updateVisit.mutateAsync({
        visitId,
        status: 'COMPLETED',
        outcome,
        notes,
      });
      setShowUpdateModal(false);
      setSelectedVisit(null);
      refetch();
    } catch (error) {
      console.error('Error completing visit:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الزيارات الميدانية</h1>
          <p className="text-gray-500">جدولة ومتابعة الزيارات للأنشطة التجارية</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          جدولة زيارة جديدة
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-500">مخططة</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {visits.filter((v: any) => v.status === 'PLANNED').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Play className="w-5 h-5 text-amber-600" />
            <span className="text-sm text-gray-500">جارية</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {visits.filter((v: any) => v.status === 'IN_PROGRESS').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-500">مكتملة</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {visits.filter((v: any) => v.status === 'COMPLETED').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-500">إجمالي</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{total}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
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
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isError ? (
          <div className="text-center py-12">
            <XCircle className="w-12 h-12 text-red-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">حدث خطأ في تحميل الزيارات</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : visits.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">لا توجد زيارات مسجلة</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-green-600 hover:text-green-700"
            >
              جدولة زيارة جديدة
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      النشاط / الموقع
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      الغرض
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      الموعد
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      الحالة
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      إجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visits.map((visit: any) => (
                    <tr key={visit.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          {visit.business ? (
                            <>
                              <p className="font-medium text-gray-900">
                                {visit.business.nameAr}
                              </p>
                              {visit.business.contacts?.[0]?.value && (
                                <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                  <Phone className="w-3 h-3" />
                                  {visit.business.contacts[0].value}
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <p className="font-medium text-gray-900">
                                {visit.governorate?.nameAr}
                              </p>
                              {visit.city && (
                                <p className="text-sm text-gray-500">
                                  {visit.city.nameAr}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-gray-700">
                          {getPurposeLabel(visit.purpose)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-gray-600">
                        {formatDate(visit.scheduledAt)}
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(visit.status)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {visit.status === 'PLANNED' && (
                            <button
                              onClick={() => handleStartVisit(visit)}
                              disabled={updateVisit.isPending}
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                              <Play className="w-4 h-4" />
                              بدء
                            </button>
                          )}
                          {visit.status === 'IN_PROGRESS' && (
                            <button
                              onClick={() => {
                                setSelectedVisit(visit);
                                setShowUpdateModal(true);
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                              إنهاء
                            </button>
                          )}
                          {visit.status === 'COMPLETED' && visit.outcome && (
                            <span className="text-sm text-gray-500">
                              {visit.outcome}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  صفحة {page} من {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Visit Modal */}
      {showCreateModal && profile && (
        <CreateVisitModal
          governorates={profile.governorates || []}
          onClose={() => setShowCreateModal(false)}
          onSubmit={async (data) => {
            await createVisit.mutateAsync(data);
            setShowCreateModal(false);
            refetch();
          }}
          isLoading={createVisit.isPending}
        />
      )}

      {/* Complete Visit Modal */}
      {showUpdateModal && selectedVisit && (
        <CompleteVisitModal
          visit={selectedVisit}
          onClose={() => {
            setShowUpdateModal(false);
            setSelectedVisit(null);
          }}
          onSubmit={handleCompleteVisit}
          isLoading={updateVisit.isPending}
        />
      )}
    </div>
  );
}

function CreateVisitModal({
  governorates,
  onClose,
  onSubmit,
  isLoading,
}: {
  governorates: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const [purpose, setPurpose] = useState('NEW_REGISTRATION');
  const [governorateId, setGovernorateId] = useState(governorates[0]?.id || '');
  const [scheduledAt, setScheduledAt] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      purpose,
      governorateId,
      scheduledAt: new Date(scheduledAt),
      address,
      notes,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">جدولة زيارة جديدة</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              غرض الزيارة
            </label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            >
              {purposeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              المحافظة
            </label>
            <select
              value={governorateId}
              onChange={(e) => setGovernorateId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            >
              {governorates.map((gov) => (
                <option key={gov.id} value={gov.id}>
                  {gov.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              موعد الزيارة
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              العنوان (اختياري)
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="العنوان التفصيلي"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ملاحظات (اختياري)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              placeholder="ملاحظات إضافية..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isLoading || !scheduledAt || !governorateId}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'جارٍ الحفظ...' : 'جدولة الزيارة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CompleteVisitModal({
  visit,
  onClose,
  onSubmit,
  isLoading,
}: {
  visit: any;
  onClose: () => void;
  onSubmit: (visitId: string, outcome: string, notes: string) => void;
  isLoading: boolean;
}) {
  const [outcome, setOutcome] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(visit.id, outcome, notes);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">إنهاء الزيارة</h2>
          <p className="text-gray-500 text-sm mt-1">
            {visit.business?.nameAr || visit.governorate?.nameAr}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              نتيجة الزيارة
            </label>
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            >
              <option value="">اختر النتيجة</option>
              <option value="تمت بنجاح">تمت بنجاح</option>
              <option value="تم تسجيل نشاط جديد">تم تسجيل نشاط جديد</option>
              <option value="تم تجديد الاشتراك">تم تجديد الاشتراك</option>
              <option value="تم تحصيل المبلغ">تم تحصيل المبلغ</option>
              <option value="العميل غير متواجد">العميل غير متواجد</option>
              <option value="تم التأجيل">تم التأجيل</option>
              <option value="لم تتم">لم تتم</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ملاحظات
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              placeholder="أضف ملاحظاتك عن الزيارة..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isLoading || !outcome}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'جارٍ الحفظ...' : 'إنهاء الزيارة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
