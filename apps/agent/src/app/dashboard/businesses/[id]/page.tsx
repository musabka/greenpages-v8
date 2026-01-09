'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Package,
  RefreshCw,
  ArrowRight,
  CheckCircle,
  Clock,
  XCircle,
  Edit,
  User,
  Globe,
  Tag,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRenewPackage, usePackages } from '@/lib/hooks/useFinancial';

export default function BusinessDetailPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params.id as string;

  const [showRenewModal, setShowRenewModal] = useState(false);

  const { data: business, isLoading, isError, refetch } = useQuery({
    queryKey: ['business', businessId],
    queryFn: async () => {
      const res = await api.get(`/businesses/${businessId}`);
      return res.data;
    },
    enabled: !!businessId,
  });

  const { data: packages } = usePackages();
  const renewPackage = useRenewPackage();

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SY').format(amount) + ' ل.س';
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; label: string; icon: any }> = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'معلق', icon: Clock },
      APPROVED: { bg: 'bg-green-100', text: 'text-green-700', label: 'فعال', icon: CheckCircle },
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-700', label: 'فعال', icon: CheckCircle },
      SUSPENDED: { bg: 'bg-red-100', text: 'text-red-700', label: 'موقوف', icon: XCircle },
      EXPIRED: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'منتهي', icon: XCircle },
    };
    const style = styles[status] || styles.PENDING;
    const Icon = style.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${style.bg} ${style.text}`}>
        <Icon className="w-4 h-4" />
        {style.label}
      </span>
    );
  };

  const isPackageExpiring = () => {
    if (!business?.package?.endDate) return false;
    const daysRemaining = Math.ceil(
      (new Date(business.package.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysRemaining <= 30;
  };

  const getDaysRemaining = () => {
    if (!business?.package?.endDate) return null;
    const daysRemaining = Math.ceil(
      (new Date(business.package.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysRemaining;
  };

  const handleRenew = async (packageId: string, paymentMethod: 'CASH' | 'WALLET', notes: string) => {
    try {
      await renewPackage.mutateAsync({
        businessId,
        packageId,
        paymentMethod,
        notes,
      });
      setShowRenewModal(false);
      refetch();
    } catch (error) {
      console.error('Error renewing package:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
          <div className="h-6 w-64 bg-gray-200 rounded mb-4" />
          <div className="h-4 w-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (isError || !business) {
    return (
      <div className="text-center py-12">
        <XCircle className="w-12 h-12 text-red-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">حدث خطأ في تحميل بيانات النشاط</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const daysRemaining = getDaysRemaining();

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{business.nameAr}</h1>
          {business.nameEn && (
            <p className="text-gray-500">{business.nameEn}</p>
          )}
        </div>
        {getStatusBadge(business.status)}
      </div>

      {/* Package Expiry Warning */}
      {isPackageExpiring() && daysRemaining !== null && (
        <div className={`rounded-xl p-4 flex items-start gap-3 ${daysRemaining <= 0 ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
          <AlertTriangle className={`w-5 h-5 mt-0.5 ${daysRemaining <= 0 ? 'text-red-600' : 'text-amber-600'}`} />
          <div className="flex-1">
            <h3 className={`font-semibold ${daysRemaining <= 0 ? 'text-red-900' : 'text-amber-900'}`}>
              {daysRemaining <= 0 ? 'انتهى الاشتراك!' : 'الاشتراك على وشك الانتهاء'}
            </h3>
            <p className={`text-sm ${daysRemaining <= 0 ? 'text-red-700' : 'text-amber-700'}`}>
              {daysRemaining <= 0
                ? `انتهى الاشتراك منذ ${Math.abs(daysRemaining)} يوم`
                : `متبقي ${daysRemaining} يوم على انتهاء الاشتراك`}
            </p>
          </div>
          <button
            onClick={() => setShowRenewModal(true)}
            className={`px-4 py-2 rounded-lg text-white text-sm font-medium ${daysRemaining <= 0 ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}`}
          >
            تجديد الآن
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">معلومات النشاط</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-gray-100">
                  <MapPin className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">الموقع</p>
                  <p className="text-gray-900">
                    {business.governorate?.nameAr}
                    {business.city && ` - ${business.city.nameAr}`}
                    {business.district && ` - ${business.district.nameAr}`}
                  </p>
                </div>
              </div>

              {business.phone && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-gray-100">
                    <Phone className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">الهاتف</p>
                    <p className="text-gray-900" dir="ltr">{business.phone}</p>
                  </div>
                </div>
              )}

              {business.email && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-gray-100">
                    <Mail className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">البريد الإلكتروني</p>
                    <p className="text-gray-900" dir="ltr">{business.email}</p>
                  </div>
                </div>
              )}

              {business.categories?.length > 0 && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-gray-100">
                    <Tag className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">التصنيف</p>
                    <p className="text-gray-900">
                      {business.categories.map((c: any) => c.category?.nameAr).join(', ')}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-gray-100">
                  <Calendar className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">تاريخ التسجيل</p>
                  <p className="text-gray-900">{formatDate(business.createdAt)}</p>
                </div>
              </div>
            </div>

            {business.description && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-2">الوصف</p>
                <p className="text-gray-700">{business.description}</p>
              </div>
            )}
          </div>

          {/* Owner Info */}
          {business.owner && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 font-outfit">معلومات المالك</h2>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center border border-green-200 shadow-sm">
                  {business.owner.avatar ? (
                    <img src={business.owner.avatar} alt="" className="w-full h-full rounded-2xl object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-green-600" />
                  )}
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">الاسم الكامل</p>
                    <p className="font-bold text-gray-900 text-lg">
                      {business.owner.firstName} {business.owner.lastName}
                      {!business.owner.firstName && business.owner.displayName && (
                        <span>{business.owner.displayName}</span>
                      )}
                    </p>
                  </div>

                  {business.owner.phone && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">رقم الهاتف</p>
                      <div className="flex items-center gap-2 text-gray-900">
                        <Phone className="w-4 h-4 text-green-600" />
                        <span dir="ltr">{business.owner.phone}</span>
                      </div>
                    </div>
                  )}

                  {business.owner.email && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500 mb-1">البريد الإلكتروني</p>
                      <div className="flex items-center gap-2 text-gray-900">
                        <Mail className="w-4 h-4 text-green-600" />
                        <span>{business.owner.email}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Package Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">الباقة</h2>
              <Package className="w-5 h-5 text-green-600" />
            </div>

            {business.package ? (
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                  <p className="font-bold text-green-800 text-lg">
                    {business.package.package?.nameAr || 'باقة'}
                  </p>
                  <p className="text-green-600 text-sm mt-1">
                    {formatCurrency(Number(business.package.package?.price || 0))}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">تاريخ البدء</span>
                    <span className="text-gray-900">{formatDate(business.package.startDate)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">تاريخ الانتهاء</span>
                    <span className={`font-medium ${daysRemaining && daysRemaining <= 7 ? 'text-red-600' : 'text-gray-900'}`}>
                      {formatDate(business.package.endDate)}
                    </span>
                  </div>
                  {daysRemaining !== null && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">المتبقي</span>
                      <span className={`font-medium ${daysRemaining <= 0 ? 'text-red-600' : daysRemaining <= 7 ? 'text-amber-600' : 'text-green-600'}`}>
                        {daysRemaining <= 0 ? `انتهى منذ ${Math.abs(daysRemaining)} يوم` : `${daysRemaining} يوم`}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowRenewModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
                >
                  <RefreshCw className="w-5 h-5" />
                  تجديد / تمديد الباقة
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-4">لا توجد باقة مفعّلة</p>
                <button
                  onClick={() => setShowRenewModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  تفعيل باقة
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">إجراءات سريعة</h2>
            <div className="space-y-2">
              <Link
                href={`/dashboard/businesses/${businessId}/edit`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Edit className="w-5 h-5 text-blue-600" />
                <span className="text-gray-700">تعديل البيانات</span>
              </Link>
              <Link
                href={`/dashboard/invoices?businessId=${businessId}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FileText className="w-5 h-5 text-purple-600" />
                <span className="text-gray-700">عرض الفواتير</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Renew Package Modal */}
      {showRenewModal && packages && (
        <RenewPackageModal
          currentPackage={business.package?.package}
          packages={packages}
          onClose={() => setShowRenewModal(false)}
          onSubmit={handleRenew}
          isLoading={renewPackage.isPending}
        />
      )}
    </div>
  );
}

function RenewPackageModal({
  currentPackage,
  packages,
  onClose,
  onSubmit,
  isLoading,
}: {
  currentPackage: any;
  packages: any[];
  onClose: () => void;
  onSubmit: (packageId: string, paymentMethod: 'CASH' | 'WALLET', notes: string) => void;
  isLoading: boolean;
}) {
  const [packageId, setPackageId] = useState(currentPackage?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'WALLET'>('CASH');
  const [notes, setNotes] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SY').format(amount) + ' ل.س';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(packageId, paymentMethod, notes);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">تجديد / تمديد الباقة</h2>
          {currentPackage && (
            <p className="text-gray-500 text-sm mt-1">
              الباقة الحالية: {currentPackage.nameAr}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              اختر الباقة
            </label>
            <div className="space-y-2">
              {packages.filter((pkg: any) => pkg.isPublic && pkg.status === 'ACTIVE').map((pkg: any) => (
                <label
                  key={pkg.id}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-colors ${packageId === pkg.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="package"
                      value={pkg.id}
                      checked={packageId === pkg.id}
                      onChange={(e) => setPackageId(e.target.value)}
                      className="w-4 h-4 text-green-600 focus:ring-green-500"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{pkg.nameAr}</p>
                      <p className="text-sm text-gray-500">{pkg.durationDays} يوم</p>
                    </div>
                  </div>
                  <p className="font-bold text-green-600">{formatCurrency(Number(pkg.price))}</p>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              طريقة الدفع
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`p-3 rounded-xl border-2 text-center transition-colors ${paymentMethod === 'CASH'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <span className="font-medium">نقدي</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('WALLET')}
                className={`p-3 rounded-xl border-2 text-center transition-colors ${paymentMethod === 'WALLET'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <span className="font-medium">محفظة العميل</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ملاحظات (اختياري)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              placeholder="أضف ملاحظاتك هنا..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isLoading || !packageId}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'جارٍ التجديد...' : 'تأكيد التجديد'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
