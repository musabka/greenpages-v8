'use client';

import Link from 'next/link';
import {
  Building2,
  Users,
  Star,
  Eye,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useDashboardStats, usePendingBusinesses, usePendingReviews } from '@/lib/hooks';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString('ar-SY');
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: pendingBusinesses, isLoading: businessesLoading } = usePendingBusinesses(5);
  const { data: pendingReviews, isLoading: reviewsLoading } = usePendingReviews(5);
  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['dashboard', 'recent-activity'],
    queryFn: () => dashboardApi.getRecentActivity(5).then((res) => res.data),
  });

  const statsCards = [
    {
      title: 'الأنشطة التجارية',
      value: stats?.businesses.total ?? 0,
      pending: stats?.businesses.pending ?? 0,
      icon: Building2,
      color: 'bg-primary-100 text-primary-600',
      href: '/businesses',
    },
    {
      title: 'المستخدمين',
      value: stats?.users.total ?? 0,
      active: stats?.users.active ?? 0,
      icon: Users,
      color: 'bg-blue-100 text-blue-600',
      href: '/users',
    },
    {
      title: 'التقييمات',
      value: stats?.reviews.total ?? 0,
      pending: stats?.reviews.pending ?? 0,
      icon: Star,
      color: 'bg-amber-100 text-amber-600',
      href: '/reviews',
    },
    {
      title: 'المشاهدات',
      value: stats?.views.total ?? 0,
      today: stats?.views.today ?? 0,
      icon: Eye,
      color: 'bg-purple-100 text-purple-600',
      href: '#',
    },
  ];
  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">لوحة التحكم</h1>
          <p className="text-gray-500 mt-1">نظرة عامة على نشاط المنصة</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsLoading ? (
          <div className="col-span-4 flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : (
          statsCards.map((stat) => (
            <Link
              key={stat.title}
              href={stat.href}
              className="stat-card hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between">
                <div className={`stat-card-icon ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <ArrowUpRight className="w-5 h-5 text-gray-300 group-hover:text-primary-500 transition-colors" />
              </div>
              <div className="mt-4">
                <p className="stat-card-value">{formatNumber(stat.value)}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="stat-card-label">{stat.title}</p>
                  {'pending' in stat && (stat.pending ?? 0) > 0 && (
                    <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                      {stat.pending} معلق
                    </span>
                  )}
                  {'active' in stat && (
                    <span className="text-xs font-medium text-green-600">
                      {stat.active} نشط
                    </span>
                  )}
                  {'today' in stat && (
                    <span className="text-xs font-medium text-purple-600">
                      {formatNumber(stat.today ?? 0)} اليوم
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pending Businesses */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                <h2 className="font-bold text-gray-900">أنشطة بانتظار المراجعة</h2>
                <span className="badge badge-warning">{pendingBusinesses?.length ?? 0}</span>
              </div>
              <Link href="/businesses?status=pending" className="text-sm text-primary-600 hover:text-primary-700">
                عرض الكل
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {businessesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                </div>
              ) : pendingBusinesses?.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  لا توجد أنشطة بانتظار المراجعة
                </div>
              ) : (
                pendingBusinesses?.map((business: any) => (
                  <div key={business.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <h3 className="font-medium text-gray-900">{business.nameAr}</h3>
                      <p className="text-sm text-gray-500">
                        {(business.categories?.find?.((c: any) => c?.isPrimary)?.category?.nameAr ||
                          business.categories?.[0]?.category?.nameAr ||
                          business.category?.nameAr ||
                          '—')}{' '}
                        • {business.city?.nameAr ?? business.governorate?.nameAr}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-bold text-gray-900">النشاط الأخير</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {activityLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
              </div>
            ) : recentActivity?.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                لا يوجد نشاط حديث
              </div>
            ) : (
              recentActivity?.map((activity: any) => (
                <div key={activity.id} className="px-6 py-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        activity.type === 'approve'
                          ? 'bg-green-100 text-green-600'
                          : activity.type === 'reject'
                          ? 'bg-red-100 text-red-600'
                          : activity.type === 'business'
                          ? 'bg-primary-100 text-primary-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {activity.type === 'approve' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : activity.type === 'reject' ? (
                        <XCircle className="w-4 h-4" />
                      ) : activity.type === 'business' ? (
                        <Building2 className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-600">
                        {activity.action}{' '}
                        <span className="font-medium text-gray-900">{activity.target}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Pending Reviews */}
      <div className="mt-6">
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              <h2 className="font-bold text-gray-900">تقييمات بانتظار المراجعة</h2>
              <span className="badge badge-warning">{pendingReviews?.length ?? 0}</span>
            </div>
            <Link href="/reviews?status=pending" className="text-sm text-primary-600 hover:text-primary-700">
              عرض الكل
            </Link>
          </div>
          <div className="table-container border-0">
            {reviewsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
              </div>
            ) : pendingReviews?.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                لا توجد تقييمات بانتظار المراجعة
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>النشاط التجاري</th>
                    <th>المستخدم</th>
                    <th>التقييم</th>
                    <th>التاريخ</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingReviews?.map((review: any) => (
                    <tr key={review.id}>
                      <td className="font-medium text-gray-900">{review.business?.nameAr}</td>
                      <td>{review.user?.firstName} {review.user?.lastName}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating
                                  ? 'text-amber-500 fill-amber-500'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="text-gray-500">{new Date(review.createdAt).toLocaleDateString('ar-SY')}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
