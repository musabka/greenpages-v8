'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import {
  ArrowRight,
  Loader2,
  Eye,
  TrendingUp,
  Calendar,
  Users,
  Star,
  MessageSquare,
} from 'lucide-react';

interface BusinessStats {
  viewsToday: number;
  viewsWeek: number;
  viewsMonth: number;
  viewsTotal: number;
}

export default function BusinessAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data: business, isLoading: businessLoading } = useQuery({
    queryKey: ['business', id],
    queryFn: async () => {
      const response = await api.get(`/businesses/${id}`);
      return response.data;
    },
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['business-stats', id],
    queryFn: async () => {
      // This is a placeholder - implement actual stats endpoint
      return {
        viewsToday: 0,
        viewsWeek: 0,
        viewsMonth: 0,
        viewsTotal: business?.viewsCount || 0,
      } as BusinessStats;
    },
    enabled: !!business,
  });

  const isLoading = businessLoading || statsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowRight className="w-5 h-5" />
            رجوع
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">إحصائيات النشاط</h1>
          <p className="text-gray-600">{business?.nameAr}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">مشاهدات اليوم</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.viewsToday || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">مشاهدات الأسبوع</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.viewsWeek || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">مشاهدات الشهر</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.viewsMonth || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">إجمالي المشاهدات</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(stats?.viewsTotal || 0).toLocaleString('ar')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <Star className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg font-semibold text-gray-900">التقييمات</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold text-gray-900">
                {business?.averageRating?.toFixed(1) || '0.0'}
              </div>
              <div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= (business?.averageRating || 0)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {business?.reviewsCount || 0} تقييم
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900">المراجعات</h3>
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {business?.reviewsCount || 0}
            </div>
            <p className="text-sm text-gray-600">إجمالي المراجعات المنشورة</p>
          </div>
        </div>

        {/* Notice */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            💡 <strong>قريباً:</strong> سنضيف المزيد من الإحصائيات التفصيلية مثل الرسوم
            البيانية ومعدلات التفاعل والمقارنات الزمنية.
          </p>
        </div>
      </div>
    </div>
  );
}
