'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, use } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, Loader2, Save, Users, Package, Shield, UserCheck } from 'lucide-react';
import { uploadApi, type Category, type City, type DayOfWeek, type District, type Governorate, type BusinessPerson, type BusinessProduct, type BusinessBranch } from '@/lib/api';
import {
  useBusiness,
  useCategories,
  useCities,
  useDistricts,
  useGovernorates,
  useUpdateBusiness,
  useBusinessPackage,
  useAssignPackage,
  usePackages,
} from '@/lib/hooks';
import { LocationPicker } from '@/components/map/location-picker';
import { PersonsManager } from '@/components/business/persons-manager';
import { ProductsManager } from '@/components/business/products-manager';
import { BranchesManager } from '@/components/business/branches-manager';
import { PackageSelector } from '@/components/packages/package-selector';
import { OwnerManagementSection } from '@/components/business';
import { OwnershipAuditList } from '@/components/business/ownership-audit-list';

type WorkingHoursForm = {
  day: DayOfWeek;
  isClosed: boolean;
  openTime: string;
  closeTime: string;
};

const days: { key: DayOfWeek; label: string }[] = [
  { key: 'SUNDAY', label: 'الأحد' },
  { key: 'MONDAY', label: 'الإثنين' },
  { key: 'TUESDAY', label: 'الثلاثاء' },
  { key: 'WEDNESDAY', label: 'الأربعاء' },
  { key: 'THURSDAY', label: 'الخميس' },
  { key: 'FRIDAY', label: 'الجمعة' },
  { key: 'SATURDAY', label: 'السبت' },
];

function emptyWorkingHours(): WorkingHoursForm[] {
  return days.map((d) => ({ day: d.key, isClosed: false, openTime: '09:00', closeTime: '17:00' }));
}

export default function EditBusinessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data: business, isLoading: isBusinessLoading } = useBusiness(id);
  const { data: categoriesTree, isLoading: isCategoriesLoading } = useCategories({ includeChildren: true });
  const { data: governoratesResponse, isLoading: isGovLoading } = useGovernorates();

  const [selectedGovernorate, setSelectedGovernorate] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');

  const { data: citiesResponse, isLoading: isCitiesLoading } = useCities(selectedGovernorate || undefined);
  const { data: districtsResponse, isLoading: isDistrictsLoading } = useDistricts(selectedCity || undefined);

  const governorates = useMemo<Governorate[]>(() => {
    return Array.isArray(governoratesResponse)
      ? (governoratesResponse as Governorate[])
      : Array.isArray((governoratesResponse as any)?.data)
        ? (((governoratesResponse as any).data ?? []) as Governorate[])
        : [];
  }, [governoratesResponse]);

  const cities = useMemo<City[]>(() => {
    return Array.isArray(citiesResponse)
      ? (citiesResponse as City[])
      : Array.isArray((citiesResponse as any)?.data)
        ? (((citiesResponse as any).data ?? []) as City[])
        : [];
  }, [citiesResponse]);

  const districts = useMemo<District[]>(() => {
    return Array.isArray(districtsResponse)
      ? (districtsResponse as District[])
      : Array.isArray((districtsResponse as any)?.data)
        ? (((districtsResponse as any).data ?? []) as District[])
        : [];
  }, [districtsResponse]);

  const updateBusiness = useUpdateBusiness();
  const { data: currentPackage } = useBusinessPackage(id);
  const assignPackage = useAssignPackage();
  const { data: allPackagesData } = usePackages({ status: 'ACTIVE' });

  const [activeTab, setActiveTab] = useState<'basic' | 'location' | 'branches' | 'contacts' | 'hours' | 'owner' | 'package' | 'team' | 'products' | 'media'>('basic');
  const [initialized, setInitialized] = useState(false);

  // Basic
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [shortDescAr, setShortDescAr] = useState('');
  const [shortDescEn, setShortDescEn] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState<string>('');
  const [status, setStatus] = useState<'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'CLOSED'>('DRAFT');
  const [isFeatured, setIsFeatured] = useState(false);

  // Package
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [durationDays, setDurationDays] = useState<number>(0);
  const [customExpiryDate, setCustomExpiryDate] = useState<string>('');

  // Location
  const [districtId, setDistrictId] = useState('');
  const [addressAr, setAddressAr] = useState('');
  const [addressEn, setAddressEn] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  const initialLocationRef = useRef<{
    governorateId: string;
    cityId: string;
    districtId: string;
    latitude: string;
    longitude: string;
  } | null>(null);

  // Contacts
  const [phone1, setPhone1] = useState('');
  const [phone2, setPhone2] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [telegram, setTelegram] = useState('');

  // Hours
  const [workingHours, setWorkingHours] = useState<WorkingHoursForm[]>(emptyWorkingHours());

  // Branches
  const [branches, setBranches] = useState<BusinessBranch[]>([]);

  // Media
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [coverUrl, setCoverUrl] = useState<string>('');
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);

  // Team
  const [persons, setPersons] = useState<BusinessPerson[]>([]);

  // Products & Services
  const [products, setProducts] = useState<BusinessProduct[]>([]);

  const flatCategories = useMemo(() => {
    const result: { id: string; nameAr: string; depth: number }[] = [];
    const walk = (nodes: Category[], depth: number) => {
      for (const node of nodes) {
        result.push({ id: node.id, nameAr: node.nameAr, depth });
        if (Array.isArray((node as any).children) && (node as any).children.length > 0) {
          walk((node as any).children as Category[], depth + 1);
        }
      }
    };
    if (Array.isArray(categoriesTree)) walk(categoriesTree as Category[], 0);
    return result;
  }, [categoriesTree]);

  // Get max branches from selected package
  const maxBranchesAllowed = useMemo(() => {
    const packages = Array.isArray(allPackagesData)
      ? allPackagesData
      : Array.isArray((allPackagesData as any)?.data)
        ? (allPackagesData as any).data
        : [];
    
    const packageId = selectedPackageId || currentPackage?.packageId;
    if (!packageId) return 1; // Default
    
    const pkg = packages.find((p: any) => p.id === packageId);
    if (!pkg) return 1;
    
    const branchLimit = pkg.limits?.find((l: any) => l.limitKey === 'MAX_BRANCHES');
    return branchLimit?.limitValue || 1;
  }, [allPackagesData, selectedPackageId, currentPackage]);

  useEffect(() => {
    if (!business || initialized) return;

    if (!initialLocationRef.current) {
      initialLocationRef.current = {
        governorateId: (business as any).governorateId ?? '',
        cityId: (business as any).cityId ?? '',
        districtId: (business as any).districtId ?? '',
        latitude: (business as any).latitude?.toString?.() ?? '',
        longitude: (business as any).longitude?.toString?.() ?? '',
      };
    }

    setNameAr(business.nameAr ?? '');
    setNameEn(business.nameEn ?? '');
    setSlug(business.slug ?? '');
    setDescriptionAr(business.descriptionAr ?? '');
    setDescriptionEn(business.descriptionEn ?? '');
    setShortDescAr((business as any).shortDescAr ?? '');
    setShortDescEn((business as any).shortDescEn ?? '');
    setTags((business as any).tags?.join?.(', ') ?? '');
    setStatus((business as any).status ?? 'DRAFT');
    setIsFeatured(Boolean((business as any).isFeatured));

    const categories = ((business as any).categories ?? []) as any[];
    const primary = categories.find((c) => c.isPrimary)?.category ?? categories[0]?.category;
    setCategoryId(primary?.id ?? '');

    setSelectedGovernorate((business as any).governorateId ?? '');
    setSelectedCity((business as any).cityId ?? '');
    setDistrictId((business as any).districtId ?? '');
    setAddressAr((business as any).addressAr ?? '');
    setAddressEn((business as any).addressEn ?? '');
    setLatitude((business as any).latitude?.toString() ?? '');
    setLongitude((business as any).longitude?.toString() ?? '');

    const contacts = ((business as any).contacts ?? []) as { type: string; value: string }[];
    const phones = contacts.filter((c) => c.type === 'PHONE' || c.type === 'MOBILE').map((c) => c.value);
    setPhone1(phones[0] ?? '');
    setPhone2(phones[1] ?? '');
    setWhatsapp(contacts.find((c) => c.type === 'WHATSAPP')?.value ?? '');
    setEmail(contacts.find((c) => c.type === 'EMAIL')?.value ?? '');
    setWebsite(contacts.find((c) => c.type === 'WEBSITE')?.value ?? '');
    setFacebook(contacts.find((c) => c.type === 'FACEBOOK')?.value ?? '');
    setInstagram(contacts.find((c) => c.type === 'INSTAGRAM')?.value ?? '');
    setTelegram(contacts.find((c) => c.type === 'TELEGRAM')?.value ?? '');

    const wh = ((business as any).workingHours ?? []) as { dayOfWeek: DayOfWeek; isClosed?: boolean; openTime?: string; closeTime?: string }[];
    if (wh.length) {
      setWorkingHours(
        days.map((d) => {
          const found = wh.find((x) => x.dayOfWeek === d.key);
          return {
            day: d.key,
            isClosed: Boolean(found?.isClosed),
            openTime: found?.openTime ?? '09:00',
            closeTime: found?.closeTime ?? '17:00',
          };
        })
      );
    }

    setLogoUrl((business as any).logo ?? '');
    setCoverUrl((business as any).cover ?? '');
    const media = ((business as any).media ?? []) as { type: string; url: string }[];
    setGalleryUrls(media.filter((m) => m.type === 'GALLERY' || m.type === 'IMAGE').map((m) => m.url));

    // Load branches
    const loadedBranches = ((business as any).branches ?? []) as BusinessBranch[];
    setBranches(loadedBranches.map((b: any) => ({
      id: b.id,
      businessId: b.businessId,
      nameAr: b.nameAr ?? '',
      nameEn: b.nameEn ?? '',
      cityId: b.cityId ?? '',
      districtId: b.districtId ?? null,
      addressAr: b.addressAr ?? '',
      addressEn: b.addressEn ?? '',
      // Prisma Decimal serializes to string in JSON; normalize to number for UI
      latitude:
        typeof b.latitude === 'number'
          ? b.latitude
          : b.latitude != null && b.latitude !== ''
            ? Number(b.latitude)
            : null,
      longitude:
        typeof b.longitude === 'number'
          ? b.longitude
          : b.longitude != null && b.longitude !== ''
            ? Number(b.longitude)
            : null,
      phone: b.phone ?? '',
      isMain: b.isMain ?? false,
      isActive: b.isActive ?? true,
      sortOrder: b.sortOrder ?? 0,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    })));

    // Load persons (team)
    const loadedPersons = ((business as any).persons ?? []) as BusinessPerson[];
    setPersons(loadedPersons.map((p: any) => ({
      id: p.id,
      nameAr: p.nameAr ?? '',
      nameEn: p.nameEn ?? '',
      positionAr: p.positionAr ?? '',
      positionEn: p.positionEn ?? '',
      bioAr: p.bioAr ?? '',
      bioEn: p.bioEn ?? '',
      photo: p.photo ?? '',
      phone: p.phone ?? '',
      email: p.email ?? '',
      isPublic: p.isPublic ?? true,
      sortOrder: p.sortOrder ?? 0,
    })));

    // Load products
    const loadedProducts = ((business as any).products ?? []) as BusinessProduct[];
    setProducts(loadedProducts.map((p: any) => ({
      id: p.id,
      type: p.type ?? 'PRODUCT',
      nameAr: p.nameAr ?? '',
      nameEn: p.nameEn ?? '',
      descriptionAr: p.descriptionAr ?? '',
      descriptionEn: p.descriptionEn ?? '',
      image: p.image ?? '',
      price: p.price ?? undefined,
      currency: p.currency ?? 'SYP',
      priceNote: p.priceNote ?? '',
      isAvailable: p.isAvailable ?? true,
      isFeatured: p.isFeatured ?? false,
      sortOrder: p.sortOrder ?? 0,
    })));

    setInitialized(true);
  }, [business, initialized]);

  // Load current package
  useEffect(() => {
    if (currentPackage?.packageId) {
      setSelectedPackageId(currentPackage.packageId);
    }
  }, [currentPackage]);

  const canSubmit = Boolean(nameAr.trim() && selectedGovernorate && selectedCity);

  const buildPayload = (nextStatus?: typeof status) => {
    const contacts: { type: string; value: string }[] = [];
    const pushContact = (type: string, value: string) => {
      const v = value.trim();
      if (v) contacts.push({ type, value: v });
    };

    pushContact('PHONE', phone1);
    pushContact('PHONE', phone2);
    pushContact('WHATSAPP', whatsapp);
    pushContact('EMAIL', email);
    pushContact('WEBSITE', website);
    pushContact('FACEBOOK', facebook);
    pushContact('INSTAGRAM', instagram);
    pushContact('TELEGRAM', telegram);

    const payload: any = {
      nameAr: nameAr.trim(),
      nameEn: nameEn.trim() || undefined,
      slug: slug.trim() || undefined,
      descriptionAr: descriptionAr.trim() || undefined,
      descriptionEn: descriptionEn.trim() || undefined,
      shortDescAr: shortDescAr.trim() || undefined,
      shortDescEn: shortDescEn.trim() || undefined,
      metaKeywordsAr: tags.trim() || undefined,
      categoryIds: categoryId ? [categoryId] : [],
      governorateId: selectedGovernorate,
      cityId: selectedCity,
      districtId: districtId || undefined,
      addressAr: addressAr.trim() || undefined,
      addressEn: addressEn.trim() || undefined,
      latitude: latitude.trim() ? Number(latitude) : undefined,
      longitude: longitude.trim() ? Number(longitude) : undefined,
      contacts,
      workingHours: workingHours.map((d) => ({
        dayOfWeek: d.day,
        isClosed: d.isClosed,
        openTime: d.isClosed ? undefined : d.openTime,
        closeTime: d.isClosed ? undefined : d.closeTime,
      })),
      // Branches - مع التحقق من الإحداثيات
      branches: branches
        .filter((b) => {
          const hasName = b.nameAr?.trim();
          const hasCity = b.cityId;
          
          if (!hasName || !hasCity) {
            console.warn('⚠️ فرع تم تجاهله:', {
              السبب: !hasName ? '❌ الاسم العربي فارغ - يجب ملء الاسم!' : 'المدينة غير محددة',
              الاسم: b.nameAr || '(فارغ)',
              المدينة: b.cityId || '(غير محدد)'
            });
          }
          
          return hasName && hasCity;
        })
        .map((b, i) => {
          const { id: _ignoreId, businessId: _ignoreBId, createdAt: _ignoreCA, updatedAt: _ignoreUA, ...rest } = b as any;
          const clean: any = {};
          Object.entries(rest).forEach(([k, v]) => {
            // إبقاء القيم العددية (0, false) و null/undefined في الإحداثيات
            if (k === 'latitude' || k === 'longitude') {
              if (v !== null && v !== undefined && v !== '') {
                clean[k] = typeof v === 'string' ? parseFloat(v) : v;
              }
            } else if (v !== '' && v != null) {
              clean[k] = v;
            }
          });
          clean.sortOrder = i;
          // Main address is stored on the business itself; branches are always additional
          clean.isMain = false;
          return clean;
        }),
      // Team (persons) — strip `id` and empty fields to satisfy API ValidationPipe
      persons: persons
        .filter((p) => p.nameAr?.trim())
        .map((p, i) => {
          const { id: _ignoreId, ...rest } = p as any;
          const clean: any = {};
          Object.entries(rest).forEach(([k, v]) => {
            if (v !== '' && v != null) clean[k] = v;
          });
          clean.sortOrder = i;
          return clean;
        }),
      // Products & Services — strip `id` and empty fields to satisfy API ValidationPipe
      products: products
        .filter((p) => p.nameAr?.trim())
        .map((p, i) => {
          const { id: _ignoreId, ...rest } = p as any;
          const clean: any = {};
          Object.entries(rest).forEach(([k, v]) => {
            if (v !== '' && v != null) clean[k] = v;
          });
          clean.sortOrder = i;
          return clean;
        }),
      logo: logoUrl || undefined,
      cover: coverUrl || undefined,
      media: galleryUrls.map((url, i) => ({ type: 'GALLERY', url, sortOrder: i })),
      isFeatured,
    };

    if (nextStatus) payload.status = nextStatus;
    return payload;
  };

  const handleSave = async (nextStatus?: typeof status) => {
    if (!canSubmit || !id) return;
    console.log('🔍 Branches state before buildPayload:', branches);
    
    // تحقق من سلامة البيانات
    const invalidBranches = branches.filter(b => {
      const hasRequiredFields = b.nameAr?.trim() && b.cityId;
      const hasCoords = typeof b.latitude === 'number' && typeof b.longitude === 'number';
      
      if (hasRequiredFields && !hasCoords) {
        console.warn('⚠️ تحذير: الفرع بدون إحداثيات جغرافية:', { 
          nameAr: b.nameAr, 
          latitude: b.latitude, 
          longitude: b.longitude,
          latitudeType: typeof b.latitude,
          longitudeType: typeof b.longitude
        });
        alert(`⚠️ الفرع "${b.nameAr}" بدون إحداثيات جغرافية كاملة!\n\nيرجى:\n1. انقر على الخريطة لتحديد الموقع\n2. أو أدخل الإحداثيات يدوياً`);
        return true; // Invalid
      }
      
      return false;
    });
    
    if (invalidBranches.length > 0) {
      console.warn(`❌ ${invalidBranches.length} فرع بدون إحداثيات كاملة`);
      return;
    }
    
    // Update package FIRST if changed (before updating business data)
    // This ensures limits are checked against the NEW package, not the old/expired one
    if (selectedPackageId && selectedPackageId !== currentPackage?.packageId) {
      // التحقق من الباقة الافتراضية - لا ترسل تاريخ أو مدة
      const allPackages = Array.isArray(allPackagesData) ? allPackagesData : (allPackagesData as any)?.data || [];
      const selectedPkg = allPackages.find((p: any) => p.id === selectedPackageId);
      
      await assignPackage.mutateAsync({
        businessId: id,
        packageId: selectedPackageId,
        // لا ترسل customExpiryDate أو durationDays للباقة الافتراضية
        ...(!selectedPkg?.isDefault && {
          customExpiryDate: customExpiryDate || undefined,
          durationDays: durationDays || undefined,
        }),
      });
    }
    
    const payload = buildPayload(nextStatus);
    console.log('📤 Update payload:', JSON.stringify(payload, null, 2));
    await updateBusiness.mutateAsync({ id, data: payload });
    
    router.push(`/businesses/${id}`);
  };

  const handleUpload = async (file: File, kind: 'logo' | 'cover' | 'gallery') => {
    const res = await uploadApi.uploadImage(file, 'businesses');
    const url = res.data.url;
    if (kind === 'logo') setLogoUrl(url);
    if (kind === 'cover') setCoverUrl(url);
    if (kind === 'gallery') setGalleryUrls((prev) => [...prev, url]);
  };

  // Auto-center map based on selected location hierarchy (instant, with OSM geocoding fallback)
  useEffect(() => {
    if (!initialized) return;

    // Preserve the existing business coordinates on initial load until user changes the location selection
    const initial = initialLocationRef.current;
    const shouldPreserveExistingCoords =
      Boolean(initial) &&
      selectedGovernorate === (initial?.governorateId ?? '') &&
      selectedCity === (initial?.cityId ?? '') &&
      districtId === (initial?.districtId ?? '') &&
      Boolean(latitude.trim()) &&
      Boolean(longitude.trim());

    if (shouldPreserveExistingCoords) return;

    const geocodeCacheRef = (globalThis as any).__greenpagesGeocodeCacheEdit || new Map<string, { lat: number; lng: number }>();
    (globalThis as any).__greenpagesGeocodeCacheEdit = geocodeCacheRef;

    let aborted = false;
    const controller = new AbortController();

    const gov = governorates.find((g) => g.id === selectedGovernorate);
    const city = cities.find((c) => c.id === selectedCity);
    const district = districts.find((d) => d.id === districtId);

    const pickCenter = () => {
      if (district?.latitude != null && district?.longitude != null) return { lat: district.latitude, lng: district.longitude };
      if (city?.latitude != null && city?.longitude != null) return { lat: city.latitude, lng: city.longitude };
      if (gov?.latitude != null && gov?.longitude != null) return { lat: gov.latitude, lng: gov.longitude };
      return undefined;
    };

    const buildQuery = () => {
      const parts: string[] = [];
      if (district?.nameAr) parts.push(district.nameAr);
      if (city?.nameAr) parts.push(city.nameAr);
      if (gov?.nameAr) parts.push(gov.nameAr);
      parts.push('سوريا');
      return parts.filter(Boolean).join(', ');
    };

    const applyCenter = (lat: number, lng: number) => {
      setLatitude(String(lat));
      setLongitude(String(lng));
    };

    const immediate = pickCenter();
    if (immediate) {
      applyCenter(immediate.lat, immediate.lng);
      return () => {
        aborted = true;
        controller.abort();
      };
    }

    const query = buildQuery();
    if (!query || query === 'سوريا') {
      return () => {
        aborted = true;
        controller.abort();
      };
    }

    const cacheKey = query;
    const cached = geocodeCacheRef.get(cacheKey);
    if (cached) {
      applyCenter(cached.lat, cached.lng);
      return () => {
        aborted = true;
        controller.abort();
      };
    }

    (async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=sy&q=${encodeURIComponent(query)}`;
        const res = await fetch(url, {
          signal: controller.signal,
          headers: { 'Accept-Language': 'ar', 'User-Agent': 'greenpages-admin/1.0' },
        });
        const data = await res.json();
        if (aborted) return;
        if (Array.isArray(data) && data.length > 0) {
          const lat = Number.parseFloat(data[0].lat);
          const lng = Number.parseFloat(data[0].lon);
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            geocodeCacheRef.set(cacheKey, { lat, lng });
            applyCenter(lat, lng);
          }
        }
      } catch (e) {
        // ignore (network / aborted)
      }
    })();

    return () => {
      aborted = true;
      controller.abort();
    };
  }, [initialized, selectedGovernorate, selectedCity, districtId, governorates, cities, districts]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Link href="/businesses" className="hover:text-gray-900">
              الأنشطة التجارية
            </Link>
            <ArrowRight className="w-4 h-4" />
            <span className="text-gray-900">تعديل نشاط</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">تعديل نشاط تجاري</h1>
          <p className="text-gray-600 mt-2">تحديث بيانات النشاط وربطها بقاعدة البيانات</p>
        </div>
        <button
          onClick={() => handleSave()}
          disabled={!canSubmit || updateBusiness.isPending}
          className="btn btn-primary"
        >
          {updateBusiness.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          حفظ
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          {isBusinessLoading ? (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري تحميل البيانات...
            </div>
          ) : !business ? (
            <div className="text-gray-600">لم يتم العثور على النشاط</div>
          ) : (
            <>
              <div className="flex gap-2 border-b mb-6 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('basic')}
                  className={`px-4 py-2 font-medium whitespace-nowrap ${
                    activeTab === 'basic' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'
                  }`}
                >
                  معلومات أساسية
                </button>
                <button
                  onClick={() => setActiveTab('location')}
                  className={`px-4 py-2 font-medium whitespace-nowrap ${
                    activeTab === 'location' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'
                  }`}
                >
                  الموقع
                </button>
                <button
                  onClick={() => setActiveTab('branches')}
                  className={`px-4 py-2 font-medium whitespace-nowrap ${
                    activeTab === 'branches' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'
                  }`}
                >
                  الفروع
                </button>
                <button
                  onClick={() => setActiveTab('contacts')}
                  className={`px-4 py-2 font-medium whitespace-nowrap ${
                    activeTab === 'contacts' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'
                  }`}
                >
                  التواصل
                </button>
                <button
                  onClick={() => setActiveTab('hours')}
                  className={`px-4 py-2 font-medium whitespace-nowrap ${
                    activeTab === 'hours' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'
                  }`}
                >
                  ساعات العمل
                </button>
                <button
                  onClick={() => setActiveTab('owner')}
                  className={`px-4 py-2 font-medium whitespace-nowrap ${
                    activeTab === 'owner' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'
                  }`}
                >
                  <UserCheck className="w-4 h-4 inline mr-1" />
                  المالك
                </button>
                <button
                  onClick={() => setActiveTab('package')}
                  className={`px-4 py-2 font-medium whitespace-nowrap ${
                    activeTab === 'package' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'
                  }`}
                >
                  الباقة
                </button>
                <button
                  onClick={() => setActiveTab('team')}
                  className={`px-4 py-2 font-medium whitespace-nowrap ${
                    activeTab === 'team' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'
                  }`}
                >
                  فريق العمل
                </button>
                <button
                  onClick={() => setActiveTab('products')}
                  className={`px-4 py-2 font-medium whitespace-nowrap ${
                    activeTab === 'products' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'
                  }`}
                >
                  المنتجات والخدمات
                </button>
                <button
                  onClick={() => setActiveTab('media')}
                  className={`px-4 py-2 font-medium whitespace-nowrap ${
                    activeTab === 'media' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'
                  }`}
                >
                  الصور
                </button>
              </div>

              {activeTab === 'basic' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">الاسم بالعربية *</label>
                      <input value={nameAr} onChange={(e) => setNameAr(e.target.value)} className="input" />
                    </div>
                    <div>
                      <label className="label">الاسم بالإنجليزية</label>
                      <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} className="input" />
                    </div>
                    <div>
                      <label className="label">Slug</label>
                      <input value={slug} onChange={(e) => setSlug(e.target.value)} className="input" />
                    </div>
                    <div>
                      <label className="label">التصنيف</label>
                      <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="select"
                        disabled={isCategoriesLoading}
                      >
                        <option value="">بدون</option>
                        {flatCategories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {'— '.repeat(c.depth)}
                            {c.nameAr}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">وصف مختصر بالعربية</label>
                      <textarea value={shortDescAr} onChange={(e) => setShortDescAr(e.target.value)} className="textarea" />
                    </div>
                    <div>
                      <label className="label">وصف مختصر بالإنجليزية</label>
                      <textarea value={shortDescEn} onChange={(e) => setShortDescEn(e.target.value)} className="textarea" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">الوصف بالعربية</label>
                      <textarea value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} className="textarea" rows={6} />
                    </div>
                    <div>
                      <label className="label">الوصف بالإنجليزية</label>
                      <textarea value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} className="textarea" rows={6} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">الكلمات المفتاحية (مفصولة بفواصل)</label>
                      <input value={tags} onChange={(e) => setTags(e.target.value)} className="input" />
                    </div>
                    <div className="flex items-center gap-2 pt-7">
                      <input
                        id="featured"
                        type="checkbox"
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                      />
                      <label htmlFor="featured" className="text-sm text-gray-700">
                        مميز
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">الحالة</label>
                      <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="select">
                        <option value="DRAFT">مسودة</option>
                        <option value="PENDING">قيد المراجعة</option>
                        <option value="APPROVED">مُعتمد</option>
                        <option value="REJECTED">مرفوض</option>
                        <option value="SUSPENDED">موقوف</option>
                        <option value="CLOSED">مغلق</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => handleSave(status)}
                        disabled={!canSubmit || updateBusiness.isPending}
                        className="btn btn-secondary"
                      >
                        حفظ مع تغيير الحالة
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'location' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="label">المحافظة *</label>
                      <select
                        value={selectedGovernorate}
                        onChange={(e) => {
                          setSelectedGovernorate(e.target.value);
                          setSelectedCity('');
                          setDistrictId('');
                        }}
                        className="select"
                        disabled={isGovLoading}
                      >
                        <option value="">اختر</option>
                        {(governorates ?? []).map((g: any) => (
                          <option key={g.id} value={g.id}>
                            {g.nameAr}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">المدينة *</label>
                      <select
                        value={selectedCity}
                        onChange={(e) => {
                          setSelectedCity(e.target.value);
                          setDistrictId('');
                        }}
                        className="select"
                        disabled={!selectedGovernorate || isCitiesLoading}
                      >
                        <option value="">اختر</option>
                        {(cities ?? []).map((c: any) => (
                          <option key={c.id} value={c.id}>
                            {c.nameAr}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">الحي</label>
                      <select
                        value={districtId}
                        onChange={(e) => setDistrictId(e.target.value)}
                        className="select"
                        disabled={!selectedCity || isDistrictsLoading}
                      >
                        <option value="">بدون</option>
                        {(districts ?? []).map((d: any) => (
                          <option key={d.id} value={d.id}>
                            {d.nameAr}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">العنوان بالعربية</label>
                      <input value={addressAr} onChange={(e) => setAddressAr(e.target.value)} className="input" />
                    </div>
                    <div>
                      <label className="label">العنوان بالإنجليزية</label>
                      <input value={addressEn} onChange={(e) => setAddressEn(e.target.value)} className="input" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">خط العرض (Latitude)</label>
                      <input 
                        type="text"
                        value={latitude} 
                        onChange={(e) => setLatitude(e.target.value)} 
                        className="input"
                        placeholder="33.5138"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="label">خط الطول (Longitude)</label>
                      <input 
                        type="text"
                        value={longitude} 
                        onChange={(e) => setLongitude(e.target.value)} 
                        className="input"
                        placeholder="36.2765"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label mb-3">تحديد الموقع على الخريطة</label>
                    <LocationPicker
                      latitude={latitude ? parseFloat(latitude) : undefined}
                      longitude={longitude ? parseFloat(longitude) : undefined}
                      onLocationChange={(lat, lng) => {
                        setLatitude(lat.toFixed(6));
                        setLongitude(lng.toFixed(6));
                      }}
                      height="400px"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'branches' && (
                <div className="space-y-4">
                  <BranchesManager
                    branches={branches}
                    onChange={setBranches}
                    governorates={governorates}
                    cities={cities}
                    districts={districts}
                    selectedCity={selectedCity}
                    onCityChange={(cityId) => setSelectedCity(cityId)}
                    maxBranches={maxBranchesAllowed}
                  />
                </div>
              )}

              {activeTab === 'contacts' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">هاتف 1</label>
                      <input value={phone1} onChange={(e) => setPhone1(e.target.value)} className="input" />
                    </div>
                    <div>
                      <label className="label">هاتف 2</label>
                      <input value={phone2} onChange={(e) => setPhone2(e.target.value)} className="input" />
                    </div>
                    <div>
                      <label className="label">واتساب</label>
                      <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="input" />
                    </div>
                    <div>
                      <label className="label">البريد الإلكتروني</label>
                      <input value={email} onChange={(e) => setEmail(e.target.value)} className="input" type="email" />
                    </div>
                    <div>
                      <label className="label">الموقع</label>
                      <input value={website} onChange={(e) => setWebsite(e.target.value)} className="input" />
                    </div>
                    <div>
                      <label className="label">فيسبوك</label>
                      <input value={facebook} onChange={(e) => setFacebook(e.target.value)} className="input" />
                    </div>
                    <div>
                      <label className="label">انستغرام</label>
                      <input value={instagram} onChange={(e) => setInstagram(e.target.value)} className="input" />
                    </div>
                    <div>
                      <label className="label">تيليغرام</label>
                      <input value={telegram} onChange={(e) => setTelegram(e.target.value)} className="input" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'hours' && (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">يمكنك تحديد الإغلاق أو وقت الفتح/الإغلاق لكل يوم</div>
                  <div className="space-y-3">
                    {workingHours.map((d, idx) => (
                      <div key={d.day} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
                        <div className="font-medium text-gray-900">{days.find((x) => x.key === d.day)?.label}</div>
                        <div className="flex items-center gap-2">
                          <input
                            id={`closed-${d.day}`}
                            type="checkbox"
                            checked={d.isClosed}
                            onChange={(e) => {
                              const next = [...workingHours];
                              next[idx] = { ...next[idx], isClosed: e.target.checked };
                              setWorkingHours(next);
                            }}
                          />
                          <label htmlFor={`closed-${d.day}`} className="text-sm text-gray-700">
                            مغلق
                          </label>
                        </div>
                        <div>
                          <input
                            type="time"
                            value={d.openTime}
                            disabled={d.isClosed}
                            onChange={(e) => {
                              const next = [...workingHours];
                              next[idx] = { ...next[idx], openTime: e.target.value };
                              setWorkingHours(next);
                            }}
                            className="input"
                          />
                        </div>
                        <div>
                          <input
                            type="time"
                            value={d.closeTime}
                            disabled={d.isClosed}
                            onChange={(e) => {
                              const next = [...workingHours];
                              next[idx] = { ...next[idx], closeTime: e.target.value };
                              setWorkingHours(next);
                            }}
                            className="input"
                          />
                        </div>
                        <div />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'owner' && (
                <div className="space-y-6">
                  <OwnerManagementSection
                    businessId={id}
                    ownerStatus={(business as any).ownerStatus || 'unclaimed'}
                    owner={(business as any).owner}
                    onOwnerLinked={() => {
                      // Refresh business data
                      window.location.reload();
                    }}
                    onOwnerRemoved={() => {
                      // Refresh business data
                      window.location.reload();
                    }}
                  />
                  
                  {/* Ownership Audit Log */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">سجل التغييرات</h3>
                    <OwnershipAuditList businessId={id} />
                  </div>
                </div>
              )}

              {activeTab === 'package' && (
                <div className="space-y-4">
                  <PackageSelector
                    businessId={id}
                    selectedPackageId={selectedPackageId}
                    onPackageSelect={setSelectedPackageId}
                    durationDays={durationDays}
                    onDurationDaysChange={setDurationDays}
                    customExpiryDate={customExpiryDate}
                    onCustomExpiryDateChange={setCustomExpiryDate}
                  />

                  {selectedPackageId && (
                    <div className="mt-6 flex justify-end">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const allPackages = Array.isArray(allPackagesData) ? allPackagesData : (allPackagesData as any)?.data || [];
                            const selectedPkg = allPackages.find((p: any) => p.id === selectedPackageId);
                            
                            await assignPackage.mutateAsync({
                              businessId: id,
                              packageId: selectedPackageId,
                              // لا ترسل customExpiryDate أو durationDays للباقة الافتراضية
                              ...(!selectedPkg?.isDefault && {
                                durationDays: durationDays || undefined,
                                customExpiryDate: customExpiryDate || undefined,
                              }),
                            });
                          } catch (error) {
                            console.error('Failed to assign package:', error);
                          }
                        }}
                        disabled={assignPackage.isPending}
                        className="btn btn-primary flex items-center gap-2"
                      >
                        {assignPackage.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Shield className="w-4 h-4" />
                        )}
                        تحديث / تمديد الباقة
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'team' && (
                <PersonsManager persons={persons} onChange={setPersons} />
              )}

              {activeTab === 'products' && (
                <ProductsManager products={products} onChange={setProducts} />
              )}

              {activeTab === 'media' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="label">الشعار</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (f) await handleUpload(f, 'logo');
                        }}
                        className="input"
                      />
                      {logoUrl ? (
                        <div className="mt-3 w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={logoUrl} alt="logo" className="w-full h-full object-cover" />
                        </div>
                      ) : null}
                    </div>
                    <div>
                      <label className="label">صورة الغلاف</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (f) await handleUpload(f, 'cover');
                        }}
                        className="input"
                      />
                      {coverUrl ? (
                        <div className="mt-3 w-full h-32 rounded-lg overflow-hidden bg-gray-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={coverUrl} alt="cover" className="w-full h-full object-cover" />
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="label">معرض الصور</label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={async (e) => {
                          const files = Array.from(e.target.files ?? []);
                          for (const f of files) {
                            // sequential to avoid overloading server
                            // eslint-disable-next-line no-await-in-loop
                            await handleUpload(f, 'gallery');
                          }
                        }}
                        className="input"
                      />
                    </div>
                    {galleryUrls.length ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                        {galleryUrls.map((url, idx) => (
                          <div key={`${url}-${idx}`} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt="gallery" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              className="absolute top-2 left-2 btn btn-sm btn-danger"
                              onClick={() => setGalleryUrls((prev) => prev.filter((_, i) => i !== idx))}
                            >
                              حذف
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
