import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ChevronLeft } from 'lucide-react';
import { BusinessCard } from '@/components/business/business-card';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const API_URL = `${API_BASE}/api/v1`;

async function getCategory(slug: string) {
  try {
    const res = await fetch(`${API_URL}/categories/slug/${slug}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch category:', error);
    return null;
  }
}

async function getCategoryBusinesses(categoryId: string) {
  try {
    const res = await fetch(`${API_URL}/businesses?categoryId=${categoryId}&limit=100`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error('Failed to fetch businesses:', error);
    return [];
  }
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: 'التصنيف غير موجود' };
  return {
    title: category.metaTitleAr || `${category.nameAr} - الصفحات الخضراء`,
    description: category.metaDescriptionAr || category.descriptionAr || `تصفح ${category.nameAr} على الصفحات الخضراء - دليل سوريا التجاري`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) notFound();

  // Get all businesses for this category and its subcategories
  const businesses = await getCategoryBusinesses(category.id);

  const hasSubcategories = category.children && category.children.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-700 py-8">
        <div className="container">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-white/80 mb-6">
            <Link href="/" className="hover:text-white transition-colors">
              الرئيسية
            </Link>
            <ChevronLeft className="w-4 h-4" />
            <Link href="/categories" className="hover:text-white transition-colors">
              التصنيفات
            </Link>
            <ChevronLeft className="w-4 h-4" />
            <span className="text-white">{category.nameAr}</span>
          </nav>

          {/* Title */}
          <div className="flex items-center gap-4">
            <div className="text-5xl">{category.icon || '📁'}</div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                {category.nameAr}
              </h1>
              {category.descriptionAr && (
                <p className="text-white/80 mt-2 max-w-2xl">
                  {category.descriptionAr}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-12">
        {/* Subcategories Grid */}
        {hasSubcategories && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">التصنيفات الفرعية</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {category.children.map((sub: any) => (
                <Link
                  key={sub.id}
                  href={`/subcategory/${sub.slug}`}
                  className="group p-4 rounded-2xl border-2 border-gray-200 hover:border-primary-200 hover:bg-primary-50 transition-all text-center bg-white"
                >
                  <div className="text-4xl mb-3">{sub.icon || '📂'}</div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors text-sm line-clamp-2">
                    {sub.nameAr}
                  </h3>
                  <p className="text-xs text-gray-400 mt-2">
                    {sub._count?.businesses || 0} نشاط
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Businesses Section */}
        <div>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              الأنشطة التجارية
            </h2>
            <p className="text-gray-600">
              {businesses.length} نشاط تجاري في {category.nameAr}
            </p>
          </div>

          {businesses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {businesses.map((business: any) => (
                <BusinessCard key={business.id} business={business} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-4xl">📦</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                لا توجد أنشطة تجارية
              </h3>
              <p className="text-gray-600">
                لم يتم إضافة أي أنشطة تجارية في هذا التصنيف بعد
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
