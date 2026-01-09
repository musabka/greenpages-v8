'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/auth-provider';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Star,
  MessageSquare,
  Clock,
  Building2,
  Reply,
  Filter,
  Loader2,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import { api } from '@/lib/api';

export default function BusinessReviewsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [filter, setFilter] = useState<'all' | 'pending' | 'replied'>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      const redirect = encodeURIComponent('/business-reviews');
      router.replace(`/auth/login?redirect=${redirect}`);
    }
  }, [authLoading, user, router]);

  // جلب المراجعات الواردة على أنشطة المستخدم
  const { data, isLoading } = useQuery({
    queryKey: ['business-reviews', filter],
    queryFn: async () => {
      const response = await api.get('/business-portal/reviews', {
        params: { filter, page: 1, limit: 50 },
      });
      return response.data;
    },
    enabled: !!user,
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const reviews = data?.reviews || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للوحة التحكم</span>
          </Link>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                المراجعات الواردة
              </h1>
              <p className="text-gray-600 mt-1">
                المراجعات التي كتبها المستخدمون على أنشطتك التجارية
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              الكل ({data?.pagination?.total || 0})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-orange-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              بانتظار الرد
            </button>
            <button
              onClick={() => setFilter('replied')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'replied'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              تم الرد عليها
            </button>
          </div>
        </div>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              لا توجد مراجعات
            </h3>
            <p className="text-gray-600">
              {filter === 'pending'
                ? 'لا توجد مراجعات بانتظار الرد'
                : filter === 'replied'
                ? 'لا توجد مراجعات تم الرد عليها'
                : 'لم يتم كتابة أي مراجعات على أنشطتك بعد'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review: any) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ReviewCardProps {
  review: any;
}

function ReviewCard({ review }: ReviewCardProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState(review.ownerReply || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReply = async () => {
    if (!replyText.trim()) return;

    setIsSubmitting(true);
    try {
      await api.post(`/business-portal/reviews/${review.id}/reply`, {
        reply: replyText,
      });
      setShowReplyForm(false);
      window.location.reload(); // إعادة تحميل لتحديث البيانات
    } catch (error) {
      alert('فشل في إرسال الرد');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      {/* User Info */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <span className="text-green-700 font-semibold text-lg">
              {review.user?.fullName?.charAt(0) || 'م'}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {review.user?.fullName || 'مستخدم'}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= review.rating
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">
                {new Date(review.createdAt).toLocaleDateString('ar-EG')}
              </span>
            </div>
          </div>
        </div>

        {review.ownerReply && (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
            <CheckCircle className="w-3.5 h-3.5" />
            تم الرد
          </span>
        )}
      </div>

      {/* Review Title */}
      {review.title && (
        <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
      )}

      {/* Review Content */}
      <p className="text-gray-700 mb-4">{review.comment}</p>

      {/* Pros & Cons */}
      {(review.pros || review.cons) && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          {review.pros && (
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-xs font-medium text-green-800 mb-1">
                الإيجابيات
              </p>
              <p className="text-sm text-green-700">{review.pros}</p>
            </div>
          )}
          {review.cons && (
            <div className="p-3 bg-red-50 rounded-lg">
              <p className="text-xs font-medium text-red-800 mb-1">السلبيات</p>
              <p className="text-sm text-red-700">{review.cons}</p>
            </div>
          )}
        </div>
      )}

      {/* Owner Reply */}
      {review.ownerReply ? (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border-r-4 border-blue-500">
          <div className="flex items-center gap-2 mb-2">
            <Reply className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">ردك:</span>
            <span className="text-xs text-blue-600">
              {new Date(review.repliedAt).toLocaleDateString('ar-EG')}
            </span>
          </div>
          <p className="text-blue-900">{review.ownerReply}</p>
        </div>
      ) : (
        <div className="mt-4">
          {showReplyForm ? (
            <div className="space-y-3">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="اكتب ردك على هذه المراجعة..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                rows={3}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReply}
                  disabled={isSubmitting || !replyText.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري الإرسال...</span>
                    </>
                  ) : (
                    <>
                      <Reply className="w-4 h-4" />
                      <span>إرسال الرد</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowReplyForm(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowReplyForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Reply className="w-4 h-4" />
              <span>الرد على المراجعة</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
