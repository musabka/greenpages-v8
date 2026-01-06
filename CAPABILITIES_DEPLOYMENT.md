# 🚀 تطبيق Capabilities System

## الخطوات المطلوبة

### 1. تشغيل قاعدة البيانات

```bash
# تشغيل Docker Desktop أولاً

# ثم تشغيل PostgreSQL
cd e:\greenpages-v8
docker-compose up -d postgres

# التحقق من أن قاعدة البيانات شغالة
docker-compose ps
```

### 2. تطبيق Migration

```bash
cd packages\database

# تطبيق Migration
pnpm prisma migrate dev

# إعادة توليد Prisma Client
pnpm prisma generate
```

### 3. تشغيل Backend API

```bash
cd apps\api
npm run start:dev
```

### 4. تشغيل Frontend Apps

```bash
# في terminal جديد - Web App
cd apps\web
npm run dev

# في terminal جديد - Agent App
cd apps\agent
npm run dev
```

---

## ✅ اختبار النظام

### Test 1: ربط مالك موجود

```bash
# 1. تسجيل دخول كمندوب
POST http://localhost:3000/api/v1/auth/login
{
  "email": "agent@example.com",
  "password": "password"
}

# 2. إنشاء نشاط تجاري
POST http://localhost:3000/api/v1/businesses
Authorization: Bearer {token}
{
  "nameAr": "مطعم الاختبار",
  "governorateId": "...",
  "cityId": "...",
  ...
}

# 3. البحث عن مستخدم
GET http://localhost:3000/api/v1/capabilities/search-user/0791234567

# 4. ربط المالك
POST http://localhost:3000/api/v1/capabilities/link-owner
{
  "identifier": "0791234567",
  "businessId": "{business-uuid}"
}

# ✅ تحقق: ownerStatus = 'claimed'
```

### Test 2: دعوة مالك جديد

```bash
# 1. إنشاء نشاط (كما في Test 1)

# 2. إرسال دعوة
POST http://localhost:3000/api/v1/capabilities/invite-owner
{
  "businessId": "{business-uuid}",
  "phone": "0799999999",
  "ownerName": "محمد أحمد"
}

# ✅ تحقق: claimToken تم إنشاؤه

# 3. المطالبة بالملكية (كمستخدم جديد)
POST http://localhost:3000/api/v1/capabilities/claim-ownership
Authorization: Bearer {new-user-token}
{
  "claimToken": "{claim-token}"
}

# ✅ تحقق: ownerStatus = 'verified'
```

### Test 3: Dashboard للمستخدم

```bash
# 1. تسجيل دخول كمستخدم عادي
# 2. افتح http://localhost:3002/dashboard
# ✅ يجب ظهور "مرحباً بك في حسابك" (بدون قسم النشاط)

# 3. تسجيل دخول كمالك نشاط
# 4. افتح http://localhost:3002/dashboard
# ✅ يجب ظهور "مرحباً بك، مالك النشاط التجاري" + قسم النشاط
```

---

## 🔍 التحقق من البيانات

### في قاعدة البيانات

```sql
-- التحقق من Capabilities
SELECT 
  u.email,
  u.first_name,
  b.name_ar,
  c.role,
  c.status,
  c.trust_level
FROM user_business_capabilities c
JOIN "User" u ON u.id = c.user_id
JOIN "Business" b ON b.id = c.business_id;

-- التحقق من ownerStatus
SELECT 
  name_ar, 
  owner_status, 
  owner_id 
FROM "Business";

-- التحقق من الدعوات
SELECT 
  b.name_ar,
  i.phone,
  i.status,
  i.claim_token,
  i.expires_at
FROM business_ownership_invitations i
JOIN "Business" b ON b.id = i.business_id;
```

---

## 🐛 حل المشاكل الشائعة

### مشكلة: Migration فشل

```bash
# حل: تأكد من أن قاعدة البيانات شغالة
netstat -ano | findstr :5434

# إذا لم تكن شغالة
docker-compose restart postgres
```

### مشكلة: Prisma Client قديم

```bash
cd packages\database
pnpm prisma generate
```

### مشكلة: TypeScript Errors في Frontend

```bash
# تأكد من تحديث types
cd apps\web
npm run type-check
```

### مشكلة: JWT لا يحتوي على hasBusinessAccess

```bash
# الحل: أعد تسجيل الدخول لتحديث التوكن
# أو
# تحقق من auth.service.ts - generateTokens()
# JWT يجب أن يحتوي على: { "hasBusinessAccess": true }
```

---

## 📊 مؤشرات النجاح

✅ Migration تم تطبيقه بنجاح  
✅ Backend API يعمل على المنفذ 3000  
✅ Frontend Apps تعمل (3002, 3003)  
✅ يمكن ربط المالك الموجود  
✅ يمكن إرسال دعوات للمالكين الجدد  
✅ Dashboard يعرض قسم النشاط للمالكين فقط  
✅ JWT يحتوي على hasBusinessAccess flag (محسّن للأداء)  

---

## 📝 ملاحظات مهمة

1. **UserRole.BUSINESS تم إزالته** - الآن USER فقط
2. **Business.ownerStatus** حقل جديد (unclaimed/claimed/verified)
3. **JWT Payload** يحتوي على `hasBusinessAccess` flag (خفيف ومحسّن)
4. **tokenVersion** يزداد عند تعديل capabilities
5. **Capabilities الكاملة** تُجلب من `GET /capabilities/my-capabilities`
5. **Migration Script** يحول البيانات القديمة تلقائياً

---

## 🎯 الخطوة التالية

بعد التطبيق الناجح:

1. اختبر كل السيناريوهات
2. راجع [CAPABILITIES_SYSTEM.md](./CAPABILITIES_SYSTEM.md) للتفاصيل الكاملة
3. استخدم [CAPABILITIES_QUICK_REF.md](./CAPABILITIES_QUICK_REF.md) كمرجع سريع
4. أضف unit tests للـ capabilities service
5. وثّق أي حالات خاصة بمشروعك
