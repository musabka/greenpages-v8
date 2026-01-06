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
  const [role, setRole] = useState<'ADMIN' | 'SUPERVISOR' | 'GOVERNORATE_MANAGER' | 'AGENT' | 'BUSINESS' | 'ACCOUNTANT' | 'USER'>('USER');
  const [isActive, setIsActive] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [governorateId, setGovernorateId] = useState('');
  const [cityId, setCityId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [managedGovernorateIds, setManagedGovernorateIds] = useState<string[]>([]);
  const [companyCommissionRate, setCompanyCommissionRate] = useState<string>('15');
  const [agentSalary, setAgentSalary] = useState<string>('0');
  const [agentCommission, setAgentCommission] = useState<string>('10');

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
      phone.trim() &&
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
        phone: phone.trim(),
        role,
        isActive,
        isEmailVerified,
        password,
        governorateId: governorateId || undefined,
        cityId: cityId || undefined,
        districtId: districtId || undefined,
        managedGovernorateIds: (role === 'GOVERNORATE_MANAGER' || role === 'AGENT') && managedGovernorateIds.length > 0 
          ? managedGovernorateIds 
          : undefined,
        companyCommissionRate: role === 'GOVERNORATE_MANAGER' ? Number(companyCommissionRate) : undefined,
        agentSalary: role === 'AGENT' ? Number(agentSalary) : undefined,
        agentCommission: role === 'AGENT' ? Number(agentCommission) : undefined,
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
                  <option value="ADMIN">المدير - كامل الصلاحيات</option>
                  <option value="SUPERVISOR">المشرف - كل شيء ما عدا الإعدادات التقنية</option>
                  <option value="GOVERNORATE_MANAGER">مدير محافظة - يدير محافظات محددة</option>
                  <option value="AGENT">المندوب - جمع البيانات الميدانية</option>
                  <option value="BUSINESS">مالك نشاط - يدير نشاطه التجاري</option>
                  <option value="ACCOUNTANT">محاسب - صلاحيات محاسبية</option>
                  <option value="USER">مستخدم - المستخدم العادي</option>
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  {role === 'ADMIN' && 'يملك كامل الصلاحيات على النظام بما فيها الإعدادات التقنية'}
                  {role === 'SUPERVISOR' && 'يملك جميع الصلاحيات ما عدا الإعدادات التقنية والباقات'}
                  {role === 'GOVERNORATE_MANAGER' && 'يدير الأنشطة والمندوبين في محافظات محددة فقط'}
                  {role === 'AGENT' && 'مسؤول جمع البيانات الميدانية ويكسب عمولة على الاشتراكات'}
                  {role === 'BUSINESS' && 'يدير نشاطه التجاري وفروعه ومنتجاته'}
                  {role === 'ACCOUNTANT' && 'يملك صلاحيات محاسبية للوحات المحاسب والتقارير'}
                  {role === 'USER' && 'يتصفح الموقع ويكتب التقييمات'}
                </p>
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
              <p className="text-xs text-gray-500 mb-4">العنوان الشخصي للمستخدم (اختياري)</p>
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

          {/* Managed Governorates - For GOVERNORATE_MANAGER and AGENT */}
          {(role === 'GOVERNORATE_MANAGER' || role === 'AGENT') && (
            <div className="card">
              <div className="card-header flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h2 className="font-bold text-gray-900">
                  {role === 'GOVERNORATE_MANAGER' ? 'المحافظات المُدارة' : 'المحافظات المخصصة'}
                  {' '}<span className="text-red-500">*</span>
                </h2>
              </div>
              <div className="card-body space-y-6">
                {/* Company Commission Rate - Only for Governorate Manager */}
                {role === 'GOVERNORATE_MANAGER' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      نسبة الصفحات الخضراء (المركز الرئيسي) %
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={companyCommissionRate}
                        onChange={(e) => setCompanyCommissionRate(e.target.value)}
                        className="input pl-10"
                        placeholder="15"
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                        %
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      النسبة المئوية التي سيتم اقتطاعها من الدخل الإجمالي للمحافظة لصالح المركز الرئيسي.
                    </p>
                  </div>
                )}

                {/* Agent Salary and Commission - Only for Agent */}
                {role === 'AGENT' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        الراتب الشهري الأساسي (ل.س)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={agentSalary}
                        onChange={(e) => setAgentSalary(e.target.value)}
                        className="input"
                        placeholder="0"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        الراتب الشهري الثابت للمندوب بالليرة السورية.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        نسبة العمولة %
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={agentCommission}
                          onChange={(e) => setAgentCommission(e.target.value)}
                          className="input pl-10"
                          placeholder="10"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                          %
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        نسبة العمولة التي سيحصل عليها المندوب من كل اشتراك يقوم بجلبه.
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    {role === 'GOVERNORATE_MANAGER' 
                      ? 'اختر المحافظات التي سيكون هذا المدير مسؤولاً عنها'
                      : 'اختر المحافظات التي يمكن للمندوب العمل فيها وإضافة أنشطة تجارية'}
                  </p>
                  <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {governorates.map((gov: any) => (
                      <label
                        key={gov.id}
                        className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={managedGovernorateIds.includes(gov.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setManagedGovernorateIds([...managedGovernorateIds, gov.id]);
                            } else {
                              setManagedGovernorateIds(managedGovernorateIds.filter(id => id !== gov.id));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {gov.nameAr}
                        </span>
                      </label>
                    ))}
                  </div>
                  {managedGovernorateIds.length > 0 && (
                    <p className="text-sm text-blue-600 mt-2">
                      تم اختيار {managedGovernorateIds.length} محافظة
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
