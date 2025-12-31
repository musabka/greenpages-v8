'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { User, Mail, Phone, MapPin, Lock, Save, Loader2, Eye, EyeOff, CheckCircle, Shield, Send } from 'lucide-react';
import { governorateApi, cityApi, districtApi, api } from '@/lib/api';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    governorateId: '',
    cityId: '',
    districtId: '',
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // OTP State
  const [otpData, setOtpData] = useState({
    code: '',
    sent: false,
    countdown: 0,
    sending: false,
    verifying: false,
  });
  
  const [governorates, setGovernorates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // تحميل بيانات المستخدم
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        governorateId: (user as any).governorateId || '',
        cityId: (user as any).cityId || '',
        districtId: (user as any).districtId || '',
      });
    }
  }, [user]);

  // تحميل المحافظات
  useEffect(() => {
    governorateApi.getAll().then(res => {
      const data: any = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
      setGovernorates(data);
    }).catch(console.error);
  }, []);

  // تحميل المدن عند تغيير المحافظة
  useEffect(() => {
    if (formData.governorateId) {
      cityApi.getAll(formData.governorateId).then(res => {
        const data: any = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
        setCities(data);
      }).catch(console.error);
    } else {
      setCities([]);
    }
  }, [formData.governorateId]);

  // تحميل الأحياء عند تغيير المدينة
  useEffect(() => {
    if (formData.cityId) {
      districtApi.getAll(formData.cityId).then(res => {
        const data: any = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
        setDistricts(data);
      }).catch(console.error);
    } else {
      setDistricts([]);
    }
  }, [formData.cityId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      // إعادة تعيين المدينة والحي عند تغيير المحافظة
      if (name === 'governorateId') {
        newData.cityId = '';
        newData.districtId = '';
      }
      // إعادة تعيين الحي عند تغيير المدينة
      if (name === 'cityId') {
        newData.districtId = '';
      }
      return newData;
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // OTP Countdown timer
  useEffect(() => {
    if (otpData.countdown > 0) {
      const timer = setTimeout(() => {
        setOtpData(prev => ({ ...prev, countdown: prev.countdown - 1 }));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [otpData.countdown]);

  // إرسال OTP
  const handleSendOtp = async () => {
    if (!formData.phone) return;
    
    setOtpData(prev => ({ ...prev, sending: true }));
    setMessage(null);

    try {
      const res = await api.post('/auth/otp/send', { phone: formData.phone });
      setOtpData(prev => ({
        ...prev,
        sent: true,
        countdown: 60,
        sending: false,
      }));
      setMessage({ type: 'success', text: 'تم إرسال رمز التحقق إلى هاتفك' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'فشل في إرسال الرمز' });
      setOtpData(prev => ({ ...prev, sending: false }));
    }
  };

  // التحقق من OTP
  const handleVerifyOtp = async () => {
    if (!otpData.code || otpData.code.length !== 6) return;

    setOtpData(prev => ({ ...prev, verifying: true }));
    setMessage(null);

    try {
      await api.post('/auth/otp/verify', {
        phone: formData.phone,
        code: otpData.code,
      });
      setMessage({ type: 'success', text: 'تم التحقق من رقم الهاتف بنجاح!' });
      setOtpData({ code: '', sent: false, countdown: 0, sending: false, verifying: false });
      // تحديث بيانات المستخدم
      if (refreshUser) {
        refreshUser();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'رمز التحقق غير صحيح' });
      setOtpData(prev => ({ ...prev, verifying: false }));
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsUpdating(true);

    try {
      await api.put('/auth/profile', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        governorateId: formData.governorateId || null,
        cityId: formData.cityId || null,
        districtId: formData.districtId || null,
      });
      
      setMessage({ type: 'success', text: 'تم تحديث البيانات بنجاح' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'حدث خطأ أثناء تحديث البيانات' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'كلمة المرور الجديدة غير متطابقة' });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' });
      return;
    }

    setIsChangingPassword(true);

    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      setMessage({ type: 'success', text: 'تم تغيير كلمة المرور بنجاح' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'كلمة المرور الحالية غير صحيحة' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // إعادة توجيه إذا لم يكن مسجل الدخول
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [authLoading, user, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">الملف الشخصي</h1>
          <p className="text-gray-600 mt-2">إدارة معلوماتك الشخصية وإعدادات الحساب</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <span className="text-red-500">⚠</span>
            )}
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4">
                {user.firstName?.charAt(0) || user.email?.charAt(0)}
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-gray-500 mt-1">{user.email}</p>
              
              <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span dir="ltr">{user.email}</span>
                  {(user as any).emailVerified && (
                    <span className="text-green-500 text-xs bg-green-50 px-2 py-0.5 rounded">موثق</span>
                  )}
                </div>
                {user.phone && (
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span dir="ltr">{user.phone}</span>
                    {(user as any).phoneVerified && (
                      <span className="text-green-500 text-xs bg-green-50 px-2 py-0.5 rounded">موثق</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <h3 className="font-bold text-gray-900">المعلومات الشخصية</h3>
              </div>
              
              <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">الاسم الأول</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">اسم العائلة</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="input"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="label">رقم الهاتف</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input"
                    dir="ltr"
                    required
                  />
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-700">الموقع</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="label">المحافظة</label>
                      <select
                        name="governorateId"
                        value={formData.governorateId}
                        onChange={handleChange}
                        className="input"
                      >
                        <option value="">اختر</option>
                        {governorates.map((gov) => (
                          <option key={gov.id} value={gov.id}>{gov.nameAr}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">المدينة</label>
                      <select
                        name="cityId"
                        value={formData.cityId}
                        onChange={handleChange}
                        className="input"
                        disabled={!formData.governorateId}
                      >
                        <option value="">اختر</option>
                        {cities.map((city) => (
                          <option key={city.id} value={city.id}>{city.nameAr}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">الحي</label>
                      <select
                        name="districtId"
                        value={formData.districtId}
                        onChange={handleChange}
                        className="input"
                        disabled={!formData.cityId}
                      >
                        <option value="">اختر</option>
                        {districts.map((district) => (
                          <option key={district.id} value={district.id}>{district.nameAr}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="btn btn-primary"
                  >
                    {isUpdating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    حفظ التغييرات
                  </button>
                </div>
              </form>
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <Lock className="w-5 h-5 text-gray-400" />
                <h3 className="font-bold text-gray-900">تغيير كلمة المرور</h3>
              </div>
              
              <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                <div>
                  <label className="label">كلمة المرور الحالية</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="input pr-10"
                      dir="ltr"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">كلمة المرور الجديدة</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className="input pr-10"
                        dir="ltr"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="label">تأكيد كلمة المرور</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="input"
                      dir="ltr"
                      required
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="btn btn-outline"
                  >
                    {isChangingPassword ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                    تغيير كلمة المرور
                  </button>
                </div>
              </form>
            </div>

            {/* Phone Verification */}
            {!(user as any)?.phoneVerified && formData.phone && (
              <div className="bg-white rounded-2xl shadow-sm border border-amber-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-amber-100 flex items-center gap-3 bg-amber-50">
                  <Shield className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-amber-800">التحقق من رقم الهاتف</h3>
                </div>
                
                <div className="p-6 space-y-4">
                  <p className="text-gray-600 text-sm">
                    قم بتأكيد رقم هاتفك لزيادة أمان حسابك والحصول على إعلانات مخصصة لموقعك.
                  </p>

                  {!otpData.sent ? (
                    <button
                      onClick={handleSendOtp}
                      disabled={otpData.sending}
                      className="btn btn-primary w-full"
                    >
                      {otpData.sending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      إرسال رمز التحقق إلى {formData.phone}
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="label">رمز التحقق (6 أرقام)</label>
                        <input
                          type="text"
                          value={otpData.code}
                          onChange={(e) => setOtpData(prev => ({ ...prev, code: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                          className="input text-center text-2xl tracking-widest"
                          dir="ltr"
                          placeholder="______"
                          maxLength={6}
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={handleVerifyOtp}
                          disabled={otpData.verifying || otpData.code.length !== 6}
                          className="btn btn-primary flex-1"
                        >
                          {otpData.verifying ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          تأكيد
                        </button>
                        
                        <button
                          onClick={handleSendOtp}
                          disabled={otpData.countdown > 0 || otpData.sending}
                          className="btn btn-outline"
                        >
                          {otpData.countdown > 0 ? (
                            <span className="text-gray-500">إعادة الإرسال ({otpData.countdown})</span>
                          ) : otpData.sending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'إعادة الإرسال'
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Phone Verified Badge */}
            {(user as any)?.phoneVerified && (
              <div className="bg-green-50 rounded-2xl border border-green-200 p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-green-800">رقم الهاتف موثق</h3>
                  <p className="text-green-600 text-sm">تم التحقق من رقم هاتفك بنجاح</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
