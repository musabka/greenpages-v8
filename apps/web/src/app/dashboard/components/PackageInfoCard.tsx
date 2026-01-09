import {
  Package,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  TrendingUp,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface PackageDetails {
  business: {
    id: string;
    nameAr: string;
    logo?: string;
    slug: string;
  };
  businessCreatedAt: string;
  role: string;
  currentPackage: {
    id: string;
    packageName: string;
    packageSlug: string;
    price: number;
    isDefault: boolean;
  } | null;
  packageActivatedAt: string | null;
  packageExpiresAt: string | null;
  daysRemaining: number | null;
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'NO_PACKAGE';
  canRenew: boolean;
  canUpgrade: boolean;
}

interface PackageInfoCardProps {
  packageDetails: PackageDetails;
}

export function PackageInfoCard({ packageDetails }: PackageInfoCardProps) {
  const {
    business,
    businessCreatedAt,
    currentPackage,
    packageActivatedAt,
    packageExpiresAt,
    daysRemaining,
    status,
    canRenew,
    canUpgrade,
  } = packageDetails;

  // تنسيق التواريخ
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'dd MMMM yyyy', { locale: ar });
  };

  // حساب النسبة المئوية للوقت المتبقي
  const getProgressPercentage = () => {
    if (!packageActivatedAt || !packageExpiresAt || !daysRemaining) return 0;
    const totalDays = Math.ceil(
      (new Date(packageExpiresAt).getTime() - new Date(packageActivatedAt).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return Math.max(0, Math.min(100, (daysRemaining / totalDays) * 100));
  };

  // ألوان ورموز الحالة
  const statusConfig = {
    ACTIVE: {
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: CheckCircle2,
      label: 'نشط',
    },
    EXPIRING_SOON: {
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      icon: AlertTriangle,
      label: 'ينتهي قريباً',
    },
    EXPIRED: {
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: XCircle,
      label: 'منتهي',
    },
    NO_PACKAGE: {
      color: 'text-gray-600',
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      icon: Package,
      label: 'لا توجد باقة',
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;
  const progressPercentage = getProgressPercentage();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header - Business Info */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-start gap-3">
          {business.logo ? (
            <img
              src={business.logo}
              alt={business.nameAr}
              className="w-12 h-12 rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <Package className="w-6 h-6 text-green-600" />
            </div>
          )}

          <div className="flex-1">
            <Link
              href={`/business/${business.slug}`}
              className="font-semibold text-gray-900 hover:text-green-600 transition-colors"
            >
              {business.nameAr}
            </Link>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                <StatusIcon className="w-3 h-3" />
                {config.label}
              </span>
              {currentPackage && !currentPackage.isDefault && (
                <span className="text-xs text-gray-500">
                  {currentPackage.packageName}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Package Details */}
      <div className="p-5 space-y-4">
        {/* تاريخ إضافة النشاط */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500">تاريخ إضافة النشاط</p>
            <p className="text-sm font-medium text-gray-900">
              {formatDate(businessCreatedAt)}
            </p>
          </div>
        </div>

        {currentPackage && !currentPackage.isDefault && (
          <>
            {/* تاريخ تفعيل الباقة */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">تاريخ تفعيل الباقة</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(packageActivatedAt)}
                </p>
              </div>
            </div>

            {/* تاريخ انتهاء الباقة */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">تاريخ انتهاء الباقة</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(packageExpiresAt)}
                </p>
              </div>
            </div>

            {/* الأيام المتبقية */}
            {daysRemaining !== null && (
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    الوقت المتبقي
                  </span>
                  <span
                    className={`text-lg font-bold ${
                      daysRemaining <= 7
                        ? 'text-red-600'
                        : daysRemaining <= 30
                        ? 'text-orange-600'
                        : 'text-green-600'
                    }`}
                  >
                    {daysRemaining > 0 ? `${daysRemaining} يوم` : 'منتهي'}
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      progressPercentage <= 20
                        ? 'bg-red-500'
                        : progressPercentage <= 40
                        ? 'bg-orange-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* باقة افتراضية */}
        {currentPackage?.isDefault && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              📦 هذا النشاط يستخدم الباقة الافتراضية (مجانية)
            </p>
          </div>
        )}

        {/* لا توجد باقة */}
        {!currentPackage && (
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">
              لا توجد باقة مفعلة لهذا النشاط التجاري
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      {(canRenew || canUpgrade) && (
        <div className="px-5 pb-5">
          <div className="grid grid-cols-2 gap-2">
            {canRenew && (
              <Link
                href={`/dashboard/packages/renew/${business.id}`}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                تجديد الباقة
              </Link>
            )}
            {canUpgrade && (
              <Link
                href={`/dashboard/packages/upgrade/${business.id}`}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <TrendingUp className="w-4 h-4" />
                ترقية الباقة
              </Link>
            )}
          </div>
          
          <Link
            href="/dashboard/packages"
            className="mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium w-full"
          >
            <Eye className="w-4 h-4" />
            عرض جميع الباقات
          </Link>
        </div>
      )}
    </div>
  );
}
