أنت وكيل تطوير Senior مسؤول عن إقفال نظام المحاسبة في مشروع Green Pages v8 (Green Core Accounting Engine) ليكون “نهائي” ومتين لمدة 3 سنوات بدون تغييرات جذرية. 
المطلوب منك ليس فقط أن “يبني يمر” بل أن يكون صحيح محاسبياً (Audit-ready) ومصمم كـ SSOT مالي.

=====================================================
0) السياق والهدف
=====================================================
- لدينا Modular Monolith (NestJS + Prisma + PostgreSQL).
- المحاسبة هي المصدر الوحيد للحقيقة المالية (SSOT).
- لدينا Wallet للمستخدم العادي + مالك النشاط التجاري (Business Owner). 
- لدينا تدفقات مالية: Top-ups متعددة الطرق، Payments من المحفظة، اشتراكات، إعلانات، خدمات مستقبلية (مثل شحن رصيد موبايل)، عمولات للمندوب، تسويات مدير المحافظة.
- لدينا ضرائب (حكومية + داخلية للنظام) متعددة الأنواع.
- لدينا Multi-currency + Exchange rates تاريخية.
- لدينا Multi-language (AR/EN) للأسماء والمستندات والفواتير.

المطلوب منك: مراجعة التنفيذ الحالي وإكماله/إصلاحه حتى يصبح مطابقًا لمواصفات “FINAL”.

=====================================================
1) قواعد غير قابلة للتفاوض (Non-Negotiables)
=====================================================
A) Accounting = Single Source of Truth
- أي رقم مالي استراتيجي (إيراد/مصروف/التزامات/ضرائب) يُستخرج من Accounting فقط.
- Wallet tables يمكن أن تبقى كـ Projection/Cache تشغيلي، لكن لا تُعتبر مصدر حقيقة.
- يجب إضافة آلية Reconciliation بين Wallet و Accounting (Job/endpoint) وتوثيق واضح.

B) Double-entry Mandatory
- كل حدث مالي => Journal Entry متوازن (sum debit == sum credit).
- يمنع نشر (POST) أي قيد غير متوازن.
- يمنع Line لديه debit>0 و credit>0 معاً.
- يمنع debit<0 أو credit<0.

C) Immutability & Auditability
- لا حذف لأي Entry/Invoice منشور.
- لا تعديل على POSTED.
- التصحيح يتم عبر:
  - Reversal Entry (الافتراضي)
  - VOID (نادر وبسبب واضح) أو Credit Note للفواتير
- كل العمليات تُسجل في AccAuditLog.

D) Atomicity
- العمليات التي تنتج كيانين/أكثر (Invoice + JournalEntry + WalletTransaction…) يجب أن تكون Transaction واحدة (Prisma $transaction).
- إذا فشل أي جزء: Rollback كامل.

E) Idempotency
- أي Event مالي يجب أن يمر بـ idempotencyKey/sourceEventId فريد.
- إعادة المحاولة لا تنتج قيدًا ثانيًا.

F) Period Closing
- لا POST/VOID/REVERSE داخل Period مغلق.
- أي تصحيح بعد الإغلاق = في Period مفتوح فقط.

=====================================================
2) المطلوب تنفيذه بالتحديد (Deliverables)
=====================================================

---------------------------------------
2.1 مراجعة المخطط Prisma وإصلاح النواقص
---------------------------------------
1) AccTax يجب أن يرتبط بحساب محاسبي (Tax Payable Account)
- أضف حقول:
  - taxAccountId (FK -> AccAccount)
  - revenueAdjustmentAccountId (اختياري إن احتجت لتسويات)
- الهدف: كل ضريبة تُرحّل محاسبياً إلى حساب محدد.

2) AccJournalLine يجب أن يدعم Dimensions
- أضف:
  - dimensions Json?
- القيم المسموحة (Whitelist):
  - governorateId, cityId, districtId
  - userId, businessId, agentProfileId
  - sourceModule, projectKey
- أي مفتاح خارج whitelist: رفض في validation.

3) AccJournalEntry.entryNumber
- يجب أن يكون:
  - nullable في DRAFT
  - يتم توليده عند POST فقط (sequence أو logic)
- إذا لا تريد nullable، اعمل entryNumber مؤقت ثم استبدله عند POST ضمن transaction مع ضمان uniqueness.

4) AccInvoice
- تأكد أنه يدعم:
  - AR/EN fields لما يلزم (notesAr, notesEn موجود)
  - journalEntryId مرتبط إلزاميًا عند ISSUED/PAID.
- أضف (إن غير موجود):
  - customerLanguage (AR/EN) لتوليد الفاتورة بشكل صحيح
  - billingAddress (اختياري)

5) Multi-tax على الفاتورة
- إن كان AccInvoiceLine يدعم taxId واحد فقط:
  - أبقه مؤقتًا
  - لكن أضف تصميم “جاهز” بدون كسر:
    - AccInvoiceLineTax (many-to-many) OPTIONAL
- إذا التغيير سهل الآن: طبق AccInvoiceLineTax من الآن لتجنب تغييرات بعد سنة.

6) WalletWithdrawal
- بما أن السياسة تقول: لا سحب رصيد نقدي للمستخدم:
  - اجعل WalletWithdrawal غير مستخدم للمستخدم النهائي.
  - إن احتجته: اجعله Admin-only internal disbursement.
  - أضف تعليق/قيد في الخدمة يمنع public withdrawals.

بعد تعديل Prisma:
- شغّل prisma generate + migration صحيحة (prefer prisma migrate dev / deploy حسب بيئتك).
- تأكد build يمر.

---------------------------------------
2.2 تثبيت طبقة السياسات المحاسبية (Accounting Policy Layer)
---------------------------------------
أنشئ طبقة واضحة:
- AccountingPolicyService (or AccountingMappingService)

وظيفتها:
- ترجمة الأحداث المالية (WalletTopUpCompleted, WalletPaymentCompleted, CommissionEarned, SettlementPaid, InvoiceIssued, InvoicePaid …)
  إلى:
  - مجموعة Journal Lines (account codes + debit/credit + dimensions)
  - الضرائب (Tax lines)
  - الرسوم (fees lines)
  - clearing lines

ممنوع:
- وضع mapping account codes داخل WalletService/CommissionsService مباشرة.
الموديول الآخر يرسل event payload فقط.

---------------------------------------
2.3 إعادة ضبط Wallet → Accounting (SSOT & Reconciliation)
---------------------------------------
1) تعريف واضح:
- Wallet balance = Projection
- Accounting is SSOT

2) أضف reconcile mechanism:
- Job أو endpoint Admin: /admin/accounting/reconcile/wallets
- يقوم بـ:
  - حساب الرصيد الحقيقي للمحفظة من Accounting (Wallet Liability movements أو حسابات مخصصة)
  - مقارنة مع Wallet.balance
  - إنتاج تقرير فروقات + إمكانية “fix projection” (اختياري) عبر تحديث Wallet فقط (لا تعديل Accounting).

3) أضف قيود تمنع أن Wallet تعدّل الحقيقة المحاسبية:
- أي تحديث على WalletTransaction يجب أن يقابله JournalEntry مرتبط (sourceEntityType/sourceEntityId).

---------------------------------------
2.4 الفوترة (Invoices) — اجعلها محاسبية بالكامل
---------------------------------------
المطلوب:
1) Invoice lifecycle مضبوط:
- DRAFT -> ISSUED -> PAID/PARTIALLY_PAID -> CANCELLED/REFUNDED
- عند ISSUED:
  - يجب إنشاء JournalEntry POSTED فوراً (أو إنشاء DRAFT ثم POST في نفس العملية).
  - وربط invoice.journalEntryId إلزامياً.
- عند PAID:
  - لا تغير قيد الإصدار، بل أنشئ قيد تحصيل Payment Entry (Cash/Bank/Clearing vs AR أو Wallet Liability حسب طريقة الدفع).
  - أو إذا نموذجك يعتمد Wallet: التحصيل يكون من Wallet Liability.

2) Credit Notes / Refunds:
- عند refund: أنشئ Credit Note invoice + reversal entries (لا تعديل على الأصل).

3) Multi-language:
- ensure invoice fields can be rendered AR/EN.
- add templates إن لزم (اختياري).

---------------------------------------
2.5 الضرائب (Tax Engine) — صحيح محاسبيًا
---------------------------------------
1) تعريف الضرائب:
- حكومية/داخلية/محافظة/خدمة
- percentage/fixed
- inclusive/exclusive
- scope
- governorate optional

2) تطبيق الضرائب:
- في invoice line:
  - calculate tax
  - create separate journal line posting to taxAccountId
- إذا tax inclusive:
  - adjust revenue so total stays same (إما عبر splitting أو using revenueAdjustmentAccountId).

3) التقارير:
- Taxes Summary by period + by type + by governorate.

---------------------------------------
2.6 Commissions / Settlements — توحيدها محاسبياً
---------------------------------------
1) عند CommissionEarned (أو Approved حسب منطقكم):
- Debit: COMMISSIONS_EXPENSE
- Credit: AGENT_PAYABLE

2) عند CommissionPayment (Paid):
- Debit: AGENT_PAYABLE
- Credit: CASH/BANK

3) عند ManagerSettlement:
- تعريف واضح للحسابات:
  - GOVERNORATE_REVENUE (إن وجدت)
  - COMPANY_COMMISSION_REVENUE
  - MANAGER_PAYABLE
- وأنشئ قيود حسب المعادلة المتفق عليها.

ملاحظة: لا تستخدم أرقام مجمعة فقط؛ اجعل كل Settlement مرتبط بمرجع.

---------------------------------------
2.7 Period Closing — enforcement قوي
---------------------------------------
- closePeriod يجب أن:
  - يتحقق عدم وجود قيود DRAFT ضمن الفترة
  - يقفلها
- أي محاولة POST/VOID/REVERSE في فترة CLOSED => Forbidden.

---------------------------------------
2.8 API Endpoints — تنظيم + صلاحيات
---------------------------------------
تحت /admin/accounting:
- currencies CRUD + seed
- exchange-rates CRUD
- accounts CRUD + seed
- taxes CRUD
- periods open/close
- journal entries manual create + post + reverse + void (void فقط لمحاسب/مدير)
- invoices create/issue/pay/refund/credit-note
- reports:
  - trial-balance
  - ledger
  - wallet-liability snapshot
  - tax summary
  - clearing accounts aging
- reconcile endpoints

صلاحيات:
- role جديد: ACCOUNTANT
- accountant لديه governorate scope:
  - يرى تقارير محافظاته فقط
  - يعالج ضرائب وفواتير ضمن محافظاته فقط
  - لا يعدّل COA system accounts
- Super Admin يرى الكل.

تأكد من:
- guards + decorators (ScopeGovernorates)
- filtering في queries (governorate dimension أو business governorate).

---------------------------------------
2.9 اختبارات سيناريو محاسبي (Mandatory)
---------------------------------------
اكتب integration tests أو scenario tests (حتى لو بسيطة) تغطي:
1) TopUp BANK_TRANSFER (مع fee + tax إن وجدت)
2) TopUp CASH_DEPOSIT
3) TopUp CREDIT_CARD (مع رسوم gateway)
4) Bulk TopUp لمجموعة مستخدمين
5) Gamification credit (بدون cash movement، فقط platform expense vs wallet liability)
6) Payment subscription من wallet (revenue + tax)
7) Payment ads من wallet
8) Commission earned + settlement paid
9) Period closing ثم محاولة post (يجب ترفض)
10) Refund / Credit Note

لكل سيناريو تحقق:
- sum debit == sum credit
- invoice/journal links exist
- correct accounts used
- correct dimensions saved
- idempotency prevents duplicates

---------------------------------------
2.10 توثيق نهائي (Docs)
---------------------------------------
أنشئ/حدّث:
- ACCOUNTING_FINAL_SPEC.md (مستخلص تنفيذي + جداول COA + flows)
- ACCOUNTING_RULES.md (Non-negotiables + invariants)
- ACCOUNTING_PLAYBOOK.md (تشغيل يومي للمحاسب + تقارير + reconciliations)
- SEED_GUIDE.md (كيف seed accounts/currencies/taxes)

=====================================================
3) طريقة العمل المطلوبة منك (Execution Protocol)
=====================================================
- لا تعمل تغييرات عشوائية.
- ابدأ بـ: 
  1) قراءة schema.prisma الحالي (المحاسبة + wallet)
  2) فحص AccountingService + endpoints + bridges
  3) استخراج قائمة gaps مقابل البنود أعلاه
- نفّذ التغييرات بترتيب:
  (Schema -> Services -> Policies -> Endpoints -> Tests -> Docs)
- بعد كل مرحلة:
  - pnpm run build
  - prisma generate
  - (إن أمكن) تشغيل tests

=====================================================
4) شروط القبول (Definition of Done)
=====================================================
لا أعتبر المهمة منتهية إلا إذا:
- كل السيناريوهات العشرة تمر
- كل عمليات ISSUE/PAID/REFUND تخلق قيود صحيحة
- الضرائب تُرحّل إلى حسابات ضريبية صحيحة
- reconcile wallet يعمل ويكشف الفروقات
- period closing enforced
- accountant scope يعمل
- لا duplication مع retries (idempotency)
- docs موجودة ومحدثة

=====================================================
5) ملاحظات تقنية مهمة
=====================================================
- استخدم Prisma $transaction لكل العمليات الحساسة.
- لا تستخدم float أبداً، فقط Decimal.
- ضع validation قوي لـ debit/credit و dimensions.
- حافظ على naming conventions الحالية.
- لا تكسر backwards compatibility إلا إذا كانت ضرورة مطلقة.
- إن احتجت Many-to-many للضرائب على invoice line، طبقها الآن لأننا نريد 3 سنوات بدون تغييرات جذرية.

ابدأ فوراً بتنفيذ الخطة أعلاه، واعتبرها مرجعًا إلزامياً.
