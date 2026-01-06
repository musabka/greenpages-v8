'use client';

import { ShieldCheck, Star, Zap } from 'lucide-react';

interface PackageBadgesProps {
  isVerified?: boolean;
  isFeatured?: boolean;
  className?: string;
}

export function PackageBadges({ isVerified, isFeatured, className = '' }: PackageBadgesProps) {
  if (!isVerified && !isFeatured) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {isVerified && (
        <span
          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
          title="نشاط موثّق"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>موثّق</span>
        </span>
      )}
      {isFeatured && (
        <span
          className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium"
          title="نشاط مميز"
        >
          <Star className="w-3.5 h-3.5 fill-current" />
          <span>مميز</span>
        </span>
      )}
    </div>
  );
}

interface VerifiedBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function VerifiedBadge({ size = 'md', className = '' }: VerifiedBadgeProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <span title="نشاط موثّق" className="inline-flex">
      <ShieldCheck className={`${sizeClasses[size]} text-blue-600 ${className}`} />
    </span>
  );
}

interface FeaturedBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function FeaturedBadge({ size = 'md', className = '' }: FeaturedBadgeProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div className={`relative inline-block ${className}`} title="نشاط مميز">
      <Star
        className={`${sizeClasses[size]} text-amber-500 fill-amber-500`}
      />
      <span className="absolute -top-1 -right-1">
        <Zap className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
      </span>
    </div>
  );
}
