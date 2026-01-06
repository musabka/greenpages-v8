'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Users, UserCheck, UserX, TrendingUp } from 'lucide-react';

interface StatsData {
  total: number;
  approved: number;
  pending: number;
  featured: number;
  verified: number;
  ownership?: {
    claimed: number;
    unclaimed: number;
    verified: number;
  };
}

export function OwnershipStatsCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => api.get<StatsData>('/businesses/stats').then(res => res.data),
  });

  if (isLoading || !stats?.ownership) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-2/3 mb-4" />
            <div className="h-6 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  const stats_data = stats.ownership;
  const percentClaimed = stats_data.claimed > 0 
    ? Math.round((stats_data.claimed / (stats_data.claimed + stats_data.unclaimed)) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total Claimed */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">الأنشطة المرتبطة</p>
            <h3 className="text-3xl font-bold text-green-600">{stats_data.claimed}</h3>
          </div>
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <UserCheck className="w-6 h-6 text-green-600" />
          </div>
        </div>
        <div className="text-xs text-green-600 font-medium">
          {percentClaimed}% من إجمالي الأنشطة
        </div>
      </div>

      {/* Total Unclaimed */}
      <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">الأنشطة غير المرتبطة</p>
            <h3 className="text-3xl font-bold text-amber-600">{stats_data.unclaimed}</h3>
          </div>
          <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
            <UserX className="w-6 h-6 text-amber-600" />
          </div>
        </div>
        <div className="text-xs text-amber-600 font-medium">
          تحتاج إلى ربط مالك
        </div>
      </div>

      {/* Verified Owners */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">المالكون الموثّقون</p>
            <h3 className="text-3xl font-bold text-blue-600">{stats_data.verified}</h3>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <div className="text-xs text-blue-600 font-medium">
          أنشطة بمالكين موثّقين
        </div>
      </div>
    </div>
  );
}
