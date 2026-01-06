'use client';

import { useState } from 'react';
import { UserCheck, Edit, Trash2, Plus, X, Loader2, AlertCircle } from 'lucide-react';
import { OwnerStatusBadge, OwnerInfoBadge } from './owner-status-badge';
import { OwnerLinkingSection } from './owner-linking';

interface OwnerManagementSectionProps {
  businessId: string;
  ownerStatus?: 'unclaimed' | 'claimed' | 'verified';
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  onOwnerLinked?: () => void;
  onOwnerRemoved?: () => void;
}

export function OwnerManagementSection({
  businessId,
  ownerStatus = 'unclaimed',
  owner,
  onOwnerLinked,
  onOwnerRemoved,
}: OwnerManagementSectionProps) {
  const [showLinkingForm, setShowLinkingForm] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemoveOwner = async () => {
    if (!owner) return;
    
    setIsRemoving(true);
    try {
      // Call API to remove owner
      const response = await fetch('/api/capabilities/remove-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId }),
      });

      if (!response.ok) throw new Error('Failed to remove owner');

      onOwnerRemoved?.();
      setShowLinkingForm(false);
    } catch (error) {
      console.error('Failed to remove owner:', error);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">إدارة المالك</h3>
        </div>
        {!showLinkingForm && ownerStatus === 'unclaimed' && (
          <button
            onClick={() => setShowLinkingForm(true)}
            className="btn btn-sm btn-primary"
          >
            <Plus className="w-4 h-4" />
            ربط مالك
          </button>
        )}
      </div>

      <div className="card-body">
        {showLinkingForm ? (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-base font-medium text-gray-900">ربط مالك جديد</h4>
              <button
                onClick={() => setShowLinkingForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <OwnerLinkingSection
              businessId={businessId}
              onOwnerLinked={() => {
                setShowLinkingForm(false);
                onOwnerLinked?.();
              }}
              onInviteSent={() => {
                setShowLinkingForm(false);
              }}
            />
          </div>
        ) : owner ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {owner.firstName} {owner.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{owner.email}</p>
                    <p className="text-sm text-gray-500">{owner.phone}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <OwnerStatusBadge status={ownerStatus} size="sm" />
              </div>
            </div>

            {/* Owner Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600 font-medium mb-1">البريد الإلكتروني</p>
                <p className="text-sm text-gray-900">{owner.email}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-green-600 font-medium mb-1">رقم الهاتف</p>
                <p className="text-sm text-gray-900">{owner.phone}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-4 border-t">
              <button
                onClick={() => setShowLinkingForm(true)}
                className="flex-1 btn btn-outline btn-sm"
              >
                <Edit className="w-4 h-4" />
                تغيير المالك
              </button>
              <button
                onClick={handleRemoveOwner}
                disabled={isRemoving}
                className="flex-1 btn btn-outline btn-sm text-red-600 hover:bg-red-50"
              >
                {isRemoving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    إزالة المالك
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">لم يتم ربط مالك بهذا النشاط التجاري حتى الآن</p>
            <button
              onClick={() => setShowLinkingForm(true)}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4" />
              ربط مالك
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
