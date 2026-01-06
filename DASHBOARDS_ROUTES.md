# 📍 مسارات لوحات التحكم - الصفحات الخضراء v8

**آخر تحديث:** 4 يناير 2026

---

## 🗺️ نظرة عامة

يحتوي المشروع على **6 لوحات تحكم** موزعة على **4 تطبيقات**:

| الدور | المسار | التطبيق | Port | الحالة |
|------|--------|---------|------|--------|
| **ADMIN** | `http://localhost:3001` | `apps/admin` | 3001 | ✅ محسّنة |
| **SUPERVISOR** | `http://localhost:3001` | `apps/admin` | 3001 | ✅ نفس لوحة ADMIN |
| **GOVERNORATE_MANAGER** | `http://localhost:3003` | `apps/manager` | 3003 | ✅ منفذة بالكامل |
| **AGENT** | `http://localhost:3004` | `apps/agent` | 3004 | ✅ منفذة بالكامل |
| **BUSINESS** | `http://localhost:3002/business/dashboard` | `apps/web` | 3002 | ✅ مبسطة |
| **USER** | `http://localhost:3002/dashboard` | `apps/web` | 3002 | ✅ مبسطة |

---

## 1️⃣ Admin Dashboard (`apps/admin`)

### مسار الوصول
```
http://localhost:3001
```

### الصلاحيات المطلوبة
- `ADMIN`
- `SUPERVISOR` (نفس الصلاحيات)

### الملفات
```
apps/admin/src/app/(dashboard)/page.tsx
apps/admin/src/lib/api.ts
apps/admin/src/components/dashboard/
```

### API Endpoints
```typescript
GET /admin/stats                    // إحصائيات عامة
GET /admin/recent-activity          // نشاطات حديثة (مع فلتر period)
GET /admin/pending-approvals        // موافقات معلقة
```

### المميزات الحالية ✅
- ✅ **فلتر زمني:** Day / Week / Month
- ✅ **Stat Cards:** Total Businesses, Total Users, Active Packages, Revenue
- ✅ **Views Card:** معطلة (cursor-default، بدون href)
- ✅ **Packages CTA:** زر واضح لإدارة الباقات المنتهية
- ✅ **Recent Activity List:** قائمة بآخر النشاطات
- ✅ **Pending Approvals:** عدد الموافقات المعلقة
- ✅ **TanStack Query:** مع skeletons + error/retry
- ✅ **Charts (Recharts):** Area Chart + Bar Chart للإحصائيات
- ✅ **Real-time Notifications:** إشعارات فورية كل 30 ثانية + Browser Notifications
- ✅ **Export Data:** تصدير لـ CSV و PDF

### التحسينات المستقبلية (اختياري)
- إضافة more chart types (Line, Pie)
- Push notifications عبر WebSockets
- Advanced filters للتقارير
- Dashboard widgets customization

---

## 2️⃣ Governorate Manager Dashboard (`apps/manager`)

### مسار الوصول
```
http://localhost:3003
```

### الصلاحيات المطلوبة
- `GOVERNORATE_MANAGER`

### الملفات
```
apps/manager/src/app/dashboard/page.tsx
apps/manager/src/lib/api.ts
```

### API Endpoints
```typescript
GET /governorate-manager/dashboard  // جميع إحصائيات المدير
```

### المميزات الحالية ✅
- ✅ **Governorates Banner:** عدد المحافظات المسؤول عنها
- ✅ **Stats Grid:** 5 بطاقات (Total Businesses, Pending, Approved, Active Agents, Total Visits)
- ✅ **Recent Businesses List:** مع status badges (pending/approved/rejected)
- ✅ **Status Badges:** من Shared utility `apps/shared/status-badge.ts`
- ✅ **TanStack Query:** مع skeletons + error/retry

### التحسينات المستقبلية (اختياري)
- فلتر حسب المحافظة
- تصدير تقارير
- إضافة quick actions (موافقة سريعة)

---

## 3️⃣ Agent Dashboard (`apps/agent`)

### مسار الوصول
```
http://localhost:3004
```

### الصلاحيات المطلوبة
- `AGENT`

### الملفات
```
apps/agent/src/app/dashboard/page.tsx
apps/agent/src/lib/api.ts
```

### API Endpoints
```typescript
GET /agent-portal/dashboard         // جميع بيانات dashboard المندوب
```

### المميزات الحالية ✅
- ✅ **Today Schedule Widget:** قائمة الزيارات المجدولة لليوم
- ✅ **Visit Cards:** لكل زيارة مع زر "بدء الزيارة"
- ✅ **Status Badges:** من Shared utility
- ✅ **Stats Grid:** Total Visits, Completed Today, Pending, Assigned
- ✅ **Renewals Section:** عمليات التجديد المطلوبة
- ✅ **Commissions Section:** العمولات المكتسبة
- ✅ **TanStack Query:** مع skeletons + error/retry
- ✅ **No Mock Data:** جميع البيانات من API

### التحسينات المستقبلية
- 🗺️ خريطة تفاعلية للزيارات
- 📍 تحسين المسار (Route Optimization)
- 📱 وضع Offline (Progressive Web App)
- 📸 رفع صور الزيارة
- ✍️ توقيع إلكتروني

---

## 4️⃣ Business Owner Dashboard (`apps/web`)

### مسار الوصول
```
http://localhost:3002/business/dashboard
```

### الصلاحيات المطلوبة
- دور `BUSINESS_OWNER`
- يجب أن يكون لديه نشاط مرتبط

### الملفات
```
apps/web/src/app/business/dashboard/page.tsx
apps/web/src/lib/api.ts
```

### API Endpoints
```typescript
GET /businesses/me/stats            // إحصائيات النشاط
GET /businesses/me/subscription     // حالة الاشتراك
```

### المميزات الحالية ✅
- ✅ **Views Stats:** viewsToday + viewsTotal
- ✅ **Subscription Card:**
  - اسم الباقة
  - الحالة (active/expiring/expired)
  - الأيام المتبقية
  - CTA للتجديد/الترقية
- ✅ **TanStack Query:** مع skeletons + error/retry
- ✅ **Simple & Clean:** تصميم بسيط غير معقد

### التحسينات المستقبلية (اختياري)
- Charts للمشاهدات (weekly/monthly trends)
- تفاصيل click sources (phone/whatsapp/website/directions)
- إدارة المنتجات/الخدمات
- الرد على التقييمات مباشرة
- Analytics متقدمة (demographics, peak hours)

---

## 5️⃣ User Dashboard (`apps/web`)

### مسار الوصول
```
http://localhost:3002/dashboard
```

### الصلاحيات المطلوبة
- دور `USER` (مستخدم عادي)

### الملفات
```
apps/web/src/app/dashboard/page.tsx
apps/web/src/lib/api.ts
```

### API Endpoints
```typescript
GET /me/reviews                     // مراجعات المستخدم
```

### المميزات الحالية ✅
- ✅ **Reviews Stats:** عدد المراجعات + متوسط التقييم
- ✅ **Reviews List:** قائمة بجميع المراجعات مع:
  - اسم النشاط
  - التقييم (نجوم)
  - التعليق
  - التاريخ
  - الحالة (APPROVED/PENDING/REJECTED)
- ✅ **Status Pills:** ألوان مختلفة حسب الحالة
- ✅ **TanStack Query:** مع skeletons + error/retry

### التحسينات المستقبلية (اختياري)
- تعديل/حذف المراجعة
- الأنشطة المفضلة (Favorites)
- سجل عمليات البحث
- Notifications للمستخدم

---

## 6️⃣ Public Web (`apps/web`)

### مسار الوصول
```
http://localhost:3002
```

### الصفحات العامة
```
/                       # الصفحة الرئيسية
/about                  # عن الموقع
/contact                # تواصل معنا
/auth/login             # تسجيل الدخول
/auth/register          # إنشاء حساب
/business/:slug         # صفحة النشاط
/category/:slug         # صفحة التصنيف
/governorate/:slug      # صفحة المحافظة
/city/:slug             # صفحة المدينة
/district/:slug         # صفحة المنطقة
/search                 # البحث
```

---

## 🔄 تدفق التوجيه (Routing Flow)

### بعد تسجيل الدخول

```typescript
// في middleware.ts أو auth callback

if (user.role === 'ADMIN' || user.role === 'SUPERVISOR') {
  redirect('http://localhost:3001') // Admin app
}

if (user.role === 'GOVERNORATE_MANAGER') {
  redirect('http://localhost:3003') // Manager app
}

if (user.role === 'AGENT') {
  redirect('http://localhost:3004') // Agent app
}

if (user.role === 'BUSINESS_OWNER') {
  redirect('http://localhost:3002/business/dashboard') // Web app
}

if (user.role === 'USER') {
  redirect('http://localhost:3002/dashboard') // Web app
}
```

---

## 🛠️ Shared Utilities

### Status Badges
```typescript
// apps/shared/status-badge.ts

import { statusBadgeMap, getStatusBadge } from '../../../shared/status-badge';

// استخدام:
const badge = getStatusBadge('pending'); // { bg, text, label }

// في JSX:
<div className={`px-2 py-1 rounded-full text-sm ${badge.bg} ${badge.text}`}>
  {badge.label}
</div>
```

### TanStack Query Setup
```typescript
// في كل dashboard:

const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['dashboard-data'],
  queryFn: () => api.getDashboard(),
  retry: 2,
  staleTime: 60000, // 1 minute
  refetchOnWindowFocus: true,
});

// Loading state:
{isLoading && <SkeletonCards />}

// Error state:
{error && (
  <div className="error">
    <p>حدث خطأ في تحميل البيانات</p>
    <button onClick={() => refetch()}>إعادة المحاولة</button>
  </div>
)}
```

---

## 🧪 الاختبار (Testing)

### اختبار Admin Dashboard
```bash
# 1. تسجيل دخول كـ ADMIN
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# 2. فتح المتصفح
http://localhost:3001
```

### اختبار Manager Dashboard
```bash
# 1. تسجيل دخول كـ GOVERNORATE_MANAGER
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@example.com","password":"password"}'

# 2. فتح المتصفح
http://localhost:3003
```

### اختبار Agent Dashboard
```bash
# 1. تسجيل دخول كـ AGENT
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"agent@example.com","password":"password"}'

# 2. فتح المتصفح
http://localhost:3004
```

### اختبار Business Dashboard
```bash
# 1. تسجيل دخول كـ BUSINESS_OWNER
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"business@example.com","password":"password"}'

# 2. فتح المتصفح
http://localhost:3002/business/dashboard
```

### اختبار User Dashboard
```bash
# 1. تسجيل دخول كـ USER
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# 2. فتح المتصفح
http://localhost:3002/dashboard
```

---

## 📊 ملخص تقني

| التطبيق | Framework | Port | Auth | State Management |
|---------|-----------|------|------|------------------|
| `admin` | Next.js 14 | 3001 | NextAuth | TanStack Query |
| `manager` | Next.js 14 | 3003 | NextAuth | TanStack Query |
| `agent` | Next.js 14 | 3004 | NextAuth | TanStack Query |
| `web` | Next.js 14 | 3002 | NextAuth | TanStack Query |
| `api` | NestJS | 3000 | JWT | - |

---

## 🎯 المرجع السريع

### تشغيل جميع التطبيقات
```bash
# من الجذر
pnpm dev

# أو منفصل
pnpm --filter admin dev     # Port 3001
pnpm --filter web dev       # Port 3002
pnpm --filter manager dev   # Port 3003
pnpm --filter agent dev     # Port 3004
pnpm --filter api dev       # Port 3000
```

### بناء التطبيقات
```bash
pnpm build                  # جميع التطبيقات
pnpm --filter admin build
pnpm --filter web build
pnpm --filter manager build
pnpm --filter agent build
pnpm --filter api build
```

---

**آخر تحديث:** 4 يناير 2026  
**الحالة:** جميع Dashboards مكتملة ✅  
**الخطوة التالية:** P0 Tasks (Payment, Security, Logging)
