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
  Edit2,
  Save,
  X,
  Target,
  Briefcase,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface AgentProfile {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar?: string;
    governorate?: { nameAr: string };
    city?: { nameAr: string };
  };
  governorates: { id: string; name: string }[];
  baseSalary: number;
  commissionRate: number;
  totalCommissions: number;
  totalVisits: number;
  hiredAt: string;
  manager?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

interface DashboardStats {
  businesses: {
    total: number;
    pending: number;
    approved: number;
  };
  renewals: {
    pending: number;
    completed: number;
  };
  commissions: {
    approved: number;
    paid: number;
    pending: number;
  };
  visits: {
    today: number;
    planned: number;
  };
}

export default function AgentProfilePage() {
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPhone, setEditedPhone] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [profileRes, dashboardRes] = await Promise.all([
        api.get('/agent-portal/profile'),
        api.get('/agent-portal/dashboard'),
      ]);

      setProfile(profileRes.data);
      setStats(dashboardRes.data.stats);
      setEditedPhone(profileRes.data.user.phone || '');
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('فشل تحميل البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await api.patch('/agent-portal/profile', {
        phone: editedPhone,
      });

      toast.success('تم تحديث الملف الشخصي بنجاح');
      setIsEditing(false);
      fetchData();
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('فشل تحديث الملف الشخصي');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">جارٍ تحميل الملف الشخصي...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const fullName = `${profile.user.firstName} ${profile.user.lastName}`;

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">الملف الشخصي</h1>
          <p className="text-gray-500 mt-1">معلوماتك الشخصية والوظيفية</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            تعديل الملف
          </button>
        )}
      </div>

      {/* Main Profile Card */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Cover Image */}
        <div className="h-40 bg-gradient-to-br from-green-600 via-green-500 to-emerald-400 relative">
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        <div className="px-8 pb-8">
          {/* Avatar and Name */}
          <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-16 mb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
              <div className="w-32 h-32 bg-white rounded-2xl p-2 shadow-xl ring-4 ring-white">
                <div className="w-full h-full bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                  {profile.user.avatar ? (
                    <img
                      src={profile.user.avatar}
                      alt={fullName}
                      className="w-full h-full rounded-xl object-cover"
                    />
                  ) : (
                    <User className="w-16 h-16 text-green-600" />
                  )}
                </div>
              </div>
              <div className="text-center sm:text-right mb-2">
                <h2 className="text-3xl font-bold text-gray-900">{fullName}</h2>
                <div className="flex items-center gap-2 mt-1 justify-center sm:justify-start">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    مندوب مبيعات
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    نشط
                  </span>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-500 flex items-center gap-2 mt-4 sm:mt-0">
              <Calendar className="w-4 h-4" />
              <span>انضم في {new Date(profile.hiredAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>

          {/* Contact and Work Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2 border-b-2 border-green-500 pb-2">
                <Mail className="w-5 h-5 text-green-600" />
                معلومات الاتصال
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">البريد الإلكتروني</p>
                    <p className="text-gray-900 font-medium">{profile.user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">رقم الهاتف</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedPhone}
                        onChange={(e) => setEditedPhone(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        dir="ltr"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium" dir="ltr">
                        {profile.user.phone || 'غير محدد'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">مناطق التغطية</p>
                    <p className="text-gray-900 font-medium">
                      {profile.governorates.map((g) => g.name).join('، ')}
                    </p>
                  </div>
                </div>

                {(profile.user.governorate || profile.user.city) && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <Building2 className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">العنوان</p>
                      <p className="text-gray-900 font-medium">
                        {[profile.user.city?.nameAr, profile.user.governorate?.nameAr]
                          .filter(Boolean)
                          .join('، ')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Work Information */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2 border-b-2 border-blue-500 pb-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                معلومات العمل
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">الراتب الأساسي</p>
                      <p className="text-lg font-bold text-gray-900">
                        {Number(profile.baseSalary).toLocaleString()} ل.س
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">نسبة العمولة</p>
                      <p className="text-lg font-bold text-gray-900">
                        {profile.commissionRate}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">إجمالي العمولات</p>
                      <p className="text-lg font-bold text-gray-900">
                        {Number(profile.totalCommissions || 0).toLocaleString()} ل.س
                      </p>
                    </div>
                  </div>
                </div>

                {profile.manager && (
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">المدير المباشر</p>
                        <p className="text-sm font-bold text-gray-900">
                          {profile.manager.firstName} {profile.manager.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{profile.manager.email}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Edit Actions */}
          {isEditing && (
            <div className="flex items-center gap-3 mt-6 pt-6 border-t">
              <button
                onClick={handleUpdateProfile}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Save className="w-4 h-4" />
                حفظ التغييرات
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedPhone(profile.user.phone || '');
                }}
                className="flex items-center gap-2 px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                <X className="w-4 h-4" />
                إلغاء
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Performance Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-xs text-gray-500">الأنشطة</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.businesses.total}</p>
            <p className="text-sm text-gray-500 mt-1">
              {stats.businesses.approved} موافق عليها • {stats.businesses.pending} معلقة
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-xs text-gray-500">التجديدات</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.renewals.pending + stats.renewals.completed}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {stats.renewals.completed} مكتملة • {stats.renewals.pending} معلقة
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-xs text-gray-500">العمولات</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {Number(stats.commissions.paid).toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {Number(stats.commissions.pending).toLocaleString()} معلقة
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-amber-600" />
              </div>
              <span className="text-xs text-gray-500">الزيارات</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{profile.totalVisits || 0}</p>
            <p className="text-sm text-gray-500 mt-1">
              {stats.visits.today} اليوم • {stats.visits.planned} مخططة
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
