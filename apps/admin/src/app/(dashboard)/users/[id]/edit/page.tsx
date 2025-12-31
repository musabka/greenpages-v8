'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, Loader2, Save, Shield, MapPin } from 'lucide-react';
import { useUpdateUser, useUser, useGovernorates, useCities, useDistricts } from '@/lib/hooks';

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === 'string' ? params.id : '';

  const { data: user, isLoading } = useUser(id);
  const updateUser = useUpdateUser();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'AGENT' | 'USER'>('USER');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING'>('ACTIVE');
  const [emailVerified, setEmailVerified] = useState(false);
  const [governorateId, setGovernorateId] = useState('');
  const [cityId, setCityId] = useState('');
  const [districtId, setDistrictId] = useState('');

  const { data: governoratesData } = useGovernorates();
  const { data: citiesData } = useCities(governorateId || undefined);
  const { data: districtsData } = useDistricts(cityId || undefined);

  const governorates = governoratesData ?? [];
  const cities = citiesData ?? [];
  const districts = districtsData ?? [];

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName ?? '');
    setLastName(user.lastName ?? '');
    setPhone(user.phone ?? '');
    setRole((user.role as any) ?? 'USER');
    setStatus((user as any).status ?? 'ACTIVE');
    setEmailVerified(Boolean((user as any).emailVerified));
    setGovernorateId((user as any).governorateId ?? '');
    setCityId((user as any).cityId ?? '');
    setDistrictId((user as any).districtId ?? '');
  }, [user]);

  const [governorateChanged, setGovernorateChanged] = useState(false);
  useEffect(() => {
    if (governorateChanged) {
      setCityId('');
      setDistrictId('');
      setGovernorateChanged(false);
    }
  }, [governorateId, governorateChanged]);

  const [cityChanged, setCityChanged] = useState(false);
  useEffect(() => {
    if (cityChanged) {
      setDistrictId('');
      setCityChanged(false);
    }
  }, [cityId, cityChanged]);

  const handleGovernorateChange = (value: string) => {
    setGovernorateId(value);
    setGovernorateChanged(true);
  };

  const handleCityChange = (value: string) => {
    setCityId(value);
    setCityChanged(true);
  };

  const canSubmit = Boolean(id && firstName.trim() && lastName.trim());

  const handleSave = async () => {
    if (!canSubmit) return;
    try {
      await updateUser.mutateAsync({
        id,
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim() || undefined,
          role,
          status,
          emailVerified,
          governorateId: governorateId || undefined,
          cityId: cityId || undefined,
          districtId: districtId || undefined,
        },
      });
      router.push('/users');
    } catch {
      // handled in hook
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!user) {
    return <div className="text-gray-500">المستخدم غير موجود</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-4">
          <Link href="/users" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="page-title">تعديل مستخدم</h1>
            <p className="text-gray-500 mt-1">تعديل بيانات المستخدم</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={!canSubmit || updateUser.isPending}>
          {updateUser.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          حفظ
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="font-bold text-gray-900">المعلومات الشخصية</h2>
            </div>
            <div className="card-body space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الاسم الأول *</label>
                  <input type="text" className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الاسم الأخير *</label>
                  <input type="text" className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">رقم الهاتف</label>
                <input type="tel" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="card-header flex items-center gap-2">
              <Shield className="w-5 h-5 text-gray-400" />
              <h2 className="font-bold text-gray-900">الدور والصلاحيات</h2>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الدور *</label>
                <select className="select" value={role} onChange={(e) => setRole(e.target.value as any)}>
                  <option value="SUPER_ADMIN">مدير عام</option>
                  <option value="ADMIN">مدير</option>
                  <option value="MODERATOR">مشرف</option>
                  <option value="AGENT">وكيل</option>
                  <option value="USER">مستخدم</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
                <select className="select" value={status} onChange={(e) => setStatus(e.target.value as any)}>
                  <option value="ACTIVE">نشط</option>
                  <option value="INACTIVE">غير نشط</option>
                  <option value="SUSPENDED">معلق</option>
                  <option value="PENDING">قيد المراجعة</option>
                </select>
              </div>
              <div className="flex items-center justify-between py-2">
                <label className="text-gray-700">بريد موثق</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={emailVerified} onChange={(e) => setEmailVerified(e.target.checked)} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-400" />
              <h2 className="font-bold text-gray-900">الموقع الجغرافي</h2>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المحافظة</label>
                <select className="select" value={governorateId} onChange={(e) => handleGovernorateChange(e.target.value)}>
                  <option value="">اختر المحافظة</option>
                  {governorates.map((gov: any) => (
                    <option key={gov.id} value={gov.id}>{gov.nameAr}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المدينة</label>
                <select className="select" value={cityId} onChange={(e) => handleCityChange(e.target.value)} disabled={!governorateId}>
                  <option value="">اختر المدينة</option>
                  {cities.map((city: any) => (
                    <option key={city.id} value={city.id}>{city.nameAr}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الحي</label>
                <select className="select" value={districtId} onChange={(e) => setDistrictId(e.target.value)} disabled={!cityId}>
                  <option value="">اختر الحي</option>
                  {districts.map((district: any) => (
                    <option key={district.id} value={district.id}>{district.nameAr}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
