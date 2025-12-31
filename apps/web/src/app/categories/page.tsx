import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { CategoryCard } from '@/components/category/category-card';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const API_URL = `${API_BASE}/api/v1`;

// Fetch categories from API
async function getCategories() {
  try {
    const res = await fetch(`${API_URL}/categories?limit=200`, {
      next: { revalidate: 600 }, // Cache for 10 minutes
    });
    if (!res.ok) return [];
    const data = await res.json();
    const allCategories = Array.isArray(data) ? data : (data.data || []);
    
    // Build tree structure: parent categories with their children
    const parentCategories = allCategories.filter((c: any) => !c.parentId);
    
    return parentCategories.map((parent: any) => ({
      ...parent,
      children: allCategories.filter((c: any) => c.parentId === parent.id),
    }));
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return [];
  }
}

export const metadata = {
  title: 'التصنيفات',
  description: 'تصفح جميع تصنيفات الأنشطة التجارية في الصفحات الخضراء - دليل سوريا التجاري',
};

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-primary-600 transition-colors">
            الرئيسية
          </Link>
          <ChevronLeft className="w-4 h-4" />
          <span className="text-gray-900">التصنيفات</span>
        </nav>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            تصفح جميع التصنيفات
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            اختر التصنيف المناسب للعثور على ما تبحث عنه من أنشطة تجارية وخدمات
          </p>
        </div>

        {/* Categories Grid */}
        {categories.length > 0 ? (
          <div className="space-y-12">
            {categories.map((category: any) => (
              <div key={category.id} className="bg-white rounded-2xl p-6 shadow-sm">
                {/* Category Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{category.icon || '📁'}</span>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{category.nameAr}</h2>
                      {category.descriptionAr && (
                        <p className="text-sm text-gray-500 mt-1">{category.descriptionAr}</p>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/category/${category.slug}`}
                    className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center gap-1"
                  >
                    عرض الكل
                    <ChevronLeft className="w-4 h-4" />
                  </Link>
                </div>

                {/* Subcategories */}
                {category.children && category.children.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {category.children.map((sub: any) => (
                      <Link
                        key={sub.id}
                        href={`/subcategory/${sub.slug}`}
                        className="group p-3 rounded-xl border border-gray-200 hover:border-primary-200 hover:bg-primary-50 transition-all text-center"
                      >
                        <h3 className="font-medium text-gray-700 group-hover:text-primary-600 transition-colors text-sm">
                          {sub.nameAr}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                          {sub._count?.businesses || 0} نشاط
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-400 text-sm">
                    لا توجد تصنيفات فرعية
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-4xl">📁</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد تصنيفات</h3>
            <p className="text-gray-600">
              لم يتم إضافة أي تصنيفات بعد
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
