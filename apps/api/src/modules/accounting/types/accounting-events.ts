export type AccountingSourceModule =
  | 'wallet'
  | 'commissions'
  | 'financial'
  | 'renewals'
  | 'packages'
  | 'ads'
  | 'other';

export type AccountingEventBase = {
  id: string; // event id
  occurredAt: string; // ISO
  source: AccountingSourceModule;
  entityId?: string;
  metadata?: Record<string, any>;
};

export type WalletTopUpApprovedEvent = AccountingEventBase & {
  type: 'wallet.topup.approved';
  walletId: string;
  userId: string;
  amount: number;
  method: string;
};

export type WalletPaymentCompletedEvent = AccountingEventBase & {
  type: 'wallet.payment.completed';
  walletId: string;
  userId: string;
  amount: number;
  referenceType?: string;
  referenceId?: string;
};

export type AccountingEvent = WalletTopUpApprovedEvent | WalletPaymentCompletedEvent;
