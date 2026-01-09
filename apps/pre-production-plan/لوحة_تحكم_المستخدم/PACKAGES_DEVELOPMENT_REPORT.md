# 📦 تطوير نظام الباقات في لوحة تحكم المستخدم

**التاريخ:** 7 يناير 2026  
**الهدف:** تطوير خيارات الأنشطة التجارية في لوحة تحكم المستخدم مع معلومات تفصيلية عن الباقات

---

## ✅ المطلوب (متطلبات المستخدم)

### معلومات الباقة الحالية:
- ✅ تاريخ إضافة النشاط التجاري
- ✅ تاريخ تفعيل الباقة الحالية
- ✅ تاريخ انتهاء الباقة الحالية
- ✅ تبقى على انتهاء الباقة xx يومًا

### العمليات المطلوبة:
- ✅ تجديد الباقة
- ✅ ترقية الباقة
- ✅ عرض الباقات المتاحة

### التكامل:
- ✅ التوافق مع موديول الباقات الموجود
- ✅ التكامل مع النظام المحاسبي
- ✅ الدفع من المحفظة

---

## 🔧 التطوير الذي تم

### 1. Backend APIs (NestJS)

#### ملفات تم تعديلها:

**`apps/api/src/modules/users/user-dashboard.service.ts`**

✅ **إضافة وظيفة `getUserPackagesDetails`:**
```typescript
async getUserPackagesDetails(userId: string) {
  // جلب جميع الأنشطة التجارية للمستخدم
  const capabilities = await this.prisma.userBusinessCapability.findMany({
    where: { userId, status: 'ACTIVE' },
    include: { business: { select: { 
      id, nameAr, nameEn, slug, logo, createdAt // ← تاريخ إضافة النشاط
    }}},
  });

  // لكل نشاط، جلب معلومات الباقة
  const packagesDetails = await Promise.all(
    capabilities.map(async (cap) => {
      const currentPackage = await this.prisma.businessPackage.findFirst({
        where: { businessId: cap.business.id, isActive: true },
        include: { package: { include: { features, limits }}},
      });

      // حساب الأيام المتبقية
      const daysRemaining = endDate
        ? Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : null;

      // تحديد الحالة: ACTIVE | EXPIRING_SOON | EXPIRED
      let status = 'ACTIVE';
      if (daysRemaining <= 0) status = 'EXPIRED';
      else if (daysRemaining <= 30) status = 'EXPIRING_SOON';

      return {
        business: cap.business,
        businessCreatedAt, // ← تاريخ إضافة النشاط
        packageActivatedAt: startDate, // ← تاريخ تفعيل الباقة
        packageExpiresAt: endDate, // ← تاريخ انتهاء الباقة
        daysRemaining, // ← الأيام المتبقية
        status,
        canRenew: !isDefaultPackage && status !== 'EXPIRED',
        canUpgrade: !isDefaultPackage,
      };
    })
  );

  return packagesDetails;
}
```

✅ **إضافة وظيفة `getAvailablePackages`:**
```typescript
async getAvailablePackages() {
  return await this.prisma.package.findMany({
    where: {
      status: 'ACTIVE',
      isPublic: true,
      isDefault: false, // ← استبعاد الباقة الافتراضية
    },
    include: { features: true, limits: true },
    orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }],
  });
}
```

**`apps/api/src/modules/users/user-dashboard.controller.ts`**

✅ **إضافة Endpoints:**
```typescript
@Get('packages-details')
@ApiOperation({ summary: 'تفاصيل باقات جميع أنشطة المستخدم التجارية' })
async getUserPackagesDetails(@Request() req: any) {
  return this.dashboardService.getUserPackagesDetails(req.user.id);
}

@Get('available-packages')
@ApiOperation({ summary: 'الباقات المتاحة للشراء/التجديد/الترقية' })
async getAvailablePackages() {
  return this.dashboardService.getAvailablePackages();
}
```

#### الـ APIs الجديدة:

| Method | Endpoint | الوصف |
|--------|----------|-------|
| `GET` | `/api/v1/user/dashboard/packages-details` | معلومات تفصيلية عن باقات جميع أنشطة المستخدم |
| `GET` | `/api/v1/user/dashboard/available-packages` | جميع الباقات المتاحة للشراء/التجديد/الترقية |

**Response Example - `packages-details`:**
```json
[
  {
    "business": {
      "id": "xxx",
      "nameAr": "مطعم النخيل",
      "slug": "al-nakhl-restaurant",
      "logo": "...",
      "createdAt": "2025-01-01T10:00:00Z"
    },
    "businessCreatedAt": "2025-01-01T10:00:00Z",
    "role": "OWNER",
    "currentPackage": {
      "id": "pkg123",
      "packageName": "الباقة الذهبية",
      "price": 500,
      "isDefault": false,
      "features": [...],
      "limits": [...]
    },
    "packageActivatedAt": "2025-12-01T00:00:00Z",
    "packageExpiresAt": "2026-03-01T00:00:00Z",
    "daysRemaining": 53,
    "status": "EXPIRING_SOON",
    "canRenew": true,
    "canUpgrade": true
  }
]
```

---

### 2. Frontend Components

#### أ) مكون `PackageInfoCard`

**الملف:** `apps/web/src/app/dashboard/components/PackageInfoCard.tsx`

✅ **المميزات:**
- عرض معلومات النشاط التجاري مع الشعار
- **تاريخ إضافة النشاط التجاري** 📅
- **تاريخ تفعيل الباقة الحالية** ✅
- **تاريخ انتهاء الباقة الحالية** ⏰
- **عداد الأيام المتبقية** مع Progress Bar
- ألوان ديناميكية حسب الحالة:
  - 🟢 أخضر: أكثر من 30 يوم
  - 🟠 برتقالي: 7-30 يوم
  - 🔴 أحمر: أقل من 7 أيام
- أزرار الإجراءات:
  - **تجديد الباقة** (إذا كانت قريبة من الانتهاء)
  - **ترقية الباقة** (لأي باقة غير افتراضية)
  - **عرض جميع الباقات**

**مثال الاستخدام:**
```tsx
<PackageInfoCard packageDetails={packageDetail} />
```

---

#### ب) صفحة عرض الباقات المتاحة

**الملف:** `apps/web/src/app/dashboard/packages/page.tsx`

✅ **المميزات:**
- عرض جميع الباقات المتاحة في Grid
- لكل باقة:
  - الاسم والوصف
  - السعر والمدة
  - قائمة المميزات (Features) مع ✓ أو ✗
  - قائمة الحدود (Limits) مع القيم
- Header مع زر "العودة للوحة التحكم"
- بطاقة معلومات عن نظام الباقات

**التصميم:**
- Grid responsive (1 col → 2 → 3)
- Header باللون الأخضر المتدرج
- أيقونات واضحة للمميزات

---

#### ج) صفحة تجديد الباقة

**الملف:** `apps/web/src/app/dashboard/packages/renew/[businessId]/page.tsx`

✅ **المميزات:**
- عرض معلومات الباقة الحالية:
  - اسم الباقة
  - تاريخ الانتهاء الحالي
  - الأيام المتبقية
- اختيار مدة التجديد:
  - المدة الافتراضية (30 يوم مثلاً)
  - ضعف المدة (60 يوم)
  - ثلاث أضعاف (90 يوم)
- عرض رصيد المحفظة
- حساب التكلفة الإجمالية
- التحقق من كفاية الرصيد
- زر شحن المحفظة إذا كان الرصيد غير كافي
- زر تأكيد التجديد

**التكامل:**
```typescript
// API Call
const response = await api.post('/packages/assign', {
  businessId,
  packageId: currentPackage.packageId,
  durationDays: selectedDuration
});
```

**الربط بالمحاسبة:**
- عند التجديد، يتم إنشاء `acc_invoice`
- خصم من `wallet_transactions`
- إنشاء `acc_journal_entry`
- تحديث `business_packages` (تمديد `endDate`)

---

#### د) صفحة ترقية الباقة

**الملف:** `apps/web/src/app/dashboard/packages/upgrade/[businessId]/page.tsx`

✅ **المميزات:**
- عرض الباقة الحالية بوضوح
- قائمة الباقات الأعلى سعراً فقط (ترقية)
- اختيار باقة جديدة
- مقارنة المميزات:
  - الباقة الحالية vs الباقة الجديدة
  - المميزات الإضافية مميزة
- عرض رصيد المحفظة
- حساب تكلفة الترقية
- التحقق من كفاية الرصيد
- زر تأكيد الترقية

**منطق الترقية:**
```typescript
// فلترة الباقات الأعلى سعراً
const upgradePackages = availablePackages.filter(
  (pkg) => Number(pkg.price) > currentPrice && pkg.id !== currentPackage.packageId
);
```

**التكامل:**
```typescript
const response = await api.post('/packages/assign', {
  businessId,
  packageId: selectedPackageId
});
```

**الربط بالمحاسبة:**
- تحديد نوع العمولة: `UPGRADE`
- إنشاء فاتورة جديدة
- خصم من المحفظة
- تعطيل الباقة القديمة
- تفعيل الباقة الجديدة

---

### 3. تحديث لوحة التحكم الرئيسية

**الملف:** `apps/web/src/app/dashboard/page.tsx`

✅ **التعديلات:**
```tsx
import { PackageInfoCard } from './components/PackageInfoCard';

// إضافة Query جديد
const packagesQuery = useQuery({
  queryKey: ['user-packages-details'],
  queryFn: async () => {
    const response = await api.get('/user/dashboard/packages-details');
    return response.data;
  },
  enabled: !!dashboardQuery.data?.hasBusinessAccess,
});

// في JSX - بعد قائمة الأنشطة
{hasBusinessAccess && packagesQuery.data && packagesQuery.data.length > 0 && (
  <div className="mt-8">
    <div className="flex items-center justify-between mb-6">
      <h2>باقات أنشطتي التجارية</h2>
      <Link href="/dashboard/packages">عرض جميع الباقات المتاحة</Link>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {packagesQuery.data.map((packageDetail) => (
        <PackageInfoCard key={packageDetail.business.id} packageDetails={packageDetail} />
      ))}
    </div>
  </div>
)}
```

---

## 🔗 التكامل مع الأنظمة الموجودة

### 1. نظام الباقات (Packages Module)

✅ **استخدام APIs الموجودة:**
- `GET /api/v1/packages` - جلب جميع الباقات
- `GET /api/v1/packages/business/:businessId` - جلب باقة نشاط معين
- `POST /api/v1/packages/assign` - تعيين/تجديد/ترقية باقة

✅ **الـ Packages Service:**
```typescript
// التجديد - يقوم بتمديد endDate تلقائياً
if (currentBP && currentBP.packageId === packageId) {
  startDate = currentBP.startDate; // نحافظ على تاريخ البدء الأصلي
  endDate = new Date(currentBP.endDate);
  endDate.setDate(endDate.getDate() + daysToAdd); // ← التمديد
}

// الترقية - باقة جديدة تبدأ من الآن
if (currentBP && currentBP.packageId !== packageId) {
  startDate = new Date();
  endDate = new Date();
  endDate.setDate(endDate.getDate() + daysToAdd);
}
```

---

### 2. النظام المحاسبي (Accounting Module)

✅ **التكامل الكامل عبر `assignPackage`:**

**عند تجديد/شراء باقة:**
```typescript
// 1. إنشاء الفاتورة
const invoice = await tx.accInvoice.create({
  data: {
    businessId,
    invoiceNumber: `INV-${Date.now()}`,
    invoiceDate: new Date(),
    status: 'PAID',
    subtotal: pkg.price,
    taxAmount: 0,
    total: pkg.price,
  }
});

// 2. إنشاء بنود الفاتورة
await tx.accInvoiceLine.create({
  data: {
    invoiceId: invoice.id,
    description: `اشتراك ${pkg.nameAr}`,
    quantity: 1,
    unitPrice: pkg.price,
    totalPrice: pkg.price,
  }
});

// 3. الدفع من المحفظة
await tx.walletTransaction.create({
  data: {
    walletId: wallet.id,
    type: 'PAYMENT',
    amount: pkg.price,
    description: `دفع اشتراك ${pkg.nameAr}`,
    relatedEntityType: 'INVOICE',
    relatedEntityId: invoice.id,
  }
});

// 4. تحديث رصيد المحفظة
await tx.wallet.update({
  where: { userId },
  data: {
    balance: { decrement: pkg.price },
    totalSpent: { increment: pkg.price },
  }
});

// 5. إنشاء القيد المحاسبي
await tx.accJournalEntry.create({
  data: {
    entryDate: new Date(),
    description: `اشتراك باقة - ${pkg.nameAr}`,
    totalDebit: pkg.price,
    totalCredit: pkg.price,
    lines: {
      create: [
        {
          accountId: debitAccountId, // حساب الإيرادات
          debitAmount: pkg.price,
          creditAmount: 0,
        },
        {
          accountId: creditAccountId, // حساب المحفظة
          debitAmount: 0,
          creditAmount: pkg.price,
        }
      ]
    }
  }
});

// 6. حساب عمولة المندوب
await this.createAgentCommission(tx, {
  businessId,
  packagePrice: pkg.price,
  commissionType: 'RENEWAL' | 'UPGRADE' | 'NEW_SUBSCRIPTION',
});
```

✅ **SSOT محترم بالكامل:**
- لا توجد أرقام معزولة
- كل معاملة لها قيد محاسبي
- الفواتير مرتبطة بالدفعات
- العمولات محسوبة ومسجلة

---

### 3. نظام المحفظة (Wallet Module)

✅ **التكامل:**
- عرض رصيد المحفظة في صفحات التجديد والترقية
- التحقق من كفاية الرصيد قبل الدفع
- زر مباشر لشحن المحفظة
- خصم تلقائي عند التأكيد

✅ **الربط:**
```typescript
// جلب الرصيد
const wallet = await api.get('/wallet/balance');

// التحقق
const hasEnoughBalance = Number(wallet.balance) >= packagePrice;

// الدفع يتم عبر packages/assign
// الـ Service يقوم بخصم الرصيد تلقائياً
```

---

## 📊 البيانات المعروضة

### في PackageInfoCard:

| البيان | المصدر | التنسيق |
|--------|--------|---------|
| تاريخ إضافة النشاط | `business.createdAt` | `format(date, 'dd MMMM yyyy', { locale: ar })` |
| تاريخ تفعيل الباقة | `businessPackage.startDate` | `format(date, 'dd MMMM yyyy', { locale: ar })` |
| تاريخ انتهاء الباقة | `businessPackage.endDate` | `format(date, 'dd MMMM yyyy', { locale: ar })` |
| الأيام المتبقية | محسوبة | `Math.ceil((endDate - now) / (1000*60*60*24))` |
| Progress Bar | محسوبة | `(daysRemaining / totalDays) * 100` |

### الحالات (Status):

| الحالة | الشرط | اللون | الأيقونة |
|--------|------|------|---------|
| `ACTIVE` | `daysRemaining > 30` | 🟢 أخضر | `CheckCircle2` |
| `EXPIRING_SOON` | `7 < daysRemaining ≤ 30` | 🟠 برتقالي | `AlertTriangle` |
| `EXPIRED` | `daysRemaining ≤ 0` | 🔴 أحمر | `XCircle` |
| `NO_PACKAGE` | لا توجد باقة | ⚪ رمادي | `Package` |

---

## 🎨 الواجهة (UI/UX)

### التصميم:
- ✅ Cards responsive مع Tailwind CSS
- ✅ Icons من `lucide-react`
- ✅ Gradient backgrounds للعناصر المهمة
- ✅ Hover effects ناعمة
- ✅ Loading states
- ✅ Error handling

### الألوان:
- 🟢 Green: الإجراءات الإيجابية (تجديد، تأكيد)
- 🔵 Blue: الترقية والمعلومات
- 🟠 Orange: التنبيهات (قريب من الانتهاء)
- 🔴 Red: الأخطاء والانتهاء

### التفاعل:
- زر "تجديد" يظهر فقط للباقات القريبة من الانتهاء
- زر "ترقية" يظهر لجميع الباقات غير الافتراضية
- Progress Bar ديناميكي حسب الوقت المتبقي
- Disabled state للأزرار أثناء التحميل

---

## 🛣️ المسارات (Routes)

| المسار | الصفحة | الوصف |
|--------|--------|-------|
| `/dashboard` | لوحة التحكم الرئيسية | عرض PackageInfoCard لكل نشاط |
| `/dashboard/packages` | عرض جميع الباقات | قائمة الباقات المتاحة للشراء |
| `/dashboard/packages/renew/[businessId]` | تجديد الباقة | صفحة تجديد باقة نشاط معين |
| `/dashboard/packages/upgrade/[businessId]` | ترقية الباقة | صفحة ترقية لباقة أعلى |

---

## ✅ الاختبار

### Checklist:

**Backend:**
- [ ] `GET /user/dashboard/packages-details` يعيد بيانات صحيحة
- [ ] `GET /user/dashboard/available-packages` يستبعد الباقة الافتراضية
- [ ] `POST /packages/assign` (تجديد) يمدد `endDate` بشكل صحيح
- [ ] `POST /packages/assign` (ترقية) ينشئ باقة جديدة
- [ ] الفواتير تُنشأ بشكل صحيح
- [ ] القيود المحاسبية متوازنة
- [ ] العمولات محسوبة بشكل صحيح
- [ ] المحفظة تُخصم بالمبلغ الصحيح

**Frontend:**
- [ ] PackageInfoCard يعرض جميع التواريخ بشكل صحيح
- [ ] Progress Bar يعكس النسبة الصحيحة
- [ ] الألوان تتغير حسب الحالة
- [ ] صفحة التجديد تحسب التكلفة بشكل صحيح
- [ ] صفحة الترقية تعرض فقط الباقات الأعلى سعراً
- [ ] التحقق من كفاية الرصيد يعمل
- [ ] Redirect بعد النجاح يعمل

**التكامل:**
- [ ] التجديد ينعكس فوراً في Dashboard
- [ ] الترقية تُظهر الباقة الجديدة
- [ ] رصيد المحفظة يتحدث بعد الدفع
- [ ] الفواتير تظهر في النظام المحاسبي

---

## 📝 ملاحظات مهمة

### 1. الباقة الافتراضية:
- لا تظهر في قائمة الباقات المتاحة
- لا يمكن تجديدها (دائمة)
- لا يمكن الترقية منها (يجب شراء باقة جديدة)

### 2. العمولات:
- تُحسب تلقائياً عند:
  - اشتراك جديد → `NEW_SUBSCRIPTION`
  - تجديد نفس الباقة → `RENEWAL`
  - ترقية لباقة أعلى → `UPGRADE`

### 3. المحفظة:
- جميع الدفعات من رصيد المحفظة
- لا يوجد دفع نقدي مباشر
- إذا كان الرصيد غير كافي، يجب الشحن أولاً

### 4. التواريخ:
- `businessCreatedAt` → من جدول `businesses.createdAt`
- `packageActivatedAt` → من `business_packages.startDate`
- `packageExpiresAt` → من `business_packages.endDate`
- التجديد يمدد `endDate` بدون تغيير `startDate`
- الترقية تُنشئ باقة جديدة بـ `startDate` جديد

---

## 🚀 الخطوات التالية (اختياري)

### تحسينات محتملة:

1. **التجديد التلقائي:**
   - إضافة checkbox "تجديد تلقائي"
   - عند اقتراب الانتهاء، يتم التجديد تلقائياً
   - إرسال تنبيه قبل التجديد بـ 3 أيام

2. **الإشعارات:**
   - إشعار عند بقاء 30 يوم
   - إشعار عند بقاء 7 أيام
   - إشعار عند الانتهاء

3. **المقارنة:**
   - صفحة مقارنة الباقات جنباً إلى جنب
   - جدول مقارنة المميزات

4. **التقارير:**
   - تاريخ الاشتراكات
   - إجمالي الإنفاق على الباقات
   - ROI من كل باقة

---

## ✅ الخلاصة

تم تطوير نظام متكامل لإدارة الباقات في لوحة تحكم المستخدم:

### Backend:
- ✅ API endpoints جديدة للباقات
- ✅ وظائف في UserDashboardService
- ✅ التكامل الكامل مع نظام المحاسبة

### Frontend:
- ✅ PackageInfoCard مع جميع المعلومات المطلوبة
- ✅ صفحة عرض الباقات المتاحة
- ✅ صفحة تجديد الباقة مع الدفع
- ✅ صفحة ترقية الباقة مع المقارنة
- ✅ تحديث Dashboard الرئيسي

### التكامل:
- ✅ نظام الباقات الموجود
- ✅ النظام المحاسبي (فواتير + قيود)
- ✅ نظام المحفظة (الدفع)
- ✅ نظام العمولات

**النظام جاهز للاختبار!** 🎉
