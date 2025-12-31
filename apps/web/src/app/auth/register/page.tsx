'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';
import { Eye, EyeOff, UserPlus, Mail, Lock, User, Phone, MapPin } from 'lucide-react';
import { governorateApi, cityApi, districtApi } from '@/lib/api';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    governorateId: '',
    cityId: '',
    districtId: '',
  });
  const [governorates, setGovernorates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Load governorates
  useEffect(() => {
    governorateApi.getAll().then(res => {
      const data: any = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
      setGovernorates(data);
    }).catch(console.error);
  }, []);

  // Load cities when governorate changes
  useEffect(() => {
    if (formData.governorateId) {
      cityApi.getAll(formData.governorateId).then(res => {
        const data: any = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
        setCities(data);
        setDistricts([]);
        setFormData(prev => ({ ...prev, cityId: '', districtId: '' }));
      }).catch(console.error);
    } else {
      setCities([]);
      setDistricts([]);
    }
  }, [formData.governorateId]);

  // Load districts when city changes
  useEffect(() => {
    if (formData.cityId) {
      districtApi.getAll(formData.cityId).then(res => {
        const data: any = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
        setDistricts(data);
        setFormData(prev => ({ ...prev, districtId: '' }));
      }).catch(console.error);
    } else {
      setDistricts([]);
    }
  }, [formData.cityId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('كلمة المرور غير متطابقة');
      return;
    }

    if (formData.password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    if (!formData.phone) {
      setError('رقم الهاتف إجباري');
      return;
    }

    if (!formData.governorateId) {
      setError('المحافظة إجبارية');
      return;
    }

    if (!acceptTerms) {
      setError('يجب الموافقة على الشروط والأحكام');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        governorateId: formData.governorateId,
        cityId: formData.cityId || undefined,
        districtId: formData.districtId || undefined,
      });
      // بعد التسجيل الناجح، توجيه المستخدم إلى الصفحة السابقة أو الرئيسية
      router.push(redirectUrl || '/');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'حدث خطأ أثناء إنشاء الحساب');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50 p-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg mb-4">
              <span className="text-white font-bold text-4xl">ص</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">الصفحات الخضراء</h1>
          <p className="text-gray-500 mt-1">أنشئ حسابك الجديد</p>
        </div>

        {/* Register Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-6">
            إنشاء حساب جديد
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="label">
                  الاسم الأول
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="input pl-10"
                    placeholder="أحمد"
                    required
                  />
                  <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className="label">
                  اسم العائلة
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="input pl-10"
                    placeholder="محمد"
                    required
                  />
                  <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="label">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="example@email.com"
                  required
                  dir="ltr"
                />
                <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="label">
                رقم الهاتف <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="+963 XXX XXX XXX"
                  required
                  dir="ltr"
                />
                <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label htmlFor="governorateId" className="label">
                المحافظة <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="governorateId"
                  name="governorateId"
                  value={formData.governorateId}
                  onChange={handleChange}
                  className="input pl-10 appearance-none"
                  required
                >
                  <option value="">اختر المحافظة</option>
                  {governorates.map((gov) => (
                    <option key={gov.id} value={gov.id}>{gov.nameAr}</option>
                  ))}
                </select>
                <MapPin className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="cityId" className="label">
                  المدينة <span className="text-gray-400">(اختياري)</span>
                </label>
                <select
                  id="cityId"
                  name="cityId"
                  value={formData.cityId}
                  onChange={handleChange}
                  className="input appearance-none"
                  disabled={!formData.governorateId}
                >
                  <option value="">اختر المدينة</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>{city.nameAr}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="districtId" className="label">
                  الحي <span className="text-gray-400">(اختياري)</span>
                </label>
                <select
                  id="districtId"
                  name="districtId"
                  value={formData.districtId}
                  onChange={handleChange}
                  className="input appearance-none"
                  disabled={!formData.cityId}
                >
                  <option value="">اختر الحي</option>
                  {districts.map((district) => (
                    <option key={district.id} value={district.id}>{district.nameAr}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="password" className="label">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input pl-10 pr-10"
                  placeholder="••••••••"
                  required
                  dir="ltr"
                />
                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">يجب أن تكون 6 أحرف على الأقل</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">
                تأكيد كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input pl-10 pr-10"
                  placeholder="••••••••"
                  required
                  dir="ltr"
                />
                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer">
                أوافق على{' '}
                <Link href="/terms" className="text-primary-600 hover:text-primary-700 font-medium">
                  الشروط والأحكام
                </Link>{' '}
                و{' '}
                <Link href="/privacy" className="text-primary-600 hover:text-primary-700 font-medium">
                  سياسة الخصوصية
                </Link>
              </label>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full h-12 text-base"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  إنشاء الحساب
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-gray-100 pt-6">
            <p className="text-gray-600 text-sm">
              لديك حساب بالفعل؟{' '}
              <Link href="/auth/login" className="text-primary-600 hover:text-primary-700 font-semibold">
                سجل الدخول
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-8">
          © {new Date().getFullYear()} الصفحات الخضراء. جميع الحقوق محفوظة.
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">جاري التحميل...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
