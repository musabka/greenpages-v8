'use client';

import { useEffect, useMemo, useRef, useState, use } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  MapPin,
  Phone,
  Clock,
  Image,
  X,
  Plus,
  Loader2,
  Save,
  Users,
  Package,
  Shield,
  UserCheck,
} from 'lucide-react';
import {
  uploadApi,
  type Category,
  type City,
  type District,
  type Governorate,
  type BusinessPerson,
  type BusinessProduct,
  type BusinessBranch,
} from '@/lib/api';
import {
  useBusiness,
  useBusinessPackage,
  useCategories,
  useCities,
  useDistricts,
  useGovernorates,
  useUpdateBusiness,
  useAssignPackage,
} from '@/lib/hooks';
import { LocationPicker } from '@/components/map/location-picker';
import { PersonsManager } from '@/components/business/persons-manager';
import { ProductsManager } from '@/components/business/products-manager';
import { BranchesManager } from '@/components/business/branches-manager';
import { PackageSelector } from '@/components/packages/package-selector';
import { OwnerManagementSection } from '@/components/business';
import { OwnershipAuditList } from '@/components/business/ownership-audit-list';

type DayOfWeek = 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';

const DAYS: Array<{ label: string; dayOfWeek: DayOfWeek }> = [
  { label: 'الأحد', dayOfWeek: 'SUNDAY' },
  { label: 'الإثنين', dayOfWeek: 'MONDAY' },
  { label: 'الثلاثاء', dayOfWeek: 'TUESDAY' },
  { label: 'الأربعاء', dayOfWeek: 'WEDNESDAY' },
  { label: 'الخميس', dayOfWeek: 'THURSDAY' },
  { label: 'الجمعة', dayOfWeek: 'FRIDAY' },
  { label: 'السبت', dayOfWeek: 'SATURDAY' },
];

export default function EditBusinessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: businessId } = use(params);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<
    'basic' | 'location' | 'branches' | 'contact' | 'hours' | 'owner' | 'package' | 'team' | 'products' | 'media'
  >('basic');

  const { data: business, isLoading: isBusinessLoading } = useBusiness(businessId);
  const updateBusiness = useUpdateBusiness();

  // Lookups
  const { data: categoriesResponse, isLoading: isCategoriesLoading } = useCategories({ includeChildren: true } as any);
  const { data: governoratesResponse, isLoading: isGovernoratesLoading } = useGovernorates();

  // Form state
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [shortDescAr, setShortDescAr] = useState('');
  const [shortDescEn, setShortDescEn] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');

  const [selectedGovernorate, setSelectedGovernorate] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [addressAr, setAddressAr] = useState('');
  const [addressEn, setAddressEn] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  const [phones, setPhones] = useState<string[]>(['']);
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  const [workingHours, setWorkingHours] = useState(
    DAYS.map((d) => ({
      dayLabel: d.label,
      dayOfWeek: d.dayOfWeek,
      isOpen: d.dayOfWeek !== 'FRIDAY',
      open: '09:00',
      close: '21:00',
    }))
  );

  // Team
  const [persons, setPersons] = useState<BusinessPerson[]>([]);

  // Products & Services
  const [products, setProducts] = useState<BusinessProduct[]>([]);

  // Branches
  const [branches, setBranches] = useState<BusinessBranch[]>([]);

  // Package
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [durationDays, setDurationDays] = useState<number>(0);
  const [customExpiryDate, setCustomExpiryDate] = useState<string>('');
  const assignPackage = useAssignPackage();
  const { data: currentPackage } = useBusinessPackage(businessId);

  const [logoUrl, setLogoUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const initialLocationRef = useRef<{
    governorateId: string;
    cityId: string;
    districtId: string;
    latitude: string;
    longitude: string;
  } | null>(null);

  const [initialized, setInitialized] = useState(false);

  const tabs = [
    { id: 'basic', label: 'المعلومات الأساسية', icon: Building2 },
    { id: 'location', label: 'الموقع', icon: MapPin },
    { id: 'branches', label: 'الفروع', icon: Building2 },
    { id: 'contact', label: 'التواصل', icon: Phone },
    { id: 'hours', label: 'ساعات العمل', icon: Clock },
    { id: 'owner', label: 'المالك', icon: UserCheck },
    { id: 'package', label: 'الباقة', icon: Shield },
    { id: 'team', label: 'فريق العمل', icon: Users },
    { id: 'products', label: 'المنتجات والخدمات', icon: Package },
    { id: 'media', label: 'الصور', icon: Image },
  ] as const;

  const categoriesTree = useMemo<Category[]>(() => {
    return Array.isArray(categoriesResponse)
      ? (categoriesResponse as Category[])
      : Array.isArray((categoriesResponse as any)?.data)
        ? ((categoriesResponse as any).data as Category[])
        : [];
  }, [categoriesResponse]);

  const categoryOptions = useMemo(() => {
    const out: Array<{ id: string; nameAr: string; index: number }> = [];
    let index = 0;
    const walk = (nodes: Category[], prefix: string) => {
      for (const node of nodes) {
        out.push({ id: node.id, nameAr: `${prefix}${node.nameAr}`, index: index++ });
        if (node.children?.length) walk(node.children, `${prefix}— `);
      }
    };
    walk(categoriesTree, '');
    return out;
  }, [categoriesTree]);

  const governorates = useMemo<Governorate[]>(() => {
    return Array.isArray(governoratesResponse)
      ? (governoratesResponse as Governorate[])
      : Array.isArray((governoratesResponse as any)?.data)
        ? ((governoratesResponse as any).data as Governorate[])
        : [];
  }, [governoratesResponse]);

  const { data: citiesResponse, isLoading: isCitiesLoading } = useCities(selectedGovernorate || undefined);
  const cities = useMemo<City[]>(() => {
    return Array.isArray(citiesResponse)
      ? (citiesResponse as City[])
      : Array.isArray((citiesResponse as any)?.data)
        ? ((citiesResponse as any).data as City[])
        : [];
  }, [citiesResponse]);

  const { data: districtsResponse, isLoading: isDistrictsLoading } = useDistricts(selectedCity || undefined);
  const districts = useMemo<District[]>(() => {
    return Array.isArray(districtsResponse)
      ? (districtsResponse as District[])
      : Array.isArray((districtsResponse as any)?.data)
        ? ((districtsResponse as any).data as District[])
        : [];
  }, [districtsResponse]);

  // Hydrate form from loaded business
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

    setNameAr((business as any).nameAr ?? '');
    setNameEn((business as any).nameEn ?? '');

    const categories = (((business as any).categories ?? []) as any[]) || [];
    const primary = categories.find((c) => c.isPrimary)?.category ?? categories[0]?.category;
    setCategoryId(primary?.id ?? '');

    setShortDescAr((business as any).shortDescAr ?? (business as any).shortDescriptionAr ?? '');
    setShortDescEn((business as any).shortDescEn ?? (business as any).shortDescriptionEn ?? '');
    setDescriptionAr((business as any).descriptionAr ?? '');
    setDescriptionEn((business as any).descriptionEn ?? '');

    setSelectedGovernorate((business as any).governorateId ?? '');
    setSelectedCity((business as any).cityId ?? '');
    setSelectedDistrict((business as any).districtId ?? '');
    setAddressAr((business as any).addressAr ?? '');
    setAddressEn((business as any).addressEn ?? '');
    setLatitude((business as any).latitude?.toString?.() ?? '');
    setLongitude((business as any).longitude?.toString?.() ?? '');

    const contacts = (((business as any).contacts ?? []) as any[]) || [];
    const phoneValues = contacts
      .filter((c) => c?.type === 'PHONE' || c?.type === 'MOBILE')
      .map((c) => String(c.value ?? '').trim())
      .filter(Boolean);
    setPhones(phoneValues.length ? phoneValues : ['']);

    setWhatsapp(contacts.find((c) => c?.type === 'WHATSAPP')?.value ?? '');
    setEmail(contacts.find((c) => c?.type === 'EMAIL')?.value ?? '');
    setWebsite(contacts.find((c) => c?.type === 'WEBSITE')?.value ?? '');
    setFacebook(contacts.find((c) => c?.type === 'FACEBOOK')?.value ?? '');
    setInstagram(contacts.find((c) => c?.type === 'INSTAGRAM')?.value ?? '');

    const wh = (((business as any).workingHours ?? []) as any[]) || [];
    if (wh.length) {
      setWorkingHours(
        DAYS.map((d) => {
          const found = wh.find((x) => x?.dayOfWeek === d.dayOfWeek);
          const isClosed = Boolean(found?.isClosed);
          return {
            dayLabel: d.label,
            dayOfWeek: d.dayOfWeek,
            isOpen: !isClosed,
            open: found?.openTime ?? '09:00',
            close: found?.closeTime ?? '21:00',
          };
        })
      );
    }

    const loadedBranches = (((business as any).branches ?? []) as any[]) || [];
    setBranches(
      loadedBranches.map((b: any) => ({
        id: b.id,
        businessId: b.businessId,
        nameAr: b.nameAr ?? '',
        nameEn: b.nameEn ?? '',
        cityId: b.cityId ?? '',
        districtId: b.districtId ?? null,
        addressAr: b.addressAr ?? '',
        addressEn: b.addressEn ?? '',
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
        isMain: Boolean(b.isMain),
        isActive: b.isActive ?? true,
        sortOrder: b.sortOrder ?? 0,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      }))
    );

    const loadedPersons = (((business as any).persons ?? []) as any[]) || [];
    setPersons(
      loadedPersons.map((p: any) => ({
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
      }))
    );

    const loadedProducts = (((business as any).products ?? []) as any[]) || [];
    setProducts(
      loadedProducts.map((p: any) => ({
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
      }))
    );

    setLogoUrl((business as any).logo ?? '');
    setCoverUrl((business as any).cover ?? '');
    const media = (((business as any).media ?? []) as any[]) || [];
    setGalleryUrls(media.filter((m) => m?.type === 'GALLERY' || m?.type === 'IMAGE').map((m) => m.url));

    setInitialized(true);
  }, [business, initialized]);

  // Load current package into the selector
  useEffect(() => {
    if (currentPackage?.packageId) setSelectedPackageId(currentPackage.packageId);
  }, [currentPackage]);

  // Auto-center map based on selected location hierarchy (instant, with OSM geocoding fallback)
  useEffect(() => {
    if (!initialized) return;

    const initial = initialLocationRef.current;
    const shouldPreserveExistingCoords =
      Boolean(initial) &&
      selectedGovernorate === (initial?.governorateId ?? '') &&
      selectedCity === (initial?.cityId ?? '') &&
      selectedDistrict === (initial?.districtId ?? '') &&
      Boolean(latitude.trim()) &&
      Boolean(longitude.trim());

    if (shouldPreserveExistingCoords) return;

    const geocodeCacheRef =
      (globalThis as any).__greenpagesGeocodeCacheEdit || new Map<string, { lat: number; lng: number }>();
    (globalThis as any).__greenpagesGeocodeCacheEdit = geocodeCacheRef;

    let aborted = false;
    const controller = new AbortController();

    const gov = governorates.find((g) => g.id === selectedGovernorate);
    const city = cities.find((c) => c.id === selectedCity);
    const district = districts.find((d) => d.id === selectedDistrict);

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
          headers: { 'Accept-Language': 'ar', 'User-Agent': 'greenpages-manager/1.0' },
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
      } catch {
        // ignore (network / aborted)
      }
    })();

    return () => {
      aborted = true;
      controller.abort();
    };
  }, [initialized, selectedGovernorate, selectedCity, selectedDistrict, governorates, cities, districts, latitude, longitude]);

  const addPhone = () => setPhones([...phones, '']);
  const removePhone = (index: number) => setPhones(phones.filter((_, i) => i !== index));
  const updatePhone = (index: number, value: string) => {
    const newPhones = [...phones];
    newPhones[index] = value;
    setPhones(newPhones);
  };

  const toggleDay = (index: number) => {
    const newHours = [...workingHours];
    newHours[index].isOpen = !newHours[index].isOpen;
    setWorkingHours(newHours);
  };

  const updateHours = (index: number, field: 'open' | 'close', value: string) => {
    const newHours = [...workingHours];
    newHours[index][field] = value;
    setWorkingHours(newHours);
  };

  const isSaving = updateBusiness.isPending;
  const canSubmit =
    !!nameAr.trim() && !!categoryId && !!selectedGovernorate && !!selectedCity && !isSaving && !!businessId;

  const buildContacts = () => {
    const contacts: any[] = [];

    const phoneValues = phones.map((p) => p.trim()).filter(Boolean);
    phoneValues.forEach((value, index) => {
      contacts.push({
        type: 'PHONE',
        value,
        isPrimary: index === 0,
        isPublic: true,
        sortOrder: index,
      });
    });

    if (whatsapp.trim()) {
      contacts.push({ type: 'WHATSAPP', value: whatsapp.trim(), isPublic: true, sortOrder: 100 });
    }
    if (email.trim()) {
      contacts.push({ type: 'EMAIL', value: email.trim(), isPublic: true, sortOrder: 110 });
    }
    if (website.trim()) {
      contacts.push({ type: 'WEBSITE', value: website.trim(), isPublic: true, sortOrder: 120 });
    }
    if (facebook.trim()) {
      contacts.push({ type: 'FACEBOOK', value: facebook.trim(), isPublic: true, sortOrder: 130 });
    }
    if (instagram.trim()) {
      contacts.push({ type: 'INSTAGRAM', value: instagram.trim(), isPublic: true, sortOrder: 140 });
    }
    return contacts;
  };

  const buildWorkingHours = () => {
    return workingHours.map((wh) => ({
      dayOfWeek: wh.dayOfWeek,
      openTime: wh.isOpen ? wh.open : undefined,
      closeTime: wh.isOpen ? wh.close : undefined,
      isClosed: !wh.isOpen,
    }));
  };

  const handleSubmit = async (status: 'DRAFT' | 'PENDING') => {
    if (!canSubmit) return;

    try {
      await updateBusiness.mutateAsync({
        id: businessId,
        data: {
          nameAr: nameAr.trim(),
          nameEn: nameEn.trim() || undefined,
          shortDescAr: shortDescAr.trim() || undefined,
          shortDescEn: shortDescEn.trim() || undefined,
          descriptionAr: descriptionAr.trim() || undefined,
          descriptionEn: descriptionEn.trim() || undefined,

          governorateId: selectedGovernorate,
          cityId: selectedCity,
          districtId: selectedDistrict || undefined,
          addressAr: addressAr.trim() || undefined,
          addressEn: addressEn.trim() || undefined,
          latitude: latitude.trim() ? Number(latitude) : undefined,
          longitude: longitude.trim() ? Number(longitude) : undefined,

          status,
          categoryIds: categoryId ? [categoryId] : undefined,
          contacts: buildContacts(),
          workingHours: buildWorkingHours(),

          branches: branches.filter((b) => b.nameAr?.trim() && b.cityId).length
            ? branches
                .filter((b) => b.nameAr?.trim() && b.cityId)
                .map((b, i) => ({
                  nameAr: b.nameAr,
                  nameEn: b.nameEn || undefined,
                  cityId: b.cityId,
                  districtId: b.districtId || undefined,
                  addressAr: b.addressAr || undefined,
                  addressEn: b.addressEn || undefined,
                  latitude:
                    typeof b.latitude === 'number'
                      ? b.latitude
                      : b.latitude != null && b.latitude !== ''
                        ? Number(b.latitude)
                        : undefined,
                  longitude:
                    typeof b.longitude === 'number'
                      ? b.longitude
                      : b.longitude != null && b.longitude !== ''
                        ? Number(b.longitude)
                        : undefined,
                  phone: b.phone || undefined,
                  isMain: false,
                  isActive: b.isActive,
                  sortOrder: i,
                }))
            : undefined,

          persons: persons.filter((p) => p.nameAr?.trim()).length
            ? persons.filter((p) => p.nameAr?.trim()).map((p, i) => ({ ...p, sortOrder: i }))
            : undefined,

          products: products.filter((p) => p.nameAr?.trim()).length
            ? products.filter((p) => p.nameAr?.trim()).map((p, i) => ({ ...p, sortOrder: i }))
            : undefined,

          logo: logoUrl.trim() || undefined,
          cover: coverUrl.trim() || undefined,
          media: galleryUrls.length
            ? galleryUrls.map((url, index) => ({ type: 'GALLERY', url, sortOrder: index }))
            : undefined,
        } as any,
      });

      if (selectedPackageId && selectedPackageId !== currentPackage?.packageId) {
        await assignPackage.mutateAsync({
          businessId,
          packageId: selectedPackageId,
          durationDays: durationDays || undefined,
          customExpiryDate: customExpiryDate || undefined,
        });
      }

      router.push('/dashboard/businesses');
    } catch {
      // handled in hook
    }
  };

  const uploadSingle = async (
    file: File,
    folder: string,
    setUrl: (url: string) => void,
    setBusy: (busy: boolean) => void
  ) => {
    try {
      setBusy(true);
      const res = await uploadApi.uploadImage(file, folder);
      setUrl(res.data.url);
    } finally {
      setBusy(false);
    }
  };

  const handleGalleryUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    try {
      setIsUploadingGallery(true);
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        // eslint-disable-next-line no-await-in-loop
        const res = await uploadApi.uploadImage(file, 'businesses');
        urls.push(res.data.url);
      }
      setGalleryUrls((prev) => [...prev, ...urls]);
    } finally {
      setIsUploadingGallery(false);
    }
  };

  if (isBusinessLoading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="w-5 h-5 animate-spin inline-block" />
        <span className="mr-2">جاري تحميل بيانات النشاط...</span>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="p-8 text-center text-gray-600">
        لم يتم العثور على النشاط
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/businesses" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="page-title">تعديل نشاط تجاري</h1>
            <p className="text-gray-500 mt-1">عدّل بيانات النشاط التجاري</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-outline" onClick={() => handleSubmit('DRAFT')} disabled={!canSubmit}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            حفظ كمسودة
          </button>
          <button className="btn btn-primary" onClick={() => handleSubmit('PENDING')} disabled={!canSubmit}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            نشر
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 shrink-0">
          <div className="card sticky top-24">
            <nav className="p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-right transition-colors ${
                      activeTab === tab.id ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'basic' && (
            <div className="card">
              <div className="card-header">
                <h2 className="font-bold text-gray-900">المعلومات الأساسية</h2>
              </div>
              <div className="card-body space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      اسم النشاط (عربي) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="مثال: مطعم الشام"
                      value={nameAr}
                      onChange={(e) => setNameAr(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">اسم النشاط (إنجليزي)</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g., Al-Sham Restaurant"
                      dir="ltr"
                      value={nameEn}
                      onChange={(e) => setNameEn(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    التصنيف <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="select"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    disabled={isCategoriesLoading}
                  >
                    <option value="">اختر التصنيف</option>
                    {categoryOptions.map((cat) => (
                      <option key={`${cat.id}-${cat.index}`} value={cat.id}>
                        {cat.nameAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">نبذة مختصرة (عربي)</label>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="وصف مختصر يظهر في نتائج البحث..."
                    value={shortDescAr}
                    onChange={(e) => setShortDescAr(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">نبذة مختصرة (إنجليزي)</label>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Short description..."
                    dir="ltr"
                    value={shortDescEn}
                    onChange={(e) => setShortDescEn(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الوصف (عربي)</label>
                  <textarea
                    className="input"
                    rows={4}
                    placeholder="وصف تفصيلي للنشاط التجاري..."
                    value={descriptionAr}
                    onChange={(e) => setDescriptionAr(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الوصف (إنجليزي)</label>
                  <textarea
                    className="input"
                    rows={4}
                    placeholder="Detailed description..."
                    dir="ltr"
                    value={descriptionEn}
                    onChange={(e) => setDescriptionEn(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'location' && (
            <div className="card">
              <div className="card-header">
                <h2 className="font-bold text-gray-900">الموقع</h2>
              </div>
              <div className="card-body space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      المحافظة <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="select"
                      value={selectedGovernorate}
                      onChange={(e) => {
                        setSelectedGovernorate(e.target.value);
                        setSelectedCity('');
                        setSelectedDistrict('');
                      }}
                      disabled={isGovernoratesLoading}
                    >
                      <option value="">اختر المحافظة</option>
                      {governorates.map((gov) => (
                        <option key={gov.id} value={gov.id}>
                          {gov.nameAr}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      المدينة <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="select"
                      value={selectedCity}
                      onChange={(e) => {
                        setSelectedCity(e.target.value);
                        setSelectedDistrict('');
                      }}
                      disabled={!selectedGovernorate || isCitiesLoading}
                    >
                      <option value="">اختر المدينة</option>
                      {cities.map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.nameAr}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">الحي</label>
                    <select
                      className="select"
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      disabled={!selectedCity || isDistrictsLoading}
                    >
                      <option value="">اختر الحي</option>
                      {districts.map((district) => (
                        <option key={district.id} value={district.id}>
                          {district.nameAr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">العنوان التفصيلي</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="الشارع، البناء، الطابق..."
                    value={addressAr}
                    onChange={(e) => setAddressAr(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">العنوان (إنجليزي)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Street, building..."
                    dir="ltr"
                    value={addressEn}
                    onChange={(e) => setAddressEn(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">خط العرض (Latitude)</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="33.5138"
                      dir="ltr"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">خط الطول (Longitude)</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="36.2765"
                      dir="ltr"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">تحديد الموقع على الخريطة</label>
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
            </div>
          )}

          {activeTab === 'branches' && (
            <div className="card">
              <div className="card-header">
                <h2 className="font-bold text-gray-900">الفروع</h2>
                <p className="text-sm text-gray-500">أضف فروع النشاط التجاري</p>
              </div>
              <div className="card-body">
                <BranchesManager
                  branches={branches}
                  onChange={setBranches}
                  governorates={governorates}
                  cities={cities}
                  districts={districts}
                  selectedCity={selectedCity}
                  onCityChange={(cityId) => setSelectedCity(cityId)}
                />
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="card">
              <div className="card-header">
                <h2 className="font-bold text-gray-900">معلومات التواصل</h2>
              </div>
              <div className="card-body space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">أرقام الهاتف</label>
                  <div className="space-y-3">
                    {phones.map((phone, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="tel"
                          className="input flex-1"
                          value={phone}
                          onChange={(e) => updatePhone(index, e.target.value)}
                          placeholder="+963 XXX XXX XXX"
                          dir="ltr"
                        />
                        {phones.length > 1 && (
                          <button
                            onClick={() => removePhone(index)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={addPhone}
                      className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
                    >
                      <Plus className="w-4 h-4" />
                      إضافة رقم آخر
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="info@example.com"
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الموقع الإلكتروني</label>
                  <input
                    type="url"
                    className="input"
                    placeholder="https://www.example.com"
                    dir="ltr"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">فيسبوك</label>
                    <input
                      type="url"
                      className="input"
                      placeholder="https://facebook.com/..."
                      dir="ltr"
                      value={facebook}
                      onChange={(e) => setFacebook(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">إنستغرام</label>
                    <input
                      type="url"
                      className="input"
                      placeholder="https://instagram.com/..."
                      dir="ltr"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">واتساب</label>
                  <input
                    type="tel"
                    className="input"
                    placeholder="+963 XXX XXX XXX"
                    dir="ltr"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'hours' && (
            <div className="card">
              <div className="card-header">
                <h2 className="font-bold text-gray-900">ساعات العمل</h2>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  {workingHours.map((item, index) => (
                    <div
                      key={item.dayOfWeek}
                      className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0"
                    >
                      <label className="flex items-center gap-3 w-28">
                        <input
                          type="checkbox"
                          checked={item.isOpen}
                          onChange={() => toggleDay(index)}
                          className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <span className="font-medium text-gray-700">{item.dayLabel}</span>
                      </label>

                      {item.isOpen ? (
                        <div className="flex items-center gap-3">
                          <input
                            type="time"
                            value={item.open}
                            onChange={(e) => updateHours(index, 'open', e.target.value)}
                            className="input w-32"
                          />
                          <span className="text-gray-500">إلى</span>
                          <input
                            type="time"
                            value={item.close}
                            onChange={(e) => updateHours(index, 'close', e.target.value)}
                            className="input w-32"
                          />
                        </div>
                      ) : (
                        <span className="text-gray-500">مغلق</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Owner Tab */}
          {activeTab === 'owner' && (
            <div className="space-y-6">
              <OwnerManagementSection
                businessId={businessId}
                ownerStatus={(business as any).ownerStatus || 'unclaimed'}
                owner={(business as any).owner}
                onOwnerLinked={() => {
                  window.location.reload();
                }}
                onOwnerRemoved={() => {
                  window.location.reload();
                }}
              />
              
              {/* Ownership Audit Log */}
              <div className="card border-t">
                <div className="card-header">
                  <h2 className="font-bold text-gray-900">سجل التغييرات</h2>
                </div>
                <div className="card-body">
                  <OwnershipAuditList businessId={businessId} />
                </div>
              </div>
            </div>
          )}

          {/* Team Tab */}
          {activeTab === 'team' && (
            <div className="card">
              <div className="card-header">
                <h2 className="font-bold text-gray-900">فريق العمل</h2>
                <p className="text-sm text-gray-500">أضف أعضاء الفريق الذين يعملون في هذا النشاط</p>
              </div>
              <div className="card-body">
                <PersonsManager persons={persons} onChange={setPersons} />
              </div>
            </div>
          )}

          {/* Products & Services Tab */}
          {activeTab === 'products' && (
            <div className="card">
              <div className="card-header">
                <h2 className="font-bold text-gray-900">المنتجات والخدمات</h2>
                <p className="text-sm text-gray-500">أضف المنتجات أو الخدمات التي يقدمها هذا النشاط</p>
              </div>
              <div className="card-body">
                <ProductsManager products={products} onChange={setProducts} />
              </div>
            </div>
          )}

          {/* Package Tab */}
          {activeTab === 'package' && (
            <div className="card">
              <div className="card-header">
                <h2 className="font-bold text-gray-900">الباقة</h2>
                <p className="text-sm text-gray-500">اختر الباقة المناسبة لهذا النشاط التجاري</p>
              </div>
              <div className="card-body">
                <PackageSelector
                  selectedPackageId={selectedPackageId}
                  onPackageSelect={setSelectedPackageId}
                  durationDays={durationDays}
                  onDurationDaysChange={setDurationDays}
                  customExpiryDate={customExpiryDate}
                  onCustomExpiryDateChange={setCustomExpiryDate}
                />
              </div>
            </div>
          )}

          {activeTab === 'media' && (
            <div className="card">
              <div className="card-header">
                <h2 className="font-bold text-gray-900">الصور</h2>
              </div>
              <div className="card-body space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الشعار</label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                      {logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={logoUrl} alt="logo" className="w-24 h-24 object-cover rounded-lg" />
                      ) : (
                        <Image className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        await uploadSingle(file, 'businesses', setLogoUrl, setIsUploadingLogo);
                        e.target.value = '';
                      }}
                    />
                    <button
                      className="btn btn-outline"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={isUploadingLogo}
                    >
                      {isUploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      رفع الشعار
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">صورة الغلاف</label>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      await uploadSingle(file, 'businesses', setCoverUrl, setIsUploadingCover);
                      e.target.value = '';
                    }}
                  />
                  <div
                    className="h-48 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-primary-500 transition-colors cursor-pointer overflow-hidden"
                    onClick={() => coverInputRef.current?.click()}
                  >
                    {coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={coverUrl} alt="cover" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <Image className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">اسحب الصورة هنا أو انقر للرفع</p>
                        <p className="text-sm text-gray-400">PNG, JPG حتى 5MB</p>
                        {isUploadingCover ? (
                          <div className="mt-2 flex justify-center">
                            <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">معرض الصور</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {galleryUrls.map((url, idx) => (
                      <div key={url + idx} className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="gallery" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          className="absolute top-2 left-2 p-1 bg-white/80 rounded"
                          onClick={() => setGalleryUrls((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          <X className="w-4 h-4 text-gray-700" />
                        </button>
                      </div>
                    ))}
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={async (e) => {
                        await handleGalleryUpload(e.target.files);
                        e.target.value = '';
                      }}
                    />
                    <button
                      type="button"
                      className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-primary-500 transition-colors"
                      onClick={() => galleryInputRef.current?.click()}
                      disabled={isUploadingGallery}
                    >
                      {isUploadingGallery ? (
                        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                      ) : (
                        <Plus className="w-8 h-8 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
