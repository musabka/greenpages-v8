'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  Building2,
  Eye,
  Star,
  MapPin,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Shield,
  Edit,
  History,
} from 'lucide-react';

interface Business {
  id: string;
  nameAr: string;
  nameEn?: string;
  slug: string;
  logo?: string;
  status: string;
  ownerStatus: string;
  isVerified: boolean;
  viewsCount: number;
  averageRating: number;
  governorate?: {
    nameAr: string;
  };
  city?: {
    nameAr: string;
  };
}

interface UserBusinessCapability {
  id: string;
  businessId: string;
  role: string;
  status: string;
  verifiedAt?: string;
  business: Business;
}

export default function MyBusinessesPage() {
  const { data: capabilities, isLoading } = useQuery({
    queryKey: ['my-businesses'],
    queryFn: async () => {
      const response = await api.get('/capabilities/my-capabilities');
      // Handle both response formats
      const data = response.data.data || response.data;
      return Array.isArray(data) ? data : [];
    },
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      APPROVED: { bg: 'bg-green-100', text: 'text-green-700', label: 'معتمد' },
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'قيد المراجعة' },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-700', label: 'مرفوض' },
    };
    const style = styles[status] || styles.PENDING;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {status === 'APPROVED' && <CheckCircle className="w-3.5 h-3.5" />}
        {status === 'PENDING' && <Clock className="w-3.5 h-3.5" />}
        {status === 'REJECTED' && <AlertCircle className="w-3.5 h-3.5" />}
        {style.label}
      </span>
    );
  };

  const getOwnerStatusBadge = (ownerStatus: string, isVerified: boolean) => {
    if (isVerified) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
          <Shield className="w-3.5 h-3.5" />
          موثّق
        </span>
      );
    }
    if (ownerStatus === 'claimed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          مرتبط
        </span>
      );
    }
    return null;
  };

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

  const businesses = capabilities || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">أنشطتي التجارية</h1>
          <p className="text-gray-600">إدارة ومتابعة الأنشطة التجارية المرتبطة بحسابك</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Building2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">إجمالي الأنشطة</p>
                <p className="text-2xl font-bold text-gray-900">{businesses.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">المعتمدة</p>
                <p className="text-2xl font-bold text-gray-900">
                  {businesses.filter((b) => b.business.status === 'APPROVED').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">الموثّقة</p>
                <p className="text-2xl font-bold text-gray-900">
                  {businesses.filter((b) => b.business.isVerified).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Eye className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">إجمالي المشاهدات</p>
                <p className="text-2xl font-bold text-gray-900">
                  {businesses.reduce((sum, b) => sum + (b.business.viewsCount || 0), 0).toLocaleString('ar')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Businesses List */}
        {businesses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد أنشطة مرتبطة</h3>
            <p className="text-gray-600 mb-6">لم يتم ربط أي نشاط تجاري بحسابك بعد</p>
            <Link
              href="/business"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Building2 className="w-5 h-5" />
              استعرض الأنشطة التجارية
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {businesses.map((capability) => {
              const business = capability.business;
              return (
                <div
                  key={capability.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Business Header */}
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Logo */}
                      {business.logo ? (
                        <img
                          src={business.logo}
                          alt={business.nameAr}
                          className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                          <Building2 className="w-8 h-8 text-gray-400" />
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {business.nameAr}
                          </h3>
                          <div className="flex gap-2 flex-shrink-0">
                            {getStatusBadge(business.status)}
                            {getOwnerStatusBadge(business.ownerStatus, business.isVerified)}
                          </div>
                        </div>

                        {business.governorate && business.city && (
                          <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                            <MapPin className="w-4 h-4" />
                            <span>
                              {business.governorate.nameAr} - {business.city.nameAr}
                            </span>
                          </div>
                        )}

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Eye className="w-4 h-4" />
                            <span>{(business.viewsCount || 0).toLocaleString('ar')} مشاهدة</span>
                          </div>
                          {business.averageRating > 0 && (
                            <div className="flex items-center gap-1 text-gray-600">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span>{business.averageRating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
                    <div className="flex gap-3">
                      <Link
                        href={`/business/${business.slug}`}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        عرض الصفحة
                      </Link>
                      
                      <Link
                        href={`/dashboard/business/${business.id}/edit`}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        تعديل البيانات
                      </Link>

                      <Link
                        href={`/dashboard/business/${business.id}/analytics`}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        title="الإحصائيات"
                      >
                        <History className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
