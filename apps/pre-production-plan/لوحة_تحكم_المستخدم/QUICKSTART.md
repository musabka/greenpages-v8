# 🚀 دليل البدء السريع - لوحة تحكم المستخدم

## 🎯 نظرة سريعة

لوحة تحكم احترافية موحدة للمستخدمين العاديين وأصحاب الأنشطة التجارية.

---

## ⚡ البدء السريع

### 1. Backend Setup

الـ Backend جاهز ويعمل! ✅

```bash
# لا حاجة لإعداد إضافي - الـ API جاهزة
```

**Endpoints الجديدة:**
- `GET /user/dashboard/summary` - كل بيانات لوحة التحكم
- `GET /user/accounting/invoices` - فواتير المستخدم
- `GET /user/dashboard/local-offers` - عروض محلية

### 2. Frontend Usage

**استخدام الصفحة الجديدة:**

```tsx
// apps/web/src/app/dashboard/page.tsx

// الخيار 1: استبدال بالملف الجديد
// احذف page.tsx القديم
// أعد تسمية page-new.tsx إلى page.tsx

// الخيار 2: الاختبار جنباً إلى جنب
// افتح: http://localhost:3002/dashboard/page-new
```

**الاستخدام في Component:**

```tsx
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

function MyComponent() {
  const { data, isLoading } = useQuery({
    queryKey: ['user-dashboard-summary'],
    queryFn: async () => {
      const response = await api.get('/user/dashboard/summary');
      return response.data;
    },
  });

  return (
    <div>
      <h1>مرحباً، {data?.user?.firstName}</h1>
      <p>الرصيد: {data?.wallet?.balance}</p>
    </div>
  );
}
```

---

## 📁 هيكل الملفات

```
Backend:
apps/api/src/modules/
├── users/
│   ├── user-dashboard.service.ts       ✅
│   ├── user-dashboard.controller.ts    ✅
│   └── users.module.ts                 ✅
└── accounting/
    ├── accounting-user.controller.ts   ✅
    └── accounting.module.ts            ✅

Frontend:
apps/web/src/app/dashboard/
├── page-new.tsx                        ✅
├── components/
│   ├── WalletCard.tsx                  ✅
│   ├── BusinessStatsCard.tsx           ✅
│   ├── ReviewsCard.tsx                 ✅
│   ├── LocalOffersCard.tsx             ✅
│   ├── QuickActions.tsx                ✅
│   └── AlertsCard.tsx                  ✅
└── wallet/
    └── page-new.tsx                    ✅
```

---

## 🔧 API Examples

### Dashboard Summary
```typescript
GET /user/dashboard/summary

Response:
{
  user: {
    firstName: "أحمد",
    governorate: { nameAr: "دمشق" }
  },
  wallet: {
    balance: 50000,
    status: "ACTIVE"
  },
  businessCapabilities: [...],
  reviews: {
    count: 10,
    averageRating: 4.5
  }
}
```

### Invoices List
```typescript
GET /user/accounting/invoices?status=ISSUED

Response:
{
  data: [
    {
      id: "uuid",
      invoiceNumber: "INV-2026-001",
      total: 25000,
      status: "ISSUED"
    }
  ]
}
```

### Pay Invoice
```typescript
POST /user/accounting/invoices/:id/pay

Response:
{
  invoice: {...},
  payment: {...},
  newBalance: 25000
}
```

---

## 🎨 Components Usage

### WalletCard
```tsx
import { WalletCard } from './components/WalletCard';

<WalletCard wallet={data?.wallet} />
```

### BusinessStatsCard
```tsx
import { BusinessStatsCard } from './components/BusinessStatsCard';

<BusinessStatsCard capabilities={data?.businessCapabilities} />
```

### LocalOffersCard
```tsx
import { LocalOffersCard } from './components/LocalOffersCard';

<LocalOffersCard governorate={data?.user?.governorate} />
```

---

## 🔐 Authentication

جميع الـ endpoints محمية بـ JWT:

```typescript
// تأكد من وجود token في headers
const response = await api.get('/user/dashboard/summary');
// api.ts يتعامل مع JWT automatically
```

---

## 🐛 Troubleshooting

### Problem: لا تظهر البيانات

**الحل:**
```typescript
// تحقق من:
1. المستخدم مسجل دخول ✅
2. Token صالح ✅
3. API server يعمل على http://localhost:4000 ✅
4. Network tab في DevTools للأخطاء
```

### Problem: Error 403 Forbidden

**الحل:**
```typescript
// تأكد من:
1. المستخدم لديه role صحيح (USER/BUSINESS)
2. Token غير منتهي
3. Refresh token إذا لزم الأمر
```

---

## 📚 المزيد من التوثيق

- **التوثيق الكامل:** [user-dashboard.md](./user-dashboard.md)
- **الملخص:** [SUMMARY.md](./SUMMARY.md)
- **خطة التطوير:** [تطوير_لوحة_تحكم_المستخدم.md](./تطوير_لوحة_تحكم_المستخدم.md)

---

## 🤝 المساهمة

عند إضافة ميزات جديدة:

1. أضف endpoint في `user-dashboard.service.ts`
2. أضف route في `user-dashboard.controller.ts`
3. أنشئ component في `dashboard/components/`
4. استخدمه في `page.tsx`
5. وثّق في `user-dashboard.md`

---

## ✅ Checklist للتطوير

```
Backend:
[x] Services
[x] Controllers
[x] DTOs
[x] Guards
[ ] Tests

Frontend:
[x] Main page
[x] Components
[x] Wallet page
[ ] Invoices pages
[ ] Business pages
[ ] Reviews pages

Testing:
[ ] Unit tests
[ ] Integration tests
[ ] E2E tests
[ ] Performance tests
```

---

**آخر تحديث:** 7 يناير 2026  
**الحالة:** ✅ جاهز للاستخدام والتطوير
