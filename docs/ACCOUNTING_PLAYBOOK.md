# 🎯 دليل التشغيل المحاسبي
# ACCOUNTING_PLAYBOOK.md

**النظام المحاسبي - GreenPages**  
**لمن:** المطورين، المحاسبين، مديري الأنظمة  
**الهدف:** سيناريوهات التشغيل اليومية

---

## 📋 جدول المحتويات

1. [المهام اليومية](#المهام-اليومية)
2. [المهام الشهرية](#المهام-الشهرية)
3. [سيناريوهات الطوارئ](#سيناريوهات-الطوارئ)
4. [استكشاف الأخطاء](#استكشاف-الأخطاء)
5. [الصيانة](#الصيانة)

---

## 1. المهام اليومية

### 1.1 التحقق من صحة النظام (صباحاً)
```bash
# 1. فحص حالة الموديول
GET /admin/accounting/health

# النتيجة المتوقعة:
{
  "ok": true,
  "module": "accounting",
  "accounts": 25,
  "journalEntries": 1523,
  "currencies": 5
}
```

### 1.2 مراجعة القيود المعلقة
```bash
# 2. القيود في حالة DRAFT
GET /admin/accounting/journal-entries?status=DRAFT&limit=100

# إذا كان العدد > 20، راجع كل قيد:
# - هل من المفترض أن يكون DRAFT؟
# - إذا لا، رحّله POST
```

```typescript
// ترحيل قيد معلق
PATCH /admin/accounting/journal-entries/{entryId}/post
```

### 1.3 مطابقة المحافظ اليومية
```bash
# 3. تقرير التزامات المحافظ
GET /admin/accounting/reconcile/wallet-liability

# النتيجة المتوقعة:
{
  "totalWalletTableBalance": 1500000,
  "totalAccountingLiability": 1500000,
  "difference": 0,
  "status": "MATCHED"  // ✅
}

# إذا status = "DISCREPANCY":
# - راجع التفاصيل
# - حدد السبب
# - صحح إن لزم
```

### 1.4 تقرير حسابات المقاصة
```bash
# 4. التحقق من حسابات المقاصة
GET /admin/accounting/reconcile/clearing-accounts

# المتوقع: جميع الحسابات balance ≈ 0
# إذا أي حساب لديه رصيد > 1000:
# - راجع العمليات المعلقة
# - هل هناك دفعات لم تُسجّل؟
```

---

## 2. المهام الشهرية

### 2.1 إغلاق الفترة المحاسبية
```bash
# في نهاية كل شهر (اليوم الأخير)

# 1. تأكد من عدم وجود قيود DRAFT
GET /admin/accounting/journal-entries?status=DRAFT

# 2. احصل على معرف الفترة الحالية
GET /admin/accounting/periods/current

# 3. أغلق الفترة
PATCH /admin/accounting/periods/{periodId}/close

# النتيجة:
{
  "id": "period-xyz",
  "status": "CLOSED",
  "closedAt": "2026-01-31T23:59:59Z",
  "closedById": "admin-user-123"
}
```

### 2.2 ميزان المراجعة
```bash
# في نهاية كل شهر، قبل الإغلاق

GET /admin/accounting/reports/trial-balance?periodId={periodId}

# تحقق من:
# 1. مجموع الأرصدة المدينة = مجموع الأرصدة الدائنة
# 2. لا أرصدة غريبة (مثلاً أصل برصيد سالب)
```

### 2.3 تقارير الإيرادات
```typescript
// دالة مساعدة: حساب الإيرادات الشهرية
async function getMonthlyRevenue(periodId: string) {
  const accounts = ['4100', '4200', '4300', '4400', '4500'];
  let total = 0;
  
  for (const code of accounts) {
    const ledger = await accountingService.getLedger(code, periodId);
    // الإيرادات = Credit Balance
    total += ledger.creditTotal - ledger.debitTotal;
  }
  
  return total;
}
```

---

## 3. سيناريوهات الطوارئ

### 3.1 رصيد محفظة خاطئ

**المشكلة:** عميل يشتكي أن رصيده في المحفظة غير صحيح

**الحل:**
```bash
# 1. احصل على walletId للعميل
# 2. مطابقة المحفظة
GET /admin/accounting/reconcile/wallets/{walletId}

# النتيجة:
{
  "walletId": "wallet-123",
  "userId": "user-456",
  "userName": "Ahmad Ali",
  "walletBalance": 5000,      # من جدول Wallet
  "accountingBalance": 5500,  # من المحاسبة
  "difference": 500,
  "status": "DISCREPANCY"  # ✗
}

# 3. المحاسبة هي المصدر الصحيح
# 4. صحح رصيد المحفظة
PATCH /admin/accounting/reconcile/wallets/{walletId}/fix

# النتيجة:
{
  "success": true,
  "oldBalance": 5000,
  "newBalance": 5500,
  "message": "Wallet balance corrected..."
}
```

### 3.2 قيد خاطئ تم ترحيله

**المشكلة:** قيد تم ترحيله POST بالخطأ

**الحل:**
```bash
# لا يمكن حذف القيد!
# الحل: إنشاء قيد عكسي

PATCH /admin/accounting/journal-entries/{wrongEntryId}/void
Body:
{
  "reason": "قيد خاطئ - المبلغ غير صحيح"
}

# النتيجة:
# - القيد الأصلي status = VOID
# - قيد عكسي جديد يُنشأ تلقائياً بنفس المبالغ معكوسة
# - القيد العكسي يُرحّل POSTED

# ثم أنشئ القيد الصحيح يدوياً
POST /admin/accounting/journal-entries/manual
```

### 3.3 فاتورة مدفوعة بالخطأ

**المشكلة:** فاتورة سُجلت كمدفوعة (PAID) ولكنها لم تُدفع فعلياً

**الحل:**
```bash
# 1. ألغِ القيد المحاسبي للدفع
GET /admin/accounting/invoices/{invoiceId}
# احصل على journalEntryId للدفع

PATCH /admin/accounting/journal-entries/{paymentEntryId}/void
Body:
{
  "reason": "الدفع لم يحدث فعلياً"
}

# 2. عدّل حالة الفاتورة يدوياً (إذا لزم)
# أو أنشئ endpoint خاص بذلك
```

---

## 4. استكشاف الأخطاء

### 4.1 "القيد غير متوازن"

**الخطأ:**
```
BadRequestException: القيد غير متوازن: مدين=10000, دائن=9500
```

**السبب:**
- خطأ في الحسابات
- نسيان سطر (مثل الضريبة)

**الحل:**
```typescript
// تحقق من المجموع قبل الإرسال
const lines = [
  { accountCode: '1101', debit: 10000, credit: 0 },
  { accountCode: '2101', debit: 0, credit: 9500 },
  // ناقص 500!
];

const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0);
const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0);

if (totalDebit !== totalCredit) {
  throw new Error(`Unbalanced: Debit=${totalDebit}, Credit=${totalCredit}`);
}
```

### 4.2 "لا يمكن إنشاء قيد في فترة مغلقة"

**الخطأ:**
```
BadRequestException: لا يمكن إنشاء قيد في فترة مغلقة
```

**السبب:**
- الفترة المحاسبية مغلقة
- تاريخ القيد في شهر مغلق

**الحل:**
```bash
# 1. احصل على الفترات
GET /admin/accounting/periods

# 2. تحقق من أن الفترة الحالية OPEN
# 3. إذا كان القيد يجب أن يكون في شهر سابق:
#    - أعد فتح الفترة (إذا مسموح)
#    - أو سجل القيد في الفترة الحالية مع ملاحظة
```

### 4.3 "sourceEventId مكرر"

**الخطأ:**
```
Unique constraint failed on sourceEventId
```

**السبب:**
- العملية مسجلة مسبقاً (Idempotency يعمل)

**الحل:**
```typescript
// هذا ليس خطأ فعلياً!
// النظام منع التكرار تلقائياً
// تحقق من أن القيد الأصلي صحيح

const existing = await prisma.accJournalEntry.findUnique({
  where: { sourceEventId: 'TOPUP-APPROVED-12345' },
});

if (existing) {
  console.log('Entry already exists:', existing.id);
  return existing;  // استخدم القيد الموجود
}
```

### 4.4 "الحساب غير موجود أو غير قابل للترحيل"

**الخطأ:**
```
BadRequestException: الحساب 9999 غير موجود أو غير قابل للترحيل
```

**السبب:**
- كود الحساب خاطئ
- الحساب موجود لكن `isPosting = false` (حساب رئيسي)

**الحل:**
```bash
# 1. تحقق من وجود الحساب
GET /admin/accounting/accounts

# 2. تأكد من استخدام الكود الصحيح
# مثال:
# '4000' - Posting = false (حساب رئيسي)
# '4100' - Posting = true  (حساب فرعي) ✅
```

---

## 5. الصيانة

### 5.1 تنظيف القيود المعلقة القديمة

```typescript
// مهمة مجدولة (شهرياً)
async function cleanupOldDraftEntries() {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  const oldDrafts = await prisma.accJournalEntry.findMany({
    where: {
      status: AccJournalStatus.DRAFT,
      createdAt: { lt: oneMonthAgo },
    },
  });
  
  console.log(`Found ${oldDrafts.length} old draft entries`);
  
  // راجع كل قيد يدوياً
  // لا تحذف تلقائياً!
}
```

### 5.2 أرشفة القيود القديمة

```typescript
// إذا كانت قاعدة البيانات كبيرة
async function archiveOldEntries() {
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  
  // نقل إلى جدول أرشيف أو قاعدة بيانات منفصلة
  // NOT IMPLEMENTED - للنسخ المستقبلية
}
```

### 5.3 إعادة بناء الأرصدة (Rebuild Balances)

```bash
# في حالة الشك في البيانات

# احصل على جميع القيود POSTED
GET /admin/accounting/journal-entries?status=POSTED&limit=99999

# أعد حساب أرصدة الحسابات
# قارن مع ميزان المراجعة
GET /admin/accounting/reports/trial-balance
```

---

## 6. الأدوات المساعدة

### 6.1 سكريبت المطابقة اليومية

```bash
# daily-reconciliation.sh

#!/bin/bash
DATE=$(date +%Y-%m-%d)
API_URL="https://api.greenpages.sy/admin/accounting"
TOKEN="your-admin-token"

# 1. Wallet Liability Report
curl -H "Authorization: Bearer $TOKEN" \
  "$API_URL/reconcile/wallet-liability" \
  > "reports/wallet-liability-$DATE.json"

# 2. Clearing Accounts
curl -H "Authorization: Bearer $TOKEN" \
  "$API_URL/reconcile/clearing-accounts" \
  > "reports/clearing-accounts-$DATE.json"

# 3. Check for discrepancies
if grep -q '"status":"DISCREPANCY"' "reports/wallet-liability-$DATE.json"; then
  echo "⚠️ Discrepancy detected in wallet liability!"
  # Send alert email
fi

echo "✅ Daily reconciliation complete"
```

### 6.2 تقرير الإيرادات الشهرية

```typescript
// monthly-revenue.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function monthlyRevenueReport(year: number, month: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  
  const period = await prisma.accPeriod.findFirst({
    where: {
      startDate: { gte: startDate },
      endDate: { lte: endDate },
    },
  });
  
  if (!period) {
    throw new Error('Period not found');
  }
  
  const revenueAccounts = [
    { code: '4100', name: 'Subscriptions' },
    { code: '4200', name: 'Ads' },
    { code: '4300', name: 'Services' },
    { code: '4400', name: 'Top-up Fees' },
  ];
  
  const report: any[] = [];
  let grandTotal = 0;
  
  for (const acc of revenueAccounts) {
    const account = await prisma.accAccount.findUnique({
      where: { code: acc.code },
    });
    
    if (!account) continue;
    
    const lines = await prisma.accJournalLine.findMany({
      where: {
        accountId: account.id,
        journalEntry: {
          status: 'POSTED',
          periodId: period.id,
        },
      },
    });
    
    let credit = 0;
    let debit = 0;
    
    for (const line of lines) {
      credit += Number(line.credit);
      debit += Number(line.debit);
    }
    
    const net = credit - debit;  // Revenue = Credit balance
    
    report.push({
      account: acc.name,
      amount: net,
    });
    
    grandTotal += net;
  }
  
  console.table(report);
  console.log(`\nTotal Revenue: ${grandTotal.toLocaleString()} SYP`);
  
  return report;
}

// Usage:
monthlyRevenueReport(2026, 1);  // يناير 2026
```

---

## 7. قوائم التحقق (Checklists)

### 7.1 قبل الإغلاق الشهري
- [ ] جميع القيود DRAFT راجعتها
- [ ] لا قيود معلقة بدون سبب
- [ ] ميزان المراجعة متوازن
- [ ] المطابقة اليومية نظيفة
- [ ] حسابات المقاصة قريبة من الصفر
- [ ] التقارير المالية جاهزة
- [ ] النسخ الاحتياطي تم

### 7.2 عند اكتشاف مشكلة
- [ ] سجّل التفاصيل (متى، ماذا، لماذا)
- [ ] تحقق من سجل التدقيق (AccAuditLog)
- [ ] راجع القيود ذات الصلة
- [ ] لا تحذف بيانات أبداً
- [ ] استخدم القيود العكسية
- [ ] وثّق الحل
- [ ] شارك مع الفريق

---

**النهاية** - هذا الدليل حي، حدّثه عند الحاجة
