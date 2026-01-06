'use client';

import { Shield, CheckCircle, Calendar, AlertCircle } from 'lucide-react';

interface BusinessPackageInfo {
  id: string;
  packageName: string;
  isActive: boolean;
  endDate?: string;
  features: {
    key: string;
    label: string;
    enabled: boolean;
  }[];
}

interface BusinessPackageCardProps {
  packageInfo?: BusinessPackageInfo;
  className?: string;
}

export function BusinessPackageCard({ packageInfo, className = '' }: BusinessPackageCardProps) {
  if (!packageInfo) return null;

  const isExpired = packageInfo.endDate && new Date(packageInfo.endDate) < new Date();
  const daysRemaining = packageInfo.endDate
    ? Math.ceil((new Date(packageInfo.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{packageInfo.packageName}</h3>
          <div className="flex items-center gap-2 mt-1">
            {packageInfo.isActive && !isExpired ? (
              <span className="inline-flex items-center gap-1 text-xs text-green-600">
                <CheckCircle className="w-3 h-3" />
                نشطة
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="w-3 h-3" />
                منتهية
              </span>
            )}
          </div>
        </div>
      </div>

      {packageInfo.endDate && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 pb-4 border-b">
          <Calendar className="w-4 h-4" />
          <span>
            {isExpired ? (
              <>انتهت في: {new Date(packageInfo.endDate).toLocaleDateString('ar-SY')}</>
            ) : daysRemaining !== null && daysRemaining <= 30 ? (
              <span className="text-amber-600 font-medium">
                تنتهي خلال {daysRemaining} يوم
              </span>
            ) : (
              <>تنتهي في: {new Date(packageInfo.endDate).toLocaleDateString('ar-SY')}</>
            )}
          </span>
        </div>
      )}

      <div className="space-y-2">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
          المميزات المتاحة
        </h4>
        {packageInfo.features.slice(0, 5).map((feature) => (
          <div
            key={feature.key}
            className={`flex items-center gap-2 text-sm ${
              feature.enabled ? 'text-gray-700' : 'text-gray-400'
            }`}
          >
            <CheckCircle
              className={`w-4 h-4 ${
                feature.enabled ? 'text-green-600' : 'text-gray-300'
              }`}
            />
            <span>{feature.label}</span>
          </div>
        ))}
        {packageInfo.features.length > 5 && (
          <div className="text-xs text-gray-500 mr-6 mt-2">
            + {packageInfo.features.length - 5} ميزة أخرى
          </div>
        )}
      </div>
    </div>
  );
}
