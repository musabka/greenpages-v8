# تقرير توحيد API في جميع لوحات التحكم
**التاريخ:** 8 يناير 2026

## 📋 المشاكل التي تم حلها

### 1. مشاكل CORS والاتصال بـ API
- **المشكلة:** بعض التطبيقات كانت تحاول الوصول إلى منافذ خاطئة (3001 بدلاً من 3000)
- **الحل:** توحيد جميع baseURL إلى `http://localhost:3000/api/v1`

### 2. عدم توحيد طريقة التعامل مع API
- **المشكلة:** بعض التطبيقات تستخدم `fetch` مباشرة والبعض يستخدم `axios`
- **الحل:** توحيد جميع التطبيقات لاستخدام axios مع interceptors موحدة

### 3. أسماء tokens مختلفة في localStorage
- **المشكلة:** بعض التطبيقات تستخدم `token` والبعض `accessToken`
- **الحل:** توحيد الاستخدام على `accessToken` و `refreshToken`

### 4. مشكلة تنزيل PDF في واجهة المستخدم
- **المشكلة:** endpoint `/user/accounting/invoices/${invoiceId}/pdf` يعطي خطأ 400
- **الحل:** استخدام بيانات الفاتورة مباشرة بدلاً من استدعاء endpoint منفصل

## 🔧 التغييرات المنفذة

### 1. إنشاء `api.ts` موحد للمحاسب
**الملف:** `apps/accountant/src/lib/api.ts`

```typescript
- إنشاء axios client موحد
- baseURL: ${API_BASE}/api/v1
- Request interceptor لإضافة token
- Response interceptor لتحديث token تلقائياً
- دعم كل من token و accessToken للتوافق مع الخلف
```

### 2. تحديث صفحة تسجيل دخول المحاسب
**الملف:** `apps/accountant/src/app/login/page.tsx`

**التغييرات:**
- استخدام `api.post()` بدلاً من `fetch()`
- توحيد تخزين tokens: `accessToken` و `refreshToken`
- تحسين معالجة الأخطاء

### 3. تحديث صفحة فواتير المحاسب
**الملف:** `apps/accountant/src/app/dashboard/invoices/page.tsx`

**التغييرات:**
- استبدال `fetch()` بـ `api.get()`
- إزالة الحاجة لإضافة token يدوياً (يتم تلقائياً)
- تبسيط الكود

### 4. إصلاح تنزيل PDF في واجهة المستخدم
**الملف:** `apps/web/src/app/dashboard/invoices/page.tsx`

**التغييرات:**
```typescript
// قبل
const response = await api.get(`/user/accounting/invoices/${invoiceId}/pdf`);
const invoiceData = response.data.invoice;

// بعد
const invoiceData = invoice; // استخدام البيانات مباشرة
```

### 5. توحيد Admin API
**الملف:** `apps/admin/src/lib/api.ts`

**التغييرات:**
- إزالة دعم أسماء tokens القديمة (`access_token`, `refresh_token`)
- توحيد على `accessToken` و `refreshToken` فقط
- تحسين منطق refresh token

## 📊 البنية الموحدة لجميع التطبيقات

### Structure
```
apps/
├── web/src/lib/api.ts          ✅ موحد
├── agent/src/lib/api.ts        ✅ موحد
├── admin/src/lib/api.ts        ✅ موحد
├── manager/src/lib/api.ts      ✅ موحد
└── accountant/src/lib/api.ts   ✅ جديد - موحد
```

### Configuration
```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const API_URL = `${API_BASE}/api/v1`;

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});
```

### Request Interceptor
```typescript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Response Interceptor
```typescript
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Auto token refresh
      const refreshToken = localStorage.getItem('refreshToken');
      const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
      // Update token and retry
    }
    return Promise.reject(error);
  }
);
```

## 🎯 معايير الاستخدام الموحدة

### 1. تخزين Tokens
```typescript
// ✅ صحيح
localStorage.setItem('accessToken', data.accessToken);
localStorage.setItem('refreshToken', data.refreshToken);

// ❌ خطأ
localStorage.setItem('token', data.token);
localStorage.setItem('access_token', data.accessToken);
```

### 2. استدعاء API
```typescript
// ✅ صحيح
import { api } from '@/lib/api';
const response = await api.get('/endpoint');

// ❌ خطأ
const response = await fetch(`${baseUrl}/api/v1/endpoint`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### 3. معالجة الأخطاء
```typescript
try {
  const response = await api.get('/endpoint');
  // handle success
} catch (error: any) {
  const message = error.response?.data?.message || error.message;
  // handle error
}
```

## ✅ اختبارات موصى بها

### 1. تسجيل الدخول
- [ ] تسجيل دخول المستخدم (web)
- [ ] تسجيل دخول المندوب (agent)
- [ ] تسجيل دخول الإداري (admin)
- [ ] تسجيل دخول المدير (manager)
- [ ] تسجيل دخول المحاسب (accountant)

### 2. Token Refresh
- [ ] انتهاء صلاحية token والتحديث التلقائي
- [ ] فشل refresh وإعادة توجيه لتسجيل الدخول

### 3. API Calls
- [ ] جلب البيانات من endpoints مختلفة
- [ ] إرسال بيانات POST/PUT/DELETE
- [ ] معالجة الأخطاء (404, 500, etc.)

### 4. PDF Download
- [ ] تنزيل فاتورة من واجهة المستخدم
- [ ] تنزيل فاتورة من لوحة المندوب
- [ ] تنزيل فاتورة من لوحة المحاسب

## 🚀 الفوائد

1. **كود موحد ومنظم:** جميع التطبيقات تستخدم نفس البنية
2. **سهولة الصيانة:** تحديث واحد يطبق على الجميع
3. **تقليل الأخطاء:** لا مزيد من مشاكل CORS أو endpoints خاطئة
4. **تجربة مستخدم أفضل:** معالجة أخطاء موحدة وrefresh تلقائي
5. **أمان محسّن:** إدارة موحدة للتوكنات

## 📝 ملاحظات

- جميع التطبيقات الآن تستخدم `localhost:3000/api/v1` كـ baseURL افتراضي
- يمكن تغيير الـ baseURL عبر متغير البيئة `NEXT_PUBLIC_API_URL`
- Token refresh يحدث تلقائياً عند انتهاء الصلاحية
- جميع requests تحتوي على timeout 30 ثانية لتجنب التعليق

## 🔄 التحديثات المستقبلية الموصى بها

1. إضافة retry logic للطلبات الفاشلة
2. إضافة request queuing عند فشل الاتصال
3. إضافة offline detection
4. تحسين error messages ليكون أكثر وضوحاً للمستخدم
5. إضافة logging مركزي لتتبع API calls
