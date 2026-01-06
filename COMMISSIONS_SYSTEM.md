# نظام العمولات المالية

## نظرة عامة

تم تطوير نظام عمولات شامل يتتبع الأرباح المالية لجميع الأطراف المعنية عند إضافة أو الموافقة على الأنشطة التجارية.

---

## تدفق العمل

### 1. عند إنشاء نشاط تجاري (Business Creation)

#### الحالة الأولى: مندوب بدون موافقة (requiresApproval = false)

```
المندوب ← يضيف نشاط تجاري
    ↓
حالة النشاط: APPROVED مباشرة
    ↓
إنشاء عمولة بحالة APPROVED
    ↓
تحديث totalCommissions و totalBusinesses للمندوب
    ↓
تظهر الأرقام في Dashboard فوراً
```

**الكود المسؤول:**
- `apps/api/src/modules/businesses/businesses.service.ts` - سطر 68-77
- `apps/api/src/modules/commissions/commissions.service.ts` - دالة `createCommissionsForBusiness()`

#### الحالة الثانية: مندوب يحتاج موافقة (requiresApproval = true)

```
المندوب ← يضيف نشاط تجاري
    ↓
حالة النشاط: PENDING
    ↓
لا يتم إنشاء عمولة بعد
    ↓
المدير ← يوافق على النشاط
    ↓
حالة النشاط: APPROVED
    ↓
إنشاء عمولة بحالة APPROVED
    ↓
تحديث totalCommissions و totalBusinesses
    ↓
تظهر الأرقام في Dashboard
```

**الكود المسؤول:**
- `apps/api/src/modules/governorate-manager/governorate-manager.service.ts` - دالة `approveBusiness()` - سطر 946-982

---

## نموذج البيانات

### AgentCommission

```prisma
model AgentCommission {
  id                 String           @id
  agentProfileId     String
  businessId         String
  
  // المبالغ المالية
  subscriptionAmount Decimal          // سعر الباكج
  commissionRate     Decimal          // نسبة العمولة (من AgentProfile.commissionRate)
  commissionAmount   Decimal          // المبلغ النهائي (subscriptionAmount * commissionRate / 100)
  
  // النوع والحالة
  type               CommissionType   // NEW_SUBSCRIPTION, RENEWAL, UPGRADE
  status             CommissionStatus // PENDING, APPROVED, PAID, CANCELLED
  
  // التواريخ
  approvedAt         DateTime?
  paidAt             DateTime?
  createdAt          DateTime
  updatedAt          DateTime
  
  notes              String?
}
```

### CommissionStatus Enum

```prisma
enum CommissionStatus {
  PENDING    // معلقة - في انتظار الموافقة
  APPROVED   // معتمدة - تم الموافقة عليها
  PAID       // مدفوعة - تم دفعها للمندوب
  CANCELLED  // ملغية - تم إلغاؤها
}
```

---

## الحسابات المالية

### حساب العمولة

```typescript
const packagePrice = Number(business.package.package.price);
const commissionRate = Number(agentProfile.commissionRate);
const commissionAmount = (packagePrice * commissionRate) / 100;
```

**مثال:**
- سعر الباكج: 1000 جنيه
- نسبة عمولة المندوب: 10%
- عمولة المندوب: 1000 * 10 / 100 = **100 جنيه**

### تحديث AgentProfile

عند إنشاء العمولة:
```typescript
await prisma.agentProfile.update({
  where: { id: agentProfileId },
  data: {
    totalCommissions: { increment: commissionAmount },
    totalBusinesses: { increment: 1 }
  }
});
```

---

## Dashboard Integration

### Agent Dashboard
**ملف:** `apps/api/src/modules/agent-portal/agent-portal.service.ts`

```typescript
// العمولات المعتمدة (APPROVED)
const approvedCommissions = await prisma.agentCommission.aggregate({
  where: { 
    agentProfile: { userId }, 
    status: 'APPROVED' 
  },
  _sum: { commissionAmount: true }
});

// العمولات المدفوعة (PAID)
const paidCommissions = await prisma.agentCommission.aggregate({
  where: { 
    agentProfile: { userId }, 
    status: 'PAID' 
  },
  _sum: { commissionAmount: true }
});
```

### Manager Dashboard
يرى المدير:
- إجمالي عمولات المندوبين في محافظته
- الأنشطة المعلقة التي تنتظر الموافقة
- تقارير الأداء لكل مندوب

---

## حالات خاصة

### 1. رفض النشاط التجاري

عند رفض نشاط كان معلقاً:
- إذا كانت هناك عمولات (بالخطأ)، يتم حذفها
- عكس التحديثات على `totalCommissions` و `totalBusinesses`

```typescript
async rejectBusiness(businessId: string) {
  await commissionsService.deleteCommissionsForBusiness(businessId);
  await prisma.business.update({
    where: { id: businessId },
    data: { status: 'REJECTED' }
  });
}
```

### 2. نشاط بدون باكج

إذا لم يكن للنشاط باكج مخصص:
- لا يتم إنشاء عمولات
- النظام يتجاوز هذا النشاط

```typescript
if (!business.package?.package) {
  console.log('No package assigned to business:', businessId);
  return null;
}
```

### 3. تجنب التكرار

قبل إنشاء عمولة جديدة، نتحقق من عدم وجود عمولة سابقة:

```typescript
const existingCommission = await prisma.agentCommission.findFirst({
  where: { businessId }
});

if (existingCommission) {
  console.log('Commission already exists for business:', businessId);
  return existingCommission;
}
```

---

## الملفات المعدلة

### 1. CommissionsService
- **المسار:** `apps/api/src/modules/commissions/commissions.service.ts`
- **الوظيفة:** حساب وإنشاء وحذف العمولات

### 2. CommissionsModule
- **المسار:** `apps/api/src/modules/commissions/commissions.module.ts`
- **الوظيفة:** تعريف الـ module وexport الـ service

### 3. BusinessesService
- **المسار:** `apps/api/src/modules/businesses/businesses.service.ts`
- **التعديل:** إضافة استدعاء `createCommissionsForBusiness()` بعد إنشاء business بحالة APPROVED

### 4. BusinessesModule
- **المسار:** `apps/api/src/modules/businesses/businesses.module.ts`
- **التعديل:** import CommissionsModule

### 5. GovernorateManagerService
- **المسار:** `apps/api/src/modules/governorate-manager/governorate-manager.service.ts`
- **التعديلات:**
  - `approveBusiness()`: إضافة استدعاء `createCommissionsForBusiness()`
  - `rejectBusiness()`: إضافة استدعاء `deleteCommissionsForBusiness()`

### 6. GovernorateManagerModule
- **المسار:** `apps/api/src/modules/governorate-manager/governorate-manager.module.ts`
- **التعديل:** import CommissionsModule

### 7. AppModule
- **المسار:** `apps/api/src/app.module.ts`
- **التعديل:** import وإضافة CommissionsModule للـ imports array

---

## الخطوات القادمة (TODO)

### 1. عمولة مدير المحافظة
```typescript
// في CommissionsService
// TODO: حساب نسبة من العمولة لمدير المحافظة
// إنشاء ManagerCommission model في Schema
```

### 2. عمولة النظام/الشركة
```typescript
// TODO: حساب الربح الصافي للنظام
// SystemRevenue model
```

### 3. دفع العمولات
```typescript
// TODO: تطوير نظام الدفعات
// تحويل status من APPROVED إلى PAID
// تسجيل CommissionPayment
```

### 4. تقارير مالية
- تقارير شهرية للمندوبين
- تقارير سنوية للمدراء
- Dashboard للأدمن يعرض إجمالي الأرباح

---

## الاختبار

### سيناريو 1: مندوب بدون موافقة
1. إنشاء مندوب بـ `requiresApproval = false`
2. تخصيص `commissionRate = 10`
3. إنشاء نشاط تجاري مع باكج سعره 1000
4. **المتوقع:**
   - حالة النشاط: APPROVED
   - عمولة جديدة بقيمة 100
   - `agentProfile.totalCommissions` زادت بـ 100
   - `agentProfile.totalBusinesses` زادت بـ 1

### سيناريو 2: مندوب يحتاج موافقة
1. إنشاء مندوب بـ `requiresApproval = true`
2. تخصيص `commissionRate = 15`
3. إنشاء نشاط تجاري مع باكج سعره 500
4. **المتوقع:**
   - حالة النشاط: PENDING
   - لا توجد عمولات بعد
5. موافقة المدير على النشاط
6. **المتوقع:**
   - حالة النشاط: APPROVED
   - عمولة جديدة بقيمة 75 (500 * 15 / 100)
   - `agentProfile.totalCommissions` زادت بـ 75

### سيناريو 3: رفض نشاط
1. نشاط بحالة PENDING
2. رفض المدير
3. **المتوقع:**
   - حالة النشاط: REJECTED
   - لا توجد عمولات
   - الـ totalCommissions لم يتغير

---

## ملاحظات مهمة

1. **Commission Status = APPROVED دائماً عند الإنشاء**
   - حتى لو كان البيزنس PENDING في البداية
   - عند الموافقة على البيزنس، نُنشئ العمولة مباشرة بحالة APPROVED
   - هذا لأن الموافقة على البيزنس = الموافقة على العمولة

2. **Error Handling**
   - إذا فشل إنشاء العمولة، لا نوقف عملية إنشاء/موافقة البيزنس
   - نسجل الخطأ في console.error للمراجعة

3. **Package Requirement**
   - العمولات تُحسب فقط إذا كان للبيزنس باكج
   - إذا لم يكن هناك باكج، يتم تجاوز إنشاء العمولة

4. **Agent Requirement**
   - إذا لم يكن للبيزنس agent (agentId)، لا تُنشأ عمولة
   - هذا طبيعي لأن بعض الأنشطة قد تُنشأ من قبل الأدمن أو صاحب النشاط نفسه
