import Image from 'next/image';
import Link from 'next/link';
import { Star, MapPin, Phone, Clock, BadgeCheck, Eye } from 'lucide-react';
import type { Business } from '@/lib/api';

interface BusinessCardProps {
  business: Business;
  variant?: 'default' | 'compact' | 'horizontal';
}

export function BusinessCard({ business, variant = 'default' }: BusinessCardProps) {
  const primaryPhone = business.contacts?.find(c => c.isPrimary && (c.type === 'PHONE' || c.type === 'MOBILE'));
  const cover = business.coverImage || business.media?.find(m => m.type === 'COVER' || m.type === 'IMAGE')?.url || business.logo;
  
  if (variant === 'compact') {
    return (
      <Link href={`/business/${business.slug}`} className="block group">
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg hover:border-primary-200 transition-all duration-300">
          <div className="flex items-center gap-3">
            {business.logo ? (
              <Image
                src={business.logo}
                alt={business.nameAr}
                width={48}
                height={48}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                <span className="text-primary-600 font-bold text-lg">
                  {business.nameAr.charAt(0)}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                {business.nameAr}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                {business.category?.nameAr}
              </p>
            </div>
            {business.isVerified && (
              <BadgeCheck className="w-5 h-5 text-primary-500 shrink-0" />
            )}
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'horizontal') {
    return (
      <Link href={`/business/${business.slug}`} className="block group">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-primary-200 transition-all duration-300">
          <div className="flex">
            <div className="relative w-48 shrink-0">
              {cover ? (
                <Image
                  src={cover}
                  alt={business.nameAr}
                  fill
                  sizes="192px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                  <span className="text-primary-300 text-4xl font-bold">
                    {business.nameAr.charAt(0)}
                  </span>
                </div>
              )}
              {business.isFeatured && (
                <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-md font-medium">
                  مميز
                </div>
              )}
            </div>
            <div className="flex-1 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 group-hover:text-primary-600 transition-colors flex items-center gap-2">
                    {business.nameAr}
                    {business.isVerified && (
                      <BadgeCheck className="w-5 h-5 text-primary-500" />
                    )}
                  </h3>
                  <p className="text-sm text-gray-500">{business.category?.nameAr}</p>
                </div>
                {business.averageRating > 0 && (
                  <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="text-sm font-medium text-amber-700">
                      {Number(business.averageRating || 0).toFixed(1)}
                    </span>
                    <span className="text-xs text-amber-600">
                      ({business.reviewsCount})
                    </span>
                  </div>
                )}
              </div>
              
              {business.shortDescriptionAr && (
                <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                  {business.shortDescriptionAr}
                </p>
              )}
              
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                {business.city && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{business.city.nameAr}</span>
                  </div>
                )}
                {primaryPhone && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    <span dir="ltr">{primaryPhone.value}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{business.viewsCount} مشاهدة</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Default variant
  return (
    <Link href={`/business/${business.slug}`} className="block group">
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-primary-200 transition-all duration-300">
        {/* Cover Image */}
        <div className="relative h-48">
          {cover ? (
            <Image
              src={cover}
              alt={business.nameAr}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
              <span className="text-primary-300 text-6xl font-bold">
                {business.nameAr.charAt(0)}
              </span>
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            {business.isFeatured && (
              <span className="bg-amber-500 text-white text-xs px-2 py-1 rounded-md font-medium">
                مميز
              </span>
            )}
            {business.isPremium && (
              <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-md font-medium">
                بريميوم
              </span>
            )}
          </div>
          
          {/* Logo */}
          {business.logo && (
            <div className="absolute -bottom-6 right-4">
              <Image
                src={business.logo}
                alt={business.nameAr}
                width={64}
                height={64}
                className="w-16 h-16 rounded-xl border-4 border-white object-cover shadow-md"
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className={`p-4 ${business.logo ? 'pt-8' : 'pt-4'}`}>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary-600 transition-colors flex items-center gap-2">
              {business.nameAr}
              {business.isVerified && (
                <BadgeCheck className="w-5 h-5 text-primary-500" />
              )}
            </h3>
            {business.averageRating > 0 && (
              <div className="flex items-center gap-1 shrink-0">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-sm font-medium">
                  {Number(business.averageRating || 0).toFixed(1)}
                </span>
              </div>
            )}
          </div>

          <p className="text-sm text-primary-600 mb-2">
            {business.category?.nameAr}
            {business.subcategory && ` • ${business.subcategory.nameAr}`}
          </p>

          {business.shortDescriptionAr && (
            <p className="text-gray-600 text-sm line-clamp-2 mb-3">
              {business.shortDescriptionAr}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 border-t border-gray-100 pt-3">
            {business.city && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{business.city.nameAr}</span>
              </div>
            )}
            {business.reviewsCount > 0 && (
              <div className="flex items-center gap-1">
                <span>{business.reviewsCount} تقييم</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
