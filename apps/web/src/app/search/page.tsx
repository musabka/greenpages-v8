'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Grid, List, ChevronLeft, X, SlidersHorizontal, Loader2 } from 'lucide-react';
import { BusinessCard } from '@/components/business/business-card';
import { useBusinesses, useCategories, useGovernorates } from '@/lib/hooks';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const initialQuery = searchParams.get('q') || '';
  const initialGovernorate = searchParams.get('governorate') || '';
  const initialCategory = searchParams.get('category') || '';
  const initialFeatured = searchParams.get('featured') === 'true';
  
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedGovernorate, setSelectedGovernorate] = useState(initialGovernorate);
  const [selectedRating, setSelectedRating] = useState<string>('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('relevance');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 12;

  // Fetch data from API
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
  const { data: governoratesData, isLoading: governoratesLoading } = useGovernorates();
  
  // Get categories and governorates - handle both array and object with data property
  const categories = (Array.isArray(categoriesData) 
    ? categoriesData 
    : (Array.isArray((categoriesData as any)?.data) ? (categoriesData as any).data : []))
    .filter((c: any) => !c.parentId);
    
  const governorates = Array.isArray(governoratesData) 
    ? governoratesData 
    : (Array.isArray((governoratesData as any)?.data) ? (governoratesData as any).data : []);

  // Resolve governorate/category from slug to ID if needed
  const governorateId = selectedGovernorate.length === 36 && selectedGovernorate.includes('-')
    ? selectedGovernorate
    : governorates.find((g: any) => g.slug === selectedGovernorate)?.id || selectedGovernorate;
    
  const categoryId = selectedCategory.length === 36 && selectedCategory.includes('-')
    ? selectedCategory
    : categories.find((c: any) => c.slug === selectedCategory)?.id || selectedCategory;

  // Normalize slug params to IDs once data is available to avoid API 500s
  useEffect(() => {
    if (!governorates.length || !selectedGovernorate) return;
    const resolvedGov = governorates.find((g: any) => g.slug === selectedGovernorate)?.id;
    if (resolvedGov && resolvedGov !== selectedGovernorate) {
      setSelectedGovernorate(resolvedGov);
    }
  }, [governorates, selectedGovernorate]);

  useEffect(() => {
    if (!categories.length || !selectedCategory) return;
    const resolvedCat = categories.find((c: any) => c.slug === selectedCategory)?.id;
    if (resolvedCat && resolvedCat !== selectedCategory) {
      setSelectedCategory(resolvedCat);
    }
  }, [categories, selectedCategory]);
  
  // Build search params for API
  const searchParamsObj: any = {
    page,
    limit,
  };
  
  if (query) searchParamsObj.search = query;
  if (governorateId) searchParamsObj.governorateId = governorateId;
  if (categoryId) searchParamsObj.categoryId = categoryId;
  if (selectedRating) searchParamsObj.minRating = parseFloat(selectedRating);
  if (verifiedOnly) searchParamsObj.verified = true;
  if (initialFeatured) searchParamsObj.featured = true;
  
  // Sorting
  if (sortBy === 'rating') {
    searchParamsObj.sortBy = 'averageRating';
    searchParamsObj.sortOrder = 'desc';
  } else if (sortBy === 'reviews') {
    searchParamsObj.sortBy = 'reviewsCount';
    searchParamsObj.sortOrder = 'desc';
  } else if (sortBy === 'views') {
    searchParamsObj.sortBy = 'viewsCount';
    searchParamsObj.sortOrder = 'desc';
  } else if (sortBy === 'newest') {
    searchParamsObj.sortBy = 'createdAt';
    searchParamsObj.sortOrder = 'desc';
  }
  
  const { data: businessesData, isLoading: businessesLoading, error } = useBusinesses(searchParamsObj);

  // Get businesses and pagination
  const businesses = businessesData?.data || [];
  const totalCount = (businessesData as any)?.meta?.total || businessesData?.total || 0;
  const totalPages = Math.ceil(totalCount / limit);

  const activeFiltersCount = [
    selectedCategory,
    selectedGovernorate,
    selectedRating,
    verifiedOnly,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedGovernorate('');
    setSelectedRating('');
    setVerifiedOnly(false);
    setQuery('');
    setPage(1);
  };

  // Update URL when search params change
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (selectedGovernorate) params.set('governorate', selectedGovernorate);
    if (selectedCategory) params.set('category', selectedCategory);
    if (initialFeatured) params.set('featured', 'true');
    
    const newUrl = params.toString() ? `/search?${params.toString()}` : '/search';
    router.replace(newUrl, { scroll: false });
  }, [query, selectedGovernorate, selectedCategory]);

  const isLoading = businessesLoading || categoriesLoading || governoratesLoading;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200 sticky top-[64px] z-40">
        <div className="container py-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="ابحث عن نشاط تجاري، خدمة، منتج..."
                className="w-full h-12 pr-12 pl-4 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>

            {/* Filter Toggle (Mobile) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center justify-center gap-2 h-12 px-4 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span>فلترة</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Desktop Filters */}
            <div className="hidden md:flex items-center gap-3">
              <select
                value={selectedGovernorate}
                onChange={(e) => {
                  setSelectedGovernorate(e.target.value);
                  setPage(1);
                }}
                className="h-12 px-4 rounded-xl border border-gray-300 bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
              >
                <option value="">كل المحافظات</option>
                {governorates.map((gov: any) => (
                  <option key={gov.id} value={gov.id}>
                    {gov.nameAr}
                  </option>
                ))}
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="h-12 px-4 rounded-xl border border-gray-300 bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
              >
                <option value="">كل التصنيفات</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nameAr}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-12 px-4 rounded-xl border border-gray-300 bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
              >
                <option value="relevance">الأكثر صلة</option>
                <option value="rating">الأعلى تقييماً</option>
                <option value="reviews">الأكثر تقييماً</option>
                <option value="views">الأكثر مشاهدة</option>
                <option value="newest">الأحدث</option>
              </select>
            </div>
          </div>

          {/* Mobile Filters Panel */}
          {showFilters && (
            <div className="md:hidden mt-4 p-4 bg-gray-50 rounded-xl space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المحافظة</label>
                <select
                  value={selectedGovernorate}
                  onChange={(e) => {
                    setSelectedGovernorate(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white"
                >
                  <option value="">كل المحافظات</option>
                  {governorates.map((gov: any) => (
                    <option key={gov.id} value={gov.id}>
                      {gov.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">التصنيف</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white"
                >
                  <option value="">كل التصنيفات</option>
                  {categories.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الحد الأدنى للتقييم</label>
                <select
                  value={selectedRating}
                  onChange={(e) => {
                    setSelectedRating(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white"
                >
                  <option value="">أي تقييم</option>
                  <option value="4">4 نجوم فأعلى</option>
                  <option value="3">3 نجوم فأعلى</option>
                  <option value="2">2 نجوم فأعلى</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="verified"
                  checked={verifiedOnly}
                  onChange={(e) => {
                    setVerifiedOnly(e.target.checked);
                    setPage(1);
                  }}
                  className="w-4 h-4 text-primary-500 rounded"
                />
                <label htmlFor="verified" className="text-sm text-gray-700">
                  الموثقين فقط
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الترتيب</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white"
                >
                  <option value="relevance">الأكثر صلة</option>
                  <option value="rating">الأعلى تقييماً</option>
                  <option value="reviews">الأكثر تقييماً</option>
                  <option value="views">الأكثر مشاهدة</option>
                  <option value="newest">الأحدث</option>
                </select>
              </div>

              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="w-full py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  مسح كل الفلاتر
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="container py-8">
        {/* Breadcrumb & Results Info */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Link href="/" className="hover:text-primary-600 transition-colors">
                الرئيسية
              </Link>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-gray-900">نتائج البحث</span>
            </nav>
            <p className="text-gray-600">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري البحث...
                </span>
              ) : (
                <>
                  تم العثور على <span className="font-semibold text-gray-900">{totalCount}</span> نتيجة
                  {query && (
                    <span>
                      {' '}لـ "<span className="font-semibold text-primary-600">{query}</span>"
                    </span>
                  )}
                </>
              )}
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-primary-100 text-primary-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary-100 text-primary-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Active Filters */}
        {activeFiltersCount > 0 && (
          <div className="hidden md:flex items-center gap-2 mb-6 flex-wrap">
            <span className="text-sm text-gray-500">الفلاتر النشطة:</span>
            
            {selectedGovernorate && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                {governorates.find((g: any) => g.id === selectedGovernorate)?.nameAr}
                <button onClick={() => setSelectedGovernorate('')}>
                  <X className="w-4 h-4" />
                </button>
              </span>
            )}
            
            {selectedCategory && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                {categories.find((c: any) => c.id === selectedCategory)?.nameAr}
                <button onClick={() => setSelectedCategory('')}>
                  <X className="w-4 h-4" />
                </button>
              </span>
            )}
            
            {selectedRating && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                {selectedRating}+ نجوم
                <button onClick={() => setSelectedRating('')}>
                  <X className="w-4 h-4" />
                </button>
              </span>
            )}
            
            {verifiedOnly && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                موثق
                <button onClick={() => setVerifiedOnly(false)}>
                  <X className="w-4 h-4" />
                </button>
              </span>
            )}
            
            <button
              onClick={clearFilters}
              className="text-sm text-red-600 hover:text-red-700 transition-colors"
            >
              مسح الكل
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
              <X className="w-12 h-12 text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">حدث خطأ</h3>
            <p className="text-gray-600 mb-6">
              لم نتمكن من تحميل النتائج. يرجى المحاولة مرة أخرى.
            </p>
            <button onClick={() => window.location.reload()} className="btn btn-primary">
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Results */}
        {!isLoading && !error && businesses.length > 0 && (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
            }
          >
            {businesses.map((business: any) => (
              <BusinessCard
                key={business.id}
                business={business}
                variant={viewMode === 'list' ? 'horizontal' : 'default'}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && businesses.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
              <Search className="w-12 h-12 text-gray-300" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد نتائج</h3>
            <p className="text-gray-600 mb-6">
              لم نتمكن من العثور على نتائج تطابق بحثك. جرب تغيير الفلاتر أو البحث بكلمات مختلفة.
            </p>
            <button onClick={clearFilters} className="btn btn-primary">
              مسح الفلاتر
            </button>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !error && businesses.length > 0 && totalPages > 1 && (
          <div className="flex justify-center mt-12">
            <nav className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-5 h-5 rotate-180" />
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                      page === pageNum
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container py-12"><div className="text-center">جاري التحميل...</div></div>}>
      <SearchPageContent />
    </Suspense>
  );
}
