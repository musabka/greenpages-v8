import Image from 'next/image';
import Link from 'next/link';
import type { Category } from '@/lib/api';

interface CategoryCardProps {
  category: Category;
  variant?: 'default' | 'compact' | 'icon';
}

export function CategoryCard({ category, variant = 'default' }: CategoryCardProps) {
  const businessCount = category._count?.businesses || 0;
  const href = category.parentId ? `/subcategory/${category.slug}` : `/category/${category.slug}`;

  if (variant === 'icon') {
    return (
      <Link href={href} className="block group">
        <div className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-primary-50 transition-colors">
          <div className="w-16 h-16 rounded-2xl bg-primary-100 group-hover:bg-primary-200 flex items-center justify-center transition-colors">
            {category.icon ? (
              <span className="text-3xl">{category.icon}</span>
            ) : (
              <span className="text-primary-600 font-bold text-xl">
                {category.nameAr.charAt(0)}
              </span>
            )}
          </div>
          <span className="text-sm font-medium text-gray-700 group-hover:text-primary-600 text-center transition-colors">
            {category.nameAr}
          </span>
        </div>
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link href={href} className="block group">
        <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-primary-200 hover:bg-primary-50 transition-all">
          <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
            {category.icon ? (
              <span className="text-xl">{category.icon}</span>
            ) : (
              <span className="text-primary-600 font-semibold">
                {category.nameAr.charAt(0)}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate group-hover:text-primary-600 transition-colors">
              {category.nameAr}
            </h3>
            <p className="text-xs text-gray-500">{businessCount} نشاط</p>
          </div>
        </div>
      </Link>
    );
  }

  // Default variant
  return (
    <Link href={href} className="block group">
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 hover:border-primary-200 hover:shadow-lg transition-all duration-300">
        {/* Background Image or Gradient */}
        <div className="relative h-40">
          {category.image ? (
            <Image
              src={category.image}
              alt={category.nameAr}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-700" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Icon */}
          <div className="absolute top-4 right-4 w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            {category.icon ? (
              <span className="text-2xl">{category.icon}</span>
            ) : (
              <span className="text-white font-bold text-xl">
                {category.nameAr.charAt(0)}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="absolute bottom-0 right-0 left-0 p-4 text-white">
            <h3 className="font-bold text-lg mb-1">{category.nameAr}</h3>
            <p className="text-sm text-white/80">{businessCount} نشاط تجاري</p>
          </div>
        </div>

        {/* Subcategories preview */}
        {category.children && category.children.length > 0 && (
          <div className="p-4 bg-white">
            <div className="flex flex-wrap gap-2">
              {category.children.slice(0, 3).map((child) => (
                <span
                  key={child.id}
                  className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md"
                >
                  {child.nameAr}
                </span>
              ))}
              {category.children.length > 3 && (
                <span className="text-xs text-primary-600 px-2 py-1">
                  +{category.children.length - 3} المزيد
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
