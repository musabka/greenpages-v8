# 📜 القواعد المحاسبية
# ACCOUNTING_RULES.md

**النظام المحاسبي - GreenPages**  
**الإصدار:** 2.0  
**تاريخ:** يناير 2026

---

## 1. القواعد الذهبية (Golden Rules)

### القاعدة 1: Double-Entry Mandatory
```
المبدأ: كل عملية مالية = قيد متوازن
الصيغة: Σ Debit = Σ Credit
```

**مثال:**
```typescript
// ✅ صحيح
const lines = [
  { accountCode: '1101', debit: 5000, credit: 0 },
  { accountCode: '2101', debit: 0, credit: 5000 },
];
// مجموع المدين = 5000 = مجموع الدائن ✓

// ❌ خطأ
const lines = [
  { accountCode: '1101', debit: 5000, credit: 0 },
  { accountCode: '2101', debit: 0, credit: 3000 },
];
// مجموع المدين (5000) ≠ مجموع الدائن (3000) ✗
```

---

### القاعدة 2: Immutability After POST
```
المبدأ: القيد المرحّل لا يُحذف ولا يُعدّل أبداً
البديل: استخدم قيد عكسي (Reversing Entry)
```

**مثال:**
```typescript
// ❌ ممنوع
await prisma.accJournalEntry.delete({
  where: { id: postedEntryId },
});

// ✅ الطريقة الصحيحة
await accountingService.voidJournalEntry(
  postedEntryId,
  userId,
  'سبب الإلغاء',
);
// ينشئ قيد عكسي ويغير status إلى VOID
```

---

### القاعدة 3: Accounting = SSOT
```
المبدأ: المحاسبة هي المصدر الوحيد للحقيقة
الإسقاط: Wallet.balance, Commission.balance هي مجرد Cache
```

**التطبيق:**
```typescript
// في حالة التعارض
if (wallet.balance !== accountingBalance) {
  // المحاسبة هي الصحيحة، ليس Wallet
  await reconciliationService.fixWalletProjection(walletId);
}
```

---

### القاعدة 4: Idempotency via sourceEventId
```
المبدأ: العملية المكررة تعيد نفس النتيجة
الطريقة: sourceEventId فريد لكل حدث
```

**مثال:**
```typescript
const topUpId = 'topup-12345';
const sourceEventId = `TOPUP-APPROVED-${topUpId}`;

// المحاولة الأولى
const entry1 = await accountingService.createJournalEntry(userId, {
  sourceEventId,
  // ...
});

// المحاولة الثانية (خطأ في النظام)
const entry2 = await accountingService.createJournalEntry(userId, {
  sourceEventId,  // نفس المعرف
  // ...
});

// النتيجة: entry1.id === entry2.id
// لا يُنشأ قيد مكرر
```

---

### القاعدة 5: Period Enforcement
```
المبدأ: الفترة المغلقة لا تقبل قيود جديدة أو تعديلات
الاستثناء: لا يوجد
```

**التطبيق:**
```typescript
// إذا كانت الفترة closed
if (period.status === AccPeriodStatus.CLOSED) {
  throw new BadRequestException('لا يمكن إنشاء قيد في فترة مغلقة');
}
```

---

## 2. قواعد الحسابات

### 2.1 Account Code Structure
```
الأصول (Assets)         1xxx
الالتزامات (Liabilities) 2xxx
حقوق الملكية (Equity)   3xxx
الإيرادات (Revenue)      4xxx
المصروفات (Expenses)     5xxx
```

### 2.2 Normal Balance
```
الأصول:         Debit
المصروفات:      Debit
الالتزامات:     Credit
الإيرادات:      Credit
حقوق الملكية:   Credit
```

---

## 3. قواعد القيود

### 3.1 لا يمكن مدين ودائن معاً في نفس السطر
```typescript
// ❌ خطأ
const line = { accountCode: '1101', debit: 1000, credit: 500 };

// ✅ صحيح
const lines = [
  { accountCode: '1101', debit: 1000, credit: 0 },
  { accountCode: '2101', debit: 0, credit: 1000 },
];
```

### 3.2 لا قيم سالبة
```typescript
// ❌ خطأ
const line = { accountCode: '1101', debit: -500, credit: 0 };

// ✅ صحيح (عكس الطرف)
const line = { accountCode: '1101', debit: 0, credit: 500 };
```

---

## 4. قواعد الفواتير

### 4.1 دورة الحياة
```
DRAFT → ISSUED → (PARTIAL) → PAID
   ↓       ↓
CANCELLED  CANCELLED
```

### 4.2 القيد المحاسبي إلزامي عند الإصدار
```typescript
// عند ISSUED
invoice.journalEntryId MUST NOT BE NULL
invoice.issuedAt MUST NOT BE NULL
```

### 4.3 المرتجعات (Credit Notes)
```
- لا يمكن استرداد فاتورة DRAFT
- لا يمكن استرداد أكثر من القيمة الأصلية
- الاسترداد الكامل: refundType = 'FULL'
- الاسترداد الجزئي: refundType = 'PARTIAL'
```

---

## 5. قواعد العمولات

### 5.1 Accrual vs Payment
```
الاستحقاق (Accrual):
  مدين: Commission Expense
  دائن: Agent Payable

التسوية (Payment):
  مدين: Agent Payable
  دائن: Cash / Bank
```

### 5.2 لا يمكن تسوية عمولة غير مستحقة
```typescript
// يجب أن يكون
commission.status === 'EARNED'
// قبل
await recordAgentSettlement(...)
```

---

## 6. قواعد المحافظ

### 6.1 Wallet Balance is Projection
```
الحقيقة: AccJournalLine WHERE accountId = WALLET_LIABILITY
الإسقاط: Wallet.balance (Cache فقط)
```

### 6.2 المطابقة اليومية
```
يومياً:
  - احسب Σ (Credit - Debit) على حساب 2101
  - قارن مع Σ Wallet.balance
  - إذا الفرق > 100: Alert
```

---

## 7. قواعد الضرائب

### 7.1 الضريبة على الإجمالي
```
الإجمالي (Gross) = الصافي (Net) + الضريبة (Tax)
```

### 7.2 القيد مع الضريبة
```
مدين: Wallet Liability  12,000  (الإجمالي)
  دائن: Revenue          10,000  (الصافي)
  دائن: Tax Payable       2,000  (الضريبة)
```

---

## 8. قواعد المعاملات

### 8.1 Atomicity
```
كل عملية مالية = 1 Transaction
إما كلها تنجح أو كلها تفشل
```

```typescript
await prisma.$transaction(async (tx) => {
  await tx.wallet.update({ ... });
  await tx.accJournalEntry.create({ ... });
  await tx.accAuditLog.create({ ... });
});
```

### 8.2 No Partial Success
```
❌ ممنوع
wallet.update() ✓
journalEntry.create() ✗  // فشل
// النتيجة: الـ wallet تحدث والمحاسبة لا

✅ صحيح
transaction { wallet + journal } ✓ أو ✗ معاً
```

---

## 9. قواعد الأبعاد (Dimensions)

### 9.1 الأبعاد المسموحة
```typescript
const ALLOWED = [
  'governorateId',
  'cityId',
  'districtId',
  'userId',
  'businessId',
  'agentProfileId',
  'sourceModule',
  'projectKey',
];

// ❌ خطأ
dimensions: { customField: 'value' }

// ✅ صحيح
dimensions: { governorateId: 'gov-123', userId: 'user-456' }
```

### 9.2 استخدام Dimensions
```
- للتقارير الإقليمية
- لتحليل الأداء
- لنطاق الصلاحيات
```

---

## 10. قواعد التدقيق

### 10.1 كل تغيير مسجّل
```
AccAuditLog لكل:
  - إنشاء قيد
  - ترحيل قيد
  - إلغاء قيد
  - إصدار فاتورة
  - إغلاق فترة
```

### 10.2 محتوى سجل التدقيق
```typescript
{
  userId: string,         // من أجرى العملية
  action: string,         // CREATE / UPDATE / DELETE / POST / VOID
  entityType: string,     // JournalEntry / Invoice / Period
  entityId: string,       // معرف الكيان
  oldValues: JSON,        // القيم القديمة
  newValues: JSON,        // القيم الجديدة
  reason?: string,        // سبب التغيير (للإلغاء)
  timestamp: DateTime,    // وقت التغيير
}
```

---

## 11. القواعد الأمنية

### 11.1 الأدوار
```
ADMIN:
  - كل الصلاحيات
  - إلغاء قيد
  - إغلاق فترة
  - تصحيح أرصدة

ACCOUNTANT:
  - عرض القيود
  - إنشاء قيد يدوي
  - ترحيل قيد
  - إصدار فاتورة
  - المطابقة

ACCOUNTANT_GOVERNORATE:
  - نفس ACCOUNTANT
  - محدود بمحافظة واحدة
  - WHERE governorateId = user.governorateId
```

### 11.2 Governorate Scope
```typescript
// للمدير الإقليمي
const entries = await prisma.accJournalEntry.findMany({
  where: {
    lines: {
      some: {
        dimensions: {
          path: ['governorateId'],
          equals: user.governorateId,
        },
      },
    },
  },
});
```

---

## 12. الأخطاء الشائعة ومنعها

### خطأ #1: تحديث Wallet دون قيد
```typescript
// ❌ كارثة
await prisma.wallet.update({
  where: { id: walletId },
  data: { balance: { increment: 1000 } },
});
// المحاسبة لا تعلم!

// ✅ صحيح
await walletAccountingBridge.recordTopUpApproval({
  amount: 1000,
  walletOwnerId,
  // ...
});
// ينشئ القيد تلقائياً
```

### خطأ #2: كتابة account codes مباشرة
```typescript
// ❌ خطير (hard-coded)
const lines = [
  { accountCode: '1101', ... },  // ماذا لو تغير الكود؟
];

// ✅ صحيح
import { ACCOUNT_CODES } from './accounting-policy.service';
const lines = [
  { accountCode: ACCOUNT_CODES.CASH, ... },
];
```

### خطأ #3: تجاهل sourceEventId
```typescript
// ❌ خطر
await accountingService.createJournalEntry(userId, {
  // بدون sourceEventId
  ...
});
// قد ينشئ قيوداً مكررة

// ✅ صحيح
await accountingService.createJournalEntry(userId, {
  sourceEventId: `TOPUP-${uniqueId}`,
  ...
});
```

### خطأ #4: نسيان dimensions
```typescript
// ❌ ناقص
const lines = [
  { accountCode: ACCOUNT_CODES.CASH, debit: 1000, credit: 0 },
  // بدون dimensions
];

// ✅ كامل
const lines = [
  {
    accountCode: ACCOUNT_CODES.CASH,
    debit: 1000,
    credit: 0,
    dimensions: {
      userId: walletOwnerId,
      governorateId: 'gov-damascus',
    },
  },
];
```

---

## 13. معادلات محاسبية أساسية

### المعادلة المحاسبية
```
الأصول = الالتزامات + حقوق الملكية
Assets = Liabilities + Equity
```

### صافي الربح
```
الإيرادات - المصروفات = الربح
Revenue - Expenses = Net Income
```

### رصيد الحساب
```
للأصول والمصروفات:
  الرصيد = مجموع المدين - مجموع الدائن

للالتزامات والإيرادات وحقوق الملكية:
  الرصيد = مجموع الدائن - مجموع المدين
```

---

## 14. قائمة التحقق (Checklist)

قبل إنشاء أي قيد جديد، تأكد من:

- [ ] القيد متوازن (Σ Debit = Σ Credit)
- [ ] لا قيم سالبة
- [ ] لا سطر بمدين ودائن معاً
- [ ] sourceEventId فريد ومعرّف
- [ ] الفترة مفتوحة (OPEN)
- [ ] الحسابات موجودة وقابلة للترحيل (isPosting = true)
- [ ] dimensions صحيحة (من القائمة البيضاء)
- [ ] description واضح (عربي + إنجليزي)
- [ ] sourceModule محدد
- [ ] metadata يحتوي التفاصيل اللازمة

---

**النهاية** - اتبع هذه القواعد لنظام محاسبي موثوق ومستقر
