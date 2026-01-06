'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { UserCheck, UserX, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface BulkOwnershipActionsProps {
  selectedBusinessIds: string[];
  onClearSelection: () => void;
  onActionComplete?: () => void;
}

export function BulkOwnershipActions({
  selectedBusinessIds,
  onClearSelection,
  onActionComplete,
}: BulkOwnershipActionsProps) {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [userId, setUserId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const queryClient = useQueryClient();

  const bulkLinkMutation = useMutation({
    mutationFn: (data: { businessIds: string[]; userId: string }) =>
      api.post('/businesses/bulk/link-owner', data),
    onSuccess: (response) => {
      const data = response.data;
      toast.success(data.message || 'تم ربط الأنشطة بنجاح');
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      onClearSelection();
      onActionComplete?.();
      setShowLinkModal(false);
      setUserId('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'فشل في ربط الأنشطة');
    },
  });

  const bulkUnlinkMutation = useMutation({
    mutationFn: (businessIds: string[]) =>
      api.post('/businesses/bulk/unlink-owner', { businessIds }),
    onSuccess: (response) => {
      const data = response.data;
      toast.success(data.message || 'تم فصل الأنشطة بنجاح');
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      onClearSelection();
      onActionComplete?.();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'فشل في فصل الأنشطة');
    },
  });

  const searchUsers = async (query: string) => {
    if (!query || query.length < 2) {
      setUsers([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await api.get(`/users?search=${encodeURIComponent(query)}&role=USER&limit=10`);
      setUsers(response.data.data || response.data || []);
    } catch (error) {
      console.error('Failed to search users:', error);
      setUsers([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    searchUsers(value);
  };

  const handleBulkLink = () => {
    if (!userId) {
      toast.error('الرجاء اختيار مستخدم');
      return;
    }
    bulkLinkMutation.mutate({ businessIds: selectedBusinessIds, userId });
  };

  const handleBulkUnlink = () => {
    if (window.confirm(`هل أنت متأكد من فصل ${selectedBusinessIds.length} نشاط عن مالكيهم؟`)) {
      bulkUnlinkMutation.mutate(selectedBusinessIds);
    }
  };

  if (selectedBusinessIds.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              {selectedBusinessIds.length} نشاط محدد
            </span>
            <button
              onClick={onClearSelection}
              className="p-1 hover:bg-gray-100 rounded"
              title="إلغاء التحديد"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="h-6 w-px bg-gray-300" />

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLinkModal(true)}
              disabled={bulkLinkMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {bulkLinkMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserCheck className="w-4 h-4" />
              )}
              ربط بمالك
            </button>

            <button
              onClick={handleBulkUnlink}
              disabled={bulkUnlinkMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {bulkUnlinkMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserX className="w-4 h-4" />
              )}
              فصل المالك
            </button>
          </div>
        </div>
      </div>

      {/* Link Owner Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                ربط {selectedBusinessIds.length} نشاط بمالك
              </h3>
              <button
                onClick={() => setShowLinkModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  البحث عن مستخدم
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="ابحث بالاسم أو البريد الإلكتروني..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {isSearching && (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              )}

              {users.length > 0 && (
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setUserId(user.id);
                        setSearchQuery(`${user.firstName} ${user.lastName}`);
                        setUsers([]);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 ${
                        userId === user.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowLinkModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleBulkLink}
                  disabled={!userId || bulkLinkMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {bulkLinkMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    'ربط الأنشطة'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
