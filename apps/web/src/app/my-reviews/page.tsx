"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star, MessageCircle, Clock } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useMyReviews } from "@/lib/hooks";

const statusStyles: Record<string, { label: string; className: string }> = {
  APPROVED: { label: "مقبولة", className: "bg-green-50 text-green-700" },
  PENDING: { label: "قيد المراجعة", className: "bg-amber-50 text-amber-700" },
  REJECTED: { label: "مرفوضة", className: "bg-red-50 text-red-700" },
};

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1 text-amber-500">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`w-4 h-4 ${i <= rating ? "fill-amber-500" : "text-gray-300"}`} />
      ))}
      <span className="text-sm text-gray-600 ms-1">{Number(rating || 0).toFixed(1)}</span>
    </div>
  );
}

export default function MyReviewsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { data, isLoading } = useMyReviews();

  useEffect(() => {
    if (!authLoading && !user) {
      const redirect = encodeURIComponent("/my-reviews");
      router.replace(`/auth/login?redirect=${redirect}`);
    }
  }, [authLoading, user, router]);

  const reviews = data?.data || [];

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">تقييماتي</h1>
          <p className="text-gray-600 mt-1">استعرض وأدر تقييماتك للأنشطة التجارية.</p>
        </div>
      </div>

      {authLoading || isLoading ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 text-gray-500">جاري التحميل...</div>
      ) : reviews.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center text-gray-600">
          لا توجد تقييمات بعد.
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review: any) => {
            const statusInfo = statusStyles[review.status] || { label: review.status, className: "bg-gray-50 text-gray-600" };
            return (
              <div key={review.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-10 h-10 text-primary-500" />
                    <div>
                      <Link href={`/business/${review.business?.slug}`} className="text-lg font-semibold text-gray-900 hover:text-primary-600">
                        {review.business?.nameAr || "نشاط تجاري"}
                      </Link>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        <RatingStars rating={review.rating} />
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${statusInfo.className}`}>{statusInfo.label}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(review.createdAt).toLocaleDateString("ar-SY")}</span>
                  </div>
                </div>

                {review.titleAr && <p className="text-gray-900 mt-3 font-medium">{review.titleAr}</p>}
                {review.contentAr && <p className="text-gray-600 mt-2 leading-relaxed">{review.contentAr}</p>}

                {(review.pros?.length || review.cons?.length) && (
                  <div className="grid md:grid-cols-2 gap-4 mt-4 text-sm">
                    {review.pros?.length ? (
                      <div className="bg-green-50 rounded-xl p-3">
                        <p className="font-semibold text-green-800 mb-1">الإيجابيات</p>
                        <ul className="list-disc list-inside text-green-800 space-y-1">
                          {review.pros.map((p: string, idx: number) => (
                            <li key={idx}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {review.cons?.length ? (
                      <div className="bg-red-50 rounded-xl p-3">
                        <p className="font-semibold text-red-800 mb-1">السلبيات</p>
                        <ul className="list-disc list-inside text-red-800 space-y-1">
                          {review.cons.map((c: string, idx: number) => (
                            <li key={idx}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
