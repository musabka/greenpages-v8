import { Building2, Eye, Star, MapPin, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface BusinessStatsCardProps {
  capabilities: any[];
}

export function BusinessStatsCard({ capabilities }: BusinessStatsCardProps) {
  if (!capabilities || capabilities.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">أنشطتي التجارية</h2>
        <Link
          href="/dashboard"
          className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
        >
          عرض الكل
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {capabilities.slice(0, 3).map((capability) => (
          <Link
            key={capability.businessId}
            href={`/business/${capability.business.slug}`}
            className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md hover:border-green-300 transition-all group"
          >
            <div className="flex items-start gap-3 mb-3">
              {capability.business.logo ? (
                <img
                  src={capability.business.logo}
                  alt={capability.business.nameAr}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-green-600" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate group-hover:text-green-600 transition-colors">
                  {capability.business.nameAr}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">{capability.role}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {capability.business.governorate && (
                <div className="flex items-center gap-1 text-gray-600">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="text-xs truncate">
                    {capability.business.governorate.nameAr}
                  </span>
                </div>
              )}

              {capability.business.viewsCount !== undefined && (
                <div className="flex items-center gap-1 text-gray-600">
                  <Eye className="w-3.5 h-3.5" />
                  <span className="text-xs">
                    {capability.business.viewsCount.toLocaleString('ar-EG')}
                  </span>
                </div>
              )}

              {capability.business.averageRating !== undefined && (
                <div className="flex items-center gap-1 text-gray-600">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs">
                    {Number(capability.business.averageRating).toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100">
              <span
                className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${
                  capability.business.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-700'
                    : capability.business.status === 'PENDING'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {capability.business.status === 'ACTIVE'
                  ? 'نشط'
                  : capability.business.status === 'PENDING'
                  ? 'قيد المراجعة'
                  : 'غير نشط'}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
