'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  Shield,
  UserCheck,
  UserX,
  MoreVertical,
  Mail,
  Phone,
  Loader2,
  MapPin,
  Building2,
  Briefcase,
  Map,
} from 'lucide-react';
import { useUsers, useDeleteUser } from '@/lib/hooks';
import toast from 'react-hot-toast';

const roleConfig = {
  ADMIN: { label: 'المدير', class: 'badge-danger', icon: Shield, description: 'كامل الصلاحيات' },
  SUPERVISOR: { label: 'المشرف', class: 'badge-warning', icon: UserCheck, description: 'كل شيء ما عدا الإعدادات التقنية' },
  GOVERNORATE_MANAGER: { label: 'مدير محافظة', class: 'badge-primary', icon: Map, description: 'يدير محافظات محددة' },
  AGENT: { label: 'المندوب', class: 'badge-success', icon: Briefcase, description: 'جمع البيانات الميدانية' },
  BUSINESS: { label: 'مالك نشاط', class: 'badge-info', icon: Building2, description: 'يدير نشاطه التجاري' },
  USER: { label: 'مستخدم', class: 'badge-gray', icon: Users, description: 'المستخدم العادي' },
};

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useUsers({
    page,
    limit: 20,
    role: roleFilter || undefined,
    search: searchQuery || undefined,
  });

  const deleteUser = useDeleteUser();

  const users = data?.data ?? [];
  const meta = data?.meta;

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`هل أنت متأكد من حذف "${name}"؟`)) {
      try {
        await deleteUser.mutateAsync(id);
      } catch (error) {
        // Error handled in hook
      }
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">المستخدمين</h1>
          <p className="text-gray-500 mt-1">إدارة حسابات المستخدمين والصلاحيات</p>
        </div>
        <Link href="/users/new" className="btn btn-primary">
          <Plus className="w-4 h-4" />
          إضافة مستخدم
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-card-icon bg-primary-100 text-primary-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="stat-card-value">{meta?.total ?? 0}</p>
              <p className="stat-card-label">إجمالي المستخدمين</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-card-icon bg-green-100 text-green-600">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="stat-card-value">{users.filter((u: any) => (u.status === 'ACTIVE')).length}</p>
              <p className="stat-card-label">نشط</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-card-icon bg-amber-100 text-amber-600">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <p className="stat-card-value">
                {users.filter((u: any) => ['ADMIN', 'SUPERVISOR'].includes(u.role)).length}
              </p>
              <p className="stat-card-label">مشرفين</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-card-icon bg-red-100 text-red-600">
              <UserX className="w-6 h-6" />
            </div>
            <div>
              <p className="stat-card-value">{users.filter((u: any) => (u.status !== 'ACTIVE')).length}</p>
              <p className="stat-card-label">معطل</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="البحث عن مستخدم..."
                  className="input pr-10"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="select w-40"
            >
              <option value="">كل الأدوار</option>
              <option value="ADMIN">مدير</option>
              <option value="SUPERVISOR">مشرف</option>
              <option value="GOVERNORATE_MANAGER">مدير محافظة</option>
              <option value="AGENT">مندوب</option>
              <option value="BUSINESS">مالك نشاط</option>
              <option value="USER">مستخدم</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            لا يوجد مستخدمين
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>المستخدم</th>
                <th>التواصل</th>
                <th>الموقع</th>
                <th>الدور</th>
                <th>الحالة</th>
                <th>تاريخ الانضمام</th>
                <th className="w-20">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: any) => {
                const roleInfo = roleConfig[user.role as keyof typeof roleConfig] || roleConfig.USER;
                const RoleIcon = roleInfo.icon;
                return (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                          <span className="text-primary-600 font-medium">
                            {user.firstName?.charAt(0) || user.email?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </span>
                          <span className="text-sm text-gray-500 block">
                            {user.role || ''}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600" dir="ltr">
                            {user.email}
                          </span>
                          {user.emailVerified && (
                            <span className="text-green-500 text-xs">✓</span>
                          )}
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600" dir="ltr">
                              {user.phone}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      {user.governorate ? (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">
                            {user.governorate.nameAr}
                            {user.city && ` - ${user.city.nameAr}`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">غير محدد</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${roleInfo.class}`}>
                        <RoleIcon className="w-3 h-3 ml-1" />
                        {roleInfo.label}
                      </span>
                    </td>
                    <td>
                      {(() => {
                        const statusMap: Record<string, { class: string; label: string }> = {
                          ACTIVE: { class: 'badge-success', label: 'نشط' },
                          INACTIVE: { class: 'badge-gray', label: 'معطل' },
                          SUSPENDED: { class: 'badge-warning', label: 'موقوف' },
                          PENDING: { class: 'badge-primary', label: 'قيد التفعيل' },
                        };
                        const info = statusMap[user.status ?? 'INACTIVE'];
                        return (
                          <span className={`badge ${info.class}`}>{info.label}</span>
                        );
                      })()}
                    </td>
                    <td className="text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('ar-SY')}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/users/${user.id}/edit`}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => handleDelete(user.id, `${user.firstName} ${user.lastName}`)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {meta && (meta.totalPages ?? 1) > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn btn-outline disabled:opacity-50"
          >
            السابق
          </button>
          <span className="flex items-center px-4 text-gray-600">
            صفحة {page} من {meta.totalPages ?? 1}
          </span>
          <button
            onClick={() => setPage(p => Math.min(meta.totalPages ?? 1, p + 1))}
            disabled={page === (meta.totalPages ?? 1)}
            className="btn btn-outline disabled:opacity-50"
          >
            التالي
          </button>
        </div>
      )}
    </div>
  );
}
