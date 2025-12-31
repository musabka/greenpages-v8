'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Search, List, X, ChevronLeft, MapPin, Star, BadgeCheck } from 'lucide-react';
import { useBusinesses, useCategories, useGovernorates } from '@/lib/hooks';

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

export default function MapPage() {
  const [isClient, setIsClient] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [showList, setShowList] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedGovernorate, setSelectedGovernorate] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([33.5138, 36.2765]);
  const [mapZoom, setMapZoom] = useState(12);

  const { data: categoriesData } = useCategories({ limit: 100 });
  const { data: governoratesData } = useGovernorates({ limit: 50 });
  const { data: businessesData, isLoading } = useBusinesses({
    search: query || undefined,
    categoryId: selectedCategory || undefined,
    governorateId: selectedGovernorate || undefined,
    limit: 100,
  });

  const categories = Array.isArray(categoriesData) 
    ? categoriesData 
    : (Array.isArray((categoriesData as any)?.data) ? (categoriesData as any).data : []);
    
  const governorates = Array.isArray(governoratesData) 
    ? governoratesData 
    : (Array.isArray((governoratesData as any)?.data) ? (governoratesData as any).data : []);
    
  const businesses = Array.isArray(businessesData) 
    ? businessesData 
    : (businessesData?.data || []);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleGovernorateChange = (govId: string) => {
    setSelectedGovernorate(govId);
    const gov = governorates.find((g: any) => g.id === govId);
    if (gov && gov.latitude && gov.longitude) {
      setMapCenter([gov.latitude, gov.longitude]);
      setMapZoom(11);
    }
  };

  const filteredBusinesses = businesses.filter((b: any) => b.latitude && b.longitude);

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="container">
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-primary-600 transition-colors">
              الرئيسية
            </Link>
            <ChevronLeft className="w-4 h-4" />
            <span className="text-gray-900">البحث على الخريطة</span>
          </nav>

          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث عن نشاط تجاري..."
                className="w-full h-12 pr-12 pl-4 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <select
                value={selectedGovernorate}
                onChange={(e) => handleGovernorateChange(e.target.value)}
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
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-12 px-4 rounded-xl border border-gray-300 bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
              >
                <option value="">كل التصنيفات</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nameAr}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowList(!showList)}
                className={`h-12 px-4 rounded-xl border transition-colors flex items-center gap-2 ${
                  showList
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-primary-500'
                }`}
              >
                <List className="w-5 h-5" />
                <span className="hidden md:inline">عرض القائمة</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        {isClient && (
          <div className="absolute inset-0">
            {/* Add Leaflet CSS */}
            <link
              rel="stylesheet"
              href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
              integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
              crossOrigin=""
            />
            
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              className="h-full w-full"
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {filteredBusinesses.map((business: any) => (
                  <Marker
                    key={business.id}
                    position={[business.latitude, business.longitude]}
                    eventHandlers={{
                      click: () => setSelectedBusiness(business),
                    }}
                  >
                    <Popup>
                      <div className="text-right min-w-[200px]">
                        <h3 className="font-bold text-gray-900 flex items-center gap-1">
                          {business.nameAr}
                          {business.verificationStatus === 'VERIFIED' && (
                            <BadgeCheck className="w-4 h-4 text-primary-500" />
                          )}
                        </h3>
                        <p className="text-sm text-gray-500">{business.category?.nameAr}</p>
                        <p className="text-sm text-gray-600 mt-1">{business.shortDescriptionAr}</p>
                        <div className="flex items-center gap-1 mt-2">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span className="text-sm font-medium">{Number(business.averageRating || 0).toFixed(1)}</span>
                        </div>
                        <Link
                          href={`/business/${business.slug}`}
                          className="block mt-2 text-center py-2 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600 transition-colors"
                        >
                          عرض التفاصيل
                        </Link>
                      </div>
                    </Popup>
                  </Marker>
              ))}
            </MapContainer>
          </div>
        )}

        {/* Side List */}
        {showList && (
          <div className="absolute top-0 right-0 h-full w-full md:w-96 bg-white shadow-xl z-[1000] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-900">
                النتائج ({filteredBusinesses.length})
              </h3>
              <button
                onClick={() => setShowList(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredBusinesses.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {filteredBusinesses.map((business: any) => (
                    <Link
                      key={business.id}
                      href={`/business/${business.slug}`}
                      className="block p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                          <span className="text-primary-600 font-bold">
                            {business.nameAr?.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 flex items-center gap-1">
                            {business.nameAr}
                            {business.verificationStatus === 'VERIFIED' && (
                              <BadgeCheck className="w-4 h-4 text-primary-500" />
                            )}
                          </h4>
                          <p className="text-sm text-primary-600">{business.category?.nameAr}</p>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                            {business.shortDescriptionAr}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                              <span>{Number(business.averageRating || 0).toFixed(1)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{business.city?.nameAr || business.governorate?.nameAr}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">لا توجد نتائج</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading state for SSR */}
        {!isClient && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">جاري تحميل الخريطة...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
