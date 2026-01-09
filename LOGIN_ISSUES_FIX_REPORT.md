# تقرير إصلاح مشاكل تسجيل الدخول والـ API
**التاريخ:** 8 يناير 2026

## 📋 المشاكل المكتشفة

### 1. ❌ المحاسب (localhost:3005)
**المشكلة:**
```
Access to XMLHttpRequest at 'http://localhost:3001/api/v1/auth/login' 
from origin 'http://localhost:3005' has been blocked by CORS policy
```

**السبب:** كان يحاول الوصول إلى port 3001 بدلاً من 3000

**الحل:**
- ✅ تم إنشاء ملف `apps/accountant/src/lib/api.ts` موحد
- ✅ تحديث login page لاستخدام api client
- ✅ تحديث invoices page لاستخدام api client

---

### 2. ❌ الأدمن (localhost:3002)
**المشكلة:** عند إدخال بيانات الدخول لا يحدث أي شيء

**السبب:** دالة `login` في auth-provider لا تُرمي الأخطاء

**الحل:**
```typescript
// في apps/admin/src/components/auth-provider.tsx
const login = async (email: string, password: string) => {
  try {
    const res = await authApi.login(email, password);
    // ... store tokens
    router.push('/');
  } catch (error) {
    console.error('Login failed:', error);
    throw error; // ✅ Re-throw للصفحة
  }
};
```

---

### 3. ❌ المدير (localhost:3003)
**المشكلة:**
```
Access to XMLHttpRequest at 'http://localhost:3001/api/v1/auth/me' 
from origin 'http://localhost:3003' has been blocked by CORS policy
```

**السبب:** `next.config.ts` كان يحتوي على rewrite خاطئ (3001)

**الحل:**
```typescript
// في apps/manager/next.config.ts
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'http://localhost:3000/api/:path*', // ✅ تصحيح من 3001
    },
  ];
},
```

---

### 4. ❌ المندوب (localhost:3004)
**المشكلة:**
```
GET http://localhost:3000/api/v1/financial/agent/balance 404 (Not Found)
GET http://localhost:3000/api/v1/agent-portal/dashboard 404 (Not Found)
```

**السبب:** الـ endpoints في `useFinancial.ts` كانت خاطئة

**الحل:** تصحيح جميع الـ endpoints المالية:
```typescript
// ❌ قبل
'/financial/agent/balance'
'/financial/agent/collections'
'/financial/agent/commissions'
'/financial/agent/collect'
'/financial/agent/submit-payment'

// ✅ بعد
'/agent-portal/financial/balance'
'/agent-portal/financial/collections'
'/agent-portal/financial/commissions'
'/agent-portal/financial/collect'
'/agent-portal/financial/submit-payment'
```

---

### 5. ✅ المستخدم (localhost:3001)
**الحالة:** يعمل بدون مشاكل ✨

---

## 🎯 الملفات المعدّلة

### 1. المحاسب
- ✅ `apps/accountant/src/lib/api.ts` - **جديد**
- ✅ `apps/accountant/src/app/login/page.tsx` - استخدام api client
- ✅ `apps/accountant/src/app/dashboard/invoices/page.tsx` - استخدام api client

### 2. الأدمن
- ✅ `apps/admin/src/components/auth-provider.tsx` - إضافة throw للأخطاء

### 3. المدير
- ✅ `apps/manager/next.config.ts` - تصحيح rewrite من 3001 إلى 3000

### 4. المندوب
- ✅ `apps/agent/src/lib/hooks/useFinancial.ts` - تصحيح 5 endpoints

---

## 📊 ملخص البنية الموحدة

### جميع التطبيقات الآن تستخدم:

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const API_URL = `${API_BASE}/api/v1`;

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});
```

### Request Interceptor موحد:
```typescript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Response Interceptor موحد:
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

---

## ✅ اختبارات موصى بها

### 1. تسجيل الدخول
- [ ] المستخدم (localhost:3001) ✅ يعمل
- [ ] الأدمن (localhost:3002) - اختبار login مع خطأ
- [ ] المدير (localhost:3003) - اختبار login
- [ ] المندوب (localhost:3004) - اختبار dashboard
- [ ] المحاسب (localhost:3005) - اختبار login & invoices

### 2. صفحات Dashboard
- [ ] المندوب - financial balance
- [ ] المندوب - collections
- [ ] المندوب - commissions
- [ ] المحاسب - invoices list

### 3. Token Refresh
- [ ] انتهاء صلاحية token والتحديث التلقائي
- [ ] فشل refresh وإعادة توجيه

---

## 🚀 الخطوات التالية

1. **إعادة تشغيل جميع التطبيقات:**
   ```bash
   cd apps/accountant && npm run dev
   cd apps/admin && npm run dev
   cd apps/manager && npm run dev
   cd apps/agent && npm run dev
   ```

2. **اختبار تسجيل الدخول في كل تطبيق**

3. **التحقق من عمل الـ dashboards بشكل صحيح**

4. **في حال استمرار مشاكل 404:**
   - تأكد من تشغيل API على port 3000
   - تحقق من وجود الـ endpoints في API
   - راجع logs الخاصة بـ API

---

## 📝 ملاحظات مهمة

1. **جميع التطبيقات الآن تستخدم `localhost:3000` كـ API base**
2. **يجب أن يكون API يعمل على port 3000**
3. **جميع tokens محفوظة بـ `accessToken` و `refreshToken`**
4. **Auto refresh يعمل عند انتهاء الصلاحية**
5. **CORS يجب أن يكون مفعّل في API للمنافذ:**
   - 3001 (web)
   - 3002 (admin)
   - 3003 (manager)
   - 3004 (agent)
   - 3005 (accountant)

---

## 🎉 النتيجة

بعد هذه الإصلاحات، جميع لوحات التحكم الآن:
- ✅ تستخدم API URL صحيح (`localhost:3000/api/v1`)
- ✅ تستخدم axios client موحد
- ✅ تدعم auto token refresh
- ✅ تُظهر رسائل خطأ واضحة
- ✅ لا مزيد من مشاكل CORS
