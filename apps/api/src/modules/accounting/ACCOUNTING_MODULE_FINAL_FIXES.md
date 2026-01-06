# 🔐 ACCOUNTING_MODULE_FINAL_FIXES.md
## GreenPages – Accounting Module Hardening Tasks

**الهدف:**  
تثبيت موديول المحاسبة نهائيًا (Production-grade)  
بدون إعادة تصميم  
بدون Refactor جذري  
مع الحفاظ على SSOT و Auditability و Multi-currency

---

## ⚠️ قواعد عامة قبل البدء

- ❌ لا تغيّر Prisma Models جذريًا
- ❌ لا تغيّر API Contracts
- ❌ لا تحذف أي منطق موجود
- ✅ أضف Guards / Validations / Constraints فقط
- ✅ أي تعديل يجب أن يكون Backward Compatible

---

## 1️⃣ Idempotency Handling (REQUIRED)

### المشكلة
`sourceEventId` يعتمد فقط على Unique Constraint → يرمي خطأ بدل إعادة القيد.

### المطلوب
في `AccountingService.createJournalEntry`:

#### الخطوة
قبل إنشاء القيد:
- إذا كان `sourceEventId` موجود
- وابحث عن JournalEntry بنفس القيمة
- أعد القيد الموجود بدل إنشاء جديد

#### شرط القبول
- Retry لنفس الحدث لا ينشئ قيدًا جديدًا
- لا يتم رمي Exception

---

## 2️⃣ منع خلط العملات داخل JournalEntry

### المشكلة
لا يوجد تحقق صريح بين:
- JournalEntry.currencyId
- AccAccount.currencyMode / currencyId

### المطلوب
في `AccountingPolicyService`:

#### أضف Validation:
- إذا كان الحساب `currencyMode = MONO`
  - يجب أن يطابق `JournalEntry.currencyId`
- امنع أي JournalEntry يحتوي حسابات بعملات مختلفة

#### شرط القبول
- لا يمكن إنشاء أو ترحيل قيد بعملات غير متوافقة

---

## 3️⃣ DB-Level Constraints على AccJournalLine

### المشكلة
التحقق فقط في الكود

### المطلوب
أضف Migration SQL:

```sql
ALTER TABLE acc_journal_lines
ADD CONSTRAINT debit_or_credit_only
CHECK (
  (debit > 0 AND credit = 0)
  OR
  (credit > 0 AND debit = 0)
);
شرط القبول

لا يمكن إدخال سطر فيه debit و credit معًا

لا قيم سالبة

4️⃣ منع القيود الصفرية (Zero-Amount Entries)
المشكلة

يمكن إنشاء قيد متوازن لكن كل القيم = 0

المطلوب

قبل POST أي JournalEntry:

احسب مجموع (debit + credit)

إذا = 0 → ارفض العملية

شرط القبول

لا يوجد JournalEntry POSTED بدون قيمة مالية فعلية

5️⃣ Dimensions Whitelist Enforcement
المشكلة

dimensions حقل Json مفتوح

المطلوب

أنشئ Whitelist ثابتة:

[
  governorateId,
  cityId,
  districtId,
  userId,
  businessId,
  agentProfileId,
  sourceModule,
  projectKey
]

التطبيق

فلترة أي dimensions واردة

تجاهل أي مفتاح خارج القائمة

شرط القبول

لا يتم حفظ أي dimension غير مصرح به

6️⃣ Audit Log إلزامي لكل Action حساس
المطلوب

تأكد من إنشاء AccAuditLog عند:

POST JournalEntry

VOID JournalEntry

ISSUE Invoice

CANCEL Invoice

RECORD Invoice Payment

CLOSE Accounting Period

Reconciliation Fix (wallet / clearing)

شرط القبول

لا يوجد Action مالي مؤثر بدون سجل تدقيق

7️⃣ Immutability Guard بعد POST
المشكلة

Immutability غير محمية صراحة

المطلوب

في أي update محتمل على JournalEntry:

إذا status = POSTED → ارفض العملية مباشرة

شرط القبول

لا يمكن تعديل أو حذف أي قيد مرحّل

8️⃣ Invoice ↔ JournalEntry Rules تثبيت
المطلوب
عند ISSUE Invoice:

journalEntryId MUST NOT be null

issuedAt MUST be set

عند تسجيل دفع Invoice:

كل دفعة = JournalEntry مستقل

sourceEventId فريد لكل دفعة

شرط القبول

لا فاتورة صادرة بدون قيد

لا دفعة بدون قيد مستقل

9️⃣ Performance Index (IMPORTANT)
المطلوب

إضافة Index:

CREATE INDEX idx_acc_journal_lines_dimensions
ON acc_journal_lines
USING GIN (dimensions);

السبب

تقارير المحافظات

Scope للمحاسبين الإقليميين

✅ Definition of Done (DoD)

 Idempotency تعمل بدون Exceptions

 لا خلط عملات داخل قيد

 DB تمنع أخطاء debit/credit

 لا قيود صفرية

 dimensions نظيفة ومحددة

 Audit Log شامل

 POSTED entries غير قابلة للتعديل

 الفواتير مربوطة محاسبيًا دائمًا

 التقارير لم تتأثر

🟢 ملاحظة ختامية

بعد تنفيذ هذا الملف:

النظام المحاسبي مغلق هندسيًا

جاهز للاستخدام لسنوات

أي تطوير لاحق سيكون توسعة فقط




