// Shared utility for status badges across all dashboards

export type BusinessStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

interface StatusBadge {
  bg: string;
  text: string;
  label: string;
}

export const statusBadgeMap: Record<string, StatusBadge> = {
  DRAFT: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    label: 'مسودة',
  },
  PENDING: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    label: 'قيد المراجعة',
  },
  APPROVED: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    label: 'موافق عليه',
  },
  REJECTED: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    label: 'مرفوض',
  },
  SUSPENDED: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    label: 'معلق',
  },
};

export function getStatusBadge(status: string | undefined | null): StatusBadge {
  if (!status) {
    return {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      label: 'غير محدد',
    };
  }
  
  return statusBadgeMap[status.toUpperCase()] || {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    label: status,
  };
}
