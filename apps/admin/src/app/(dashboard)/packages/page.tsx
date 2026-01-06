'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Edit2, Trash2, Star, Check, Eye, EyeOff } from 'lucide-react';
import { usePackages, useDeletePackage, useSetDefaultPackage } from '@/lib/hooks';
import type { Package } from '@/lib/api';

export default function PackagesPage() {
  const { data: packagesData, isLoading } = usePackages();
  const deletePackage = useDeletePackage();
  const setDefaultPackage = useSetDefaultPackage();

  const packages = Array.isArray(packagesData)
    ? (packagesData as Package[])
    : Array.isArray((packagesData as any)?.data)
      ? ((packagesData as any).data as Package[])
      : [];

  const handleDelete = async (pkg: Package) => {
    if (!confirm(`هل أنت متأكد من حذف الباقة "${pkg.nameAr}"؟`)) return;
    await deletePackage.mutateAsync(pkg.id);
  };

  const handleSetDefault = async (pkg: Package) => {
    if (!confirm(`هل تريد تعيين "${pkg.nameAr}" كباقة افتراضية؟`)) return;
    await setDefaultPackage.mutateAsync(pkg.id);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      ACTIVE: 'badge-success',
      INACTIVE: 'badge-warning',
      ARCHIVED: 'badge-secondary',
    };
    const labels = {
      ACTIVE: 'نشطة',
      INACTIVE: 'غير نشطة',
      ARCHIVED: 'مؤرشفة',
    };
    return (
      <span className={`badge ${styles[status as keyof typeof styles] || 'badge-secondary'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">إدارة الباقات</h1>
          <p className="text-gray-500 mt-1">إدارة باقات الاشتراك المتاحة للأنشطة التجارية</p>
        </div>
        <Link href="/packages/new" className="btn btn-primary">
          <Plus className="w-4 h-4" />
          إضافة باقة جديدة
        </Link>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-gray-500">جارٍ التحميل...</div>
        ) : packages.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            لا توجد باقات حالياً
          </div>
        ) : (
          packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`card relative ${pkg.isDefault ? 'ring-2 ring-primary-500' : ''}`}
            >
              {/* Default Badge */}
              {pkg.isDefault && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="badge badge-primary flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    الباقة الافتراضية
                  </span>
                </div>
              )}

              <div className="card-body">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{pkg.nameAr}</h3>
                    {pkg.nameEn && (
                      <p className="text-sm text-gray-500">{pkg.nameEn}</p>
                    )}
                  </div>
                  {getStatusBadge(pkg.status)}
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-primary-600">
                      {Number(pkg.price).toLocaleString('ar-SY')}
                    </span>
                    <span className="text-gray-500">ل.س</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {pkg.durationDays} يوم
                  </p>
                </div>

                {/* Description */}
                {pkg.descriptionAr && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {pkg.descriptionAr}
                  </p>
                )}

                {/* Features Count */}
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4 pb-4 border-b">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>{pkg.features?.length || 0} ميزة</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 text-blue-600">∞</span>
                    <span>{pkg.limits?.length || 0} قيد</span>
                  </div>
                </div>

                {/* Visibility */}
                <div className="flex items-center gap-2 mb-4">
                  {pkg.isPublic ? (
                    <>
                      <Eye className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600">ظاهرة للعموم</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-500">مخفية</span>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Link
                    href={`/packages/${pkg.id}/edit`}
                    className="btn btn-outline btn-sm flex-1"
                  >
                    <Edit2 className="w-4 h-4" />
                    تعديل
                  </Link>
                  {!pkg.isDefault && (
                    <button
                      onClick={() => handleSetDefault(pkg)}
                      className="btn btn-outline btn-sm"
                      title="تعيين كافتراضية"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(pkg)}
                    className="btn btn-outline btn-sm text-red-600 hover:bg-red-50"
                    disabled={pkg.isDefault}
                    title={pkg.isDefault ? 'لا يمكن حذف الباقة الافتراضية' : 'حذف'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Subscribers count (if available) */}
                {pkg._count?.businessPackages !== undefined && (
                  <div className="mt-3 pt-3 border-t text-sm text-gray-500 text-center">
                    {pkg._count.businessPackages} مشترك
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
