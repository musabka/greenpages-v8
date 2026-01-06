# 🎯 نظام إدارة الملكية المتكامل - دليل شامل

## 📋 جدول المحتويات
1. [نظرة عامة](#نظرة-عامة)
2. [المكونات الرئيسية](#المكونات-الرئيسية)
3. [الميزات الأساسية](#الميزات-الأساسية)
4. [الميزات المتقدمة](#الميزات-المتقدمة)
5. [API Endpoints](#api-endpoints)
6. [قاعدة البيانات](#قاعدة-البيانات)
7. [Frontend Components](#frontend-components)
8. [دليل الاستخدام](#دليل-الاستخدام)

---

## 🌟 نظرة عامة

نظام متكامل لإدارة ملكية الأنشطة التجارية يشمل:
- **ربط/فصل المالكين** بالأنشطة التجارية
- **تتبع كامل** لكل التغييرات (Audit Log)
- **إحصائيات مفصلة** عن حالة الملكية
- **إجراءات جماعية** (Bulk Actions)
- **نظام إشعارات** للمالكين والمسؤولين
- **فلاتر متقدمة** للبحث والتحليل

---

## 🔧 المكونات الرئيسية

### Backend Components

```
apps/api/src/modules/businesses/
├── businesses.controller.ts          ← REST API Endpoints
├── businesses.service.ts             ← Business Logic
├── ownership-notification.service.ts ← Notifications System
└── dto/
    └── *.dto.ts                      ← Data Transfer Objects

packages/database/
├── prisma/schema.prisma              ← Database Schema
└── migrations/
    └── add_business_ownership_audit.sql ← Migration File
```

### Frontend Components

```
apps/{admin,manager,agent}/src/components/business/
├── ownership-stats-cards.tsx         ← Dashboard Statistics
├── ownership-audit-list.tsx          ← Audit Log Viewer
├── bulk-ownership-actions.tsx        ← Multi-Select Actions
├── owner-management-section.tsx      ← Owner Management UI
├── owner-linking-section.tsx         ← Link Owner Modal
├── owner-status-badge.tsx            ← Status Indicators
├── owner-info-badge.tsx              ← Owner Info Display
└── quick-actions-menu.tsx            ← Dropdown Actions Menu
```

---

## ✨ الميزات الأساسية

### 1️⃣ ربط المالك (Link Owner)

**الاستخدام:**
```typescript
// API Call
POST /businesses/:id/owner
Body: { userId: "uuid" }

// Response
{
  "id": "business-uuid",
  "ownerStatus": "claimed",
  "owner": {
    "firstName": "أحمد",
    "lastName": "محمد",
    "email": "ahmad@example.com"
  }
}
```

**Frontend:**
```tsx
<OwnerLinkingSection
  businessId={businessId}
  onOwnerLinked={handleRefresh}
  onInviteSent={handleClose}
/>
```

**النتيجة:**
- ✅ تحديث حالة النشاط إلى `claimed`
- ✅ إنشاء `UserBusinessCapability` للمالك
- ✅ تسجيل في `BusinessOwnershipAudit`
- ✅ إرسال إشعار للمالك الجديد

---

### 2️⃣ فصل المالك (Unlink Owner)

**الاستخدام:**
```typescript
// API Call
DELETE /businesses/:id/owner

// Response
{
  "id": "business-uuid",
  "ownerStatus": "unclaimed",
  "owner": null
}
```

**النتيجة:**
- ✅ تحديث حالة النشاط إلى `unclaimed`
- ✅ حذف `UserBusinessCapability`
- ✅ تسجيل في Audit Log
- ✅ إرسال إشعار للمالك السابق

---

### 3️⃣ سجل التدقيق (Audit Log)

**عرض السجل:**
```tsx
<OwnershipAuditList businessId={businessId} />
```

**البيانات المسجلة:**
- نوع الإجراء (ربط/فصل/توثيق)
- الحالة السابقة والجديدة
- من قام بالإجراء
- تفاصيل التغييرات (JSON)
- التوقيت الدقيق

**الفلاتر المتاحة:**
- الكل
- ربط مالك (LINKED)
- فصل مالك (UNLINKED)
- تغيير الحالة (STATUS_CHANGED)
- توثيق (VERIFIED)
- إلغاء التوثيق (VERIFICATION_REVOKED)

---

### 4️⃣ إحصائيات الملكية (Ownership Stats)

**الاستخدام:**
```tsx
<OwnershipStatsCards />
```

**الإحصائيات المعروضة:**
1. **الأنشطة المرتبطة** (Claimed)
   - العدد الإجمالي
   - النسبة المئوية
   - أيقونة: UserCheck ✓

2. **الأنشطة غير المرتبطة** (Unclaimed)
   - العدد الإجمالي
   - حاجة لربط مالك
   - أيقونة: UserX ✗

3. **المالكون الموثّقون** (Verified)
   - عدد الأنشطة الموثّقة
   - أيقونة: TrendingUp ↗

**API Endpoint:**
```typescript
GET /businesses/stats
Response: {
  total: 1500,
  approved: 1200,
  pending: 300,
  ownership: {
    claimed: 800,
    unclaimed: 700,
    verified: 150
  }
}
```

---

## 🚀 الميزات المتقدمة

### 5️⃣ الإجراءات الجماعية (Bulk Actions)

**تفعيل Multi-Select:**
```tsx
const [selectedRows, setSelectedRows] = useState<string[]>([]);

<BulkOwnershipActions
  selectedBusinessIds={selectedRows}
  onClearSelection={() => setSelectedRows([])}
  onActionComplete={handleRefresh}
/>
```

**الإجراءات المتاحة:**

#### أ) ربط جماعي (Bulk Link)
```typescript
POST /businesses/bulk/link-owner
Body: {
  businessIds: ["id1", "id2", "id3"],
  userId: "owner-uuid"
}

Response: {
  message: "تم ربط 3 من 3 أنشطة بنجاح",
  success: ["id1", "id2", "id3"],
  failed: [],
  total: 3
}
```

#### ب) فصل جماعي (Bulk Unlink)
```typescript
POST /businesses/bulk/unlink-owner
Body: {
  businessIds: ["id1", "id2", "id3"]
}

Response: {
  message: "تم فصل 3 من 3 أنشطة بنجاح",
  success: ["id1", "id2", "id3"],
  failed: [],
  total: 3
}
```

**واجهة المستخدم:**
- شريط سفلي عائم يظهر عند التحديد
- عداد الأنشطة المحددة
- زر ربط بمالك (مع modal بحث)
- زر فصل المالك (مع تأكيد)

---

### 6️⃣ نظام الإشعارات (Notifications)

**أنواع الإشعارات:**

#### 1. إشعار ربط مالك
```json
{
  "type": "BUSINESS_OWNERSHIP_LINKED",
  "title": "تم ربطك كمالك لنشاط تجاري",
  "message": "تم ربطك كمالك للنشاط التجاري \"مطعم الشام\". يمكنك الآن إدارة بيانات النشاط وتحديثها.",
  "data": {
    "businessId": "uuid",
    "businessName": "مطعم الشام",
    "action": "LINKED"
  }
}
```

#### 2. إشعار فصل مالك
```json
{
  "type": "BUSINESS_OWNERSHIP_UNLINKED",
  "title": "تم فصلك عن نشاط تجاري",
  "message": "تم فصلك عن النشاط التجاري \"مطعم الشام\". لم تعد تملك صلاحيات إدارة هذا النشاط."
}
```

#### 3. إشعار توثيق
```json
{
  "type": "BUSINESS_OWNERSHIP_VERIFIED",
  "title": "تم توثيق ملكيتك للنشاط التجاري",
  "message": "تم توثيق ملكيتك للنشاط التجاري \"مطعم الشام\". هذا يمنحك مزايا إضافية وثقة أكبر من العملاء."
}
```

**الخدمة المسؤولة:**
```typescript
// apps/api/src/modules/businesses/ownership-notification.service.ts
OwnershipNotificationService.notifyOwnerLinked(params)
OwnershipNotificationService.notifyOwnerUnlinked(params)
OwnershipNotificationService.notifyOwnerVerified(params)
```

---

## 📡 API Endpoints

### الأنشطة الأساسية

| Method | Endpoint | الوصف | الصلاحيات |
|--------|----------|-------|-----------|
| `GET` | `/businesses` | قائمة الأنشطة | Public |
| `GET` | `/businesses/:id` | تفاصيل نشاط | Public |
| `GET` | `/businesses/stats` | الإحصائيات | Public |
| `POST` | `/businesses` | إضافة نشاط | ADMIN, AGENT |
| `PUT` | `/businesses/:id` | تحديث نشاط | ADMIN, AGENT |
| `DELETE` | `/businesses/:id` | حذف نشاط | ADMIN |

### إدارة الملكية

| Method | Endpoint | الوصف | الصلاحيات |
|--------|----------|-------|-----------|
| `POST` | `/businesses/:id/owner` | ربط مالك | ADMIN, SUPERVISOR, MANAGER |
| `DELETE` | `/businesses/:id/owner` | فصل مالك | ADMIN, SUPERVISOR, MANAGER |
| `GET` | `/businesses/:id/ownership-audit` | سجل التدقيق | Authenticated |
| `POST` | `/businesses/bulk/link-owner` | ربط جماعي | ADMIN, SUPERVISOR, MANAGER |
| `POST` | `/businesses/bulk/unlink-owner` | فصل جماعي | ADMIN, SUPERVISOR, MANAGER |

### Query Parameters

```typescript
GET /businesses?
  page=1&
  limit=20&
  search=مطعم&
  categoryId=uuid&
  governorateId=uuid&
  cityId=uuid&
  status=APPROVED&
  ownerStatus=claimed&     ← فلتر الملكية
  featured=true&
  verified=true
```

---

## 🗄️ قاعدة البيانات

### جدول BusinessOwnershipAudit

```sql
CREATE TABLE "business_ownership_audits" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "business_id" UUID NOT NULL,
    "user_id" UUID,
    "action" TEXT NOT NULL,
    "previous_status" TEXT,
    "new_status" TEXT,
    "changes" JSONB,
    "performed_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "fk_performed_by" 
        FOREIGN KEY ("performed_by") 
        REFERENCES "users"("id") 
        ON DELETE SET NULL
);

-- Indexes
CREATE INDEX "idx_business_id" ON "business_ownership_audits"("business_id");
CREATE INDEX "idx_user_id" ON "business_ownership_audits"("user_id");
CREATE INDEX "idx_action" ON "business_ownership_audits"("action");
CREATE INDEX "idx_created_at" ON "business_ownership_audits"("created_at");
CREATE INDEX "idx_performed_by" ON "business_ownership_audits"("performed_by");
```

### Prisma Schema

```prisma
model BusinessOwnershipAudit {
  id             String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  businessId     String   @map("business_id") @db.Uuid
  userId         String?  @map("user_id") @db.Uuid
  action         String   // LINKED | UNLINKED | STATUS_CHANGED | VERIFIED | VERIFICATION_REVOKED
  previousStatus String?  @map("previous_status")
  newStatus      String?  @map("new_status")
  changes        Json?
  performedBy    String   @map("performed_by") @db.Uuid
  createdAt      DateTime @default(now()) @map("created_at")
  
  performedByUser User? @relation("OwnershipAuditPerformed", fields: [performedBy], references: [id])
  
  @@index([businessId])
  @@index([userId])
  @@index([action])
  @@index([createdAt])
  @@index([performedBy])
  @@map("business_ownership_audits")
}
```

---

## 🎨 Frontend Components

### 1. OwnershipStatsCards

**المكان:** Dashboard الرئيسي
**الملفات:**
- `apps/admin/src/components/dashboard/ownership-stats-cards.tsx`
- `apps/manager/src/components/dashboard/ownership-stats-cards.tsx`
- `apps/agent/src/components/dashboard/ownership-stats-cards.tsx`

**الاستخدام:**
```tsx
import { OwnershipStatsCards } from '@/components/dashboard/ownership-stats-cards';

<OwnershipStatsCards />
```

---

### 2. OwnershipAuditList

**المكان:** صفحة تفاصيل النشاط → تبويب المالك
**الملفات:** في كل تطبيق بـ `components/business/`

**الاستخدام:**
```tsx
import { OwnershipAuditList } from '@/components/business/ownership-audit-list';

<OwnershipAuditList businessId={businessId} />
```

**الميزات:**
- عرض سجل التدقيق الكامل
- فلاتر حسب نوع الإجراء
- عرض تفاصيل كل تغيير
- أيقونات ملونة حسب النوع

---

### 3. BulkOwnershipActions

**المكان:** صفحة قائمة الأنشطة
**الملفات:** في كل تطبيق

**الاستخدام:**
```tsx
import { BulkOwnershipActions } from '@/components/business/bulk-ownership-actions';

const [selectedRows, setSelectedRows] = useState<string[]>([]);

<BulkOwnershipActions
  selectedBusinessIds={selectedRows}
  onClearSelection={() => setSelectedRows([])}
  onActionComplete={handleRefresh}
/>
```

**الميزات:**
- شريط عائم في الأسفل
- بحث عن مستخدمين
- ربط/فصل جماعي
- تقارير النجاح/الفشل

---

### 4. OwnerManagementSection

**المكان:** صفحة تعديل النشاط → تبويب المالك

**الاستخدام:**
```tsx
import { OwnerManagementSection } from '@/components/business';

<OwnerManagementSection
  businessId={businessId}
  ownerStatus={business.ownerStatus}
  owner={business.owner}
  onOwnerLinked={handleRefresh}
  onOwnerRemoved={handleRefresh}
/>
```

**الميزات:**
- عرض معلومات المالك الحالي
- زر ربط مالك جديد
- زر فصل المالك الحالي
- إحصائيات الملكية

---

## 📖 دليل الاستخدام

### للمسؤول (Admin)

#### 1. عرض إحصائيات الملكية
1. افتح الداشبورد الرئيسي
2. شاهد بطاقات الإحصائيات:
   - الأنشطة المرتبطة (أخضر)
   - الأنشطة غير المرتبطة (أصفر)
   - المالكون الموثّقون (أزرق)

#### 2. ربط مالك لنشاط واحد
1. افتح قائمة الأنشطة
2. اضغط على "..." → "ربط مالك"
3. ابحث عن المستخدم
4. اختر المستخدم المناسب
5. اضغط "ربط"

#### 3. ربط مالك لعدة أنشطة
1. افتح قائمة الأنشطة
2. حدد الأنشطة المطلوبة (checkbox)
3. سيظهر شريط في الأسفل
4. اضغط "ربط بمالك"
5. ابحث واختر المستخدم
6. اضغط "ربط الأنشطة"

#### 4. عرض سجل التغييرات
1. افتح صفحة تفاصيل النشاط
2. اذهب لتبويب "المالك"
3. مرّر للأسفل لقسم "سجل التغييرات"
4. استخدم الفلاتر لعرض نوع معين من الإجراءات

#### 5. فصل مالك
1. افتح صفحة تفاصيل النشاط
2. تبويب "المالك"
3. اضغط "فصل المالك"
4. أكّد العملية

---

### للمندوب (Agent)

#### عرض الإحصائيات في الداشبورد
- يرى المندوب إحصائيات الأنشطة التي أضافها
- يمكنه رؤية حالة الملكية لكل نشاط

#### استخدام Quick Actions
1. في قائمة الأنشطة
2. اضغط على أيقونة "..." بجانب النشاط
3. اختر:
   - "ربط مالك" (للأنشطة غير المرتبطة)
   - "عرض تفاصيل المالك" (للمرتبطة)

---

### للمدير (Manager)

#### إدارة الملكية في المحافظة
- يدير المدير ملكية الأنشطة في محافظته فقط
- نفس الميزات المتاحة للـ Admin
- إحصائيات خاصة بمحافظته

#### تصدير التقارير
1. اذهب للداشبورد
2. اضغط "تصدير تقرير"
3. اختر نوع التقرير:
   - PDF للطباعة
   - CSV للتحليل

---

## 🔐 الصلاحيات

| الإجراء | ADMIN | SUPERVISOR | MANAGER | AGENT | USER |
|---------|-------|------------|---------|-------|------|
| عرض الإحصائيات | ✅ | ✅ | ✅ | ✅ | ❌ |
| ربط مالك | ✅ | ✅ | ✅ | ❌ | ❌ |
| فصل مالك | ✅ | ✅ | ✅ | ❌ | ❌ |
| ربط جماعي | ✅ | ✅ | ✅ | ❌ | ❌ |
| فصل جماعي | ✅ | ✅ | ✅ | ❌ | ❌ |
| عرض Audit Log | ✅ | ✅ | ✅ | ✅ | ❌ |
| توثيق المالك | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 🎯 حالات الاستخدام

### Scenario 1: مالك جديد يسجل في المنصة
1. المالك يسجل دخول للمنصة
2. يبحث عن نشاطه التجاري
3. يضغط "هذا نشاطي"
4. يملأ نموذج طلب الملكية
5. المسؤول يراجع الطلب
6. يوافق على الطلب → يتم ربط المالك
7. المالك يستلم إشعار بالربط
8. يصبح لديه صلاحيات تعديل النشاط

### Scenario 2: نقل ملكية نشاط
1. المسؤول يفتح النشاط
2. يفصل المالك الحالي
3. المالك القديم يستلم إشعار بالفصل
4. المسؤول يربط المالك الجديد
5. المالك الجديد يستلم إشعار
6. يتم تسجيل كل التغييرات في Audit Log

### Scenario 3: ربط عدة أنشطة لنفس المالك
1. المسؤول يحدد 10 أنشطة من قائمة الأنشطة
2. يضغط "ربط بمالك"
3. يبحث عن المالك المطلوب
4. يختار المالك
5. النظام يربط الـ 10 أنشطة
6. يرسل إشعار واحد للمالك بكل الأنشطة
7. يتم تسجيل 10 إدخالات في Audit Log

---

## 📊 الإحصائيات والتقارير

### Dashboard Stats
```json
{
  "total": 1500,
  "ownership": {
    "claimed": 800,      // 53.3%
    "unclaimed": 700,    // 46.7%
    "verified": 150      // 18.75% من المرتبطة
  }
}
```

### Audit Log Analytics
- عدد التغييرات اليومية
- أكثر المسؤولين نشاطاً
- نسبة نجاح الربط الجماعي
- متوسط وقت الاستجابة

---

## 🚦 حالات النشاط (Business Owner Status)

| Status | الوصف | اللون | الأيقونة |
|--------|-------|-------|----------|
| `unclaimed` | غير مرتبط | أصفر | UserX |
| `claimed` | مرتبط | أخضر | UserCheck |
| `verified` | موثّق | أزرق | BadgeCheck |

---

## 🔄 دورة حياة الملكية

```
┌─────────────┐
│  unclaimed  │ ← النشاط عند الإنشاء
└──────┬──────┘
       │ Link Owner
       ↓
┌─────────────┐
│   claimed   │ ← مرتبط بمالك
└──────┬──────┘
       │ Verify Owner
       ↓
┌─────────────┐
│  verified   │ ← موثّق رسمياً
└──────┬──────┘
       │ Revoke / Unlink
       ↓
┌─────────────┐
│  unclaimed  │ ← العودة لغير مرتبط
└─────────────┘
```

---

## 🛠️ الصيانة والتطوير

### تشغيل Migration
```bash
cd packages/database
psql -U postgres -d greenpages < migrations/add_business_ownership_audit.sql
```

### تحديث Prisma Client
```bash
cd packages/database
npx prisma generate
```

### اختبار الإشعارات
```typescript
// في BusinessesService
await OwnershipNotificationService.notifyOwnerLinked({
  userId: 'test-user-id',
  businessId: 'test-business-id',
  businessName: 'مطعم الشام',
  performedBy: 'admin-id',
});
```

---

## 📝 ملاحظات مهمة

1. **Audit Log لا يُحذف أبداً** - للاحتفاظ بسجل كامل
2. **الإشعارات اختيارية** - فشلها لا يوقف العملية
3. **Bulk Actions معالجة تسلسلية** - لتجنب race conditions
4. **Filters في Audit Log من جهة Frontend** - لا تحتاج API منفصل
5. **Owner Status مستقل عن Business Status** - يمكن أن يكون النشاط approved وunclaimed

---

## 🎓 موارد إضافية

- [CAPABILITIES_SYSTEM.md](./CAPABILITIES_SYSTEM.md) - نظام القدرات الكامل
- [ENTITY_SCOPE_README.md](./docs/ENTITY_SCOPE_README.md) - نطاق الكيانات
- [API Documentation](./API_DOCS.md) - توثيق كامل للـ API

---

**آخر تحديث:** 6 يناير 2026
**الإصدار:** 2.0 - نظام متكامل
**المطورون:** فريق الصفحات الخضراء
