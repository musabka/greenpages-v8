'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  UserCheck,
  Shield,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate, formatNumber } from '@/lib/format';
import { OwnerStatusBadge, OwnerInfoBadge, OwnerLinkingSection, QuickActionsMenu } from '@/components/business';
import { BulkOwnershipActions } from '@/components/business/bulk-ownership-actions';

interface Business {
  id: string;
  nameAr: string;
  phone: string;
  email?: string;
  city: { nameAr: string };
  district?: { nameAr: string };
  categories?: Array<{ category: { nameAr: string } }>;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'EXPIRED';
  createdAt: string;
  package?: {
    package: { nameAr: string };
  };
  ownerStatus?: 'unclaimed' | 'claimed' | 'verified';
  owner?: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
}

export default function ManagerBusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ownerStatusFilter, setOwnerStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showOwnerLinkModal, setShowOwnerLinkModal] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const limit = 10;

  useEffect(() => {
    fetchBusinesses();
  }, [page, statusFilter, ownerStatusFilter]);

  const fetchBusinesses = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (ownerStatusFilter !== 'all') params.append('ownerStatus', ownerStatusFilter);
      if (search) params.append('search', search);

      const response = await api.get(`/governorate-manager/businesses?${params}`);
      setBusinesses(response.data.data || response.data);
      setTotal(response.data.total || response.data.length);
    } catch (error) {
      console.error('Failed to fetch businesses:', error);
      setBusinesses([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchBusinesses();
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-700';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-700';
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'فعال';
      case 'PENDING':
        return 'معلق';
      case 'SUSPENDED':
        return 'موقوف';
      case 'EXPIRED':
        return 'منتهي';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return CheckCircle;
      case 'PENDING':
        return Clock;
      case 'SUSPENDED':
      case 'EXPIRED':
        return XCircle;
      default:
        return Clock;
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">النشاطات التجارية</h1>
          <p className="text-gray-500">إدارة النشاطات في محافظاتك</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            إجمالي: {formatNumber(total)} نشاط
          </div>
          <Link
            href="/dashboard/businesses/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            إضافة نشاط
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="البحث بالاسم أو رقم الهاتف..."
              className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">جميع الحالات</option>
              <option value="ACTIVE">فعال</option>
              <option value="PENDING">معلق</option>
              <option value="SUSPENDED">موقوف</option>
              <option value="EXPIRED">منتهي</option>
            </select>
            
            <select
              value={ownerStatusFilter}
              onChange={(e) => {
                setOwnerStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">كل الملكية</option>
              <option value="unclaimed">غير مرتبط</option>
              <option value="claimed">مرتبط</option>
              <option value="verified">موثّق</option>
            </select>
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            بحث
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد نشاطات تجارية</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                    النشاط
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                    المالك
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                    الموقع
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                    التصنيف
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                    الباقة
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                    الحالة
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                    التاريخ
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {businesses.map((business) => {
                  const StatusIcon = getStatusIcon(business.status);
                  return (
                    <tr key={business.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{business.nameAr}</p>
                          <p className="text-sm text-gray-500">{business.phone}</p>
                        </div>
                      </td>
                      
                      <td className="px-4 py-3">
                        {business.ownerStatus === 'unclaimed' ? (
                          <button
                            onClick={() => {
                              setSelectedBusinessId(business.id);
                              setShowOwnerLinkModal(true);
                            }}
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            <UserCheck className="w-4 h-4" />
                            ربط مالك
                          </button>
                        ) : (
                          <OwnerInfoBadge
                            status={business.ownerStatus || 'unclaimed'}
                            ownerName={business.owner ? `${business.owner.firstName} ${business.owner.lastName}` : undefined}
                            ownerPhone={business.owner?.phone}
                            compact
                          />
                        )}
                      </td>
                      
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>
                            {business.city.nameAr}
                            {business.district && ` - ${business.district.nameAr}`}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {business.categories?.[0]?.category?.nameAr || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {business.package?.package?.nameAr || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusStyle(
                            business.status
                          )}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {getStatusText(business.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {formatDate(business.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <QuickActionsMenu
                          businessId={business.id}
                          businessName={business.nameAr}
                          ownerStatus={business.ownerStatus}
                          onLinkOwner={(id) => {
                            setSelectedBusinessId(id);
                            setShowOwnerLinkModal(true);
                          }}
                          editPath="/dashboard/businesses"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <p className="text-sm text-gray-500">
              عرض {formatNumber((page - 1) * limit + 1)} - {formatNumber(Math.min(page * limit, total))} من {formatNumber(total)}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-600">
                {formatNumber(page)} / {formatNumber(totalPages)}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Owner Linking Modal */}
      {showOwnerLinkModal && selectedBusinessId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">ربط مالك النشاط التجاري</h2>
              <button
                onClick={() => {
                  setShowOwnerLinkModal(false);
                  setSelectedBusinessId(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <OwnerLinkingSection
                businessId={selectedBusinessId}
                onOwnerLinked={() => {
                  setShowOwnerLinkModal(false);
                  setSelectedBusinessId(null);
                  fetchBusinesses(); // Refresh list
                }}
                onInviteSent={() => {
                  setShowOwnerLinkModal(false);
                  setSelectedBusinessId(null);
                  fetchBusinesses(); // Refresh list
                }}
              />
              
              <div className="mt-6 pt-6 border-t flex justify-end">
                <button
                  onClick={() => {
                    setShowOwnerLinkModal(false);
                    setSelectedBusinessId(null);
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Ownership Actions */}
      <BulkOwnershipActions
        selectedBusinessIds={selectedRows}
        onClearSelection={() => setSelectedRows([])}
        onActionComplete={fetchBusinesses}
      />
    </div>
  );
}
