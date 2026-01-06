# نظام المحفظة - دليل سريع للمطورين

## 🚀 البدء السريع

### 1. تفعيل قاعدة البيانات
```bash
cd packages/database
npx prisma db push
npx prisma generate
```

### 2. إعادة تشغيل API
```bash
cd apps/api
npm run start:dev
```

### 3. الوصول للواجهات
- **المستخدم:** `http://localhost:3001/dashboard/wallet`
- **الأدمن:** `http://localhost:3002/wallet`
- **المدير:** `http://localhost:3003/dashboard/wallet`

---

## 📋 API Quick Reference

### User Endpoints
```typescript
GET    /api/v1/wallet/balance
GET    /api/v1/wallet/transactions?limit=50&page=1
POST   /api/v1/wallet/top-up
POST   /api/v1/wallet/withdraw
POST   /api/v1/wallet/pay
GET    /api/v1/wallet/top-ups
GET    /api/v1/wallet/withdrawals
```

### Admin Endpoints
```typescript
GET    /api/v1/admin/wallet/stats
GET    /api/v1/admin/wallet/wallets?limit=20&page=1
GET    /api/v1/admin/wallet/top-ups?status=PENDING
POST   /api/v1/admin/wallet/top-ups/:id/approve
POST   /api/v1/admin/wallet/top-ups/:id/reject
GET    /api/v1/admin/wallet/withdrawals?status=PENDING
POST   /api/v1/admin/wallet/withdrawals/:id/approve
POST   /api/v1/admin/wallet/withdrawals/:id/reject
POST   /api/v1/admin/wallet/credit
POST   /api/v1/admin/wallet/adjust
PATCH  /api/v1/admin/wallet/wallets/:id/status
```

---

## 💡 أمثلة الاستخدام

### 1. إضافة عمولة لمندوب
```typescript
import { WalletService } from './modules/wallet/wallet.service';

// في commission.service.ts
async createCommission(agentId: string, amount: number, description: string) {
  // ... حساب العمولة
  
  // إضافة للمحفظة
  await this.walletService.addCommission(
    agentId,
    amount,
    description
  );
}
```

### 2. الدفع من المحفظة
```typescript
// في subscription.controller.ts
async subscribe(@Body() dto: SubscribeDto, @User() user) {
  if (dto.paymentMethod === PaymentMethod.WALLET) {
    await this.walletService.payFromWallet(user.id, {
      businessId: dto.businessId,
      packageId: dto.packageId,
    });
  }
}
```

### 3. التحقق من الرصيد
```typescript
const balance = await walletService.getBalance(userId);
if (balance.availableBalance >= requiredAmount) {
  // proceed with payment
}
```

### 4. شحن يدوي (Admin)
```typescript
await walletService.adminTopUp(userId, {
  amount: 50000,
  method: TopUpMethod.ADMIN_CREDIT,
  description: 'مكافأة أداء ممتاز',
  descriptionAr: 'مكافأة أداء ممتاز',
});
```

---

## 🔒 الصلاحيات والأمان

### Guards Required
```typescript
@UseGuards(JwtAuthGuard)           // جميع endpoints
@UseGuards(RolesGuard)            // endpoints الأدمن
@Roles(UserRole.ADMIN)            // أدمن فقط
```

### DTO Validation
```typescript
// جميع DTOs تستخدم class-validator
class CreateTopUpDto {
  @IsNumber()
  @Min(1000)  // الحد الأدنى 1000 ل.س
  amount: number;

  @IsEnum(TopUpMethod)
  method: TopUpMethod;
  
  // ...
}
```

---

## 🗄️ Database Schema Quick View

```typescript
// المحفظة
interface Wallet {
  id: string;
  userId: string;
  balance: Decimal;           // الرصيد الكلي
  frozenBalance: Decimal;     // المجمد (طلبات سحب)
  availableBalance: number;   // = balance - frozenBalance
  totalDeposits: Decimal;
  totalWithdrawals: Decimal;
  totalSpent: Decimal;
  currency: string;           // "SYP"
  status: WalletStatus;       // ACTIVE, FROZEN, SUSPENDED, CLOSED
}

// المعاملة
interface WalletTransaction {
  id: string;
  walletId: string;
  type: WalletTransactionType;    // DEPOSIT, WITHDRAWAL, PAYMENT, COMMISSION, etc.
  amount: Decimal;
  balanceBefore: Decimal;
  balanceAfter: Decimal;
  description?: string;
  descriptionAr?: string;
  referenceType?: string;         // SUBSCRIPTION, TOP_UP, COMMISSION, etc.
  referenceId?: string;
  status: WalletTransactionStatus;
}
```

---

## 🎨 Component Examples

### عرض الرصيد
```tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function WalletBalance() {
  const { data: balance } = useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: async () => (await api.get('/wallet/balance')).data,
  });

  return (
    <div>
      <p>الرصيد المتاح: {balance?.availableBalance} ل.س</p>
    </div>
  );
}
```

### طلب سحب
```tsx
const withdrawMutation = useMutation({
  mutationFn: async (data) => {
    return await api.post('/wallet/withdraw', data);
  },
  onSuccess: () => {
    queryClient.invalidateQueries(['wallet']);
  },
});

// Usage
withdrawMutation.mutate({
  amount: 20000,
  method: 'BANK_TRANSFER',
  bankName: 'البنك التجاري',
  accountNumber: '12345678',
  accountHolderName: 'محمد أحمد',
});
```

---

## 🐛 Troubleshooting

### المشكلة: "Insufficient balance"
```typescript
// التحقق من الرصيد المتاح، ليس الرصيد الكلي
const { availableBalance } = await walletService.getBalance(userId);
if (availableBalance < amount) {
  throw new BadRequestException('الرصيد غير كافٍ');
}
```

### المشكلة: "Wallet not found"
```typescript
// استخدم getOrCreateWallet بدلاً من findUnique
const wallet = await walletService.getOrCreateWallet(userId);
```

### المشكلة: الرصيد المجمد لا يُحرر
```typescript
// عند رفض طلب سحب، تأكد من:
await prisma.wallet.update({
  where: { id: walletId },
  data: {
    frozenBalance: { decrement: amount },
  },
});
```

---

## 📊 Testing Checklist

### User Flow
- [ ] إنشاء محفظة تلقائياً للمستخدم الجديد
- [ ] طلب شحن → PENDING
- [ ] عرض في قائمة الطلبات
- [ ] موافقة أدمن → APPROVED → إضافة رصيد
- [ ] دفع من المحفظة → خصم رصيد
- [ ] طلب سحب → تجميد رصيد
- [ ] رفض سحب → إلغاء تجميد

### Admin Flow
- [ ] عرض إحصائيات صحيحة
- [ ] فلترة طلبات الشحن
- [ ] الموافقة على شحن
- [ ] رفض شحن
- [ ] فلترة طلبات السحب
- [ ] الموافقة على سحب
- [ ] رفض سحب
- [ ] شحن يدوي
- [ ] تجميد محفظة

### Integration
- [ ] دفع اشتراك من المحفظة
- [ ] إضافة عمولة مندوب
- [ ] إضافة عمولة مدير
- [ ] استرداد عند إلغاء اشتراك

---

## 🎯 Performance Tips

### Caching
```typescript
// استخدم React Query للـ caching
const { data } = useQuery({
  queryKey: ['wallet', 'balance'],
  queryFn: fetchBalance,
  staleTime: 30000,  // 30 ثانية
});
```

### Pagination
```typescript
// دائماً استخدم pagination للقوائم الطويلة
GET /wallet/transactions?limit=50&page=1
```

### Indexes
```sql
-- تأكد من وجود indexes على:
CREATE INDEX idx_wallet_user_id ON wallets(user_id);
CREATE INDEX idx_wallet_transaction_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_topup_status ON wallet_top_ups(status);
CREATE INDEX idx_wallet_withdrawal_status ON wallet_withdrawals(status);
```

---

## 📚 المرجع السريع

### Enums
```typescript
enum WalletStatus {
  ACTIVE, FROZEN, SUSPENDED, CLOSED
}

enum WalletTransactionType {
  DEPOSIT, WITHDRAWAL, PAYMENT, REFUND,
  COMMISSION, BONUS, TRANSFER_IN, TRANSFER_OUT,
  FEE, ADJUSTMENT
}

enum TopUpMethod {
  BANK_TRANSFER, CASH_DEPOSIT, MOBILE_WALLET,
  CREDIT_CARD, AGENT_COLLECTION, ADMIN_CREDIT
}

enum WithdrawalMethod {
  BANK_TRANSFER, CASH, MOBILE_WALLET, CHECK
}

enum TopUpStatus {
  PENDING, APPROVED, REJECTED, COMPLETED, CANCELLED
}

enum WithdrawalStatus {
  PENDING, APPROVED, PROCESSING, COMPLETED,
  REJECTED, CANCELLED
}
```

### Helper Functions
```typescript
// في WalletService
async getBalance(userId: string)
async getOrCreateWallet(userId: string)
async addCommission(userId: string, amount: number, description: string)
async payFromWallet(userId: string, dto: WalletPaymentDto)
async requestTopUp(userId: string, dto: CreateTopUpDto)
async requestWithdrawal(userId: string, dto: CreateWithdrawalDto)
```

---

## 🔗 الملفات المهمة

```
📁 Backend
apps/api/src/modules/wallet/
  - wallet.service.ts      (الوظائف الأساسية)
  - wallet.controller.ts   (endpoints المستخدم)
  - wallet-admin.controller.ts (endpoints الأدمن)
  - dto/wallet.dto.ts      (validation)

📁 Frontend - User
apps/web/src/app/dashboard/wallet/
  - page.tsx               (الصفحة الرئيسية)
  - top-up/page.tsx
  - withdraw/page.tsx
  - pay/page.tsx

📁 Frontend - Admin
apps/admin/src/app/(dashboard)/wallet/
  - page.tsx
  - top-ups/page.tsx
  - withdrawals/page.tsx
  - users/page.tsx
  - credit/page.tsx

📁 Database
packages/database/prisma/
  - schema.prisma          (جميع الـ models)
```

---

## 💼 الدعم

للأسئلة أو المشاكل:
1. راجع `WALLET_SYSTEM.md` للتفاصيل الكاملة
2. تحقق من الـ API logs في `apps/api/logs/`
3. استخدم Prisma Studio لمراجعة البيانات: `npx prisma studio`

---

**Happy Coding! 🎉**
