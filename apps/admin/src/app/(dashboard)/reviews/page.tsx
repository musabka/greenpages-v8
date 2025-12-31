'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Star,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Trash2,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { useReviews, useDeleteReview, useApproveReview, useRejectReview } from '@/lib/hooks';

const statusConfig = {
  PENDING: { label: 'معلق', class: 'badge-warning', icon: Clock },
  APPROVED: { label: 'مقبول', class: 'badge-success', icon: CheckCircle },
  REJECTED: { label: 'مرفوض', class: 'badge-danger', icon: XCircle },
};

export default function ReviewsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useReviews({
    page,
    limit: 20,
    status: statusFilter || undefined,
  });

  const deleteReview = useDeleteReview();
  const approveReview = useApproveReview();
  const rejectReview = useRejectReview();

  const reviews = data?.data ?? [];

  const handleApprove = async (id: string) => {
    try {
      await approveReview.mutateAsync(id);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectReview.mutateAsync(id);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا التقييم؟')) {
      try {
        await deleteReview.mutateAsync(id);
      } catch (error) {
        // Error handled in hook
      }
    }
  };

  const filteredReviews = reviews.filter((review: any) => {
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      if (
        !review.business?.nameAr?.includes(search) &&
        !(review.user?.firstName || review.user?.displayName)?.toLowerCase()?.includes(search) &&
        !(review.contentAr || review.contentEn || review.comment)?.toLowerCase?.()?.includes(search)
      ) {
        return false;
      }
    }
    if (ratingFilter && review.rating !== parseInt(ratingFilter)) return false;
    return true;
  });

  const pendingCount = reviews.filter((r: any) => r.status === 'PENDING').length;
  const approvedCount = reviews.filter((r: any) => r.status === 'APPROVED').length;
  const rejectedCount = reviews.filter((r: any) => r.status === 'REJECTED').length;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">التقييمات</h1>
          <p className="text-gray-500 mt-1">إدارة ومراجعة تقييمات الأنشطة التجارية</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-card-icon bg-primary-100 text-primary-600">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <p className="stat-card-value">{reviews.length}</p>
              <p className="stat-card-label">إجمالي التقييمات</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-card-icon bg-amber-100 text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="stat-card-value">{pendingCount}</p>
              <p className="stat-card-label">بانتظار المراجعة</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-card-icon bg-green-100 text-green-600">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="stat-card-value">{approvedCount}</p>
              <p className="stat-card-label">مقبولة</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-card-icon bg-red-100 text-red-600">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="stat-card-value">{rejectedCount}</p>
              <p className="stat-card-label">مرفوضة</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="البحث في التقييمات..."
                  className="input pr-10"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select w-40"
            >
              <option value="">كل الحالات</option>
              <option value="PENDING">معلق</option>
              <option value="APPROVED">مقبول</option>
              <option value="REJECTED">مرفوض</option>
            </select>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="select w-40"
            >
              <option value="">كل التقييمات</option>
              <option value="5">5 نجوم</option>
              <option value="4">4 نجوم</option>
              <option value="3">3 نجوم</option>
              <option value="2">2 نجوم</option>
              <option value="1">1 نجمة</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">لا توجد تقييمات</p>
        </div>
      ) : (
      <div className="space-y-4">
        {filteredReviews.map((review: any) => {
          const StatusIcon = statusConfig[review.status as keyof typeof statusConfig]?.icon ?? Clock;
          const userName = review.user?.firstName
            ? `${review.user.firstName} ${review.user.lastName || ''}`
            : review.user?.displayName || 'مستخدم';
          return (
            <div key={review.id} className="card">
              <div className="card-body">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <span className="text-gray-600 font-medium text-lg">
                      {userName.charAt(0)}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-2">
                      <span className="font-medium text-gray-900">{userName}</span>
                      <span className="text-gray-400">•</span>
                      <Link
                        href={`/businesses/${review.business?.slug || review.businessId}`}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        {review.business?.nameAr || 'نشاط تجاري'}
                      </Link>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-500">
                        {review.createdAt ? new Date(review.createdAt).toLocaleDateString('ar-SY') : '-'}
                      </span>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < (review.rating ?? 0)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Comment */}
                    <p className="text-gray-700 mb-3">{review.contentAr || review.contentEn || review.comment || '-'}</p>

                    {/* Reply */}
                    {(review.replyAr || review.replyEn || review.reply) && (
                      <div className="bg-gray-50 rounded-lg p-3 mt-3">
                        <p className="text-sm text-gray-500 mb-1">رد صاحب النشاط:</p>
                        <p className="text-gray-700">{review.replyAr || review.replyEn || review.reply}</p>
                      </div>
                    )}
                  </div>

                  {/* Status & Actions */}
                  <div className="flex flex-col items-end gap-3">
                    <span
                      className={`badge ${
                        statusConfig[review.status as keyof typeof statusConfig]?.class ?? 'badge-gray'
                      }`}
                    >
                      <StatusIcon className="w-3 h-3 ml-1" />
                      {statusConfig[review.status as keyof typeof statusConfig]?.label ?? review.status}
                    </span>

                    <div className="flex items-center gap-1">
                      {review.status === 'PENDING' && (
                        <>
                          <button
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="قبول"
                            onClick={() => handleApprove(review.id)}
                            disabled={approveReview.isPending}
                          >
                            <ThumbsUp className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="رفض"
                            onClick={() => handleReject(review.id)}
                            disabled={rejectReview.isPending}
                          >
                            <ThumbsDown className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <Link
                        href={`/business/${review.business?.slug || review.businessId}`}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="عرض النشاط"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="حذف"
                        onClick={() => handleDelete(review.id)}
                        disabled={deleteReview.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
