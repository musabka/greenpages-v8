import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Calendar,
  Star,
  Share2,
  Heart,
  BadgeCheck,
  ChevronLeft,
  ExternalLink,
  MessageCircle,
  Navigation,
  Users,
  Package,
} from 'lucide-react';
import { FaFacebook, FaInstagram, FaTwitter, FaWhatsapp, FaTelegram, FaLinkedin, FaYoutube, FaTiktok } from 'react-icons/fa';
import { BusinessCard } from '@/components/business/business-card';
import { ReviewsSection } from '@/components/reviews/reviews-section';
import { BusinessRating } from '@/components/business/business-rating';
import { LocationMap } from '@/components/map/location-map';
import { hasFeature } from '@/lib/package-features';
import type { BusinessPackage } from '@/lib/package-features';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const API_URL = `${API_BASE}/api/v1`;

async function getBusiness(slug: string) {
  try {
    const res = await fetch(`${API_URL}/businesses/slug/${slug}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch business:', error);
    return null;
  }
}

async function getBusinessPackage(businessId: string) {
  try {
    const res = await fetch(`${API_URL}/packages/business/${businessId}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    
    const text = await res.text();
    if (!text) return null;
    
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  } catch (error) {
    console.error('Failed to fetch business package:', error);
    return null;
  }
}

async function getRelatedBusinesses(categoryId: string, currentId: string) {
  try {
    const res = await fetch(`${API_URL}/businesses?categoryId=${categoryId}&limit=4`, {
      next: { revalidate: 600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const businesses = data.data || data || [];
    return businesses.filter((b: any) => b.id !== currentId).slice(0, 4);
  } catch (error) {
    return [];
  }
}

const dayNames: Record<string, string> = {
  SUNDAY: 'الأحد',
  MONDAY: 'الاثنين',
  TUESDAY: 'الثلاثاء',
  WEDNESDAY: 'الأربعاء',
  THURSDAY: 'الخميس',
  FRIDAY: 'الجمعة',
  SATURDAY: 'السبت',
};

const contactIcons: Record<string, any> = {
  FACEBOOK: FaFacebook,
  INSTAGRAM: FaInstagram,
  TWITTER: FaTwitter,
  WHATSAPP: FaWhatsapp,
  TELEGRAM: FaTelegram,
  LINKEDIN: FaLinkedin,
  YOUTUBE: FaYoutube,
  TIKTOK: FaTiktok,
};

function formatTimeValue(value: any) {
  if (!value) return '';
  // Accept plain HH:MM or full ISO/time strings
  const str = value.toString();
  if (str.length >= 5 && str.includes(':')) {
    return str.slice(0, 5);
  }
  return str;
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusiness(slug);
  if (!business) return { title: 'النشاط غير موجود' };
  return {
    title: business.metaTitleAr || business.nameAr,
    description: business.metaDescriptionAr || business.shortDescriptionAr,
  };
}

export default async function BusinessDetailPage({ params }: Props) {
  const { slug } = await params;
  const business = await getBusiness(slug);
  if (!business) notFound();

  const businessPackage = await getBusinessPackage(business.id);

  const relatedBusinesses = await (business.categoryId ? getRelatedBusinesses(business.categoryId, business.id) : []);

  const contacts = business.contacts || [];
  const workingHours = business.workingHours || [];
  const branches = business.branches || [];
  const media = business.media || [];
  const tags = business.tags || [];
  const persons = business.persons || [];
  const products = business.products || [];

  const socialContacts = contacts.filter((c: any) => 
    ['FACEBOOK', 'INSTAGRAM', 'TWITTER', 'LINKEDIN', 'YOUTUBE', 'TIKTOK', 'TELEGRAM'].includes(c.type)
  );
  const phoneContacts = contacts.filter((c: any) => ['PHONE', 'MOBILE', 'WHATSAPP'].includes(c.type));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative h-64 md:h-80 lg:h-96 bg-gradient-to-br from-primary-500 to-primary-700">
        {business.cover ? (
          <Image src={business.cover} alt={business.nameAr} fill className="object-cover" unoptimized />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white/20 text-[200px] font-bold">{business.nameAr?.charAt(0)}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute top-4 right-4 left-4">
          <nav className="container flex items-center gap-2 text-sm text-white/80">
            <Link href="/" className="hover:text-white transition-colors">الرئيسية</Link>
            <ChevronLeft className="w-4 h-4" />
            {business.category && (
              <>
                <Link href={business.category.parentId ? `/subcategory/${business.category.slug}` : `/category/${business.category.slug}`} className="hover:text-white transition-colors">
                  {business.category.nameAr}
                </Link>
                <ChevronLeft className="w-4 h-4" />
              </>
            )}
            <span className="text-white">{business.nameAr}</span>
          </nav>
        </div>
        <div className="absolute top-4 left-4 flex gap-2">
          {business.isFeatured && <span className="bg-amber-500 text-white text-sm px-3 py-1 rounded-lg font-medium">مميز</span>}
          {business.isPremium && <span className="bg-purple-500 text-white text-sm px-3 py-1 rounded-lg font-medium">بريميوم</span>}
        </div>
      </div>

      <div className="container py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6 -mt-24 relative z-10">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="shrink-0">
                  {business.logo ? (
                    <Image src={business.logo} alt={business.nameAr} width={120} height={120} className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover border-4 border-white shadow-lg" unoptimized />
                  ) : (
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-primary-100 flex items-center justify-center border-4 border-white shadow-lg">
                      <span className="text-primary-600 font-bold text-4xl">{business.nameAr?.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                        {business.nameAr}
                        {business.verificationStatus === 'VERIFIED' && <BadgeCheck className="w-6 h-6 text-primary-500" />}
                      </h1>
                      {business.nameEn && <p className="text-gray-500 mt-1">{business.nameEn}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Heart className="w-6 h-6" /></button>
                      <button className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"><Share2 className="w-6 h-6" /></button>
                    </div>
                  </div>
                  {business.category && (
                    <div className="flex flex-wrap items-center gap-4 mt-4">
                      <Link href={business.category.parentId ? `/subcategory/${business.category.slug}` : `/category/${business.category.slug}`} className="text-primary-600 hover:text-primary-700 font-medium transition-colors">
                        {business.category.icon} {business.category.nameAr}
                      </Link>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-600">
                    {(business.city || business.governorate) && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{business.city?.nameAr || business.governorate?.nameAr}</span>
                        {business.district && <span>، {business.district.nameAr}</span>}
                      </div>
                    )}
                    {business.establishedYear && (
                      <div className="flex items-center gap-1"><Calendar className="w-4 h-4" /><span>منذ {business.establishedYear}</span></div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-4">
                    <BusinessRating
                      slug={business.slug}
                      initialRating={business.averageRating}
                      initialCount={business.reviewsCount}
                    />
                    <div className="text-gray-500 text-sm">{Number(business.viewsCount || 0).toLocaleString()} مشاهدة</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">نبذة عن النشاط</h2>
              {hasFeature(businessPackage, 'SHOW_DESCRIPTION') ? (
                <div className="prose prose-gray max-w-none">
                  {business.descriptionAr ? (
                    business.descriptionAr.split('\n').map((p: string, i: number) => <p key={i} className="text-gray-600 leading-relaxed mb-3">{p}</p>)
                  ) : (
                    <p className="text-gray-400">لا يوجد وصف متاح</p>
                  )}
                </div>
              ) : (
                <div className="p-6 bg-gray-50 rounded-lg text-center">
                  <p className="text-gray-500">الوصف التفصيلي متاح في الباقات المدفوعة</p>
                </div>
              )}
              {tags.length > 0 && hasFeature(businessPackage, 'SHOW_DESCRIPTION') && (
                <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-gray-100">
                  {tags.map((tag: string) => (
                    <Link key={tag} href={`/search?q=${tag}`} className="px-3 py-1 bg-gray-100 hover:bg-primary-100 text-gray-600 hover:text-primary-600 rounded-lg text-sm transition-colors">#{tag}</Link>
                  ))}
                </div>
              )}
            </div>

            {media.length > 0 && hasFeature(businessPackage, 'SHOW_GALLERY') && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">معرض الصور</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {media.map((item: any) => (
                    <div key={item.id} className="aspect-square rounded-xl bg-gray-100 overflow-hidden">
                      {item.url ? (
                        <Image src={item.url} alt={item.title || business.nameAr} width={200} height={200} className="w-full h-full object-cover" unoptimized />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300"><span className="text-4xl">📷</span></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* قسم فريق العمل */}
            {persons.length > 0 && hasFeature(businessPackage, 'SHOW_TEAM') && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-6 h-6 text-primary-500" />
                  <h2 className="text-xl font-bold text-gray-900">يعمل هنا</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {persons.filter((p: any) => p.isActive !== false).map((person: any) => (
                    <div key={person.id} className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-primary-50 transition-colors">
                      <div className="shrink-0">
                        {person.photo ? (
                          <Image 
                            src={person.photo} 
                            alt={person.nameAr} 
                            width={64} 
                            height={64} 
                            className="w-16 h-16 rounded-full object-cover border-2 border-white shadow" 
                            unoptimized 
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center border-2 border-white shadow">
                            <span className="text-primary-600 font-bold text-xl">{person.nameAr?.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900">{person.nameAr}</h3>
                        {person.nameEn && <p className="text-xs text-gray-500">{person.nameEn}</p>}
                        {person.positionAr && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full">
                            {person.positionAr}
                          </span>
                        )}
                        {person.bioAr && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{person.bioAr}</p>}
                        <div className="flex gap-2 mt-2">
                          {person.phone && (
                            <a 
                              href={`tel:${person.phone}`} 
                              className="p-1.5 rounded-lg bg-white hover:bg-primary-100 text-gray-500 hover:text-primary-600 transition-colors"
                            >
                              <Phone className="w-4 h-4" />
                            </a>
                          )}
                          {person.email && (
                            <a 
                              href={`mailto:${person.email}`} 
                              className="p-1.5 rounded-lg bg-white hover:bg-primary-100 text-gray-500 hover:text-primary-600 transition-colors"
                            >
                              <Mail className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* قسم المنتجات والخدمات */}
            {products.length > 0 && hasFeature(businessPackage, 'SHOW_PRODUCTS') && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="w-6 h-6 text-primary-500" />
                  <h2 className="text-xl font-bold text-gray-900">
                    {products.every((p: any) => p.type === 'SERVICE') ? 'خدماتنا' : 
                     products.every((p: any) => p.type === 'PRODUCT') ? 'منتجاتنا' : 'منتجاتنا وخدماتنا'}
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.filter((p: any) => p.isActive !== false).map((product: any) => (
                    <div key={product.id} className="rounded-xl bg-gray-50 overflow-hidden hover:shadow-md transition-shadow">
                      {product.image ? (
                        <div className="aspect-video relative">
                          <Image 
                            src={product.image} 
                            alt={product.nameAr} 
                            fill 
                            className="object-cover" 
                            unoptimized 
                          />
                          {product.isFeatured && (
                            <span className="absolute top-2 right-2 px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                              مميز
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="aspect-video bg-gray-200 flex items-center justify-center">
                          <Package className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">{product.nameAr}</h3>
                            {product.nameEn && <p className="text-xs text-gray-500">{product.nameEn}</p>}
                          </div>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            product.type === 'SERVICE' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {product.type === 'SERVICE' ? 'خدمة' : 'منتج'}
                          </span>
                        </div>
                        {product.descriptionAr && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{product.descriptionAr}</p>
                        )}
                        {(product.price || product.priceNote) && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            {product.price ? (
                              <div className="flex items-baseline gap-1">
                                <span className="text-lg font-bold text-primary-600">
                                  {Number(product.price).toLocaleString()}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {product.currency === 'USD' ? '$' : product.currency === 'EUR' ? '€' : 'ل.س'}
                                </span>
                              </div>
                            ) : null}
                            {product.priceNote && (
                              <p className="text-xs text-gray-500 mt-1">{product.priceNote}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {branches.filter((b: any) => b.isActive !== false).length > 0 && hasFeature(businessPackage, 'SHOW_BRANCHES') && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">الفروع</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {branches.filter((b: any) => b.isActive !== false).map((branch: any) => (
                    <div key={branch.id} className="p-4 rounded-xl border-2 border-gray-200">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            {branch.nameAr}
                          </h3>
                          <p className="text-gray-600 text-sm mt-1">{branch.addressAr}</p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {branch.phone && (
                            <a 
                              href={`tel:${branch.phone}`} 
                              className="flex items-center gap-1 text-primary-600 text-sm hover:text-primary-700 transition-colors" 
                              dir="ltr"
                            >
                              <Phone className="w-4 h-4" />
                              {branch.phone}
                            </a>
                          )}
                        </div>

                        {branch.latitude != null && branch.longitude != null && (
                          <a
                            href={`https://www.google.com/maps?q=${branch.latitude},${branch.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors text-sm font-medium"
                          >
                            <Navigation className="w-4 h-4" />
                            عرض على الخريطة
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasFeature(businessPackage, 'SHOW_REVIEWS') && (
              <ReviewsSection
                businessId={business.id}
                businessSlug={business.slug}
                businessName={business.nameAr}
              />
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-4">معلومات التواصل</h3>
              
              {hasFeature(businessPackage, 'SHOW_PHONE') && phoneContacts.filter((c: any) => c.type !== 'WHATSAPP').length > 0 && (
                <div className="space-y-3">
                  {phoneContacts.filter((c: any) => c.type !== 'WHATSAPP').map((contact: any) => (
                    <a key={contact.id} href={`tel:${contact.value}`} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-primary-50 transition-colors group">
                      <div className="w-10 h-10 rounded-lg bg-primary-500 flex items-center justify-center"><Phone className="w-5 h-5 text-white" /></div>
                      <div className="flex-1">
                        <span className="text-sm text-gray-500">{contact.label || contact.type}</span>
                        <p className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors" dir="ltr">{contact.value}</p>
                      </div>
                    </a>
                  ))}
                </div>
              )}

              {hasFeature(businessPackage, 'SHOW_WHATSAPP') && phoneContacts.filter((c: any) => c.type === 'WHATSAPP').length > 0 && (
                <div className="space-y-3">
                  {phoneContacts.filter((c: any) => c.type === 'WHATSAPP').map((contact: any) => (
                    <a key={contact.id} href={`https://wa.me/${contact.value.replace(/\D/g, '')}`} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-primary-50 transition-colors group">
                      <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center"><FaWhatsapp className="w-5 h-5 text-white" /></div>
                      <div className="flex-1">
                        <span className="text-sm text-gray-500">{contact.label || 'واتساب'}</span>
                        <p className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors" dir="ltr">{contact.value}</p>
                      </div>
                    </a>
                  ))}
                </div>
              )}

              {hasFeature(businessPackage, 'SHOW_EMAIL') && contacts.filter((c: any) => c.type === 'EMAIL').length > 0 && (
                <div className="space-y-3">
                  {contacts.filter((c: any) => c.type === 'EMAIL').map((contact: any) => (
                    <a key={contact.id} href={`mailto:${contact.value}`} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-primary-50 transition-colors group">
                      <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-gray-500">{contact.label || 'البريد الإلكتروني'}</span>
                        <p className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors truncate">{contact.value}</p>
                      </div>
                    </a>
                  ))}
                </div>
              )}

              {hasFeature(businessPackage, 'SHOW_WEBSITE') && contacts.filter((c: any) => c.type === 'WEBSITE').length > 0 && (
                <div className="space-y-3">
                  {contacts.filter((c: any) => c.type === 'WEBSITE').map((contact: any) => (
                    <a key={contact.id} href={contact.value} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-primary-50 transition-colors group">
                      <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                        <Globe className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-gray-500">{contact.label || 'الموقع الإلكتروني'}</span>
                        <p className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors truncate">{contact.value.replace(/^https?:\/\//, '')}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </a>
                  ))}
                </div>
              )}

              {hasFeature(businessPackage, 'SHOW_SOCIAL_LINKS') && socialContacts.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h4 className="text-sm font-medium text-gray-500 mb-3">تابعنا على</h4>
                  <div className="flex flex-wrap gap-2">
                    {socialContacts.map((contact: any) => {
                      const Icon = contactIcons[contact.type];
                      return (
                        <a key={contact.id} href={contact.value} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-primary-100 flex items-center justify-center text-gray-600 hover:text-primary-600 transition-colors">
                          {Icon && <Icon className="w-5 h-5" />}
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {workingHours.length > 0 && hasFeature(businessPackage, 'SHOW_WORKING_HOURS') && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-3"><Clock className="w-5 h-5 text-gray-400" /><h4 className="font-medium text-gray-900">أوقات العمل</h4></div>
                  <div className="space-y-2">
                    {workingHours.map((wh: any) => {
                      const open = formatTimeValue(wh.openTime ?? wh.open ?? wh.startTime ?? wh.start);
                      const close = formatTimeValue(wh.closeTime ?? wh.close ?? wh.endTime ?? wh.end);
                      let label = 'غير محدد';

                      if (wh.isClosed) {
                        label = 'مغلق';
                      } else if (open || close) {
                        label = `${open || '—'} - ${close || '—'}`;
                      } else if (wh.is24Hours) {
                        label = 'طوال اليوم';
                      }

                      return (
                        <div key={wh.id || wh.day} className="flex justify-between text-sm">
                          <span className="text-gray-600">{dayNames[wh.dayOfWeek || wh.day] || wh.dayOfWeek || wh.day}</span>
                          <span className={wh.isClosed ? 'text-red-500' : 'text-gray-900'}>{label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {(business.addressAr || business.city) && hasFeature(businessPackage, 'SHOW_ADDRESS') && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-3"><MapPin className="w-5 h-5 text-gray-400" /><h4 className="font-medium text-gray-900">العنوان</h4></div>
                  <p className="text-gray-600 text-sm mb-3">
                    {business.addressAr}{business.addressAr && <br />}
                    {business.district?.nameAr && `${business.district.nameAr}، `}{business.city?.nameAr || business.governorate?.nameAr}
                  </p>
                </div>
              )}

              {business.latitude && business.longitude && hasFeature(businessPackage, 'SHOW_MAP') && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-3"><Navigation className="w-5 h-5 text-gray-400" /><h4 className="font-medium text-gray-900">الموقع على الخريطة</h4></div>
                  <LocationMap
                    latitude={business.latitude}
                    longitude={business.longitude}
                    name={business.nameAr}
                    address={`${business.addressAr || ''} ${business.city?.nameAr || business.governorate?.nameAr || ''}`.trim()}
                    height="300px"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {relatedBusinesses.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">أنشطة مشابهة</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedBusinesses.map((b: any) => <BusinessCard key={b.id} business={b} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
