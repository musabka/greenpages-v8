'use client';

import { useState } from 'react';
import { Search, UserCheck, UserPlus, X, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useMutation, useQuery } from '@tanstack/react-query';

type OwnerLinkingProps = {
  businessId?: string;
  onOwnerLinked?: (ownerId: string) => void;
  onInviteSent?: (phone: string) => void;
  className?: string;
};

type UserSearchResult = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  businessCapabilities?: Array<{
    business: {
      id: string;
      nameAr: string;
    };
  }>;
};

export function OwnerLinkingSection({ businessId, onOwnerLinked, onInviteSent, className = '' }: OwnerLinkingProps) {
  const [activeTab, setActiveTab] = useState<'existing' | 'invite'>('existing');
  const [searchIdentifier, setSearchIdentifier] = useState('');
  const [searchedUser, setSearchedUser] = useState<UserSearchResult | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Invite form state
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteOwnerName, setInviteOwnerName] = useState('');

  // Search user mutation
  const searchUserMutation = useMutation({
    mutationFn: async (identifier: string) => {
      const response = await api.get(`/capabilities/search-user/${encodeURIComponent(identifier)}`);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        setSearchedUser(data.data);
        setShowSearchResults(true);
      } else {
        setSearchedUser(null);
        setShowSearchResults(true);
      }
    },
  });

  // Link owner mutation
  const linkOwnerMutation = useMutation({
    mutationFn: async (data: { identifier: string; businessId: string }) => {
      const response = await api.post('/capabilities/link-owner', data);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success && searchedUser) {
        onOwnerLinked?.(searchedUser.id);
        setSearchIdentifier('');
        setSearchedUser(null);
        setShowSearchResults(false);
      }
    },
  });

  // Invite owner mutation
  const inviteOwnerMutation = useMutation({
    mutationFn: async (data: { businessId: string; phone: string; email?: string; ownerName?: string }) => {
      const response = await api.post('/capabilities/invite-owner', data);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        onInviteSent?.(invitePhone);
        setInvitePhone('');
        setInviteEmail('');
        setInviteOwnerName('');
      }
    },
  });

  const handleSearch = () => {
    if (!searchIdentifier.trim()) return;
    searchUserMutation.mutate(searchIdentifier.trim());
  };

  const handleLinkOwner = () => {
    if (!businessId || !searchIdentifier) return;
    linkOwnerMutation.mutate({
      identifier: searchIdentifier,
      businessId,
    });
  };

  const handleInviteOwner = () => {
    if (!businessId || !invitePhone.trim()) return;
    inviteOwnerMutation.mutate({
      businessId,
      phone: invitePhone.trim(),
      email: inviteEmail.trim() || undefined,
      ownerName: inviteOwnerName.trim() || undefined,
    });
  };

  return (
    <div className={`rounded-2xl border border-gray-200 bg-white shadow-sm ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">ربط المالك (اختياري)</h3>
        <p className="text-sm text-gray-500 mt-1">
          يمكن ربط النشاط بمالك الآن أو لاحقاً. تخطي هذه الخطوة لا يؤثر على نشر النشاط.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('existing')}
          className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'existing'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <UserCheck className="w-4 h-4 inline-block ml-2" />
          مالك لديه حساب
        </button>
        <button
          onClick={() => setActiveTab('invite')}
          className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'invite'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <UserPlus className="w-4 h-4 inline-block ml-2" />
          دعوة مالك جديد
        </button>
      </div>

      <div className="p-6">
        {/* Tab: Existing User */}
        {activeTab === 'existing' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رقم الهاتف أو البريد الإلكتروني
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchIdentifier}
                  onChange={(e) => setSearchIdentifier(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="0791234567 أو email@example.com"
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                />
                <button
                  onClick={handleSearch}
                  disabled={!searchIdentifier.trim() || searchUserMutation.isPending}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {searchUserMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  بحث
                </button>
              </div>
            </div>

            {/* Search Results */}
            {showSearchResults && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                {searchedUser ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      {searchedUser.avatar ? (
                        <img
                          src={searchedUser.avatar}
                          alt={`${searchedUser.firstName} ${searchedUser.lastName}`}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-600 font-semibold text-lg">
                            {searchedUser.firstName[0]}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          {searchedUser.firstName} {searchedUser.lastName}
                        </h4>
                        <p className="text-sm text-gray-600">{searchedUser.phone}</p>
                        <p className="text-sm text-gray-600">{searchedUser.email}</p>
                        {searchedUser.businessCapabilities && searchedUser.businessCapabilities.length > 0 && (
                          <p className="text-xs text-amber-600 mt-1">
                            مرتبط بـ {searchedUser.businessCapabilities.length} نشاط تجاري
                          </p>
                        )}
                      </div>
                    </div>

                    {businessId && (
                      <button
                        onClick={handleLinkOwner}
                        disabled={linkOwnerMutation.isPending}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {linkOwnerMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                        ربط كمالك
                      </button>
                    )}

                    {linkOwnerMutation.isSuccess && (
                      <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                        <p className="text-sm text-green-700 font-medium">
                          ✓ تم ربط المالك بنجاح
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-600">لم يتم العثور على مستخدم بهذه البيانات</p>
                    <button
                      onClick={() => setActiveTab('invite')}
                      className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      أرسل دعوة بدلاً من ذلك ←
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab: Invite New User */}
        {activeTab === 'invite' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رقم الهاتف <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={invitePhone}
                onChange={(e) => setInvitePhone(e.target.value)}
                placeholder="0791234567"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                البريد الإلكتروني (اختياري)
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="owner@example.com"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم المالك (اختياري)
              </label>
              <input
                type="text"
                value={inviteOwnerName}
                onChange={(e) => setInviteOwnerName(e.target.value)}
                placeholder="أحمد محمد"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              />
            </div>

            {businessId && (
              <button
                onClick={handleInviteOwner}
                disabled={!invitePhone.trim() || inviteOwnerMutation.isPending}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {inviteOwnerMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                إرسال دعوة
              </button>
            )}

            {inviteOwnerMutation.isSuccess && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                <p className="text-sm text-green-700 font-medium">
                  ✓ تم إرسال الدعوة بنجاح
                </p>
                <p className="text-xs text-green-600 mt-1">
                  سيتم إرسال رسالة SMS للمالك برابط المطالبة بالملكية
                </p>
              </div>
            )}

            {inviteOwnerMutation.isError && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-700">
                  {(inviteOwnerMutation.error as any)?.response?.data?.message || 'حدث خطأ أثناء إرسال الدعوة'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
