'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowRight,
    Building2,
    MapPin,
    Phone,
    Globe,
    Clock,
    Image,
    X,
    Plus,
    Loader2,
    Save,
    Users,
    Package as PackageIcon,
    Shield,
    CheckCircle2,
} from 'lucide-react';
import {
    uploadApi,
    type Category,
    type City,
    type District,
    type Governorate,
    type BusinessPerson,
    type BusinessProduct,
    type BusinessBranch
} from '@/lib/api';
import {
    useCategories,
    useCities,
    useDistricts,
    useGovernorates,
    useAgentProfile,
    useBusinessById,
    useUpdateBusiness,
} from '@/lib/hooks';
import { LocationPicker } from '@/components/map/location-picker';
import { PersonsManager } from '@/components/business/persons-manager';
import { ProductsManager } from '@/components/business/products-manager';
import { BranchesManager } from '@/components/business/branches-manager';

const DAYS: Array<{ label: string; dayOfWeek: 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' }> = [
    { label: 'الأحد', dayOfWeek: 'SUNDAY' },
    { label: 'الإثنين', dayOfWeek: 'MONDAY' },
    { label: 'الثلاثاء', dayOfWeek: 'TUESDAY' },
    { label: 'الأربعاء', dayOfWeek: 'WEDNESDAY' },
    { label: 'الخميس', dayOfWeek: 'THURSDAY' },
    { label: 'الجمعة', dayOfWeek: 'FRIDAY' },
    { label: 'السبت', dayOfWeek: 'SATURDAY' },
];

export default function EditBusinessPage() {
    const router = useRouter();
    const params = useParams();
    const businessId = params.id as string;

    const [activeTab, setActiveTab] = useState<'basic' | 'location' | 'branches' | 'contact' | 'hours' | 'team' | 'products' | 'media'>('basic');

    const { data: business, isLoading: isBusinessLoading } = useBusinessById(businessId);
    const updateBusiness = useUpdateBusiness();

    // Lookups
    const { data: categoriesResponse, isLoading: isCategoriesLoading } = useCategories({ includeChildren: true });
    const { data: governoratesResponse, isLoading: isGovernoratesLoading } = useGovernorates();
    const { data: agentProfileData } = useAgentProfile();

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

    const [phones, setPhones] = useState(['']);
    const [email, setEmail] = useState('');
    const [website, setWebsite] = useState('');
    const [facebook, setFacebook] = useState('');
    const [instagram, setInstagram] = useState('');
    const [whatsapp, setWhatsapp] = useState('');

    const [workingHours, setWorkingHours] = useState(
        DAYS.map((d) => ({
            dayLabel: d.label,
            dayOfWeek: d.dayOfWeek,
            isOpen: true,
            open: '09:00',
            close: '21:00',
        }))
    );

    const [persons, setPersons] = useState<BusinessPerson[]>([]);
    const [products, setProducts] = useState<BusinessProduct[]>([]);
    const [branches, setBranches] = useState<BusinessBranch[]>([]);

    const [logoUrl, setLogoUrl] = useState('');
    const [coverUrl, setCoverUrl] = useState('');
    const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [isUploadingCover, setIsUploadingCover] = useState(false);
    const [isUploadingGallery, setIsUploadingGallery] = useState(false);

    const logoInputRef = useRef<HTMLInputElement | null>(null);
    const coverInputRef = useRef<HTMLInputElement | null>(null);
    const galleryInputRef = useRef<HTMLInputElement | null>(null);

    // Sync state with business data
    useEffect(() => {
        if (!business) return;

        // NOTE: Using casting (as any) to ensure we get properties even if TS interface is outdated
        const b = business as any;

        // Basic Info
        setNameAr(b.nameAr ?? '');
        setNameEn(b.nameEn ?? '');
        setShortDescAr(b.shortDescAr ?? '');
        setShortDescEn(b.shortDescEn ?? '');
        setDescriptionAr(b.descriptionAr ?? '');
        setDescriptionEn(b.descriptionEn ?? '');

        // Category
        const categories = b.categories || [];
        const primaryCat = categories.find((c: any) => c.isPrimary)?.category || categories[0]?.category;
        setCategoryId(primaryCat?.id || b.categoryId || '');

        // Location
        // Try getting ID from root, then from relation object
        const govId = b.governorateId ?? b.governorate?.id ?? '';
        const cityId = b.cityId ?? b.city?.id ?? '';
        const distId = b.districtId ?? b.district?.id ?? '';

        setSelectedGovernorate(govId);
        // Important: logic for city/district dependency might need ensuring governorate is set first 
        // in some components, but for state it should be fine.
        setSelectedCity(cityId);
        setSelectedDistrict(distId);

        setAddressAr(b.addressAr ?? '');
        setAddressEn(b.addressEn ?? '');

        // Handle coordinates safely - Prisma returns Decimal-like objects
        const lat = b.latitude;
        const lng = b.longitude;
        setLatitude(lat != null && lat !== '' ? String(lat) : '');
        setLongitude(lng != null && lng !== '' ? String(lng) : '');

        // Contacts
        const contacts = b.contacts || [];
        const phoneContacts = contacts.filter((c: any) => c.type === 'PHONE' || c.type === 'MOBILE');
        setPhones(phoneContacts.length > 0 ? phoneContacts.map((c: any) => c.value) : ['']);

        setEmail(contacts.find((c: any) => c.type === 'EMAIL')?.value ?? '');
        setWebsite(contacts.find((c: any) => c.type === 'WEBSITE')?.value ?? '');
        setFacebook(contacts.find((c: any) => c.type === 'FACEBOOK')?.value ?? '');
        setInstagram(contacts.find((c: any) => c.type === 'INSTAGRAM')?.value ?? '');
        setWhatsapp(contacts.find((c: any) => c.type === 'WHATSAPP')?.value ?? '');

        // Working Hours
        const dbWorkingHours = b.workingHours || [];
        if (dbWorkingHours.length > 0) {
            setWorkingHours(
                DAYS.map((d) => {
                    const wh = dbWorkingHours.find((h: any) => h.dayOfWeek === d.dayOfWeek);
                    return {
                        dayLabel: d.label,
                        dayOfWeek: d.dayOfWeek,
                        isOpen: !wh?.isClosed,
                        open: wh?.openTime ?? '09:00',
                        close: wh?.closeTime ?? '21:00',
                    };
                })
            );
        }

        // Sub-entities
        // Ensure we map sortOrder and handle potentially missing arrays
        setPersons((b.persons || []).map((p: any) => ({ ...p, sortOrder: p.sortOrder || 0 })));
        setProducts((b.products || []).map((p: any) => ({ ...p, sortOrder: p.sortOrder || 0 })));

        // Branches
        const loadedBranches = (b.branches || []) as any[];
        setBranches(loadedBranches.map((branch) => ({
            id: branch.id,
            businessId: branch.businessId,
            nameAr: branch.nameAr ?? '',
            nameEn: branch.nameEn ?? '',
            cityId: branch.cityId ?? '',
            districtId: branch.districtId ?? null,
            addressAr: branch.addressAr ?? '',
            addressEn: branch.addressEn ?? '',
            phone: branch.phone ?? '',
            isMain: branch.isMain ?? false,
            isActive: branch.isActive ?? true,
            sortOrder: branch.sortOrder ?? 0,
            // Convert Decimal-like coordinates to number/undefined
            latitude: branch.latitude != null && branch.latitude !== '' ? Number(branch.latitude) : undefined,
            longitude: branch.longitude != null && branch.longitude !== '' ? Number(branch.longitude) : undefined,
            createdAt: branch.createdAt,
            updatedAt: branch.updatedAt
        })));


        // Media
        setLogoUrl(b.logo ?? '');
        setCoverUrl(b.cover ?? '');

        const media = b.media || [];
        setGalleryUrls(media.filter((m: any) => m.type === 'GALLERY' || m.type === 'IMAGE').map((m: any) => m.url));

    }, [business]);

    const tabs = [
        { id: 'basic', label: 'المعلومات الأساسية', icon: Building2 },
        { id: 'location', label: 'الموقع', icon: MapPin },
        { id: 'branches', label: 'الفروع', icon: Building2 },
        { id: 'contact', label: 'التواصل', icon: Phone },
        { id: 'hours', label: 'ساعات العمل', icon: Clock },
        { id: 'team', label: 'فريق العمل', icon: Users },
        { id: 'products', label: 'المنتجات والخدمات', icon: PackageIcon },
        { id: 'media', label: 'الصور', icon: Image },
    ] as const;

    const categoriesTree = useMemo<Category[]>(() => {
        return Array.isArray(categoriesResponse) ? (categoriesResponse as Category[]) : [];
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
        const allGovs = Array.isArray(governoratesResponse)
            ? (governoratesResponse as Governorate[])
            : Array.isArray((governoratesResponse as any)?.data)
                ? ((governoratesResponse as any).data as Governorate[])
                : [];

        if (agentProfileData?.governorates && Array.isArray(agentProfileData.governorates)) {
            const allowedIds = new Set(
                agentProfileData.governorates
                    .map((g: any) => g?.id ?? g?.governorateId ?? g?.governorate?.id)
                    .filter(Boolean)
            );
            return allGovs.filter((g) => allowedIds.has(g.id));
        }

        return allGovs;
    }, [governoratesResponse, agentProfileData]);

    const { data: citiesResponse } = useCities(selectedGovernorate || undefined);
    const cities = useMemo<City[]>(() => {
        return Array.isArray(citiesResponse)
            ? (citiesResponse as City[])
            : Array.isArray((citiesResponse as any)?.data)
                ? ((citiesResponse as any).data as City[])
                : [];
    }, [citiesResponse]);

    const { data: districtsResponse } = useDistricts(selectedCity || undefined);
    const districts = useMemo<District[]>(() => {
        return Array.isArray(districtsResponse)
            ? (districtsResponse as District[])
            : Array.isArray((districtsResponse as any)?.data)
                ? ((districtsResponse as any).data as District[])
                : [];
    }, [districtsResponse]);

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
    const canSubmit = !!nameAr.trim() && !!categoryId && !!selectedGovernorate && !!selectedCity && !isSaving;

    const buildContacts = () => {
        const contacts: any[] = [];
        phones.filter(p => !!p.trim()).forEach((value, index) => {
            contacts.push({ type: 'PHONE', value, isPrimary: index === 0, isPublic: true, sortOrder: index });
        });
        if (whatsapp.trim()) contacts.push({ type: 'WHATSAPP', value: whatsapp.trim(), isPublic: true, sortOrder: 100 });
        if (email.trim()) contacts.push({ type: 'EMAIL', value: email.trim(), isPublic: true, sortOrder: 110 });
        if (website.trim()) contacts.push({ type: 'WEBSITE', value: website.trim(), isPublic: true, sortOrder: 120 });
        if (facebook.trim()) contacts.push({ type: 'FACEBOOK', value: facebook.trim(), isPublic: true, sortOrder: 130 });
        if (instagram.trim()) contacts.push({ type: 'INSTAGRAM', value: instagram.trim(), isPublic: true, sortOrder: 140 });
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

    const handleSubmit = async () => {
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
                    categoryIds: [categoryId], // Updated to match many-to-many API
                    contacts: buildContacts(),
                    workingHours: buildWorkingHours(),
                    branches: branches.map((b, i) => ({ ...b, sortOrder: i })),
                    persons: persons.map((p, i) => ({ ...p, sortOrder: i })),
                    products: products.map((p, i) => ({ ...p, sortOrder: i })),
                    logo: logoUrl || undefined,
                    cover: coverUrl || undefined,
                    media: galleryUrls.map((url, index) => ({ type: 'GALLERY', url, sortOrder: index })),
                } as any,
            });
            router.push(`/dashboard/businesses/${businessId}`);
        } catch (error) {
            console.error('فشل التحديث:', error);
        }
    };

    const uploadSingle = async (file: File, folder: string, setUrl: (url: string) => void, setBusy: (busy: boolean) => void) => {
        try {
            setBusy(true);
            const res = await uploadApi.uploadImage(file, folder);
            setUrl(res.data.url);
        } finally {
            setBusy(false);
        }
    };

    if (isBusinessLoading) {
        return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-green-600" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href={`/dashboard/businesses/${businessId}`} className="p-2 hover:bg-gray-100 rounded-lg">
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">تعديل النشاط التجاري</h1>
                        <p className="text-gray-500">{nameAr}</p>
                    </div>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={!canSubmit || isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-all shadow-lg shadow-green-200"
                >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    حفظ التغييرات
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                <div className="lg:w-64 shrink-0">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 sticky top-24">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === tab.id ? 'bg-green-50 text-green-700 font-bold' : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex-1 space-y-6">
                    {/* Tabs Content */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        {activeTab === 'basic' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-bold text-gray-900">المعلومات الأساسية</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">اسم النشاط (عربي) *</label>
                                        <input type="text" value={nameAr} onChange={(e) => setNameAr(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">اسم النشاط (إنجليزي)</label>
                                        <input type="text" value={nameEn} onChange={(e) => setNameEn(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" dir="ltr" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">التصنيف *</label>
                                    <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none">
                                        <option value="">اختر التصنيف</option>
                                        {categoryOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.nameAr}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">نبذة مختصرة (عربي)</label>
                                    <textarea value={shortDescAr} onChange={(e) => setShortDescAr(e.target.value)} rows={2} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">الوصف (عربي)</label>
                                    <textarea value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} rows={4} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" />
                                </div>
                            </div>
                        )}

                        {activeTab === 'location' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-bold text-gray-900">الموقع</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">المحافظة *</label>
                                        <select value={selectedGovernorate} onChange={(e) => setSelectedGovernorate(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none">
                                            <option value="">اختر المحافظة</option>
                                            {governorates.map(g => <option key={g.id} value={g.id}>{g.nameAr}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">المدينة *</label>
                                        <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none">
                                            <option value="">اختر المدينة</option>
                                            {cities.map(c => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">الحي</label>
                                        <select value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none">
                                            <option value="">اختر الحي</option>
                                            {districts.map(d => <option key={d.id} value={d.id}>{d.nameAr}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">العنوان التفصيلي</label>
                                    <input type="text" value={addressAr} onChange={(e) => setAddressAr(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">خط العرض (Lat)</label>
                                        <input type="text" value={latitude} onChange={(e) => setLatitude(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" dir="ltr" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">خط الطول (Lng)</label>
                                        <input type="text" value={longitude} onChange={(e) => setLongitude(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" dir="ltr" />
                                    </div>
                                </div>
                                <LocationPicker
                                    latitude={latitude ? parseFloat(latitude) : undefined}
                                    longitude={longitude ? parseFloat(longitude) : undefined}
                                    onLocationChange={(lat, lng) => {
                                        setLatitude(lat.toFixed(6));
                                        setLongitude(lng.toFixed(6));
                                    }}
                                    height="350px"
                                />
                            </div>
                        )}

                        {activeTab === 'branches' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-bold text-gray-900">الفروع</h2>
                                <BranchesManager
                                    branches={branches}
                                    onChange={setBranches}
                                    governorates={governorates}
                                    cities={cities}
                                    districts={districts}
                                />
                            </div>
                        )}

                        {activeTab === 'contact' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-bold text-gray-900">معلومات التواصل</h2>
                                <div className="space-y-4">
                                    <label className="block text-sm font-medium text-gray-700">أرقام الهاتف</label>
                                    {phones.map((phone, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input type="text" value={phone} onChange={(e) => updatePhone(idx, e.target.value)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl outline-none" dir="ltr" />
                                            {phones.length > 1 && (
                                                <button onClick={() => removePhone(idx)} className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl"><X className="w-5 h-5" /></button>
                                            )}
                                        </div>
                                    ))}
                                    <button onClick={addPhone} className="text-green-600 text-sm font-bold flex items-center gap-1"><Plus className="w-4 h-4" /> إضافة رقم آخر</button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">واتساب</label>
                                        <input type="text" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none" dir="ltr" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">البريد الإلكتروني</label>
                                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none" dir="ltr" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'hours' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-bold text-gray-900">ساعات العمل</h2>
                                <div className="space-y-4">
                                    {workingHours.map((wh, idx) => (
                                        <div key={idx} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                                            <div className="w-24 font-medium text-gray-700">{wh.dayLabel}</div>
                                            <button onClick={() => toggleDay(idx)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${wh.isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {wh.isOpen ? 'مفتوح' : 'مغلق'}
                                            </button>
                                            {wh.isOpen && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <input type="time" value={wh.open} onChange={(e) => updateHours(idx, 'open', e.target.value)} className="px-2 py-1 border border-gray-200 rounded-lg outline-none" />
                                                    <span>إلى</span>
                                                    <input type="time" value={wh.close} onChange={(e) => updateHours(idx, 'close', e.target.value)} className="px-2 py-1 border border-gray-200 rounded-lg outline-none" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'team' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-bold text-gray-900">فريق العمل</h2>
                                <PersonsManager persons={persons} onChange={setPersons} />
                            </div>
                        )}

                        {activeTab === 'products' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-bold text-gray-900">المنتجات والخدمات</h2>
                                <ProductsManager products={products} onChange={setProducts} />
                            </div>
                        )}

                        {activeTab === 'media' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-bold text-gray-900">الصور والمعرض</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">الشعار (Logo)</label>
                                        <div
                                            onClick={() => logoInputRef.current?.click()}
                                            className="aspect-square border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all overflow-hidden relative group"
                                        >
                                            {logoUrl ? (
                                                <>
                                                    <img src={logoUrl} alt="" className="w-full h-full object-contain p-4" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                                        <Plus className="text-white w-8 h-8" />
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <Image className="w-10 h-10 text-gray-300 mb-2" />
                                                    <span className="text-xs text-gray-400">انقر لرفع الشعار</span>
                                                </>
                                            )}
                                            {isUploadingLogo && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-green-600" /></div>}
                                        </div>
                                        <input ref={logoInputRef} type="file" hidden accept="image/*" onChange={(e) => e.target.files?.[0] && uploadSingle(e.target.files[0], 'logos', setLogoUrl, setIsUploadingLogo)} />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">صورة الغلاف (Cover)</label>
                                        <div
                                            onClick={() => coverInputRef.current?.click()}
                                            className="aspect-video border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all overflow-hidden relative group"
                                        >
                                            {coverUrl ? (
                                                <>
                                                    <img src={coverUrl} alt="" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                                        <Plus className="text-white w-8 h-8" />
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <Image className="w-10 h-10 text-gray-300 mb-2" />
                                                    <span className="text-xs text-gray-400">انقر لرفع صورة الغلاف</span>
                                                </>
                                            )}
                                            {isUploadingCover && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-green-600" /></div>}
                                        </div>
                                        <input ref={coverInputRef} type="file" hidden accept="image/*" onChange={(e) => e.target.files?.[0] && uploadSingle(e.target.files[0], 'covers', setCoverUrl, setIsUploadingCover)} />
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <label className="text-sm font-medium text-gray-700">معرض الصور</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {galleryUrls.map((url, idx) => (
                                            <div key={idx} className="aspect-square rounded-xl border border-gray-100 overflow-hidden relative group">
                                                <img src={url} alt="" className="w-full h-full object-cover" />
                                                <button onClick={() => setGalleryUrls(prev => prev.filter((_, i) => i !== idx))} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all"><X className="w-3 h-3" /></button>
                                            </div>
                                        ))}
                                        <div
                                            onClick={() => galleryInputRef.current?.click()}
                                            className="aspect-square border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-all"
                                        >
                                            {isUploadingGallery ? <Loader2 className="w-6 h-6 animate-spin text-gray-400" /> : <Plus className="w-6 h-6 text-gray-300" />}
                                        </div>
                                    </div>
                                    <input ref={galleryInputRef} type="file" hidden multiple accept="image/*" onChange={(e) => {
                                        if (e.target.files) {
                                            setIsUploadingGallery(true);
                                            const uploads = Array.from(e.target.files).map(f => uploadApi.uploadImage(f, 'gallery'));
                                            Promise.all(uploads).then(results => {
                                                setGalleryUrls(prev => [...prev, ...results.map(r => r.data.url)]);
                                            }).finally(() => setIsUploadingGallery(false));
                                        }
                                    }} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
