'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Calendar,
  Edit,
  Eye,
  Globe,
  Loader2,
  MapPin,
  MousePointerClick,
  Pause,
  Play,
  Plus,
  Search,
  Trash2,
  TrendingUp,
} from 'lucide-react';

import { useAds, useDeleteAd, usePauseAd, useResumeAd } from '@/lib/hooks';

const positionLabels: Record<string, string> = {
  HOME_TOP: 'أعلى الصفحة الرئيسية',
  HOME_MIDDLE: 'منتصف الصفحة الرئيسية',
  HOME_BOTTOM: 'أسفل الصفحة الرئيسية',
  SIDEBAR: 'الشريط الجانبي',
  CATEGORY_TOP: 'أعلى صفحة التصنيف',
  SEARCH_RESULTS: 'نتائج البحث',
  BUSINESS_PAGE: 'صفحة النشاط',
};

const statusConfig: Record<string, { label: string; className: string }> = {
  DRAFT: { label: 'مسودة', className: 'badge-gray' },
  PENDING: { label: 'معلق', className: 'badge-warning' },
  ACTIVE: { label: 'نشط', className: 'badge-success' },
  PAUSED: { label: 'متوقف', className: 'badge-warning' },
  EXPIRED: { label: 'منتهي', className: 'badge-gray' },
  REJECTED: { label: 'مرفوض', className: 'badge-danger' },
};

export default function AdsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page] = useState(1);

  const { data, isLoading } = useAds({
    page,
    limit: 20,
    status: statusFilter || undefined,
  });

  const deleteAd = useDeleteAd();
  const pauseAd = usePauseAd();
  const resumeAd = useResumeAd();

  const ads = data?.data ?? [];

  const filteredAds = ads.filter((ad: any) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    const titleAr = (ad.titleAr ?? '').toLowerCase();
    const titleEn = (ad.titleEn ?? '').toLowerCase();
    const businessName = (ad.business?.nameAr ?? '').toLowerCase();
    return titleAr.includes(search) || titleEn.includes(search) || businessName.includes(search);
  });

  const totalImpressions = filteredAds.reduce((sum: number, ad: any) => sum + (ad.impressions ?? 0), 0);
  const totalClicks = filteredAds.reduce((sum: number, ad: any) => sum + (ad.clicks ?? 0), 0);
  const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0';

  const handleDelete = async (id: string, titleAr: string) => {
    if (!confirm(`هل أنت متأكد من حذف "${titleAr}"؟`)) return;
    try {
      await deleteAd.mutateAsync(id);
    } catch {
      // handled in hook
    }
  };

  const handlePause = async (id: string) => {
    try {
      await pauseAd.mutateAsync(id);
    } catch {
      // handled in hook
    }
  };

  const handleResume = async (id: string) => {
    try {
      await resumeAd.mutateAsync(id);
    } catch {
      // handled in hook
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">الإعلانات</h1>
          <p className="text-gray-500 mt-1">إدارة الحملات الإعلانية</p>
        </div>
        <Link href="/ads/new" className="btn btn-primary">
          <Plus className="w-4 h-4" />
          إنشاء إعلان
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-card-icon bg-primary-100 text-primary-600">
              <Play className="w-6 h-6" />
            </div>
            <div>
              <p className="stat-card-value">{filteredAds.filter((a: any) => a.status === 'ACTIVE').length}</p>
              <p className="stat-card-label">إعلان نشط</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-card-icon bg-blue-100 text-blue-600">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <p className="stat-card-value">{totalImpressions.toLocaleString()}</p>
              <p className="stat-card-label">مشاهدة</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-card-icon bg-green-100 text-green-600">
              <MousePointerClick className="w-6 h-6" />
            </div>
            <div>
              <p className="stat-card-value">{totalClicks.toLocaleString()}</p>
              <p className="stat-card-label">نقرة</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-card-icon bg-amber-100 text-amber-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="stat-card-value">{avgCTR}%</p>
              <p className="stat-card-label">معدل النقر</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="البحث في الإعلانات..."
                  className="input pr-10"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select w-40">
              <option value="">كل الحالات</option>
              <option value="DRAFT">مسودة</option>
              <option value="PENDING">معلق</option>
              <option value="ACTIVE">نشط</option>
              <option value="PAUSED">متوقف</option>
              <option value="EXPIRED">منتهي</option>
              <option value="REJECTED">مرفوض</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAds.map((ad: any) => {
          const imgSrc: string | undefined = ad.imageDesktop || ad.imageMobile;
          const statusInfo = statusConfig[ad.status] || { label: ad.status, className: 'badge-gray' };
          const ctr = (ad.impressions ?? 0) > 0 ? (((ad.clicks ?? 0) / ad.impressions) * 100).toFixed(2) : '0.00';

          return (
            <div key={ad.id} className="card">
              <div className="relative h-40 bg-gray-100">
                {imgSrc ? (
                  <Image src={imgSrc} alt={ad.titleAr || 'Ad image'} fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <Eye className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={`badge ${statusInfo.className}`}>{statusInfo.label}</span>
                </div>
              </div>

              <div className="card-body">
                <h3 className="font-medium text-gray-900 mb-1">{ad.titleAr || '-'}</h3>
                <p className="text-sm text-gray-500 mb-3">{ad.business?.nameAr || 'غير محدد'}</p>

                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {ad.startDate ? new Date(ad.startDate).toLocaleDateString('ar-SY') : '-'} -{' '}
                    {ad.endDate ? new Date(ad.endDate).toLocaleDateString('ar-SY') : '-'}
                  </span>
                </div>

                <div className="text-xs text-gray-500 mb-2">{positionLabels[ad.position] || ad.position}</div>

                {/* Geographic Targeting Info */}
                <div className="flex items-center gap-1 text-xs mb-4">
                  {ad.targetAllLocations !== false ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
                      <Globe className="w-3 h-3" />
                      كل المناطق
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 rounded">
                      <MapPin className="w-3 h-3" />
                      {(ad.targetGovernorates?.length || 0) + (ad.targetCities?.length || 0)} منطقة
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm mb-4">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Eye className="w-4 h-4" />
                    <span>{(ad.impressions ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <MousePointerClick className="w-4 h-4" />
                    <span>{(ad.clicks ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="text-primary-600">{ctr}% CTR</div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  {ad.status === 'ACTIVE' ? (
                    <button
                      className="btn btn-outline btn-sm flex-1"
                      onClick={() => handlePause(ad.id)}
                      disabled={pauseAd.isPending}
                    >
                      <Pause className="w-4 h-4" />
                      إيقاف
                    </button>
                  ) : ad.status === 'PAUSED' ? (
                    <button
                      className="btn btn-primary btn-sm flex-1"
                      onClick={() => handleResume(ad.id)}
                      disabled={resumeAd.isPending}
                    >
                      <Play className="w-4 h-4" />
                      تشغيل
                    </button>
                  ) : (
                    <div className="flex-1" />
                  )}

                  <Link href={`/ads/${ad.id}/edit`} className="btn btn-outline btn-sm">
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    className="btn btn-outline btn-sm text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleDelete(ad.id, ad.titleAr || '')}
                    disabled={deleteAd.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      )}

      {!isLoading && filteredAds.length === 0 && (
        <div className="text-center py-12">
          <Eye className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">لا توجد إعلانات</p>
        </div>
      )}
    </div>
  );
}
