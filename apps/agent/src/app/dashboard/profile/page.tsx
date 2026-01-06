'use client';

import { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  DollarSign,
  TrendingUp,
  Calendar,
  Shield,
} from 'lucide-react';
import { api } from '@/lib/api';

interface AgentProfile {
  user: {
    name: string;
    email: string;
    phone?: string;
    role: string;
  };
  governorates: { name: string }[];
  baseSalary: number;
  commissionRate: number;
  totalEarnings: number;
  joinDate: string;
  manager?: {
    name: string;
    email: string;
  };
}

export default function AgentProfilePage() {
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/agent-portal/profile');
      setProfile(response.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      // بيانات تجريبية
      setProfile({
        user: {
          name: 'أحمد محمد',
          email: 'ahmed@greenpages.sy',
          phone: '0911234567',
          role: 'AGENT',
        },
        governorates: [{ name: 'دمشق' }, { name: 'ريف دمشق' }],
        baseSalary: 500000,
        commissionRate: 10,
        totalEarnings: 2500000,
        joinDate: '2023-06-01',
        manager: {
          name: 'سعيد المدير',
          email: 'saeed@greenpages.sy',
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">جارٍ تحميل الملف الشخصي...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">الملف الشخصي</h1>
        <p className="text-gray-500">معلوماتك الشخصية والوظيفية</p>
      </div>

      {/* Main Info Card */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-green-600 to-green-400" />
        <div className="px-6 pb-6">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 bg-white rounded-full p-1 shadow-lg">
                <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="w-12 h-12 text-gray-400" />
                </div>
              </div>
              <div className="mb-1">
                <h2 className="text-2xl font-bold text-gray-900">
                  {profile.user.name}
                </h2>
                <p className="text-green-600 font-medium">مندوب مبيعات</p>
              </div>
            </div>
            <div className="text-sm text-gray-500 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              انضم منذ {new Date(profile.joinDate).toLocaleDateString('ar-SA')}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">
                معلومات الاتصال
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-600">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span>{profile.user.email}</span>
                </div>
                {profile.user.phone && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span dir="ltr">{profile.user.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-gray-600">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span>
                    {profile.governorates.map((g) => g.name).join('، ')}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">
                معلومات العمل
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span>الراتب الأساسي</span>
                  </div>
                  <span className="font-bold text-gray-900">
                    {profile.baseSalary.toLocaleString()} ل.س
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <span>نسبة العمولة</span>
                  </div>
                  <span className="font-bold text-gray-900">
                    {profile.commissionRate}%
                  </span>
                </div>
                {profile.manager && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Shield className="w-5 h-5 text-purple-600" />
                      <span>المدير المباشر</span>
                    </div>
                    <span className="font-medium text-gray-900">
                      {profile.manager.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm text-center">
          <p className="text-gray-500 text-sm mb-1">إجمالي الأرباح</p>
          <p className="text-2xl font-bold text-green-600">
            {profile.totalEarnings.toLocaleString()} ل.س
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm text-center">
          <p className="text-gray-500 text-sm mb-1">مناطق التغطية</p>
          <p className="text-2xl font-bold text-blue-600">
            {profile.governorates.length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm text-center">
          <p className="text-gray-500 text-sm mb-1">الحالة</p>
          <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium mt-1">
            نشط
          </span>
        </div>
      </div>
    </div>
  );
}
