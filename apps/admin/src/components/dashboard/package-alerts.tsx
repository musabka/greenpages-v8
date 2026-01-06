'use client';

import { useQuery } from '@tanstack/react-query';
import { packageApi } from '@/lib/api';
import { AlertCircle, Calendar, Loader2, ArrowRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export function PackageAlerts() {
  const { data: expiringPackages, isLoading } = useQuery({
    queryKey: ['packages', 'expiring'],
    queryFn: () => packageApi.getExpiring(30).then(res => res.data),
  });

  if (isLoading) {
    return (
      <div className="card mb-8">
        <div className="card-body flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        </div>
      </div>
    );
  }

  if (!expiringPackages || expiringPackages.length === 0) {
    return null;
  }

  // Take only first 5 for dashboard
  const displayPackages = expiringPackages.slice(0, 5);

  return (
    <div className="card mb-8 border-amber-200">
      <div className="card-header border-amber-100 flex items-center justify-between bg-amber-50/50">
        <div className="flex items-center gap-2 text-amber-800">
          <AlertCircle className="w-5 h-5" />
          <h2 className="font-bold">اشتراكات قاربت على الانتهاء</h2>
          <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-full">
            {expiringPackages.length}
          </span>
        </div>
        <Link
          href="/subscriptions"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
        >
          عرض الكل
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>
      <div className="card-body p-0">
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
                  تاريخ الانتهاء
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الأيام المتبقية
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  إجراء
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayPackages.map((bp) => {
                const daysLeft = bp.endDate 
                  ? Math.ceil((new Date(bp.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  : 0;

                return (
                  <tr key={bp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                          {bp.business?.logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={bp.business.logo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Calendar className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-sm">{bp.business?.nameAr}</div>
                          {bp.business?.nameEn && (
                            <div className="text-xs text-gray-500">{bp.business.nameEn}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-amber-700">
                        {bp.package?.nameAr}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {bp.endDate && new Date(bp.endDate).toLocaleDateString('ar-SY', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        daysLeft <= 0 
                          ? 'bg-red-100 text-red-700' 
                          : daysLeft <= 7 
                            ? 'bg-red-50 text-red-600'
                            : daysLeft <= 15
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-yellow-50 text-yellow-600'
                      }`}>
                        {daysLeft <= 0 ? 'منتهي' : 
                         daysLeft === 1 ? 'يوم واحد' :
                         `${daysLeft} يوم`}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Link
                        href={`/businesses/${bp.businessId}/edit?tab=package`}
                        className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-bold hover:underline"
                      >
                        تجديد
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
