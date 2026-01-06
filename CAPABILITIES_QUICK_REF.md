# ⚡ Capabilities System - Quick Reference

## 🔑 الأساسيات

```typescript
// ❌ القديم
user.role = 'BUSINESS'  // مقيد بنشاط واحد

// ✅ الجديد  
user.role = 'USER'
// JWT contains: { hasBusinessAccess: true }
// Full data from: GET /capabilities/my-capabilities
```

---

## 📡 API Endpoints

### ربط مالك موجود
```bash
POST /capabilities/link-owner
{ "identifier": "0791234567", "businessId": "uuid" }
```

### دعوة مالك جديد
```bash
POST /capabilities/invite-owner
{ "businessId": "uuid", "phone": "0791234567" }
```

### المطالبة بالملكية
```bash
POST /capabilities/claim-ownership
{ "claimToken": "abc123..." }
```

### قدراتي
```bash
GET /capabilities/my-capabilities
```

### البحث عن مستخدم
```bash
GET /capabilities/search-user/{phone_or_email}
```

---

## 🎨 Frontend Usage

### Dashboard
```tsx
const capabilitiesQuery = useQuery({
  queryKey: ['my-capabilities'],
  queryFn: async () => {
    const res = await api.get('/capabilities/my-capabilities');
    return res.data.data;
  }
});

const hasBusinessAccess = capabilitiesQuery.data?.length > 0;

{hasBusinessAccess && <BusinessSection />}
```

### Agent - Owner Linking
```tsx
import { OwnerLinkingSection } from '@/components/business/owner-linking';

<OwnerLinkingSection
  businessId={businessId}
  onOwnerLinked={(ownerId) => console.log('Linked:', ownerId)}
  onInviteSent={(phone) => console.log('Invited:', phone)}
/>
```

---

## 🗄️ Database

### UserBusinessCapability
```sql
SELECT * FROM user_business_capabilities 
WHERE user_id = 'uuid' AND status = 'ACTIVE';
```

### Business ownerStatus
```sql
-- unclaimed: لا مالك رقمي
-- claimed: تم الربط
-- verified: تم التأكيد من المالك
UPDATE "Business" SET owner_status = 'claimed' WHERE id = 'uuid';
```

---

## 🔐 JWT Payload

```json
{
  "sub": "user-id",
  "role": "USER",
  "businessCapabilities": [
    { "id": "business-uuid-1", "role": "OWNER" },
    { "id": "business-uuid-2", "role": "MANAGER" }
  ]
}
```

---

## 🚀 Migration

```bash
cd packages/database
pnpm prisma migrate dev
pnpm prisma generate
```

---

## 📋 Enums

```typescript
BusinessCapabilityRole: OWNER | MANAGER | CASHIER | STAFF | VIEWER
CapabilityStatus: ACTIVE | PENDING | SUSPENDED | REVOKED
TrustLevel: UNVERIFIED | FIELD_VERIFIED | OWNER_CONFIRMED | DOCUMENT_VERIFIED
CapabilitySource: AGENT | ADMIN | SELF_CLAIMED | INVITATION
```

---

## 🔄 Workflows

### المندوب + مالك موجود
```
1. إنشاء النشاط (unclaimed)
2. البحث عن المالك (search-user)
3. الربط (link-owner)
✅ ownerStatus = 'claimed'
```

### المندوب + مالك جديد
```
1. إنشاء النشاط (unclaimed)
2. إرسال دعوة (invite-owner)
3. المالك يطالب (claim-ownership)
✅ ownerStatus = 'verified'
```

---

## 🎯 أفضل الممارسات

✅ **افعل:**
- استخدم `capabilities` للوصول لبيانات النشاط
- تحقق من `status === 'ACTIVE'` دائماً
- استخدم `enabled: !!primaryBusiness` في queries
- أضف `trustLevel` عند الربط الميداني

❌ **لا تفعل:**
- لا تعتمد على `user.role === 'BUSINESS'`
- لا تفترض نشاط واحد فقط
- لا تنسى تحديث `tokenVersion` عند التعديل
- لا ترسل دعوة لمستخدم موجود

---

## 📞 للمساعدة

- 📄 [التوثيق الكامل](./CAPABILITIES_SYSTEM.md)
- 🔧 [Backend Code](./apps/api/src/modules/capabilities)
- 🎨 [Frontend Components](./apps/web/src/app/dashboard)
- 🔄 [Migration Script](./packages/database/prisma/migrations)
