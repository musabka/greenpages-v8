"use client";

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, Star, Loader2, LogIn } from 'lucide-react';
import { useBusinessReviews, useCreateReview } from '@/lib/hooks';
import { useAuth } from '@/components/auth/auth-provider';

interface ReviewsSectionProps {
  businessId: string;
  businessSlug: string;
  businessName: string;
}

export function ReviewsSection({ businessId, businessSlug, businessName }: ReviewsSectionProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data, isLoading, refetch } = useBusinessReviews(businessSlug);
  const createReview = useCreateReview();

  const reviews = useMemo(() => {
    if (!data) return [] as any[];
    if (Array.isArray(data)) return data as any[];
    return (data as any).data || [];
  }, [data]);

  const handleLoginRedirect = () => {
    const currentUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '';
    const redirectUrl = encodeURIComponent(currentUrl);
    router.push(`/auth/login?redirect=${redirectUrl}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setMessage({ type: 'error', text: 'يرجى تسجيل الدخول لإضافة تقييم.' });
      return;
    }
    if (!rating) {
      setMessage({ type: 'error', text: 'الرجاء اختيار التقييم.' });
      return;
    }

    setMessage(null);
    try {
      await createReview.mutateAsync({
        businessId,
        businessSlug,
        rating,
        titleAr: title || undefined,
        contentAr: content || undefined,
      });
      setMessage({ type: 'success', text: 'تم إرسال تقييمك، بانتظار المراجعة.' });
      setTitle('');
      setContent('');
      setRating(5);
      setShowForm(false);
      refetch();
    } catch (err: any) {
      const apiMessage = err?.response?.data?.message;
      setMessage({ type: 'error', text: apiMessage || 'فشل في إرسال التقييم' });
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">التقييمات والآراء</h2>
        {user ? (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="btn btn-primary btn-sm"
          >
            <MessageCircle className="w-4 h-4" />
            {showForm ? 'إغلاق النموذج' : 'أضف تقييمك'}
          </button>
        ) : (
          <button 
            onClick={handleLoginRedirect}
            className="btn btn-outline btn-sm flex items-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            سجل الدخول للتقييم
          </button>
        )}
      </div>

      {message && (
        <div
          className={`mb-4 rounded-lg px-3 py-2 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">التقييم</label>
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => {
                const value = i + 1;
                return (
                  <button
                    type="button"
                    key={value}
                    onClick={() => setRating(value)}
                    className="focus:outline-none"
                    aria-label={`تقييم ${value}`}
                  >
                    <Star
                      className={`w-7 h-7 ${
                        value <= rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'
                      }`}
                    />
                  </button>
                );
              })}
              <span className="text-sm text-gray-600">{rating} / 5</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">عنوان التقييم (اختياري)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              maxLength={120}
              placeholder={`مثال: تجربة رائعة مع ${businessName}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">التفاصيل</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="input min-h-[120px]"
              placeholder="اكتب تجربتك بالتفصيل"
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createReview.isPending}
            >
              {createReview.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                'إرسال التقييم'
              )}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-gray-400 text-center py-8">لا توجد تقييمات بعد</p>
      ) : (
        <div className="space-y-6">
          {reviews.map((review: any) => {
            const name = review.user?.firstName
              ? `${review.user.firstName} ${review.user.lastName || ''}`
              : review.user?.displayName || 'مستخدم';
            return (
              <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-600 font-semibold">
                      {name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{name}</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < (review.rating || 0)
                                ? 'text-amber-500 fill-amber-500'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      {review.createdAt && (
                        <>
                          <span>•</span>
                          <span className="text-xs text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString('ar-SY')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {review.titleAr && (
                  <h5 className="font-medium text-gray-900 mt-3">{review.titleAr}</h5>
                )}
                <p className="text-gray-600 mt-2">{review.contentAr || review.contentEn || review.content}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
