'use client';

import Link from 'next/link';
import { useEffect, useState, use } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, Loader2, Save, Shield, MapPin } from 'lucide-react';
import { useUpdateUser, useUser, useGovernorates, useCities, useDistricts } from '@/lib/hooks';

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data: user, isLoading } = useUser(id);
  const updateUser = useUpdateUser();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'SUPERVISOR' | 'GOVERNORATE_MANAGER' | 'AGENT' | 'BUSINESS' | 'USER'>('USER');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING'>('ACTIVE');
  const [emailVerified, setEmailVerified] = useState(false);
  const [governorateId, setGovernorateId] = useState('');
  const [cityId, setCityId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [managedGovernorateIds, setManagedGovernorateIds] = useState<string[]>([]);
  const [companyCommissionRate, setCompanyCommissionRate] = useState<string>('15');
  const [agentSalary, setAgentSalary] = useState<string>('0');
  const [agentCommission, setAgentCommission] = useState<string>('10');

  const { data: governoratesData } = useGovernorates();
  const { data: citiesData } = useCities(governorateId || undefined);
  const { data: districtsData } = useDistricts(cityId || undefined);

  const governorates = governoratesData ?? [];
  const cities = citiesData ?? [];
  const districts = districtsData ?? [];

  useEffect(() => {
    if (!user) return;
    console.log('Loading user data:', user);
    setFirstName(user.firstName ?? '');
    setLastName(user.lastName ?? '');
    setPhone(user.phone ?? '');
    setRole((user.role as any) ?? 'USER');
    setStatus((user as any).status ?? 'ACTIVE');
    setEmailVerified(Boolean((user as any).emailVerified));
    setGovernorateId((user as any).governorateId ?? '');
    setCityId((user as any).cityId ?? '');
    setDistrictId((user as any).districtId ?? '');
    
    // Load managed governorates for GOVERNORATE_MANAGER
    if ((user as any).governorateManagers && Array.isArray((user as any).governorateManagers)) {
      const govIds = (user as any).governorateManagers.map((gm: any) => gm.governorateId);
      console.log('Loading manager governorates:', govIds);
      setManagedGovernorateIds(govIds);
      // Load commission rate from the first record
      if ((user as any).governorateManagers.length > 0) {
        setCompanyCommissionRate((user as any).governorateManagers[0].companyCommissionRate?.toString() ?? '15');
      }
    }
    
    // Load managed governorates for AGENT
    if ((user as any).agentProfile?.governorates && Array.isArray((user as any).agentProfile.governorates)) {
      const govIds = (user as any).agentProfile.governorates.map((ag: any) => ag.governorateId);
      console.log('Loading agent governorates:', govIds);
      console.log('Raw agentProfile.governorates:', (user as any).agentProfile.governorates);
      setManagedGovernorateIds(govIds);
    }
    
    // Load agent salary and commission
    if ((user as any).agentProfile) {
      setAgentSalary((user as any).agentProfile.baseSalary?.toString() ?? '0');
      setAgentCommission((user as any).agentProfile.commissionRate?.toString() ?? '10');
    }
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
      const payload = {
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
          managedGovernorateIds: (role === 'GOVERNORATE_MANAGER' || role === 'AGENT') && managedGovernorateIds.length > 0 
            ? managedGovernorateIds 
            : undefined,
          companyCommissionRate: role === 'GOVERNORATE_MANAGER' ? Number(companyCommissionRate) : undefined,
          agentSalary: role === 'AGENT' ? Number(agentSalary) : undefined,
          agentCommission: role === 'AGENT' ? Number(agentCommission) : undefined,
        },
      };
      console.log('Saving with payload:', payload);
      await updateUser.mutateAsync(payload);
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
                  <option value="ADMIN">مدير</option>
                  <option value="SUPERVISOR">مشرف</option>
                  <option value="GOVERNORATE_MANAGER">مدير محافظة</option>
                  <option value="AGENT">مندوب</option>
                  <option value="BUSINESS">مالك نشاط</option>
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
              <p className="text-xs text-gray-500 mb-4">العنوان الشخصي للمستخدم (اختياري)</p>
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
