'use client';

import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  Building2,
  Wallet as WalletIcon,
  MessageSquare,
  TrendingUp,
  Eye,
  Star,
  User,
  FileText,
  Receipt,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { WalletCard } from './components/WalletCard';
import { BusinessStatsCard } from './components/BusinessStatsCard';
import { AlertsCard } from './components/AlertsCard';
import { PackageInfoCard } from './components/PackageInfoCard';




export default function UserDashboardPage() {
  // Fetch dashboard summary (all-in-one)
  const dashboardQuery = useQuery({
    queryKey: ['user-dashboard-summary'],
    queryFn: async () => {
      const response = await api.get('/user/dashboard/summary');
      return response.data;
    },
    staleTime: 30_000,
    retry: 1,
  });

  // Fetch business stats if user has businesses
  const businessStatsQuery = useQuery({
    queryKey: ['user-business-stats'],
    queryFn: async () => {
      const response = await api.get('/user/dashboard/business-stats');
      return response.data;
    },
    staleTime: 60_000,
    retry: 1,
    enabled: !!dashboardQuery.data?.hasBusinessAccess,
  });

  // Fetch packages details if user has businesses
  const packagesQuery = useQuery({
    queryKey: ['user-packages-details'],
    queryFn: async () => {
      const response = await api.get('/user/dashboard/packages-details');
      return response.data;
    },
    staleTime: 60_000,
    retry: 1,
    enabled: !!dashboardQuery.data?.hasBusinessAccess,
  });

  const data = dashboardQuery.data;
  const hasBusinessAccess = data?.hasBusinessAccess || false;
  const user = data?.user;
  const wallet = data?.wallet;
  const capabilities = data?.businessCapabilities || [];

  // Loading state
  if (dashboardQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (dashboardQuery.isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
            خطأ في تحميل البيانات
          </h2>
          <p className="text-gray-600 text-center mb-4">
            حدث خطأ أثناء تحميل لوحة التحكم. يرجى المحاولة مرة أخرى.
          </p>
          <button
            onClick={() => dashboardQuery.refetch()}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                مرحباً، {user?.firstName} {user?.lastName}
              </h1>
              <div className="flex items-center gap-2 mt-2 text-gray-600">
                {user?.governorate && (
                  <>
                    <span>{user.governorate.nameAr}</span>
                    {user.city && (
                      <>
                        <span>•</span>
                        <span>{user.city.nameAr}</span>
                      </>
                    )}
                    {user.district && (
                      <>
                        <span>•</span>
                        <span>{user.district.nameAr}</span>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Quick Action - تعديل الملف الشخصي */}
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">تعديل الملف</span>
            </Link>
          </div>
        </div>

        {/* Alerts Section */}
        {hasBusinessAccess && capabilities.length > 0 && (
          <AlertsCard capabilities={capabilities} />
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Wallet Card */}
          <WalletCard wallet={wallet} hasBusinessAccess={hasBusinessAccess} />

          {/* Stats Cards - Only if user has businesses */}
          {hasBusinessAccess && (
            <>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">
                      مشاهدات اليوم
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {businessStatsQuery.data?.viewsToday || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50">
                    <Eye className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500">لجميع أنشطتك التجارية</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">
                      إجمالي المشاهدات
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {businessStatsQuery.data?.viewsTotal || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-50">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500">منذ إنشاء الأنشطة</p>
              </div>
            </>
          )}

          {/* Reviews Card - if user doesn't have businesses */}
          {!hasBusinessAccess && (
            <>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">
                      عدد مراجعاتي
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {data?.reviews?.count || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-yellow-50">
                    <MessageSquare className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500">مراجعاتك على الأنشطة</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">
                      متوسط التقييم
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {Number(data?.reviews?.averageRating || 0).toFixed(1)}
                      <span className="text-base text-gray-400 mr-1">/5</span>
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-orange-50">
                    <Star className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(data?.reviews?.averageRating || 0)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Business Capabilities Section */}
        {hasBusinessAccess && capabilities.length > 0 && (
          <BusinessStatsCard capabilities={capabilities} />
        )}

        {/* Packages Information Section - for business owners */}
        {hasBusinessAccess && packagesQuery.data && packagesQuery.data.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">باقات أنشطتي التجارية</h2>
              <Link
                href="/dashboard/packages"
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                عرض جميع الباقات المتاحة
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packagesQuery.data.map((packageDetail: any) => (
                <PackageInfoCard
                  key={packageDetail.business.id}
                  packageDetails={packageDetail}
                />
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section - for all users */}
        {data?.reviews && data.reviews.count > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">مراجعاتي</h2>
              <Link
                href="/my-reviews"
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                عرض الكل ({data.reviews.count})
              </Link>
            </div>
            <p className="text-gray-600 text-sm">
              لديك {data.reviews.count} مراجعة بمتوسط {Number(data.reviews.averageRating || 0).toFixed(1)} نجوم
            </p>
          </div>
        )}

        {/* Quick Links Section - فواتيري والمزيد */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* رابط الفواتير */}
          <Link
            href="/dashboard/invoices"
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:border-green-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors">
                    <Receipt className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">فواتيري</h3>
                </div>
                <p className="text-sm text-gray-500">
                  عرض وتنزيل فواتير الاشتراكات والمدفوعات
                </p>
              </div>
              <FileText className="w-8 h-8 text-gray-300 group-hover:text-green-500 transition-colors" />
            </div>
          </Link>
        </div>


      </div>
    </div>
  );
}

