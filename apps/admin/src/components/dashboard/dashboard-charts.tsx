// Admin Dashboard Chart Component
import React from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ChartData {
  name: string;
  businesses: number;
  users: number;
  reviews: number;
}

interface DashboardChartsProps {
  data: ChartData[];
  timeRange: 'day' | 'week' | 'month';
}

export function DashboardCharts({ data, timeRange }: DashboardChartsProps) {
  const chartTitle = timeRange === 'day' ? 'آخر 24 ساعة' : timeRange === 'week' ? 'آخر 7 أيام' : 'آخر 30 يوم';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Area Chart - Overview */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-bold text-gray-900">نظرة عامة - {chartTitle}</h2>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorBusinesses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorReviews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                stroke="#e5e7eb"
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                stroke="#e5e7eb"
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  direction: 'rtl',
                }}
                labelStyle={{ color: '#111827', fontWeight: 'bold' }}
              />
              <Legend 
                wrapperStyle={{ direction: 'rtl', paddingTop: '10px' }}
                formatter={(value) => {
                  const labels: Record<string, string> = {
                    businesses: 'الأنشطة',
                    users: 'المستخدمين',
                    reviews: 'التقييمات',
                  };
                  return labels[value] || value;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="businesses" 
                stroke="#059669" 
                fillOpacity={1} 
                fill="url(#colorBusinesses)" 
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="users" 
                stroke="#3b82f6" 
                fillOpacity={1} 
                fill="url(#colorUsers)" 
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="reviews" 
                stroke="#f59e0b" 
                fillOpacity={1} 
                fill="url(#colorReviews)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart - Comparison */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-bold text-gray-900">مقارنة الإحصائيات - {chartTitle}</h2>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                stroke="#e5e7eb"
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                stroke="#e5e7eb"
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  direction: 'rtl',
                }}
                labelStyle={{ color: '#111827', fontWeight: 'bold' }}
              />
              <Legend 
                wrapperStyle={{ direction: 'rtl', paddingTop: '10px' }}
                formatter={(value) => {
                  const labels: Record<string, string> = {
                    businesses: 'الأنشطة',
                    users: 'المستخدمين',
                    reviews: 'التقييمات',
                  };
                  return labels[value] || value;
                }}
              />
              <Bar dataKey="businesses" fill="#059669" radius={[8, 8, 0, 0]} />
              <Bar dataKey="users" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              <Bar dataKey="reviews" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
