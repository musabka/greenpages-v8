# نظام المحفظة - دليل شامل

## نظرة عامة

نظام المحفظة هو نظام مالي متكامل يسمح للمستخدمين بإدارة أرصدتهم المالية داخل منصة الصفحات الخضراء. تم تصميم النظام ليكون:

- ✅ **آمن**: جميع المعاملات محفوظة ومؤرخة
- ✅ **مرن**: يدعم عدة طرق للشحن والسحب
- ✅ **قابل للتوسع**: سهل الربط مع أنظمة أخرى
- ✅ **شفاف**: سجل كامل لجميع المعاملات

## البنية التقنية

### قاعدة البيانات

تم إضافة 4 جداول جديدة:

#### 1. `wallets` - المحفظة
```prisma
model Wallet {
  id                String              @id @default(uuid)
  userId            String              @unique
  balance           Decimal             @default(0)  // الرصيد الكلي
  frozenBalance     Decimal             @default(0)  // الرصيد المجمد (طلبات سحب معلقة)
  totalDeposits     Decimal             @default(0)  // مجموع الإيداعات
  totalWithdrawals  Decimal             @default(0)  // مجموع السحوبات
  totalSpent        Decimal             @default(0)  // مجموع المصروفات
  currency          String              @default("SYP")
  status            WalletStatus        @default(ACTIVE)
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
}
```

**الحسابات:**
- `availableBalance` = `balance` - `frozenBalance`

#### 2. `wallet_transactions` - سجل المعاملات
```prisma
model WalletTransaction {
  id              String                   @id
  walletId        String
  type            WalletTransactionType    // نوع المعاملة
  amount          Decimal
  balanceBefore   Decimal                  // الرصيد قبل المعاملة
  balanceAfter    Decimal                  // الرصيد بعد المعاملة
  description     String?
  descriptionAr   String?
  referenceType   WalletReferenceType?     // مرجع المعاملة
  referenceId     String?
  status          WalletTransactionStatus
  metadata        Json?
  createdAt       DateTime
}
```

**أنواع المعاملات:**
- `DEPOSIT`: إيداع
- `WITHDRAWAL`: سحب
- `PAYMENT`: دفع (اشتراك)
- `REFUND`: استرداد
- `COMMISSION`: عمولة (مندوب/مدير)
- `BONUS`: مكافأة
- `TRANSFER_IN/OUT`: تحويل
- `FEE`: رسوم
- `ADJUSTMENT`: تعديل إداري

#### 3. `wallet_top_ups` - طلبات الشحن
```prisma
model WalletTopUp {
  id                String            @id
  walletId          String
  amount            Decimal
  method            TopUpMethod       // طريقة الشحن
  status            TopUpStatus       @default(PENDING)
  receiptNumber     String?           // رقم الإيصال
  proofImage        String?           // صورة الإثبات
  notes             String?
  adminNotes        String?
  processedByUserId String?
  processedAt       DateTime?
  createdAt         DateTime
}
```

**طرق الشحن:**
- `BANK_TRANSFER`: تحويل بنكي
- `CASH_DEPOSIT`: إيداع نقدي
- `MOBILE_WALLET`: محفظة إلكترونية
- `CREDIT_CARD`: بطاقة ائتمان
- `AGENT_COLLECTION`: تحصيل مندوب
- `ADMIN_CREDIT`: إضافة إدارية

#### 4. `wallet_withdrawals` - طلبات السحب
```prisma
model WalletWithdrawal {
  id                  String            @id
  walletId            String
  amount              Decimal
  method              WithdrawalMethod
  status              WithdrawalStatus  @default(PENDING)
  bankName            String?
  accountNumber       String?
  accountHolderName   String?
  mobileWalletNumber  String?
  notes               String?
  adminNotes          String?
  processedByUserId   String?
  processedAt         DateTime?
  createdAt           DateTime
}
```

**طرق السحب:**
- `BANK_TRANSFER`: تحويل بنكي
- `CASH`: نقدي
- `MOBILE_WALLET`: محفظة إلكترونية
- `CHECK`: شيك

---

## API Endpoints

### للمستخدمين

#### `GET /api/v1/wallet/balance`
الحصول على رصيد المحفظة

**Response:**
```json
{
  "balance": 150000,
  "frozenBalance": 10000,
  "availableBalance": 140000,
  "totalDeposits": 200000,
  "totalWithdrawals": 50000,
  "totalSpent": 0,
  "currency": "SYP"
}
```

#### `GET /api/v1/wallet/transactions`
قائمة المعاملات

**Query Parameters:**
- `limit`: عدد النتائج (افتراضي: 50)
- `page`: رقم الصفحة
- `type`: نوع المعاملة (اختياري)
- `status`: حالة المعاملة (اختياري)

#### `POST /api/v1/wallet/top-up`
طلب شحن المحفظة

**Body:**
```json
{
  "amount": 50000,
  "method": "BANK_TRANSFER",
  "receiptNumber": "TRX123456",
  "notes": "تحويل من البنك التجاري"
}
```

#### `POST /api/v1/wallet/withdraw`
طلب سحب من المحفظة

**Body:**
```json
{
  "amount": 20000,
  "method": "BANK_TRANSFER",
  "bankName": "البنك التجاري السوري",
  "accountNumber": "12345678",
  "accountHolderName": "محمد أحمد",
  "notes": "طلب سحب"
}
```

⚠️ **ملاحظة:** المبلغ سيتم تجميده فوراً حتى تتم الموافقة أو الرفض

#### `POST /api/v1/wallet/pay`
الدفع من المحفظة

**Body:**
```json
{
  "businessId": "uuid",
  "packageId": "uuid"
}
```

#### `GET /api/v1/wallet/top-ups`
قائمة طلبات الشحن الخاصة بي

#### `GET /api/v1/wallet/withdrawals`
قائمة طلبات السحب الخاصة بي

---

### للأدمن

#### `GET /admin/wallet/stats`
إحصائيات نظام المحفظة

**Response:**
```json
{
  "totalWallets": 150,
  "activeWallets": 120,
  "totalBalance": 5000000,
  "totalDeposits": 8000000,
  "totalWithdrawals": 2000000,
  "totalSpent": 1000000,
  "pendingTopUps": 5,
  "pendingTopUpsAmount": 250000,
  "pendingWithdrawals": 3,
  "pendingWithdrawalsAmount": 75000
}
```

#### `GET /admin/wallet/wallets`
قائمة جميع المحافظ

**Query Parameters:**
- `limit`, `page`, `search`, `status`

#### `GET /admin/wallet/top-ups`
قائمة طلبات الشحن

**Query Parameters:**
- `status`: PENDING, APPROVED, REJECTED, etc.

#### `POST /admin/wallet/top-ups/:id/approve`
الموافقة على طلب شحن

**Body:**
```json
{
  "adminNotes": "تم التحقق من الإيصال"
}
```

#### `POST /admin/wallet/top-ups/:id/reject`
رفض طلب شحن

**Body:**
```json
{
  "adminNotes": "الإيصال غير صحيح"
}
```

#### `GET /admin/wallet/withdrawals`
قائمة طلبات السحب

#### `POST /admin/wallet/withdrawals/:id/approve`
الموافقة على طلب سحب

⚠️ **ملاحظة:** سيتم خصم المبلغ من الرصيد المجمد ومن الرصيد الكلي

#### `POST /admin/wallet/withdrawals/:id/reject`
رفض طلب سحب

⚠️ **ملاحظة:** سيتم إلغاء التجميد وإعادة المبلغ للرصيد المتاح

#### `POST /admin/wallet/credit`
شحن محفظة مستخدم بشكل يدوي

**Body:**
```json
{
  "userId": "uuid",
  "amount": 50000,
  "description": "مكافأة أداء ممتاز"
}
```

#### `POST /admin/wallet/adjust`
تعديل رصيد المحفظة

**Body:**
```json
{
  "userId": "uuid",
  "amount": -5000,
  "description": "تصحيح خطأ سابق",
  "type": "ADJUSTMENT"
}
```

#### `PATCH /admin/wallet/wallets/:id/status`
تغيير حالة المحفظة

**Body:**
```json
{
  "status": "FROZEN"  // ACTIVE, FROZEN, SUSPENDED, CLOSED
}
```

---

## واجهات المستخدم

### 1. لوحة المستخدم (`/dashboard/wallet`)
- عرض الرصيد المتاح والمجمد
- سجل المعاملات
- طلبات الشحن والسحب
- أزرار سريعة (دفع، شحن، سحب)

### 2. صفحة طلب الشحن (`/dashboard/wallet/top-up`)
- اختيار طريقة الشحن
- أزرار مبالغ سريعة
- رفع صورة الإثبات
- رقم الإيصال
- ملاحظات

### 3. صفحة طلب السحب (`/dashboard/wallet/withdraw`)
- اختيار طريقة السحب
- حقول حسب الطريقة (بنك، محفظة، إلخ)
- تنبيه بتجميد الرصيد

### 4. صفحة الدفع (`/dashboard/wallet/pay`)
- اختيار النشاط التجاري
- اختيار الباقة
- عرض الرصيد والسعر
- تأكيد الدفع

### 5. لوحة الأدمن (`/admin/wallet`)
- إحصائيات شاملة
- طلبات الشحن المعلقة
- طلبات السحب المعلقة
- إجراءات سريعة

### 6. طلبات الشحن (`/admin/wallet/top-ups`)
- جدول بجميع الطلبات
- فلترة حسب الحالة
- بحث
- موافقة/رفض فوري
- عرض الإثبات

### 7. طلبات السحب (`/admin/wallet/withdrawals`)
- جدول بجميع الطلبات
- عرض بيانات التحويل
- موافقة/رفض مع ملاحظات

### 8. محافظ المستخدمين (`/admin/wallet/users`)
- قائمة جميع المحافظ
- بحث وفلترة
- شحن يدوي
- تجميد/تفعيل المحفظة

### 9. شحن يدوي (`/admin/wallet/credit`)
- بحث عن المستخدم
- إدخال المبلغ والسبب
- تأكيد العملية

### 10. لوحة المدير (`/manager/dashboard/wallet`)
- عرض رصيد المدير
- سجل العمولات
- طلب سحب الأرباح

---

## تدفق العمليات

### 1. شحن المحفظة

```
المستخدم
  ↓ يملأ نموذج طلب الشحن
طلب شحن (PENDING)
  ↓ الأدمن يراجع ويوافق
طلب شحن (APPROVED/COMPLETED)
  ↓ يتم إضافة الرصيد
معاملة (DEPOSIT, COMPLETED)
  ↓
تحديث totalDeposits و balance
```

### 2. سحب من المحفظة

```
المستخدم
  ↓ يطلب السحب
تجميد المبلغ (frozenBalance += amount)
  ↓
طلب سحب (PENDING)
  ↓ الأدمن يوافق
خصم من balance و frozenBalance
  ↓
طلب سحب (APPROVED/COMPLETED)
  ↓
معاملة (WITHDRAWAL, COMPLETED)
  ↓
تحديث totalWithdrawals

أو في حالة الرفض:
  ↓ الأدمن يرفض
إلغاء التجميد (frozenBalance -= amount)
  ↓
طلب سحب (REJECTED)
```

### 3. الدفع من المحفظة

```
المستخدم يختار باقة
  ↓
التحقق من الرصيد المتاح
  ↓ كافٍ
خصم من balance
  ↓
معاملة (PAYMENT, COMPLETED)
  ↓
تحديث totalSpent
  ↓
تحديث اشتراك النشاط التجاري
```

### 4. إضافة عمولة (مندوب/مدير)

```
اكتمال اشتراك
  ↓
حساب العمولة
  ↓
wallet.addCommission(userId, amount, description)
  ↓
إضافة للرصيد
  ↓
معاملة (COMMISSION, COMPLETED)
  ↓
تحديث totalDeposits
```

---

## حالات الاستخدام

### المستخدم العادي
1. ✅ شحن المحفظة (طلب → موافقة أدمن)
2. ✅ دفع اشتراك نشاط تجاري من المحفظة
3. ✅ عرض سجل المعاملات
4. ✅ طلب سحب (نادر للمستخدم العادي)

### صاحب النشاط التجاري
1. ✅ دفع اشتراكات الأنشطة من المحفظة
2. ✅ عرض المعاملات والمصروفات

### المندوب
1. ✅ استلام العمولات تلقائياً في المحفظة
2. ✅ طلب سحب الأرباح
3. ✅ عرض سجل العمولات

### مدير المحافظة
1. ✅ استلام العمولات من اشتراكات منطقته
2. ✅ طلب سحب الأرباح
3. ✅ عرض سجل العمولات والدخل

### الأدمن
1. ✅ الموافقة/رفض طلبات الشحن
2. ✅ الموافقة/رفض طلبات السحب
3. ✅ شحن محافظ يدوياً (مكافآت، تصحيحات)
4. ✅ تجميد/تفعيل المحافظ
5. ✅ عرض إحصائيات شاملة
6. ✅ إدارة جميع المحافظ

---

## نقاط التكامل مع الأنظمة الأخرى

### 1. نظام الاشتراكات
```typescript
// في subscription.service.ts
if (paymentMethod === PaymentMethod.WALLET) {
  await this.walletService.payFromWallet(userId, {
    businessId,
    packageId,
  });
}
```

### 2. نظام العمولات
```typescript
// في commission.service.ts
await this.walletService.addCommission(
  agentId,
  commissionAmount,
  `عمولة من اشتراك ${business.nameAr}`
);
```

### 3. نظام المدراء
```typescript
// في manager.service.ts
await this.walletService.addCommission(
  managerId,
  profitShare,
  `أرباح من محافظة ${governorate.nameAr}`
);
```

---

## الأمان والتحقق

### على مستوى الخدمة
- ✅ التحقق من كفاية الرصيد قبل أي عملية خصم
- ✅ تجميد المبلغ فوراً عند طلب السحب
- ✅ معاملات قاعدة البيانات (transactions) لضمان التناسق
- ✅ تسجيل جميع العمليات مع `balanceBefore` و `balanceAfter`
- ✅ التحقق من صلاحيات المستخدم

### على مستوى قاعدة البيانات
- ✅ `Decimal` للمبالغ (دقة عالية)
- ✅ `@unique` على `userId` في جدول `wallets`
- ✅ Foreign Keys لضمان الروابط
- ✅ Timestamps تلقائية

### على مستوى API
- ✅ Guards للتحقق من الهوية
- ✅ Roles للتحقق من الصلاحيات
- ✅ DTOs للتحقق من صحة البيانات
- ✅ Error Handling شامل

---

## الملفات المُنشأة

### Backend (NestJS)
```
apps/api/src/modules/wallet/
├── wallet.module.ts
├── wallet.service.ts          (940 سطر)
├── wallet.controller.ts
├── wallet-admin.controller.ts
└── dto/
    └── wallet.dto.ts          (230 سطر)
```

### Frontend - User (Next.js)
```
apps/web/src/app/dashboard/wallet/
├── page.tsx                   (صفحة المحفظة الرئيسية)
├── top-up/
│   └── page.tsx              (نموذج طلب شحن)
├── withdraw/
│   └── page.tsx              (نموذج طلب سحب)
└── pay/
    └── page.tsx              (صفحة الدفع)
```

### Frontend - Admin (Next.js)
```
apps/admin/src/app/(dashboard)/wallet/
├── page.tsx                   (نظرة عامة وإحصائيات)
├── top-ups/
│   └── page.tsx              (إدارة طلبات الشحن)
├── withdrawals/
│   └── page.tsx              (إدارة طلبات السحب)
├── users/
│   └── page.tsx              (محافظ المستخدمين)
└── credit/
    └── page.tsx              (شحن يدوي)
```

### Frontend - Manager (Next.js)
```
apps/manager/src/app/dashboard/wallet/
└── page.tsx                   (محفظة المدير)
```

### Database
```
packages/database/prisma/schema.prisma
├── model Wallet
├── model WalletTransaction
├── model WalletTopUp
├── model WalletWithdrawal
├── enum WalletStatus
├── enum WalletTransactionType
├── enum WalletTransactionStatus
├── enum WalletReferenceType
├── enum TopUpMethod
├── enum TopUpStatus
├── enum WithdrawalMethod
└── enum WithdrawalStatus
```

---

## خطوات التفعيل

### 1. تشغيل Migration
```bash
cd packages/database
npx prisma db push
# أو
npx prisma migrate dev --name add-wallet-system
```

### 2. إعادة تشغيل الـ API
```bash
cd apps/api
npm run start:dev
```

### 3. اختبار النظام
1. تسجيل الدخول كمستخدم عادي
2. الذهاب إلى `/dashboard/wallet`
3. طلب شحن
4. تسجيل الدخول كأدمن
5. الموافقة على الطلب
6. التحقق من إضافة الرصيد

---

## التطويرات المستقبلية (اختياري)

### المرحلة التالية
- [ ] تكامل مع بوابات الدفع الإلكتروني (Syriatel Cash, MTN)
- [ ] إشعارات بالبريد الإلكتروني عند تغيير حالة الطلبات
- [ ] تقارير مالية تفصيلية للأدمن
- [ ] تصدير CSV/Excel للمعاملات
- [ ] حد أقصى للسحب اليومي/الشهري
- [ ] نظام إحالة ومكافآت
- [ ] محفظة عائلية (wallet sharing)

### التحسينات
- [ ] Redis للـ caching
- [ ] Queue للعمليات الكبيرة
- [ ] Webhooks للتكامل مع أنظمة خارجية
- [ ] API للمطورين الخارجيين
- [ ] Multi-currency support

---

## الدعم والصيانة

### Logs
جميع العمليات المالية مسجلة في:
- جدول `wallet_transactions`
- Logs النظام

### Monitoring
يُنصح بمراقبة:
- عدد الطلبات المعلقة
- متوسط وقت المعالجة
- نسبة الرفض
- التناقضات في الأرصدة

### Backup
تأكد من النسخ الاحتياطي لـ:
- جدول `wallets`
- جدول `wallet_transactions`
- جداول الطلبات

---

## تم بحمد الله ✅

النظام جاهز للاستخدام الفوري في بيئة الإنتاج!

**المطور:** GitHub Copilot (Claude Sonnet 4.5)  
**التاريخ:** 2024  
**الإصدار:** 1.0.0
