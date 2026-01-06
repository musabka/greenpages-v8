# 🎯 Capabilities System - نظام القدرات

## نظرة عامة

تم تطوير **نظام القدرات (Capabilities System)** كبديل متقدم للنهج التقليدي القائم على الأدوار الثابتة. بدلاً من وجود دور منفصل `BUSINESS` للمستخدم، أصبح لدينا **سياق ديناميكي** يسمح لأي مستخدم بامتلاك أو إدارة عدة أنشطة تجارية دون تغيير دوره الأساسي.

### لماذا Capabilities بدلاً من Roles؟

#### ❌ النهج القديم (Role-Based):
```typescript
user.role = 'BUSINESS'  // الآن مقيد بنشاط واحد فقط
```

**المشاكل:**
- لا يمكن للمستخدم امتلاك عدة أنشطة
- يحتاج تبديل الأدوار لإدارة أكثر من نشاط
- صعوبة في التوسع (موظفين، مديرين، إلخ)
- إغلاق النشاط = فقدان الدور

#### ✅ النهج الجديد (Capability-Based):
```typescript
user.role = 'USER'  // دور واحد للجميع
user.businessCapabilities = [
  { businessId: 'uuid1', role: 'OWNER' },
  { businessId: 'uuid2', role: 'MANAGER' },
  { businessId: 'uuid3', role: 'STAFF' }
]
```

**المزايا:**
- ✅ نفس المستخدم يدير عدة أنشطة
- ✅ دعم أدوار مختلفة لكل نشاط
- ✅ سهولة التوسع (إضافة موظفين لاحقاً)
- ✅ إغلاق النشاط = إزالة capability فقط

---

## 📐 البنية المعمارية

### 1. Database Schema

#### Enums الجديدة:

```prisma
enum BusinessCapabilityRole {
  OWNER        // مالك - كامل الصلاحيات
  MANAGER      // مدير - العمليات اليومية
  CASHIER      // أمين صندوق - الطلبات والمدفوعات
  STAFF        // موظف - صلاحيات محدودة
  VIEWER       // مشاهد - قراءة فقط
}

enum CapabilityStatus {
  ACTIVE       // نشط - يمكن الوصول
  PENDING      // معلق - بانتظار التأكيد
  SUSPENDED    // معلق مؤقتاً
  REVOKED      // ملغى
}

enum TrustLevel {
  UNVERIFIED        // غير موثق
  FIELD_VERIFIED    // موثق ميدانياً
  OWNER_CONFIRMED   // مؤكد من المالك
  DOCUMENT_VERIFIED // موثق بالوثائق
}

enum CapabilitySource {
  AGENT          // من المندوب
  ADMIN          // من الإدارة
  SELF_CLAIMED   // من المالك نفسه
  INVITATION     // من دعوة
}
```

#### Models الأساسية:

**UserBusinessCapability** - الربط بين المستخدم والنشاط:
```prisma
model UserBusinessCapability {
  id         String   @id @default(uuid())
  userId     String
  businessId String
  
  role       BusinessCapabilityRole
  status     CapabilityStatus @default(PENDING)
  trustLevel TrustLevel @default(UNVERIFIED)
  source     CapabilitySource
  
  permissions Json? @default("[]")  // للتوسع المستقبلي
  
  activatedAt DateTime?
  revokedAt   DateTime?
  
  user       User     @relation(...)
  business   Business @relation(...)
  
  @@unique([userId, businessId, role])
}
```

**BusinessOwnershipInvitation** - دعوات الملكية:
```prisma
model BusinessOwnershipInvitation {
  id         String @id @default(uuid())
  businessId String
  
  phone      String
  email      String?
  ownerName  String?
  
  claimToken String @unique
  status     CapabilityStatus @default(PENDING)
  expiresAt  DateTime
  
  claimedByUserId String?
  claimedAt       DateTime?
  
  business   Business @relation(...)
}
```

**Business Updates**:
```prisma
model Business {
  // ... existing fields ...
  
  ownerStatus String @default("unclaimed")  // unclaimed | claimed | verified
  
  // Relations
  userCapabilities UserBusinessCapability[]
  ownerInvitations BusinessOwnershipInvitation[]
}
```

---

## 🔌 Backend API

### Capabilities Module

**الملفات:**
```
apps/api/src/modules/capabilities/
├── capabilities.module.ts
├── capabilities.service.ts
├── capabilities.controller.ts
└── dto/
    ├── link-owner.dto.ts
    ├── invite-owner.dto.ts
    └── claim-ownership.dto.ts
```

### API Endpoints

#### 1. ربط مالك موجود
```http
POST /capabilities/link-owner
Authorization: Bearer {token}

Request:
{
  "identifier": "0791234567",  // phone or email
  "businessId": "uuid",
  "trustLevel": "FIELD_VERIFIED"  // optional
}

Response:
{
  "success": true,
  "message": "تم ربط المالك بنجاح",
  "data": {
    "id": "capability-uuid",
    "userId": "user-uuid",
    "businessId": "business-uuid",
    "role": "OWNER",
    "status": "ACTIVE"
  }
}
```

#### 2. دعوة مالك جديد
```http
POST /capabilities/invite-owner
Authorization: Bearer {token}

Request:
{
  "businessId": "uuid",
  "phone": "0791234567",
  "email": "owner@example.com",  // optional
  "ownerName": "أحمد محمد"  // optional
}

Response:
{
  "success": true,
  "message": "تم إنشاء الدعوة بنجاح",
  "data": {
    "id": "invitation-uuid",
    "businessId": "business-uuid",
    "phone": "0791234567",
    "claimToken": "abc123...",
    "expiresAt": "2026-02-05T..."
  }
}
```

#### 3. المطالبة بالملكية
```http
POST /capabilities/claim-ownership
Authorization: Bearer {token}

Request:
{
  "claimToken": "abc123..."
}

Response:
{
  "success": true,
  "message": "تم المطالبة بالملكية بنجاح",
  "data": {
    "capability": {...},
    "business": {...}
  }
}
```

#### 4. الحصول على قدرات المستخدم
```http
GET /capabilities/my-capabilities
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": [
    {
      "businessId": "uuid1",
      "role": "OWNER",
      "status": "ACTIVE",
      "business": {
        "id": "uuid1",
        "nameAr": "مطعم الأمل",
        "slug": "مطعم-الأمل-abc123",
        "logo": "...",
        "status": "APPROVED"
      }
    },
    {
      "businessId": "uuid2",
      "role": "MANAGER",
      "status": "ACTIVE",
      "business": {
        "id": "uuid2",
        "nameAr": "مكتبة النور",
        ...
      }
    }
  ]
}
```

#### 5. البحث عن مستخدم
```http
GET /capabilities/search-user/{identifier}
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "firstName": "أحمد",
    "lastName": "محمد",
    "phone": "0791234567",
    "email": "ahmad@example.com",
    "avatar": "...",
    "businessCapabilities": [
      {
        "business": {
          "id": "uuid",
          "nameAr": "نشاط موجود"
        }
      }
    ]
  }
}
```

---

## 🎨 Frontend Integration

### 1. Dashboard - الكشف من Capabilities

**apps/web/src/app/dashboard/page.tsx**:
```typescript
// Fetch capabilities
const capabilitiesQuery = useQuery({
  queryKey: ['my-capabilities'],
  queryFn: async () => {
    const response = await api.get('/capabilities/my-capabilities');
    return response.data.data as BusinessCapability[];
  }
});

// Check if user has business capabilities
const capabilities = capabilitiesQuery.data ?? [];
const hasBusinessCapabilities = capabilities.length > 0;
const primaryBusiness = capabilities[0];

// Conditional business section
{hasBusinessCapabilities && (
  <div>
    <h2>إدارة النشاط التجاري</h2>
    {/* Business stats, subscription, etc. */}
  </div>
)}
```

### 2. Owner Linking Section - واجهة المندوب

**apps/agent/src/components/business/owner-linking/OwnerLinkingSection.tsx**:
```tsx
<OwnerLinkingSection
  businessId={createdBusinessId}
  onOwnerLinked={(ownerId) => {
    console.log('Owner linked:', ownerId);
  }}
  onInviteSent={(phone) => {
    console.log('Invitation sent to:', phone);
  }}
/>
```

**الميزات:**
- تبويب "مالك لديه حساب": بحث بالهاتف/البريد → ربط فوري
- تبويب "دعوة مالك جديد": إرسال دعوة عبر SMS
- UX سلس مع feedback فوري
- معالجة أخطاء شاملة

---

## 🔐 JWT Token Structure

### قبل:
```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "role": "BUSINESS",
  "businessId": "uuid1"  // نشاط واحد فقط
}
```

### بعد (محسّن للأداء):
```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "role": "USER",
  "hasBusinessAccess": true  // ✅ خفيف - لا يكبر مع الأنشطة
}
```

**⚡ Performance Note:**  
نستخدم `hasBusinessAccess` flag بدلاً من array كامل لتجنب تضخم JWT.  
الـ capabilities الكاملة تُجلب عبر: `GET /capabilities/my-capabilities`

---

## 🔄 سيناريوهات الاستخدام

### السيناريو 1: المندوب يضيف نشاط بمالك موجود

```typescript
// 1. المندوب ينشئ النشاط (ownerStatus: 'unclaimed')
const business = await api.post('/businesses', {
  nameAr: "مطعم الأمل",
  // ... بيانات النشاط
});

// 2. المندوب يبحث عن المالك
const searchResult = await api.get('/capabilities/search-user/0791234567');

// 3. المندوب يربط المالك
const link = await api.post('/capabilities/link-owner', {
  identifier: "0791234567",
  businessId: business.id
});

// النتيجة:
// - Business.ownerStatus = 'claimed'
// - UserBusinessCapability created with role='OWNER'
// - User.tokenVersion incremented (JWT refresh required)
```

### السيناريو 2: المندوب يضيف نشاط بمالك ليس لديه حساب

```typescript
// 1. المندوب ينشئ النشاط (ownerStatus: 'unclaimed')
const business = await api.post('/businesses', { ... });

// 2. المندوب يرسل دعوة
const invitation = await api.post('/capabilities/invite-owner', {
  businessId: business.id,
  phone: "0791234567",
  ownerName: "أحمد محمد"
});

// 3. المالك يستلم SMS برابط + claimToken

// 4. المالك يسجل دخول/تسجيل جديد

// 5. المالك يطالب بالملكية
const claim = await api.post('/capabilities/claim-ownership', {
  claimToken: invitation.claimToken
});

// النتيجة:
// - UserBusinessCapability created
// - Business.ownerStatus = 'verified'
// - Invitation.status = 'ACTIVE'
```

### السيناريو 3: مستخدم لديه عدة أنشطة

```typescript
// الحصول على كل الأنشطة
const { data } = await api.get('/capabilities/my-capabilities');

// data:
[
  { businessId: 'uuid1', role: 'OWNER', business: {...} },
  { businessId: 'uuid2', role: 'MANAGER', business: {...} },
  { businessId: 'uuid3', role: 'CASHIER', business: {...} }
]

// في الـ UI: Business Selector لاختيار النشاط النشط
<select>
  {data.map(cap => (
    <option value={cap.businessId}>
      {cap.business.nameAr} ({cap.role})
    </option>
  ))}
</select>
```

---

## 🚀 التوسع المستقبلي

### 1. إضافة موظفين

```typescript
POST /capabilities/add-staff

{
  "businessId": "uuid",
  "userId": "staff-user-id",
  "role": "CASHIER",
  "permissions": ["orders.read", "orders.create", "payments.create"]
}
```

### 2. Permissions دقيقة

```json
{
  "role": "STAFF",
  "permissions": [
    "orders.read",
    "orders.create",
    "products.read",
    "inventory.update"
  ]
}
```

### 3. Business Context Switching

```typescript
// تبديل السياق النشط
const activeBusiness = useBusinessContext();
activeBusiness.switchTo('uuid2');
```

---

## 📋 Migration Guide

### تطبيق Migration:

```bash
# 1. تشغيل قاعدة البيانات
docker-compose up -d postgres

# 2. تطبيق Migration
cd packages/database
pnpm prisma migrate dev

# 3. إعادة توليد Prisma Client
pnpm prisma generate
```

### Migration Script تلقائي:

يقوم الـ Migration بتحويل البيانات الموجودة تلقائياً:

```sql
-- تحويل الأنشطة الموجودة
INSERT INTO "user_business_capabilities" (...)
SELECT 
  b."owner_id",
  b."id",
  'OWNER',
  'ACTIVE',
  'FIELD_VERIFIED',
  'AGENT',
  ...
FROM "Business" b
WHERE b."owner_id" IS NOT NULL;

-- تحديث ownerStatus
UPDATE "Business"
SET "owner_status" = 'claimed'
WHERE "owner_id" IS NOT NULL;
```

---

## 🎯 النقاط الأساسية

| الجانب | التفاصيل |
|--------|---------|
| **الدور الأساسي** | `USER` للجميع (لا `BUSINESS` role) |
| **الربط** | عبر `UserBusinessCapability` |
| **تعدد الأنشطة** | ✅ مدعوم بالكامل |
| **النشاط بدون مالك** | ✅ `ownerStatus: 'unclaimed'` (طبيعي) |
| **الدعوات** | ✅ `BusinessOwnershipInvitation` + claimToken |
| **الصلاحيات** | قابلة للتوسع عبر `permissions` JSON |
| **JWT** | يحتوي على `hasBusinessAccess` flag (محسّن) |
| **التوسع** | سهل (MANAGER, CASHIER, STAFF, VIEWER) |

---

## 📞 الدعم والصيانة

- **Backend**: [apps/api/src/modules/capabilities](../../apps/api/src/modules/capabilities)
- **Frontend**: [apps/web/src/app/dashboard/page.tsx](../../apps/web/src/app/dashboard/page.tsx)
- **Agent UI**: [apps/agent/src/components/business/owner-linking](../../apps/agent/src/components/business/owner-linking)
- **Migration**: [packages/database/prisma/migrations/add_capabilities_system](../../packages/database/prisma/migrations/add_capabilities_system/migration.sql)

---

**التطوير مكتمل 100%** ✅  
**جاهز للاختبار والإطلاق** 🚀
