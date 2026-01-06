import { Shield, ShieldCheck, ShieldAlert, User } from 'lucide-react';

type OwnerStatus = 'unclaimed' | 'claimed' | 'verified';

interface OwnerStatusBadgeProps {
  status: OwnerStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showLabel?: boolean;
}

export function OwnerStatusBadge({ 
  status, 
  size = 'md', 
  showIcon = true, 
  showLabel = true 
}: OwnerStatusBadgeProps) {
  const config = {
    unclaimed: {
      label: 'غير مرتبط',
      color: 'bg-gray-100 text-gray-700 border-gray-300',
      icon: ShieldAlert,
    },
    claimed: {
      label: 'مرتبط',
      color: 'bg-blue-100 text-blue-700 border-blue-300',
      icon: Shield,
    },
    verified: {
      label: 'موثّق',
      color: 'bg-green-100 text-green-700 border-green-300',
      icon: ShieldCheck,
    },
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const cfg = config[status];
  const Icon = cfg.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${cfg.color} ${sizeClasses[size]}`}>
      {showIcon && <Icon className={iconSizes[size]} />}
      {showLabel && <span>{cfg.label}</span>}
    </span>
  );
}

interface OwnerInfoBadgeProps {
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  status: OwnerStatus;
  compact?: boolean;
}

export function OwnerInfoBadge({ 
  ownerName, 
  ownerPhone, 
  ownerEmail, 
  status,
  compact = false 
}: OwnerInfoBadgeProps) {
  if (status === 'unclaimed') {
    return (
      <div className="flex items-center gap-2">
        <OwnerStatusBadge status="unclaimed" size="sm" />
        {!compact && <span className="text-sm text-gray-500">لم يتم ربط مالك</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <OwnerStatusBadge status={status} size="sm" showLabel={false} />
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-900">
            {ownerName || 'مالك النشاط'}
          </span>
          <OwnerStatusBadge status={status} size="sm" showIcon={false} />
        </div>
        {!compact && (ownerPhone || ownerEmail) && (
          <span className="text-xs text-gray-500 mr-6">
            {ownerPhone || ownerEmail}
          </span>
        )}
      </div>
    </div>
  );
}
