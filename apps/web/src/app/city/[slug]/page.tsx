import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ChevronLeft, MapPin } from 'lucide-react';
import { BusinessCard } from '@/components/business/business-card';
import { api } from '@/lib/api';

async function getCityData(slug: string) {
  try {
    const response = await api.get(`/cities/slug/${slug}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch city:', error);
    return null;
  }
}

async function getGovernorateData(governorateId: string) {
  try {
    const response = await api.get(`/governorates/${governorateId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch governorate:', error);
    return null;
  }
}

async function getCityBusinesses(cityId: string) {
  try {
    const response = await api.get(`/businesses?cityId=${cityId}&limit=100`);
    return response.data?.data || [];
  } catch (error) {
    console.error('Failed to fetch city businesses:', error);
    return [];
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const city = await getCityData(slug);
  if (!city) {
    return {
      title: 'غير موجود',
    };
  }
  return {
    title: `${city.nameAr} - GreenPages`,
    description: `اكتشف الأنشطة التجارية في ${city.nameAr}`,
  };
}

export default async function CityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const city = await getCityData(slug);

  if (!city) {
    return notFound();
  }

  const governorate = city.governorateId ? await getGovernorateData(city.governorateId) : null;
  const businesses = await getCityBusinesses(city.id);

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
            {governorate && (
              <>
                <Link
                  href={`/governorate/${governorate.slug}`}
                  className="hover:text-white transition-colors"
                >
                  {governorate.nameAr}
                </Link>
                <ChevronLeft className="w-4 h-4" />
              </>
            )}
            <span className="text-white flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {city.nameAr}
            </span>
          </nav>

          {/* Title */}
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              {city.nameAr}
            </h1>
            <p className="text-white/90 text-lg">
              اكتشف {businesses.length} نشاط تجاري في {city.nameAr}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-12">
        {businesses.length > 0 ? (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                الأنشطة التجارية
              </h2>
              <p className="text-gray-600">
                {businesses.length} نشاط تجاري في {city.nameAr}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {businesses.map((business: any) => (
                <BusinessCard key={business.id} business={business} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
              <MapPin className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              لا توجد أنشطة تجارية
            </h3>
            <p className="text-gray-600">
              لم يتم تسجيل أي أنشطة تجارية في {city.nameAr} حتى الآن
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
