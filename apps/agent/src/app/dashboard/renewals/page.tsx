'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Building2,
  CheckCircle,
  Clock,
  XCircle,
  Phone,
  MapPin,
  AlertTriangle,
  MessageCircle,
  Eye,
} from 'lucide-react';
import { useAgentRenewals, useRecordRenewalVisit, usePackages } from '@/lib/hooks/useFinancial';

const statusOptions = [
  { value: '', label: 'جميع الحالات' },
  { value: 'PENDING', label: 'معلق' },
  { value: 'CONTACTED', label: 'تم التواصل' },
  { value: 'VISIT_SCHEDULED', label: 'زيارة مجدولة' },
  { value: 'RENEWED', label: 'تم التجديد' },
  { value: 'DECLINED', label: 'رفض التجديد' },
  { value: 'EXPIRED', label: 'منتهي' },
];

export default function AgentRenewalsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedRenewal, setSelectedRenewal] = useState<any>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const limit = 10;

  const { data, isLoading, isError, refetch } = useAgentRenewals({
    page,
    limit,
    status: statusFilter || undefined,
  });

  const { data: packages } = usePackages();
  const recordVisit = useRecordRenewalVisit();

  const renewals = data?.data || [];
  const total = data?.meta?.total || 0;
  const totalPages = data?.meta?.totalPages || 1;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysRemaining = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'معلق' },
      CONTACTED: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'تم التواصل' },
      VISIT_SCHEDULED: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'زيارة مجدولة' },
      RENEWED: { bg: 'bg-green-100', text: 'text-green-700', label: 'تم التجديد' },
      DECLINED: { bg: 'bg-red-100', text: 'text-red-700', label: 'رفض التجديد' },
      EXPIRED: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'منتهي' },
    };
    const style = styles[status] || styles.PENDING;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    );
  };

  const getPriorityBadge = (priority: number) => {
    if (priority >= 3) {
      return (
        <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <AlertTriangle className="w-3 h-3" /> حرج
        </span>
      );
    }
    if (priority >= 2) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
          عاجل
        </span>
      );
    }
    if (priority >= 1) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
          متوسط
        </span>
      );
    }
    return null;
  };

  const handleRecordVisit = async (outcome: 'ACCEPTED' | 'DECLINED' | 'POSTPONED' | 'NOT_AVAILABLE', notes: string, newPackageId?: string, nextVisitDate?: string) => {
    if (!selectedRenewal) return;
    
    try {
      await recordVisit.mutateAsync({
        renewalId: selectedRenewal.id,
        outcome,
        notes,
        newPackageId,
        nextVisitDate,
      });
      setShowActionModal(false);
      setSelectedRenewal(null);
      refetch();
    } catch (error) {
      console.error('Error recording visit:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">التجديدات</h1>
          <p className="text-gray-500">متابعة تجديدات الاشتراكات المخصصة لك</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            إجمالي: {total} تجديد
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <span className="text-sm text-gray-500">معلقة</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {renewals.filter((r: any) => r.status === 'PENDING').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-sm text-gray-500">عاجلة</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {renewals.filter((r: any) => r.priority >= 2).length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-500">مكتملة</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {renewals.filter((r: any) => r.status === 'RENEWED').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-5 h-5 text-gray-600" />
            <span className="text-sm text-gray-500">مرفوضة</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {renewals.filter((r: any) => r.status === 'DECLINED').length}
          </p>
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
            <p className="text-gray-500 mb-4">حدث خطأ في تحميل التجديدات</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : renewals.length === 0 ? (
          <div className="text-center py-12">
            <RefreshCw className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد تجديدات مخصصة لك حالياً</p>
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
                      الباقة الحالية
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      تاريخ الانتهاء
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      الأولوية
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
                  {renewals.map((renewal: any) => {
                    const daysRemaining = getDaysRemaining(renewal.expiryDate);
                    return (
                      <tr key={renewal.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {renewal.business?.nameAr || '-'}
                            </p>
                            {renewal.business?.contacts?.[0]?.value && (
                              <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                <Phone className="w-3 h-3" />
                                {renewal.business.contacts[0].value}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-gray-600">
                          {renewal.currentPackage?.nameAr || '-'}
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <p className="text-gray-900">{formatDate(renewal.expiryDate)}</p>
                            <p className={`text-xs mt-1 ${daysRemaining <= 3 ? 'text-red-600 font-semibold' : daysRemaining <= 7 ? 'text-amber-600' : 'text-gray-500'}`}>
                              {daysRemaining > 0 ? `متبقي ${daysRemaining} يوم` : daysRemaining === 0 ? 'ينتهي اليوم' : `انتهى منذ ${Math.abs(daysRemaining)} يوم`}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {getPriorityBadge(renewal.priority)}
                        </td>
                        <td className="px-4 py-4">
                          {getStatusBadge(renewal.status)}
                        </td>
                        <td className="px-4 py-4">
                          {renewal.status === 'PENDING' || renewal.status === 'CONTACTED' || renewal.status === 'VISIT_SCHEDULED' ? (
                            <button
                              onClick={() => {
                                setSelectedRenewal(renewal);
                                setShowActionModal(true);
                              }}
                              className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                            >
                              تسجيل نتيجة
                            </button>
                          ) : (
                            <Link
                              href={`/dashboard/businesses/${renewal.businessId}`}
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                            >
                              <Eye className="w-4 h-4" />
                              عرض
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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

      {/* Record Visit Modal */}
      {showActionModal && selectedRenewal && (
        <RecordVisitModal
          renewal={selectedRenewal}
          packages={packages || []}
          onClose={() => {
            setShowActionModal(false);
            setSelectedRenewal(null);
          }}
          onSubmit={handleRecordVisit}
          isLoading={recordVisit.isPending}
        />
      )}
    </div>
  );
}

function RecordVisitModal({
  renewal,
  packages,
  onClose,
  onSubmit,
  isLoading,
}: {
  renewal: any;
  packages: any[];
  onClose: () => void;
  onSubmit: (outcome: 'ACCEPTED' | 'DECLINED' | 'POSTPONED' | 'NOT_AVAILABLE', notes: string, newPackageId?: string, nextVisitDate?: string) => void;
  isLoading: boolean;
}) {
  const [outcome, setOutcome] = useState<'ACCEPTED' | 'DECLINED' | 'POSTPONED' | 'NOT_AVAILABLE'>('ACCEPTED');
  const [notes, setNotes] = useState('');
  const [newPackageId, setNewPackageId] = useState(renewal.currentPackage?.id || '');
  const [nextVisitDate, setNextVisitDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(
      outcome,
      notes,
      outcome === 'ACCEPTED' ? newPackageId : undefined,
      outcome === 'POSTPONED' ? nextVisitDate : undefined
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">تسجيل نتيجة الزيارة</h2>
          <p className="text-gray-500 text-sm mt-1">
            {renewal.business?.nameAr}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              نتيجة الزيارة
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOutcome('ACCEPTED')}
                className={`p-3 rounded-lg border-2 text-center transition-colors ${
                  outcome === 'ACCEPTED'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CheckCircle className="w-6 h-6 mx-auto mb-1" />
                <span className="text-sm font-medium">وافق على التجديد</span>
              </button>
              <button
                type="button"
                onClick={() => setOutcome('DECLINED')}
                className={`p-3 rounded-lg border-2 text-center transition-colors ${
                  outcome === 'DECLINED'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <XCircle className="w-6 h-6 mx-auto mb-1" />
                <span className="text-sm font-medium">رفض التجديد</span>
              </button>
              <button
                type="button"
                onClick={() => setOutcome('POSTPONED')}
                className={`p-3 rounded-lg border-2 text-center transition-colors ${
                  outcome === 'POSTPONED'
                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Clock className="w-6 h-6 mx-auto mb-1" />
                <span className="text-sm font-medium">تأجيل</span>
              </button>
              <button
                type="button"
                onClick={() => setOutcome('NOT_AVAILABLE')}
                className={`p-3 rounded-lg border-2 text-center transition-colors ${
                  outcome === 'NOT_AVAILABLE'
                    ? 'border-gray-500 bg-gray-50 text-gray-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <MapPin className="w-6 h-6 mx-auto mb-1" />
                <span className="text-sm font-medium">غير متواجد</span>
              </button>
            </div>
          </div>

          {outcome === 'ACCEPTED' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الباقة الجديدة
              </label>
              <select
                value={newPackageId}
                onChange={(e) => setNewPackageId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                <option value="">اختر الباقة</option>
                {packages.map((pkg: any) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.nameAr} - {Number(pkg.price).toLocaleString()} ل.س
                  </option>
                ))}
              </select>
            </div>
          )}

          {outcome === 'POSTPONED' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                موعد الزيارة القادمة
              </label>
              <input
                type="date"
                value={nextVisitDate}
                onChange={(e) => setNextVisitDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ملاحظات
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              placeholder="أضف ملاحظاتك هنا..."
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
              disabled={isLoading || (outcome === 'ACCEPTED' && !newPackageId) || (outcome === 'POSTPONED' && !nextVisitDate)}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'جارٍ الحفظ...' : 'حفظ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
