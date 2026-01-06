'use client';

import { useState } from 'react';
import { MoreVertical, UserCheck, Eye, Edit, Trash2, Copy, CheckCircle } from 'lucide-react';

interface QuickActionsMenuProps {
  businessId: string;
  businessName: string;
  ownerStatus?: 'unclaimed' | 'claimed' | 'verified';
  onLinkOwner: (businessId: string) => void;
  onView?: (businessId: string) => void;
  onEdit?: (businessId: string) => void;
  onDelete?: (businessId: string) => void;
  editPath?: string;
  viewPath?: string;
}

export function QuickActionsMenu({
  businessId,
  businessName,
  ownerStatus = 'unclaimed',
  onLinkOwner,
  onView,
  onEdit,
  onDelete,
  editPath,
  viewPath,
}: QuickActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(businessId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48">
          {/* Link Owner - Always visible but special styling for unclaimed */}
          <button
            onClick={() => {
              onLinkOwner(businessId);
              setIsOpen(false);
            }}
            className={`w-full px-4 py-2 flex items-center gap-2 text-sm transition-colors text-left ${
              ownerStatus === 'unclaimed'
                ? 'text-primary-600 hover:bg-primary-50 font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            {ownerStatus === 'unclaimed' ? (
              <>
                <UserCheck className="w-4 h-4" />
                ربط مالك الآن
              </>
            ) : (
              <>
                <Edit className="w-4 h-4" />
                تعديل المالك
              </>
            )}
          </button>

          <div className="border-t border-gray-100" />

          {/* View */}
          {(onView || viewPath) && (
            <a
              href={viewPath ? `${viewPath}/${businessId}` : '#'}
              onClick={(e) => {
                if (!viewPath && onView) {
                  e.preventDefault();
                  onView(businessId);
                }
                setIsOpen(false);
              }}
              className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              عرض
            </a>
          )}

          {/* Edit */}
          {(onEdit || editPath) && (
            <a
              href={editPath ? `${editPath}/${businessId}/edit` : '#'}
              onClick={(e) => {
                if (!editPath && onEdit) {
                  e.preventDefault();
                  onEdit(businessId);
                }
                setIsOpen(false);
              }}
              className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              تعديل
            </a>
          )}

          <div className="border-t border-gray-100" />

          {/* Copy ID */}
          <button
            onClick={handleCopyId}
            className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            {isCopied ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-600" />
                تم النسخ
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                نسخ المعرّف
              </>
            )}
          </button>

          {/* Delete */}
          {onDelete && (
            <>
              <div className="border-t border-gray-100" />
              <button
                onClick={() => {
                  onDelete(businessId);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                حذف
              </button>
            </>
          )}
        </div>
      )}

      {/* Backdrop to close menu */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
