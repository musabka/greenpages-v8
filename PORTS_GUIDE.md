# 🔌 دليل البورتات - GreenPages v8

## ⚠️ مهم جداً: البورتات الصحيحة

### 📋 جدول البورتات

| التطبيق | البورت | الرابط | الوصف |
|---------|--------|--------|-------|
| **Admin Panel** | `3001` | http://localhost:3001 | لوحة التحكم الإدارية |
| **Public Website** | `3002` | http://localhost:3002 | الموقع العام |
| **Backend API** | `3000` | http://localhost:3000 | NestJS API |
| **PostgreSQL** | `5432` | localhost:5432 | قاعدة البيانات |
| **Redis** | `6379` | localhost:6379 | Redis Cache |

---

## 🔐 صفحات تسجيل الدخول

### 1. لوحة الإدارة (Admin Panel)
```
البورت: 3001
الرابط: http://localhost:3001/login
المستخدمون: SUPER_ADMIN, ADMIN, MODERATOR, AGENT
```

### 2. لوحة صاحب النشاط (Business Dashboard)
```
البورت: 3002
الرابط: http://localhost:3002/business/login
المستخدمون: BUSINESS
```

### 3. الموقع العام (Public Website)
```
البورت: 3002
الرابط: http://localhost:3002
المستخدمون: USER (عام)
```

---

## 🚀 كيفية تشغيل التطبيقات

### تشغيل Admin Panel (البورت 3001):
```bash
cd apps/admin
pnpm dev
# سيعمل على: http://localhost:3001
```

### تشغيل Public Website (البورت 3002):
```bash
cd apps/web
pnpm dev
# سيعمل على: http://localhost:3002
```

### تشغيل Backend API (البورت 3000):
```bash
cd apps/api
pnpm start:dev
# سيعمل على: http://localhost:3000
```

### تشغيل الكل معاً (من الجذر):
```bash
pnpm dev
# سيشغل جميع التطبيقات
```

---

## ✅ تحقق من البورتات

### للتأكد من البورتات المستخدمة:

**Windows PowerShell:**
```powershell
# التحقق من البورت 3000 (API)
netstat -ano | findstr :3000

# التحقق من البورت 3001 (Admin)
netstat -ano | findstr :3001

# التحقق من البورت 3002 (Web)
netstat -ano | findstr :3002
```

**Linux/Mac:**
```bash
# التحقق من البورت 3000 (API)
lsof -i :3000

# التحقق من البورت 3001 (Admin)
lsof -i :3001

# التحقق من البورت 3002 (Web)
lsof -i :3002
```

---

## 🐛 حل المشاكل الشائعة

### خطأ 404 عند فتح `/business/login`

**المشكلة:** فتح http://localhost:3001/business/login
**السبب:** البورت الخطأ! (3001 هو Admin)
**الحل:** استخدم http://localhost:3002/business/login

### خطأ "Port already in use"

**الحل:**
```powershell
# Windows - إيقاف العملية على البورت 3001
netstat -ano | findstr :3001
# ثم
taskkill /PID <PID_NUMBER> /F

# أو أعد تشغيل الجهاز
```

### لا يعمل أي تطبيق

**الحل:**
```bash
# 1. تأكد من تشغيل Backend
cd apps/api
pnpm start:dev

# 2. تأكد من تشغيل Database
docker-compose up -d

# 3. ثم شغل Frontend
cd apps/web
pnpm dev
```

---

## 📝 ملاحظات مهمة

1. **Admin Panel** (البورت 3001) و **Public Website** (البورت 3002) تطبيقان منفصلان
2. لوحة تحكم صاحب النشاط موجودة في **Public Website** وليس Admin Panel
3. جميع التطبيقات تتصل بنفس Backend API على البورت 3000
4. لا تنسى تشغيل Backend قبل تشغيل Frontend

---

## 🔗 روابط سريعة

### Development:
- Admin Panel: http://localhost:3001
- Public Website: http://localhost:3002
- Business Login: http://localhost:3002/business/login
- API Docs: http://localhost:3000/api
- API Health: http://localhost:3000/health

### Production (Example):
- Admin Panel: https://admin.greenpages.sy
- Public Website: https://greenpages.sy
- Business Login: https://greenpages.sy/business/login
- API: https://api.greenpages.sy

---

**تاريخ التحديث:** 4 يناير 2026
