'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowRight, Save, Shield, Loader2, MapPin } from 'lucide-react';
import { useCreateUser, useGovernorates, useCities, useDistricts } from '@/lib/hooks';

export default function NewUserPage() {
  const router = useRouter();
  const createUser = useCreateUser();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'AGENT' | 'USER'>('USER');
  const [isActive, setIsActive] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [governorateId, setGovernorateId] = useState('');
  const [cityId, setCityId] = useState('');
  const [districtId, setDistrictId] = useState('');

  // جلب بيانات المواقع
  const { data: governoratesData } = useGovernorates();
  const { data: citiesData } = useCities(governorateId || undefined);
  const { data: districtsData } = useDistricts(cityId || undefined);

  const governorates = (governoratesData as any[]) ?? [];
  const cities = (citiesData as any[]) ?? [];
  const districts = (districtsData as any[]) ?? [];

  // إعادة تعيين المدينة والحي عند تغيير المحافظة
  useEffect(() => {
    setCityId('');
    setDistrictId('');
  }, [governorateId]);

  useEffect(() => {
    setDistrictId('');
  }, [cityId]);

  const canSubmit = Boolean(
    firstName.trim() &&
      lastName.trim() &&
      email.trim() &&
      password.length >= 8 &&
      password === confirmPassword
  );

  const handleSave = async () => {
    if (!canSubmit) return;
    try {
      await createUser.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        role,
        isActive,
        isEmailVerified,
        password,
        governorateId: governorateId || undefined,
        cityId: cityId || undefined,
        districtId: districtId || undefined,
      });
      router.push('/users');
    } catch {
      // handled in hook
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          <Link
            href="/users"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="page-title">إضافة مستخدم</h1>
            <p className="text-gray-500 mt-1">أضف مستخدم جديد للنظام</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={!canSubmit || createUser.isPending}>
          {createUser.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          حفظ
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="font-bold text-gray-900">المعلومات الشخصية</h2>
            </div>
            <div className="card-body space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الاسم الأول <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="أحمد"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الاسم الأخير <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="محمد"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    البريد الإلكتروني <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    className="input"
                    placeholder="email@example.com"
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رقم الهاتف
                  </label>
                  <input
                    type="tel"
                    className="input"
                    placeholder="+963 XXX XXX XXX"
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="font-bold text-gray-900">كلمة المرور</h2>
            </div>
            <div className="card-body space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    كلمة المرور <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    className="input"
                    placeholder="••••••••"
                    dir="ltr"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    تأكيد كلمة المرور <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    className="input"
                    placeholder="••••••••"
                    dir="ltr"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500">
                كلمة المرور يجب أن تكون 8 أحرف على الأقل وتحتوي على حرف كبير ورقم ورمز خاص
              </p>
              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-sm text-red-600">كلمتا المرور غير متطابقتين</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header flex items-center gap-2">
              <Shield className="w-5 h-5 text-gray-400" />
              <h2 className="font-bold text-gray-900">الدور والصلاحيات</h2>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الدور <span className="text-red-500">*</span>
                </label>
                <select className="select" value={role} onChange={(e) => setRole(e.target.value as any)}>
                  <option value="SUPER_ADMIN">مدير عام</option>
                  <option value="ADMIN">مدير</option>
                  <option value="MODERATOR">مشرف</option>
                  <option value="AGENT">وكيل</option>
                  <option value="USER">مستخدم</option>
                </select>
              </div>
              <div className="flex items-center justify-between py-2">
                <label className="text-gray-700">نشط</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between py-2">
                <label className="text-gray-700">بريد موثق</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={isEmailVerified}
                    onChange={(e) => setIsEmailVerified(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المحافظة
                </label>
                <select
                  className="select"
                  value={governorateId}
                  onChange={(e) => setGovernorateId(e.target.value)}
                >
                  <option value="">اختر المحافظة</option>
                  {governorates.map((gov: any) => (
                    <option key={gov.id} value={gov.id}>{gov.nameAr}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المدينة
                </label>
                <select
                  className="select"
                  value={cityId}
                  onChange={(e) => setCityId(e.target.value)}
                  disabled={!governorateId}
                >
                  <option value="">اختر المدينة</option>
                  {cities.map((city: any) => (
                    <option key={city.id} value={city.id}>{city.nameAr}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الحي
                </label>
                <select
                  className="select"
                  value={districtId}
                  onChange={(e) => setDistrictId(e.target.value)}
                  disabled={!cityId}
                >
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
