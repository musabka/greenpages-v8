'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { ArrowRightLeft, UserCheck, UserX, History, Loader2, Filter, X } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  previousStatus?: string;
  newStatus?: string;
  changes?: Record<string, any>;
  performedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
}

interface OwnershipAuditListProps {
  businessId: string;
}

export function OwnershipAuditList({ businessId }: OwnershipAuditListProps) {
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const { data: audits, isLoading } = useQuery({
    queryKey: ['business', businessId, 'ownership-audit'],
    queryFn: () =>
      api
        .get<AuditLog[]>(`/businesses/${businessId}/ownership-audit`)
        .then(res => res.data),
  });

  // Filter audits based on action filter
  const filteredAudits = audits?.filter(audit => {
    if (actionFilter === 'all') return true;
    return audit.action === actionFilter;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!audits || audits.length === 0) {
    return (
      <div className="text-center py-8">
        <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">لا يوجد سجل تغييرات لملكية هذا النشاط</p>
      </div>
    );
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'LINKED':
        return <UserCheck className="w-5 h-5 text-green-600" />;
      case 'UNLINKED':
        return <UserX className="w-5 h-5 text-red-600" />;
      case 'STATUS_CHANGED':
        return <ArrowRightLeft className="w-5 h-5 text-blue-600" />;
      default:
        return <History className="w-5 h-5 text-gray-600" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'LINKED':
        return 'ربط مالك';
      case 'UNLINKED':
        return 'فصل مالك';
      case 'STATUS_CHANGED':
        return 'تغيير الحالة';
      case 'VERIFIED':
        return 'توثيق';
      case 'VERIFICATION_REVOKED':
        return 'إلغاء التوثيق';
      default:
        return action;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'unclaimed':
        return 'غير مرتبط';
      case 'claimed':
        return 'مرتبط';
      case 'verified':
        return 'موثّق';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Filter className="w-4 h-4" />
          تصفية ({filteredAudits.length} من {audits.length})
        </button>

        {actionFilter !== 'all' && (
          <button
            onClick={() => setActionFilter('all')}
            className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
          >
            <X className="w-3 h-3" />
            إلغاء التصفية
          </button>
        )}
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            نوع الإجراء
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'الكل' },
              { value: 'LINKED', label: 'ربط مالك' },
              { value: 'UNLINKED', label: 'فصل مالك' },
              { value: 'STATUS_CHANGED', label: 'تغيير الحالة' },
              { value: 'VERIFIED', label: 'توثيق' },
              { value: 'VERIFICATION_REVOKED', label: 'إلغاء التوثيق' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setActionFilter(option.value)}
                className={`px-3 py-1 text-sm rounded-lg border ${
                  actionFilter === option.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Audit List */}
      {filteredAudits.length === 0 ? (
        <div className="text-center py-8">
          <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">لا توجد نتائج للتصفية الحالية</p>
        </div>
      ) : (
        filteredAudits.map((audit) => (
          <div
            key={audit.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex-shrink-0 mt-1">{getActionIcon(audit.action)}</div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold text-gray-900">
                    {getActionLabel(audit.action)}
                  </h4>
                  {audit.previousStatus && audit.newStatus && (
                    <div className="text-xs">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {getStatusLabel(audit.previousStatus)}
                      </span>
                      <span className="mx-1 text-gray-400">→</span>
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {getStatusLabel(audit.newStatus)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Details */}
                {audit.changes && (
                  <div className="text-sm text-gray-600 mb-2">
                    {audit.changes.linkedUser && (
                      <p>المالك: {audit.changes.linkedUser}</p>
                    )}
                    {audit.changes.email && (
                      <p>البريد الإلكتروني: {audit.changes.email}</p>
                    )}
                    {audit.changes.unlinkedUser && (
                      <p>تم فصل: {audit.changes.unlinkedUser}</p>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div>
                    بواسطة{' '}
                    <span className="font-medium text-gray-700">
                      {audit.performedByUser
                        ? `${audit.performedByUser.firstName} ${audit.performedByUser.lastName}`
                        : 'النظام'}
                    </span>
                  </div>
                  <time>
                    {format(new Date(audit.createdAt), 'PPpp', { locale: ar })}
                  </time>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
