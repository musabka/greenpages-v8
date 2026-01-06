'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { packageApi } from '@/lib/api';
import { 
  Calendar, 
  Search, 
  Filter, 
  Loader2, 
  ArrowRight,
  RefreshCw,
  Download,
  Package as PackageIcon
} from 'lucide-react';
import Link from 'next/link';
import { usePackages } from '@/lib/hooks';

export default function SubscriptionsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'expiring'>('all');
  const [packageFilter, setPackageFilter] = useState('');
  const [daysThreshold, setDaysThreshold] = useState(30);

  const { data: packagesData } = usePackages({ status: 'ACTIVE' });
  const packages = Array.isArray(packagesData)
    ? packagesData
    : Array.isArray((packagesData as any)?.data)
      ? (packagesData as any).data
      : [];

  const { data: subscriptions, isLoading, refetch } = useQuery({
    queryKey: ['subscriptions', search, statusFilter, packageFilter, daysThreshold],
    queryFn: () => packageApi.getAllSubscriptions({
      search: search || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
      packageId: packageFilter || undefined,
      daysThreshold,
    }).then(res => res.data),
  });

  const calculateDaysLeft = (endDate?: string) => {
    if (!endDate) return null;
    const now = new Date();
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getStatusBadge = (daysLeft: number | null, isActive: boolean) => {
    if (!daysLeft) {
      return <span className="px-2 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-700">دائمة</span>;
    }
    if (daysLeft <= 0 || !isActive) {
      return <span className="px-2 py-1 text-xs font-bold rounded-full bg-red-100 text-red-700">منتهية</span>;
    }
    if (daysLeft <= 7) {
      return <span className="px-2 py-1 text-xs font-bold rounded-full bg-red-50 text-red-600">حرجة</span>;
    }
    if (daysLeft <= 15) {
      return <span className="px-2 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-600">قريبة الانتهاء</span>;
    }
    if (daysLeft <= 30) {
      return <span className="px-2 py-1 text-xs font-bold rounded-full bg-yellow-50 text-yellow-600">تحذير</span>;
    }
    return <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700">نشطة</span>;
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">متابعة الاشتراكات</h1>
          <p className="text-gray-500 mt-1">إدارة ومتابعة اشتراكات الأنشطة التجارية</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="btn btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            تحديث
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                البحث
              </label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="اسم النشاط التجاري..."
                  className="input pr-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الحالة
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="input"
              >
                <option value="all">الكل</option>
                <option value="active">نشطة</option>
                <option value="expiring">قريبة الانتهاء</option>
                <option value="expired">منتهية</option>
              </select>
            </div>

            {/* Package Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الباقة
              </label>
              <select
                value={packageFilter}
                onChange={(e) => setPackageFilter(e.target.value)}
                className="input"
              >
                <option value="">جميع الباقات</option>
                {packages.map((pkg: any) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.nameAr}
                  </option>
                ))}
              </select>
            </div>

            {/* Days Threshold */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                عتبة التحذير (أيام)
              </label>
              <select
                value={daysThreshold}
                onChange={(e) => setDaysThreshold(Number(e.target.value))}
                className="input"
              >
                <option value="7">7 أيام</option>
                <option value="15">15 يوم</option>
                <option value="30">30 يوم</option>
                <option value="60">60 يوم</option>
                <option value="90">90 يوم</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      {subscriptions && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">إجمالي الاشتراكات</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{subscriptions.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <PackageIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">نشطة</p>
                <p className="text-2xl font-bold text-green-700 mt-1">
                  {subscriptions.filter(s => {
                    const daysLeft = calculateDaysLeft(s.endDate);
                    return s.isActive && (daysLeft === null || daysLeft > 30);
                  }).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-amber-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">قريبة الانتهاء</p>
                <p className="text-2xl font-bold text-amber-700 mt-1">
                  {subscriptions.filter(s => {
                    const daysLeft = calculateDaysLeft(s.endDate);
                    return s.isActive && daysLeft !== null && daysLeft > 0 && daysLeft <= 30;
                  }).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">منتهية</p>
                <p className="text-2xl font-bold text-red-700 mt-1">
                  {subscriptions.filter(s => {
                    const daysLeft = calculateDaysLeft(s.endDate);
                    return !s.isActive || (daysLeft !== null && daysLeft <= 0);
                  }).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subscriptions Table */}
      <div className="card">
        <div className="card-body p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : !subscriptions || subscriptions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>لا توجد اشتراكات</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      النشاط التجاري
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الباقة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاريخ البدء
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاريخ الانتهاء
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الأيام المتبقية
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      إجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscriptions.map((subscription: any) => {
                    const daysLeft = calculateDaysLeft(subscription.endDate);
                    
                    return (
                      <tr key={subscription.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                              {subscription.business?.logo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={subscription.business.logo} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Calendar className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 text-sm">
                                {subscription.business?.nameAr}
                              </div>
                              {subscription.business?.nameEn && (
                                <div className="text-xs text-gray-500">
                                  {subscription.business.nameEn}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {subscription.package?.nameAr}
                          </div>
                          {subscription.package?.price && (
                            <div className="text-xs text-gray-500">
                              {Number(subscription.package.price).toLocaleString('ar-SY')} ل.س
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(subscription.startDate).toLocaleDateString('ar-SY', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {subscription.endDate ? (
                            new Date(subscription.endDate).toLocaleDateString('ar-SY', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          ) : (
                            <span className="text-blue-600 font-medium">دائمة</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {daysLeft !== null ? (
                            <span className={`text-sm font-bold ${
                              daysLeft <= 0 
                                ? 'text-red-600' 
                                : daysLeft <= 7 
                                  ? 'text-red-600'
                                  : daysLeft <= 15
                                    ? 'text-amber-600'
                                    : daysLeft <= 30
                                      ? 'text-yellow-600'
                                      : 'text-green-600'
                            }`}>
                              {daysLeft <= 0 ? 'منتهي' : `${daysLeft} يوم`}
                            </span>
                          ) : (
                            <span className="text-sm text-blue-600 font-medium">∞</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getStatusBadge(daysLeft, subscription.isActive)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              href={`/businesses/${subscription.businessId}`}
                              className="text-xs text-gray-600 hover:text-gray-900"
                            >
                              عرض
                            </Link>
                            <Link
                              href={`/businesses/${subscription.businessId}/edit?tab=package`}
                              className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-bold"
                            >
                              إدارة
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
