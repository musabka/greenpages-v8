'use client';

import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowUpRight,
  ArrowUpCircle,
  ArrowDownCircle,
  MessageSquare,
  Star,
  Building2,
  DollarSign,
  Eye,
  TrendingUp,
  FileText,
  CreditCard,
  User,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

type Review = {
  id: string;
  rating: number;
  comment?: string;
  status?: string;
  createdAt?: string;
};

type BusinessCapability = {
  businessId: string;
  role: string;
  business: {
    id: string;
    nameAr: string;
    nameEn?: string;
    slug: string;
    logo?: string;
    status: string;
  };
};

type BusinessStats = {
  viewsToday?: number;
  viewsTotal?: number;
};

type Subscription = {
  status?: string;
  packageName?: string;
  expiresAt?: string | null;
  daysRemaining?: number | null;
};

type FinancialSummary = {
  totalSpent: number;
  paymentsCount: number;
  currentPackage?: {
    name: string;
    daysRemaining?: number | null;
  };
};

const statusStyles: Record<string, string> = {
  APPROVED: 'bg-green-100 text-green-700',
  PENDING: 'bg-amber-100 text-amber-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const SkeletonCard = () => (
  <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm animate-pulse">
    <div className="h-4 w-24 bg-gray-200 rounded" />
    <div className="mt-3 h-7 w-16 bg-gray-200 rounded" />
    <div className="mt-2 h-4 w-20 bg-gray-200 rounded" />
  </div>
);

const SkeletonList = () => (
  <div className="space-y-3">
    {Array.from({ length: 3 }).map((_, idx) => (
      <div key={idx} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm animate-pulse">
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="mt-2 h-3 w-24 bg-gray-200 rounded" />
      </div>
    ))}
  </div>
);

export default function UserDashboardPage() {
  // Fetch wallet balance
  const walletQuery = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: async () => {
      const response = await api.get('/wallet/balance');
      return response.data;
    },
    staleTime: 30_000,
    retry: 1,
  });

  // Fetch user's business capabilities
  const capabilitiesQuery = useQuery({
    queryKey: ['my-capabilities'],
    queryFn: async () => {
      const response = await api.get('/capabilities/my-capabilities');
      return response.data.data as BusinessCapability[];
    },
    staleTime: 60_000,
    retry: 1,
  });

  // Fetch user reviews
  const reviewsQuery = useQuery({
    queryKey: ['me', 'reviews'],
    queryFn: async () => (await api.get('/reviews/me')).data as Review[],
    staleTime: 60_000,
    retry: 1,
  });

  const reviews = reviewsQuery.data ?? [];
  const reviewCount = reviews.length;
  const reviewAverage = reviewCount
    ? reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviewCount
    : 0;

  // Check if user has business capabilities
  const capabilities = capabilitiesQuery.data ?? [];
  const hasBusinessCapabilities = capabilities.length > 0;
  const primaryBusiness = capabilities[0]; // الأولوية للنشاط الأول

  // Try to fetch business stats (only if user has capabilities)
  const businessStatsQuery = useQuery({
    queryKey: ['business-portal-stats', primaryBusiness?.businessId],
    queryFn: async () => (await api.get('/business-portal/dashboard')).data as BusinessStats,
    staleTime: 60_000,
    retry: 1,
    throwOnError: false,
    enabled: !!primaryBusiness,
  });

  // Try to fetch business subscription
  const businessSubscriptionQuery = useQuery({
    queryKey: ['business-portal-subscription', primaryBusiness?.businessId],
    queryFn: async () => (await api.get('/business-portal/subscription')).data as Subscription,
    staleTime: 60_000,
    retry: 1,
    throwOnError: false,
    enabled: !!primaryBusiness,
  });

  // Try to fetch business financial data
  const businessFinancialQuery = useQuery({
    queryKey: ['business-portal-financial', primaryBusiness?.businessId],
    queryFn: async () => {
      const response = await api.get('/business-portal/financial');
      return response.data.summary as FinancialSummary;
    },
    staleTime: 60_000,
    retry: 1,
    throwOnError: false,
    enabled: !!primaryBusiness,
  });

  const renderStatus = (status?: string) => {
    if (!status) return <span className="text-xs text-gray-500">غير محدد</span>;
    const style = statusStyles[status] || 'bg-gray-100 text-gray-700';
    return (
      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${style}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم</h1>
            <p className="text-gray-500 mt-1">
              {hasBusinessCapabilities ? 'إدارة أنشطتك التجارية وحسابك الشخصي' : 'إدارة حسابك ومراجعاتك'}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">تعديل الملف الشخصي</span>
            </Link>
            {hasBusinessCapabilities && (
              <Link
                href="/dashboard/my-businesses"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: 'var(--color-primary, #16a34a)' }}
              >
                <Building2 className="w-4 h-4" />
                <span className="text-sm font-medium">إدارة الأنشطة</span>
              </Link>
            )}
          </div>
        </div>

        {/* Business Owner Section */}
        {hasBusinessCapabilities && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
              <div className="p-2 rounded-lg bg-green-100">
                <Building2 className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">إحصائيات الأنشطة التجارية</h2>
            </div>

            {/* Business Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {businessStatsQuery.isLoading ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : (
                <>
                  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 font-medium">مشاهدات اليوم</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          {(businessStatsQuery.data?.viewsToday || 0).toLocaleString('ar-EG')}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">عدد الزيارات اليوم</p>
                      </div>
                      <div className="p-4 rounded-xl bg-blue-50">
                        <Eye className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 font-medium">إجمالي المشاهدات</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          {(businessStatsQuery.data?.viewsTotal || 0).toLocaleString('ar-EG')}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">منذ إنشاء النشاط</p>
                      </div>
                      <div className="p-4 rounded-xl bg-green-50">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 font-medium">إجمالي المصروفات</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          {(businessFinancialQuery.data?.totalSpent || 0).toLocaleString('ar-EG')}
                          <span className="text-base text-gray-500 mr-1">ل.س</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-1">الاشتراكات والإعلانات</p>
                      </div>
                      <div className="p-4 rounded-xl bg-purple-50">
                        <DollarSign className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 font-medium">عدد المدفوعات</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          {businessFinancialQuery.data?.paymentsCount || 0}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">العمليات المالية</p>
                      </div>
                      <div className="p-4 rounded-xl bg-amber-50">
                        <FileText className="w-6 h-6 text-amber-600" />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Business Subscription */}
            {!businessSubscriptionQuery.isLoading && businessSubscriptionQuery.data && (
              <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-cyan-50 to-blue-50 p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-xl bg-white shadow-sm">
                      <CreditCard className="w-6 h-6 text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">الباقة الحالية</p>
                      <p className="text-xl font-bold text-gray-900 mt-1">
                        {businessSubscriptionQuery.data.packageName || 'غير متاح'}
                      </p>
                      {businessSubscriptionQuery.data.daysRemaining != null && (
                        <p className="text-sm text-gray-600 mt-1">
                          {businessSubscriptionQuery.data.daysRemaining > 0
                            ? `${businessSubscriptionQuery.data.daysRemaining} يوم متبقي`
                            : 'منتهية'}
                        </p>
                      )}
                    </div>
                  </div>
                  <Link
                    href="/dashboard/my-businesses"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-700 hover:to-blue-700 transition-all shadow-md"
                  >
                    <Building2 className="w-4 h-4" />
                    <span className="text-sm font-medium">إدارة الاشتراكات</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
        {/* Wallet Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
            <div className="p-2 rounded-lg bg-emerald-100">
              <Wallet className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">محفظتي</h2>
          </div>

          {/* Wallet Balance */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {walletQuery.isLoading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : walletQuery.isError ? (
              <div className="col-span-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm">المحفظة غير متاحة حالياً</span>
                </div>
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-emerald-50 to-green-50 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-emerald-700 font-medium">الرصيد المتاح</p>
                      <p className="text-3xl font-bold text-emerald-900 mt-2">
                        {(walletQuery.data?.availableBalance || 0).toLocaleString('ar-SY')}
                      </p>
                      <p className="text-xs text-emerald-600 mt-1">ليرة سورية</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white shadow-sm">
                      <Wallet className="w-6 h-6 text-emerald-600" />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 font-medium">إجمالي الإيداعات</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {(walletQuery.data?.totalDeposits || 0).toLocaleString('ar-SY')}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">ليرة سورية</p>
                    </div>
                    <div className="p-4 rounded-xl bg-blue-50">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 font-medium">إجمالي المصروفات</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {(walletQuery.data?.totalSpent || 0).toLocaleString('ar-SY')}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">ليرة سورية</p>
                    </div>
                    <div className="p-4 rounded-xl bg-orange-50">
                      <CreditCard className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Wallet Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link
              href="/dashboard/wallet"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all shadow-sm"
            >
              <Wallet className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-medium text-gray-700">المحفظة</span>
            </Link>
            <Link
              href="/dashboard/wallet/top-up"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all shadow-sm"
            >
              <ArrowUpCircle className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">شحن</span>
            </Link>
            <Link
              href="/dashboard/wallet/withdraw"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white border border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all shadow-sm"
            >
              <ArrowDownCircle className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium text-gray-700">سحب</span>
            </Link>
            <Link
              href="/dashboard/wallet/pay"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white border border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all shadow-sm"
            >
              <CreditCard className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">دفع</span>
            </Link>
          </div>
        </div>
        {/* User Reviews Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
            <div className="p-2 rounded-lg bg-yellow-100">
              <MessageSquare className="w-5 h-5 text-yellow-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">مراجعاتي</h2>
          </div>

          {/* Reviews Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviewsQuery.isLoading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : (
              <>
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 font-medium">عدد المراجعات</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{reviewCount}</p>
                      <p className="text-xs text-gray-400 mt-1">تقييماتك على الأنشطة</p>
                    </div>
                    <div className="p-4 rounded-xl bg-blue-50">
                      <MessageSquare className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 font-medium">متوسط التقييم</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {reviewAverage.toFixed(1)} 
                        <span className="text-base text-gray-400 mr-1">/5</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">متوسط تقييماتك</p>
                    </div>
                    <div className="p-4 rounded-xl bg-yellow-50">
                      <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Reviews List */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">آخر المراجعات</h3>
                <p className="text-sm text-gray-500 mt-1">حالة وتفاصيل مراجعاتك</p>
              </div>
              {reviewCount > 0 && (
                <Link 
                  href="/my-reviews" 
                  className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                >
                  عرض الكل ({reviewCount})
                </Link>
              )}
            </div>

            {reviewsQuery.isLoading && <SkeletonList />}

            {reviewsQuery.isError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm">تعذر تحميل المراجعات</span>
                </div>
                <button
                  onClick={() => reviewsQuery.refetch()}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 transition-colors"
                >
                  إعادة المحاولة
                </button>
              </div>
            )}

            {!reviewsQuery.isLoading && !reviewsQuery.isError && reviews.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">لم تقم بكتابة أي مراجعات بعد</p>
                <Link 
                  href="/search"
                  className="inline-block mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  ابحث عن الأنشطة التجارية
                </Link>
              </div>
            )}

            {!reviewsQuery.isLoading && !reviewsQuery.isError && reviews.length > 0 && (
              <div className="space-y-3">
                {reviews.slice(0, 5).map((review) => (
                  <div
                    key={review.id}
                    className="rounded-lg border border-gray-100 bg-gray-50 p-4 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{review.rating}.0</span>
                      </div>
                      {renderStatus(review.status)}
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-700 mt-2 line-clamp-2">{review.comment}</p>
                    )}
                    {review.createdAt && (
                      <p className="text-xs text-gray-500 mt-3">
                        {new Date(review.createdAt).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
