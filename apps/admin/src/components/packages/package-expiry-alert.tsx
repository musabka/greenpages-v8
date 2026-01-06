'use client';

import { AlertTriangle, Clock, XCircle } from 'lucide-react';

interface PackageExpiryAlertProps {
  endDate?: string;
  isActive?: boolean;
  packageName?: string;
}

export function PackageExpiryAlert({ endDate, isActive, packageName }: PackageExpiryAlertProps) {
  if (!endDate) return null;

  const expiryDate = new Date(endDate);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isExpired = daysUntilExpiry < 0;
  const isExpiringSoon = daysUntilExpiry >= 0 && daysUntilExpiry <= 7;

  if (!isExpired && !isExpiringSoon && isActive) return null;

  if (isExpired || !isActive) {
    return (
      <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="bg-red-100 p-2 rounded-lg">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-red-900 mb-1">
              الباقة منتهية
            </h4>
            <p className="text-sm text-red-700">
              باقة "{packageName}" انتهت منذ{' '}
              <span className="font-semibold">
                {Math.abs(daysUntilExpiry)} {Math.abs(daysUntilExpiry) === 1 ? 'يوم' : 'أيام'}
              </span>
              . يرجى تجديد الباقة لاستعادة كامل الميزات.
            </p>
            <div className="mt-2 text-xs text-red-600">
              انتهت في: {expiryDate.toLocaleDateString('ar-SY', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isExpiringSoon) {
    return (
      <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="bg-amber-100 p-2 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-amber-900 mb-1">
              الباقة قريبة من الانتهاء
            </h4>
            <p className="text-sm text-amber-700">
              باقة "{packageName}" ستنتهي خلال{' '}
              <span className="font-semibold text-amber-900">
                {daysUntilExpiry} {daysUntilExpiry === 1 ? 'يوم' : 'أيام'}
              </span>
              . ننصح بالتجديد قبل انتهاء الصلاحية لتجنب انقطاع الخدمة.
            </p>
            <div className="mt-2 flex items-center gap-1 text-xs text-amber-700">
              <Clock className="w-3.5 h-3.5" />
              تنتهي في: {expiryDate.toLocaleDateString('ar-SY', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
