'use client';

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Loader2, MapPin, Save, Shield } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCities, useDistricts, useGovernorates, useManagerDashboard } from '@/lib/hooks';
import { api } from '@/lib/api';

export default function NewAgentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [governorateId, setGovernorateId] = useState('');
  const [cityId, setCityId] = useState('');
  const [districtId, setDistrictId] = useState('');

  const [managedGovernorateIds, setManagedGovernorateIds] = useState<string[]>([]);
  const [agentSalary, setAgentSalary] = useState<string>('0');
  const [agentCommission, setAgentCommission] = useState<string>('10');
  const [requiresApproval, setRequiresApproval] = useState<boolean>(true);

  // جلب بيانات dashboard للحصول على محافظات المدير
  const { data: dashboardData } = useManagerDashboard();

  // جلب بيانات المواقع
  const { data: governoratesData } = useGovernorates();
  const { data: citiesData } = useCities(governorateId || undefined);
  const { data: districtsData } = useDistricts(cityId || undefined);

  // جميع المحافظات - للموقع الجغرافي الشخصي
  const allGovernorates = (governoratesData as any[]) ?? [];
  
  // محافظات المدير فقط - للمحافظات المخصصة للعمل
  const managerGovernorates = useMemo(() => {
    if (dashboardData?.governorates && Array.isArray(dashboardData.governorates)) {
      const allowedGovernorateIds = new Set(dashboardData.governorates.map((g: any) => g.id));
      return allGovernorates.filter((gov: any) => allowedGovernorateIds.has(gov.id));
    }
    return allGovernorates;
  }, [allGovernorates, dashboardData]);

  const cities = (citiesData as any[]) ?? [];
  const districts = (districtsData as any[]) ?? [];

  // إعادة تعيين المدينة والحي عند تغيير المحافظة/المدينة
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
      managedGovernorateIds.length > 0 &&
      password.length >= 8 &&
      password === confirmPassword
  );

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.post('/governorate-manager/agents', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      router.push('/dashboard/agents');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'حدث خطأ أثناء إنشاء المندوب');
    },
  });

  const handleSave = async () => {
    if (!canSubmit) return;

    const baseSalary = Number(agentSalary || 0);
    const commissionRate = Number(agentCommission || 0);

    try {
      await createMutation.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        governorateId: governorateId || undefined,
        cityId: cityId || undefined,
        districtId: districtId || undefined,
        managedGovernorateIds:
          managedGovernorateIds.length > 0 ? managedGovernorateIds : undefined,
        baseSalary: Number.isFinite(baseSalary) ? baseSalary : 0,
        commissionRate: Number.isFinite(commissionRate) ? commissionRate : 0,
        requiresApproval,
      });
    } catch {
      // handled in mutation
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/agents"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="page-title">إضافة مندوب جديد</h1>
            <p className="text-gray-500 mt-1">أضف مندوب جديد للنظام</p>
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={!canSubmit || createMutation.isPending}
        >
          {createMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
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
                    رقم الهاتف <span className="text-red-500">*</span>
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
                كلمة المرور يجب أن تكون 8 أحرف على الأقل
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
                <p className="text-sm font-medium text-gray-900">مندوب</p>
                <p className="text-xs text-gray-500 mt-2">
                  مسؤول جمع البيانات الميدانية ويكسب عمولة على الاشتراكات
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-400" />
              <h2 className="font-bold text-gray-900">الموقع الجغرافي</h2>
            </div>
            <div className="card-body space-y-4">
              <p className="text-xs text-gray-500 mb-4">العنوان الشخصي للمندوب (اختياري)</p>
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
                  {allGovernorates.map((gov: any) => (
                    <option key={gov.id} value={gov.id}>
                      {gov.nameAr}
                    </option>
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
                    <option key={city.id} value={city.id}>
                      {city.nameAr}
                    </option>
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
                    <option key={district.id} value={district.id}>
                      {district.nameAr}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Managed Governorates + Agent Financials (مطابق لمنطق admin عند role=AGENT) */}
          <div className="card">
            <div className="card-header flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-gray-900">
                المحافظات المخصصة <span className="text-red-500">*</span>
              </h2>
            </div>
            <div className="card-body space-y-6">
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

                <div className="pt-4 border-t border-gray-200">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requiresApproval}
                      onChange={(e) => setRequiresApproval(e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900 block">
                        يحتاج موافقة على الأنشطة التجارية
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        عندما يكون مفعّلاً، تحتاج الأنشطة التجارية التي يضيفها المندوب إلى موافقة من مدير المحافظة قبل نشرها.
                        عند تعطيله، يتم نشر الأنشطة مباشرة دون الحاجة للموافقة.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  اختر المحافظات التي يمكن للمندوب العمل فيها <span className="text-red-500">*</span>
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  هذه المحافظات هي التي يمكن للمندوب إضافة أنشطة تجارية فيها
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {managerGovernorates.map((gov: any) => (
                    <label
                      key={gov.id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={managedGovernorateIds.includes(gov.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setManagedGovernorateIds([
                              ...managedGovernorateIds,
                              gov.id,
                            ]);
                          } else {
                            setManagedGovernorateIds(
                              managedGovernorateIds.filter((id) => id !== gov.id)
                            );
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
        </div>
      </div>
    </div>
  );
}
