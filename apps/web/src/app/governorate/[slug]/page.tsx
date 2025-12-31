import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ChevronLeft, MapPin } from 'lucide-react';
import { BusinessCard } from '@/components/business/business-card';
import { api } from '@/lib/api';

async function getGovernorateData(slug: string) {
  try {
    const response = await api.get(`/governorates/slug/${slug}`);
    return response.data;
  } catch {
    return null;
  }
}

async function getGovernorateBusinesses(governorateId: string) {
  try {
    const response = await api.get(`/businesses?governorateId=${governorateId}&limit=100`);
    return response.data?.data || [];
  } catch {
    return [];
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const governorate = await getGovernorateData(slug);
  if (!governorate) {
    return {
      title: 'غير موجود',
    };
  }
  return {
    title: `${governorate.nameAr} - GreenPages`,
    description: `اكتشف الأنشطة التجارية في ${governorate.nameAr}`,
  };
}

export default async function GovernoratePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const governorate = await getGovernorateData(slug);

  if (!governorate) {
    return notFound();
  }

  const businesses = await getGovernorateBusinesses(governorate.id);

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
            <span className="text-white flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {governorate.nameAr}
            </span>
          </nav>

          {/* Title */}
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              {governorate.nameAr}
            </h1>
            <p className="text-white/90 text-lg">
              اكتشف {businesses.length} نشاط تجاري في {governorate.nameAr}
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
                {businesses.length} نشاط تجاري في {governorate.nameAr}
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
              لم يتم تسجيل أي أنشطة تجارية في {governorate.nameAr} حتى الآن
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
