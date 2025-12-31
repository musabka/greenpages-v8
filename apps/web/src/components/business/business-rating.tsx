"use client";

import { Star } from 'lucide-react';
import { useBusinessBySlug } from '@/lib/hooks';

interface BusinessRatingProps {
  slug: string;
  initialRating?: number;
  initialCount?: number;
}

export function BusinessRating({ slug, initialRating = 0, initialCount = 0 }: BusinessRatingProps) {
  const { data } = useBusinessBySlug(slug);
  const rating = data?.averageRating ?? initialRating;
  const count = data?.reviewsCount ?? initialCount;

  return (
    <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-xl">
      <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
      <span className="text-2xl font-bold text-amber-700">{Number(rating || 0).toFixed(1)}</span>
      <span className="text-amber-600">({Number(count || 0)} تقييم)</span>
    </div>
  );
}
