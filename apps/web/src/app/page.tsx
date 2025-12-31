import Link from 'next/link';
import { Search, MapPin, Building2, Users, Star, ArrowLeft, ChevronDown } from 'lucide-react';
import { BusinessCard } from '@/components/business/business-card';
import { CategoryCard } from '@/components/category/category-card';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const API_URL = `${API_BASE}/api/v1`;

// Fetch featured businesses from API
async function getFeaturedBusinesses() {
  try {
    const res = await fetch(`${API_URL}/businesses/featured?limit=4`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data.data || []);
  } catch (error) {
    console.error('Failed to fetch featured businesses:', error);
    return [];
  }
}

// Fetch categories from API
async function getCategories() {
  try {
    const res = await fetch(`${API_URL}/categories?limit=100`, {
      next: { revalidate: 600 }, // Cache for 10 minutes
    });
    if (!res.ok) return [];
    const data = await res.json();
    // Get parent categories only (no parentId)
    const allCategories = Array.isArray(data) ? data : (data.data || []);
    return allCategories.filter((c: any) => !c.parentId).slice(0, 8);
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return [];
  }
}

// Fetch governorates from API
async function getGovernorates() {
  try {
    const res = await fetch(`${API_URL}/governorates?limit=100`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data.data || []);
  } catch (error) {
    console.error('Failed to fetch governorates:', error);
    return [];
  }
}

// Fetch stats from API
async function getStats() {
  try {
    const [businessesRes, categoriesRes, governoratesRes] = await Promise.all([
      fetch(`${API_URL}/businesses?limit=1`, { next: { revalidate: 300 } }),
      fetch(`${API_URL}/categories?limit=1`, { next: { revalidate: 600 } }),
      fetch(`${API_URL}/governorates?limit=1`, { next: { revalidate: 3600 } }),
    ]);
    
    const businessesData = businessesRes.ok ? await businessesRes.json() : { meta: { total: 0 } };
    const categoriesData = categoriesRes.ok ? await categoriesRes.json() : { meta: { total: 0 } };
    const governoratesData = governoratesRes.ok ? await governoratesRes.json() : { meta: { total: 0 } };

    return {
      businesses: businessesData.meta?.total || businessesData.total || 0,
      categories: categoriesData.meta?.total || categoriesData.total || 0,
      governorates: governoratesData.meta?.total || governoratesData.total || 14,
    };
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return { businesses: 0, categories: 0, governorates: 14 };
  }
}

export default async function HomePage() {
  const [featuredBusinesses, categories, governorates, stats] = await Promise.all([
    getFeaturedBusinesses(),
    getCategories(),
    getGovernorates(),
    getStats(),
  ]);

  const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(value);

  const statsDisplay = [
    { label: 'نشاط تجاري', value: stats.businesses > 0 ? `${formatNumber(stats.businesses)}+` : '10+', icon: Building2 },
    { label: 'مستخدم نشط', value: '50+', icon: Users },
    { label: 'تقييم', value: '100+', icon: Star },
    { label: 'محافظة', value: `${stats.governorates}`, icon: MapPin },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="container relative py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              اكتشف أفضل الأنشطة التجارية
              <br />
              <span className="text-primary-200">في سوريا</span>
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 mb-10 max-w-2xl mx-auto">
              الدليل التجاري الرقمي الأول والأشمل للأنشطة التجارية في جميع المحافظات السورية
            </p>

            {/* Search Box */}
            <form action="/search" method="GET" className="bg-white rounded-2xl p-2 shadow-2xl max-w-3xl mx-auto">
              <div className="flex flex-col md:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    name="q"
                    placeholder="ابحث عن نشاط تجاري، خدمة، منتج..."
                    className="w-full h-14 pr-12 pl-4 text-gray-900 rounded-xl border-0 focus:ring-2 focus:ring-primary-200 outline-none"
                  />
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                <div className="relative">
                  <select 
                    name="governorate"
                    className="w-full md:w-48 h-14 px-4 text-gray-900 rounded-xl border-0 bg-gray-50 focus:ring-2 focus:ring-primary-200 outline-none appearance-none cursor-pointer"
                  >
                    <option value="">كل المحافظات</option>
                    {governorates.map((gov: any) => (
                      <option key={gov.id} value={gov.slug}>{gov.nameAr}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                <button type="submit" className="h-14 px-8 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors flex items-center justify-center gap-2 font-semibold">
                  <Search className="w-5 h-5" />
                  <span>بحث</span>
                </button>
              </div>
            </form>

            {/* Quick Links */}
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              <span className="text-primary-200">بحث سريع:</span>
              {['مطاعم', 'عيادات', 'مدارس', 'فنادق', 'محامين'].map((term) => (
                <Link
                  key={term}
                  href={`/search?q=${term}`}
                  className="px-4 py-1 bg-white/10 hover:bg-white/20 rounded-full text-sm transition-colors"
                >
                  {term}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V120Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {statsDisplay.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-primary-100 flex items-center justify-center">
                  <stat.icon className="w-7 h-7 text-primary-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">تصفح حسب التصنيف</h2>
              <p className="text-gray-600 mt-2">اختر التصنيف المناسب للعثور على ما تبحث عنه</p>
            </div>
            <Link
              href="/categories"
              className="hidden md:flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              عرض الكل
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {categories.length > 0 ? (
              categories.map((category: any) => (
                <CategoryCard key={category.id} category={category} variant="icon" />
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                لا توجد تصنيفات متاحة حالياً
              </div>
            )}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Link href="/categories" className="btn btn-outline">
              عرض جميع التصنيفات
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Businesses Section */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">الأنشطة المميزة</h2>
              <p className="text-gray-600 mt-2">أفضل الأنشطة التجارية المختارة لك</p>
            </div>
            <Link
              href="/search?featured=true"
              className="hidden md:flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              عرض الكل
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredBusinesses.length > 0 ? (
              featuredBusinesses.map((business: any) => (
                <BusinessCard key={business.id} business={business} />
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                لا توجد أنشطة مميزة حالياً
              </div>
            )}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Link href="/search?featured=true" className="btn btn-outline">
              عرض جميع الأنشطة المميزة
            </Link>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16 bg-gray-50">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                ابحث على الخريطة
              </h2>
              <p className="text-gray-600 mb-6">
                استخدم الخريطة التفاعلية للعثور على الأنشطة التجارية القريبة منك في أي مكان في سوريا.
                يمكنك التصفية حسب المحافظة والمدينة والتصنيف.
              </p>
              <Link href="/map" className="btn btn-primary">
                <MapPin className="w-5 h-5" />
                <span>فتح الخريطة</span>
              </Link>
            </div>
            <div className="relative h-80 md:h-96 rounded-2xl overflow-hidden bg-gray-200">
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-50">
                <div className="text-center">
                  <MapPin className="w-16 h-16 text-primary-400 mx-auto mb-4" />
                  <p className="text-primary-600 font-medium">خريطة تفاعلية</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              هل لديك نشاط تجاري؟
            </h2>
            <p className="text-primary-100 text-lg mb-8">
              أضف نشاطك التجاري مجاناً واحصل على عملاء جدد. انضم إلى آلاف الأنشطة التجارية
              في الصفحات الخضراء.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/add-business"
                className="btn bg-white text-primary-600 hover:bg-gray-100"
              >
                أضف نشاطك مجاناً
              </Link>
              <Link
                href="/pricing"
                className="btn bg-primary-500 hover:bg-primary-400 border border-white/20"
              >
                تعرف على الباقات
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Governorates Section */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              تصفح حسب المحافظة
            </h2>
            <p className="text-gray-600">
              اكتشف الأنشطة التجارية في جميع المحافظات السورية
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {governorates.length > 0 ? (
              governorates.map((gov: any) => (
                <Link
                  key={gov.id}
                  href={`/governorate/${gov.slug}`}
                  className="group p-4 rounded-xl border border-gray-200 hover:border-primary-200 hover:bg-primary-50 transition-all text-center"
                >
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                    {gov.nameAr}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {gov._count?.businesses || 0} نشاط
                  </p>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                لا توجد محافظات متاحة حالياً
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
