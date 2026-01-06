# 📢 خطة تطوير نظام الإشعارات المتكامل - GreenPages

> **تاريخ الإنشاء:** 4 يناير 2026
> **حالة المشروع:** قيد التنفيذ

---

## 📋 جدول المحتويات

1. [نظرة عامة](#-نظرة-عامة)
2. [تحليل المتطلبات](#-تحليل-المتطلبات)
3. [هيكل قاعدة البيانات](#-هيكل-قاعدة-البيانات)
4. [أنواع الإشعارات](#-أنواع-الإشعارات)
5. [خطة التنفيذ](#-خطة-التنفيذ)
6. [قائمة المهام](#-قائمة-المهام)

---

## 🎯 نظرة عامة

نظام إشعارات احترافي ومتكامل يغطي جميع جوانب تطبيق الصفحات الخضراء، مع دعم:
- إشعارات فورية (Real-time via WebSocket/SSE)
- إشعارات Push للموبايل (FCM/APNs)
- إشعارات بريد إلكتروني
- إشعارات SMS
- إشعارات مجدولة وتلقائية
- استهداف متقدم (جغرافي، مهني، سلوكي)

---

## 📊 تحليل المتطلبات

### 1. إشعارات المدير (SUPER_ADMIN / ADMIN)

| الفئة | الإشعار | الأولوية |
|-------|---------|----------|
| **المستخدمين** | تسجيل مستخدم جديد | منخفضة |
| | تسجيل صاحب نشاط جديد | متوسطة |
| | طلب توثيق حساب | عالية |
| **الأنشطة التجارية** | نشاط جديد بانتظار الموافقة | عالية |
| | طلب تعديل بيانات نشاط | متوسطة |
| | نشاط مُبلغ عنه | عالية |
| **المندوبين** | مندوب جديد مُضاف | متوسطة |
| | أداء المندوب (يومي/أسبوعي) | منخفضة |
| | مندوب لم يسجل نشاط منذ X أيام | متوسطة |
| **المالية** | اشتراك جديد مدفوع | عالية |
| | اشتراكات ستنتهي قريباً | متوسطة |
| | تقرير الإيرادات (أسبوعي/شهري) | منخفضة |
| **التقييمات** | تقييم سلبي جديد | عالية |
| | تقييم بانتظار المراجعة | متوسطة |
| **النظام** | أخطاء تقنية | عالية |
| | نسخ احتياطي فشل | عالية |
| | تحديثات أمنية | عالية |

### 2. إشعارات المشرف (MODERATOR)

| الفئة | الإشعار | الأولوية |
|-------|---------|----------|
| **المحافظات المسؤول عنها** | نشاط جديد في محافظتي | عالية |
| | تقييم جديد في محافظتي | متوسطة |
| | مستخدم جديد في محافظتي | منخفضة |
| **المندوبين التابعين** | مندوب تابع أكمل مهمة | منخفضة |
| | مندوب تابع لم يسجل نشاط | متوسطة |
| | تقرير أداء المندوبين التابعين | منخفضة |
| **الأنشطة** | أنشطة ستنتهي في محافظتي | عالية |
| | طلب دعم من صاحب نشاط | عالية |

### 3. إشعارات المندوب (AGENT)

| الفئة | الإشعار | الأولوية |
|-------|---------|----------|
| **المهام** | مهمة جديدة مُسندة | عالية |
| | تذكير بموعد زيارة | عالية |
| | مهمة متأخرة | عالية |
| **العملاء** | عميل يحتاج متابعة | متوسطة |
| | اشتراك عميل ينتهي قريباً | عالية |
| | عميل طلب التواصل | عالية |
| **الأداء** | ملخص الأداء اليومي | منخفضة |
| | مكافأة على إنجاز | متوسطة |
| | تحذير على تأخر | متوسطة |

### 4. إشعارات صاحب النشاط (BUSINESS)

| الفئة | الإشعار | الأولوية |
|-------|---------|----------|
| **النشاط** | تمت الموافقة على نشاطك | عالية |
| | تم رفض نشاطك (مع السبب) | عالية |
| | تم توثيق نشاطك | عالية |
| | تذكير بتحديث البيانات (كل 6 أشهر) | متوسطة |
| **الاشتراك** | اشتراكك سينتهي خلال 30 يوم | عالية |
| | اشتراكك سينتهي خلال 7 أيام | عالية |
| | اشتراكك انتهى | عالية |
| | تم تجديد اشتراكك | متوسطة |
| | عرض خاص على الترقية | منخفضة |
| **التفاعل** | تقييم جديد على نشاطك | عالية |
| | رد على تقييمك | متوسطة |
| | زيادة ملحوظة في الزيارات | منخفضة |
| | شخص حفظ نشاطك | منخفضة |
| **المندوب** | مندوب جديد تم تعيينه لك | متوسطة |
| | مندوبك سيتواصل معك | متوسطة |

### 5. إشعارات المستخدم العادي (USER)

| الفئة | الإشعار | الأولوية |
|-------|---------|----------|
| **الحساب** | مرحباً بك في الصفحات الخضراء | متوسطة |
| | تم تفعيل حسابك | عالية |
| | تذكير بإكمال الملف الشخصي | منخفضة |
| **التقييمات** | تم نشر تقييمك | متوسطة |
| | رد صاحب النشاط على تقييمك | عالية |
| | تم رفض تقييمك (مع السبب) | متوسطة |
| **المحتوى** | نشاط جديد في منطقتك | منخفضة |
| | عرض خاص في نشاط تتابعه | منخفضة |

### 6. إشعارات إعلانية مستهدفة

| نوع الاستهداف | أمثلة |
|---------------|-------|
| **جغرافي** | إشعار لسكان حي بابا عمرو بحمص |
| | إشعار لسكان مدينة حماه |
| | إشعار لسكان محافظة دمشق |
| **مهني** | إشعار لجميع الصيادلة |
| | إشعار للأطباء في دمشق |
| | إشعار للمهندسين |
| **سلوكي** | إشعار لمن بحث عن "مطاعم" |
| | إشعار لمن زار أنشطة معينة |
| **مختلط** | صيادلة + حماه + نشطين آخر أسبوع |

### 7. إشعارات تلقائية مجدولة

| الإشعار | التوقيت | المستهدف |
|---------|---------|----------|
| تذكير تجديد الاشتراك | 30، 15، 7، 3، 1 يوم قبل الانتهاء | صاحب النشاط + المندوب |
| تذكير تحديث البيانات | كل 6 أشهر من آخر تحديث | صاحب النشاط |
| ملخص الأداء اليومي | كل يوم الساعة 8 مساءً | المندوبين |
| تقرير أسبوعي | كل أحد الساعة 9 صباحاً | المدير + المشرفين |
| تنظيف الإشعارات القديمة | كل أسبوع | النظام |
| فحص الأنشطة المنتهية | كل يوم الساعة 6 صباحاً | النظام |

---

## 🗄️ هيكل قاعدة البيانات

### الجداول المطلوبة

```prisma
// ===== إضافة حقل المهنة للمستخدم =====
// في model User:
// profession    String?   @map("profession") // المهنة

// ===== أنواع الإشعارات الموسعة =====
enum NotificationType {
  // إشعارات النظام
  SYSTEM
  SECURITY
  
  // إشعارات الأعمال
  BUSINESS_PENDING
  BUSINESS_APPROVED
  BUSINESS_REJECTED
  BUSINESS_UPDATE
  BUSINESS_REPORT
  
  // إشعارات الاشتراكات
  SUBSCRIPTION_EXPIRING
  SUBSCRIPTION_EXPIRED
  SUBSCRIPTION_RENEWED
  SUBSCRIPTION_UPGRADED
  
  // إشعارات التقييمات
  REVIEW_NEW
  REVIEW_REPLY
  REVIEW_PENDING
  REVIEW_REJECTED
  
  // إشعارات المندوبين
  AGENT_TASK
  AGENT_REMINDER
  AGENT_PERFORMANCE
  
  // إشعارات التجديد
  RENEWAL_REMINDER
  RENEWAL_ASSIGNED
  RENEWAL_COMPLETED
  
  // إشعارات إعلانية
  PROMOTIONAL
  TARGETED_AD
  
  // إشعارات المستخدم
  WELCOME
  PROFILE_REMINDER
  
  // إشعارات الإعلانات
  AD_APPROVED
  AD_REJECTED
  AD_EXPIRING
}

enum NotificationPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum NotificationChannel {
  IN_APP
  PUSH
  EMAIL
  SMS
}

// ===== نموذج الإشعار المُحسّن =====
model Notification {
  id              String               @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  
  // المستلم
  userId          String               @map("user_id") @db.Uuid
  user            User                 @relation(fields: [userId], references: [id])
  
  // المحتوى
  type            NotificationType
  priority        NotificationPriority @default(MEDIUM)
  titleAr         String               @map("title_ar")
  titleEn         String?              @map("title_en")
  messageAr       String               @map("message_ar") @db.Text
  messageEn       String?              @map("message_en") @db.Text
  
  // البيانات والروابط
  data            Json?                // بيانات إضافية مرنة
  actionUrl       String?              @map("action_url") // رابط الإجراء
  imageUrl        String?              @map("image_url") // صورة الإشعار
  
  // الحالة
  isRead          Boolean              @default(false) @map("is_read")
  readAt          DateTime?            @map("read_at")
  isArchived      Boolean              @default(false) @map("is_archived")
  archivedAt      DateTime?            @map("archived_at")
  
  // قنوات الإرسال
  channels        NotificationChannel[] @default([IN_APP])
  sentViaEmail    Boolean              @default(false) @map("sent_via_email")
  sentViaPush     Boolean              @default(false) @map("sent_via_push")
  sentViaSms      Boolean              @default(false) @map("sent_via_sms")
  
  // المرسل (إن وجد)
  senderId        String?              @map("sender_id") @db.Uuid
  sender          User?                @relation("SentNotifications", fields: [senderId], references: [id])
  
  // الجدولة
  scheduledAt     DateTime?            @map("scheduled_at")
  sentAt          DateTime?            @map("sent_at")
  
  // المرجع
  referenceType   String?              @map("reference_type") // business, review, renewal, etc.
  referenceId     String?              @map("reference_id") @db.Uuid
  
  createdAt       DateTime             @default(now()) @map("created_at")
  updatedAt       DateTime             @updatedAt @map("updated_at")
  
  @@index([userId, isRead])
  @@index([userId, type])
  @@index([userId, createdAt])
  @@index([scheduledAt])
  @@index([referenceType, referenceId])
  @@map("notifications")
}

// ===== تفضيلات الإشعارات للمستخدم =====
model NotificationPreference {
  id              String               @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  userId          String               @unique @map("user_id") @db.Uuid
  user            User                 @relation(fields: [userId], references: [id])
  
  // تفعيل القنوات
  emailEnabled    Boolean              @default(true) @map("email_enabled")
  pushEnabled     Boolean              @default(true) @map("push_enabled")
  smsEnabled      Boolean              @default(false) @map("sms_enabled")
  
  // تفضيلات حسب النوع (JSON مرن)
  typePreferences Json?                @map("type_preferences")
  // مثال: { "PROMOTIONAL": false, "REVIEW_NEW": true, ... }
  
  // أوقات عدم الإزعاج
  quietHoursStart String?              @map("quiet_hours_start") // "22:00"
  quietHoursEnd   String?              @map("quiet_hours_end")   // "08:00"
  
  createdAt       DateTime             @default(now()) @map("created_at")
  updatedAt       DateTime             @updatedAt @map("updated_at")
  
  @@map("notification_preferences")
}

// ===== قوالب الإشعارات =====
model NotificationTemplate {
  id              String               @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  
  code            String               @unique // مُعرف فريد مثل: SUBSCRIPTION_EXPIRING_30
  type            NotificationType
  priority        NotificationPriority @default(MEDIUM)
  
  titleAr         String               @map("title_ar")
  titleEn         String?              @map("title_en")
  messageAr       String               @map("message_ar") @db.Text
  messageEn       String?              @map("message_en") @db.Text
  
  // قنوات الإرسال الافتراضية
  channels        NotificationChannel[] @default([IN_APP])
  
  // قالب البريد الإلكتروني (اختياري)
  emailSubjectAr  String?              @map("email_subject_ar")
  emailSubjectEn  String?              @map("email_subject_en")
  emailBodyAr     String?              @map("email_body_ar") @db.Text
  emailBodyEn     String?              @map("email_body_en") @db.Text
  
  // قالب SMS (اختياري)
  smsTemplateAr   String?              @map("sms_template_ar")
  smsTemplateEn   String?              @map("sms_template_en")
  
  isActive        Boolean              @default(true) @map("is_active")
  
  createdAt       DateTime             @default(now()) @map("created_at")
  updatedAt       DateTime             @updatedAt @map("updated_at")
  
  @@map("notification_templates")
}

// ===== الإشعارات الجماعية =====
model BulkNotification {
  id              String               @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  
  // المحتوى
  titleAr         String               @map("title_ar")
  titleEn         String?              @map("title_en")
  messageAr       String               @map("message_ar") @db.Text
  messageEn       String?              @map("message_en") @db.Text
  actionUrl       String?              @map("action_url")
  imageUrl        String?              @map("image_url")
  
  // معايير الاستهداف
  targetCriteria  Json                 @map("target_criteria")
  // مثال: { 
  //   "roles": ["USER", "BUSINESS"],
  //   "governorates": ["uuid1", "uuid2"],
  //   "cities": ["uuid1"],
  //   "districts": ["uuid1"],
  //   "professions": ["صيدلي", "طبيب"],
  //   "activeLastDays": 30
  // }
  
  // الإحصائيات
  totalRecipients Int                  @default(0) @map("total_recipients")
  sentCount       Int                  @default(0) @map("sent_count")
  readCount       Int                  @default(0) @map("read_count")
  
  // الحالة
  status          BulkNotificationStatus @default(DRAFT)
  scheduledAt     DateTime?            @map("scheduled_at")
  startedAt       DateTime?            @map("started_at")
  completedAt     DateTime?            @map("completed_at")
  
  // المُنشئ
  createdById     String               @map("created_by_id") @db.Uuid
  createdBy       User                 @relation(fields: [createdById], references: [id])
  
  createdAt       DateTime             @default(now()) @map("created_at")
  updatedAt       DateTime             @updatedAt @map("updated_at")
  
  @@index([status])
  @@index([scheduledAt])
  @@map("bulk_notifications")
}

enum BulkNotificationStatus {
  DRAFT
  SCHEDULED
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
}

// ===== أجهزة المستخدم (للـ Push) =====
model UserDevice {
  id              String               @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  userId          String               @map("user_id") @db.Uuid
  user            User                 @relation(fields: [userId], references: [id])
  
  deviceType      DeviceType
  deviceToken     String               @map("device_token") // FCM token
  deviceName      String?              @map("device_name")
  deviceModel     String?              @map("device_model")
  osVersion       String?              @map("os_version")
  appVersion      String?              @map("app_version")
  
  isActive        Boolean              @default(true) @map("is_active")
  lastActiveAt    DateTime?            @map("last_active_at")
  
  createdAt       DateTime             @default(now()) @map("created_at")
  updatedAt       DateTime             @updatedAt @map("updated_at")
  
  @@unique([userId, deviceToken])
  @@index([userId, isActive])
  @@map("user_devices")
}

enum DeviceType {
  IOS
  ANDROID
  WEB
}
```

### إضافة حقل المهنة للمستخدم

```prisma
// إضافة في model User:
profession      String?              @map("profession") // المهنة
```

### تحديث العلاقات في User

```prisma
model User {
  // ... الحقول الموجودة ...
  
  // الإشعارات
  notifications           Notification[] @relation()
  sentNotifications       Notification[] @relation("SentNotifications")
  notificationPreference  NotificationPreference?
  devices                 UserDevice[]
  bulkNotifications       BulkNotification[]
}
```

---

## 🔔 أنواع الإشعارات التفصيلية

### قوالب الإشعارات الافتراضية

```typescript
const NOTIFICATION_TEMPLATES = {
  // === إشعارات الترحيب ===
  WELCOME: {
    titleAr: 'مرحباً بك في الصفحات الخضراء! 🎉',
    messageAr: 'شكراً لانضمامك إلينا {{firstName}}. اكتشف آلاف الأنشطة التجارية حولك.',
  },
  
  // === إشعارات الاشتراك ===
  SUBSCRIPTION_EXPIRING_30: {
    titleAr: 'تنبيه: اشتراكك سينتهي قريباً',
    messageAr: 'اشتراك نشاطك "{{businessName}}" سينتهي خلال 30 يوم. جدد الآن للاستمرار.',
  },
  SUBSCRIPTION_EXPIRING_7: {
    titleAr: '⚠️ اشتراكك سينتهي خلال أسبوع',
    messageAr: 'اشتراك "{{businessName}}" سينتهي في {{expiryDate}}. لا تفقد ظهورك!',
  },
  SUBSCRIPTION_EXPIRING_1: {
    titleAr: '🚨 آخر يوم في اشتراكك!',
    messageAr: 'اشتراك "{{businessName}}" ينتهي اليوم! جدد الآن فوراً.',
  },
  SUBSCRIPTION_EXPIRED: {
    titleAr: 'انتهى اشتراكك',
    messageAr: 'اشتراك "{{businessName}}" انتهى. تم تحويلك للباقة المجانية.',
  },
  
  // === إشعارات التقييمات ===
  REVIEW_NEW: {
    titleAr: 'تقييم جديد ⭐',
    messageAr: 'حصل نشاطك "{{businessName}}" على تقييم جديد من {{reviewerName}}.',
  },
  REVIEW_REPLY: {
    titleAr: 'رد على تقييمك',
    messageAr: 'رد صاحب "{{businessName}}" على تقييمك.',
  },
  
  // === إشعارات المندوب ===
  AGENT_TASK_ASSIGNED: {
    titleAr: 'مهمة جديدة 📋',
    messageAr: 'تم تعيينك لمتابعة تجديد "{{businessName}}". انتهاء الاشتراك: {{expiryDate}}.',
  },
  AGENT_VISIT_REMINDER: {
    titleAr: 'تذكير بموعد زيارة',
    messageAr: 'لديك زيارة مجدولة لـ "{{businessName}}" اليوم.',
  },
  
  // === إشعارات النشاط التجاري ===
  BUSINESS_APPROVED: {
    titleAr: 'تهانينا! تمت الموافقة 🎉',
    messageAr: 'تمت الموافقة على نشاطك "{{businessName}}" وأصبح مرئياً للجميع.',
  },
  BUSINESS_REJECTED: {
    titleAr: 'نشاطك يحتاج تعديل',
    messageAr: 'لم تتم الموافقة على "{{businessName}}". السبب: {{reason}}',
  },
  BUSINESS_UPDATE_REMINDER: {
    titleAr: 'هل بياناتك محدّثة؟',
    messageAr: 'مر 6 أشهر على آخر تحديث لـ "{{businessName}}". راجع بياناتك للتأكد من صحتها.',
  },
};
```

---

## 📅 خطة التنفيذ

### المرحلة 1: البنية التحتية (الأساس)
**المدة المتوقعة: 2-3 أيام**

- [ ] 1.1 تحديث Prisma Schema
  - [ ] إضافة حقل `profession` للمستخدم
  - [ ] تحديث نموذج `Notification`
  - [ ] إضافة `NotificationPreference`
  - [ ] إضافة `NotificationTemplate`
  - [ ] إضافة `BulkNotification`
  - [ ] إضافة `UserDevice`
  - [ ] تشغيل Migration

- [ ] 1.2 إنشاء Notifications Module في API
  - [ ] `notifications.module.ts`
  - [ ] `notifications.service.ts`
  - [ ] `notifications.controller.ts`
  - [ ] DTOs (Create, Update, Query)
  - [ ] Entities

- [ ] 1.3 إنشاء Events System
  - [ ] `notification-events.service.ts`
  - [ ] Event emitters للأحداث المختلفة

### المرحلة 2: الخدمات الأساسية
**المدة المتوقعة: 2-3 أيام**

- [ ] 2.1 خدمة الإشعارات الداخلية (In-App)
  - [ ] إنشاء إشعار
  - [ ] جلب إشعارات المستخدم
  - [ ] تعليم كمقروء
  - [ ] أرشفة/حذف
  - [ ] WebSocket/SSE للإشعارات الفورية

- [ ] 2.2 خدمة قوالب الإشعارات
  - [ ] CRUD للقوالب
  - [ ] استبدال المتغيرات (Template variables)
  - [ ] قوالب افتراضية Seed

- [ ] 2.3 خدمة تفضيلات المستخدم
  - [ ] إنشاء تفضيلات افتراضية
  - [ ] تحديث التفضيلات
  - [ ] التحقق قبل الإرسال

### المرحلة 3: قنوات الإرسال
**المدة المتوقعة: 3-4 أيام**

- [ ] 3.1 Push Notifications (FCM)
  - [ ] إعداد Firebase Admin SDK
  - [ ] خدمة إرسال Push
  - [ ] إدارة أجهزة المستخدم
  - [ ] اختبار iOS + Android

- [ ] 3.2 Email Notifications
  - [ ] إعداد SMTP/SendGrid
  - [ ] قوالب HTML للبريد
  - [ ] طابور إرسال (Queue)

- [ ] 3.3 SMS Notifications (اختياري)
  - [ ] إعداد مزود SMS
  - [ ] خدمة إرسال SMS
  - [ ] إدارة الرصيد

### المرحلة 4: الإشعارات التلقائية
**المدة المتوقعة: 2-3 أيام**

- [ ] 4.1 Cron Jobs للإشعارات المجدولة
  - [ ] تذكيرات انتهاء الاشتراك (30, 15, 7, 3, 1 يوم)
  - [ ] تذكير تحديث البيانات (كل 6 أشهر)
  - [ ] ملخص الأداء اليومي للمندوبين
  - [ ] التقارير الأسبوعية

- [ ] 4.2 Event Listeners
  - [ ] عند إنشاء نشاط جديد
  - [ ] عند تسجيل مستخدم جديد
  - [ ] عند إضافة تقييم
  - [ ] عند تغيير حالة النشاط

### المرحلة 5: الإشعارات الجماعية المستهدفة
**المدة المتوقعة: 2-3 أيام**

- [ ] 5.1 نظام الاستهداف
  - [ ] استهداف جغرافي (محافظة/مدينة/حي)
  - [ ] استهداف مهني (المهنة)
  - [ ] استهداف حسب الدور
  - [ ] استهداف مختلط

- [ ] 5.2 واجهة إدارة الإشعارات الجماعية
  - [ ] إنشاء إشعار جماعي
  - [ ] معاينة المستهدفين
  - [ ] جدولة الإرسال
  - [ ] تقارير الإرسال

### المرحلة 6: الواجهات
**المدة المتوقعة: 3-4 أيام**

- [ ] 6.1 Admin Dashboard
  - [ ] صفحة إدارة الإشعارات
  - [ ] إنشاء إشعارات جماعية
  - [ ] إدارة القوالب
  - [ ] إحصائيات الإشعارات

- [ ] 6.2 تحديث نموذج التسجيل
  - [ ] إضافة حقل المهنة (إجباري)
  - [ ] قائمة المهن المتاحة
  - [ ] التحقق

- [ ] 6.3 Web App
  - [ ] قائمة الإشعارات
  - [ ] إعدادات الإشعارات
  - [ ] Real-time notifications

- [ ] 6.4 Mobile App (Flutter)
  - [ ] عرض الإشعارات
  - [ ] Push notifications
  - [ ] إعدادات الإشعارات

---

## ✅ قائمة المهام (Checklist)

### المرحلة 1: البنية التحتية
- [ ] تحديث schema.prisma
- [ ] npx prisma migrate dev --name add_notifications_system
- [ ] npx prisma generate
- [ ] إنشاء مجلد modules/notifications
- [ ] إنشاء الملفات الأساسية

### المرحلة 2: API
- [ ] notifications.module.ts
- [ ] notifications.service.ts
- [ ] notifications.controller.ts
- [ ] notifications.gateway.ts (WebSocket)
- [ ] DTOs

### المرحلة 3: القوالب
- [ ] notification-templates.service.ts
- [ ] Seed للقوالب الافتراضية
- [ ] إدارة القوالب

### المرحلة 4: الإرسال
- [ ] push-notification.service.ts
- [ ] email-notification.service.ts
- [ ] sms-notification.service.ts

### المرحلة 5: الجدولة
- [ ] notification-scheduler.service.ts
- [ ] Cron jobs

### المرحلة 6: الأحداث
- [ ] notification-events.service.ts
- [ ] Event handlers

### المرحلة 7: الواجهات
- [ ] Admin: صفحة الإشعارات
- [ ] Admin: تحديث نموذج التسجيل (المهنة)
- [ ] Web: الإشعارات
- [ ] Mobile: Push + الإشعارات

---

## 📌 ملاحظات مهمة

1. **الأولوية**: البدء بالإشعارات الداخلية (In-App) ثم Push ثم Email
2. **الأداء**: استخدام Queue للإشعارات الجماعية لتجنب الضغط على الخادم
3. **التخزين**: حذف الإشعارات القديمة (> 90 يوم) تلقائياً
4. **الترجمة**: دعم اللغتين العربية والإنجليزية
5. **الاختبار**: اختبار شامل قبل الإطلاق

---

## 🚀 البدء الآن

سنبدأ بـ **المرحلة 1** - تحديث قاعدة البيانات وإنشاء البنية الأساسية.

**الخطوة التالية:** تحديث `schema.prisma` وتشغيل Migration.
