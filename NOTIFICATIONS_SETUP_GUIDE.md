# دليل إعداد نظام الإشعارات - Integration Guide

## 🎯 نظرة عامة

تم تطوير نظام إشعارات متكامل يدعم 3 قنوات رئيسية:
- 🔔 **Push Notifications** (Firebase Cloud Messaging)
- 📧 **Email Notifications** (SMTP)
- 📱 **SMS Notifications** (Twilio / Nexmo / Custom)

## 📍 الوصول إلى صفحة الإعدادات

```
http://localhost:3001/notifications/settings
```

## 🔧 إعداد كل خدمة

### 1️⃣ Firebase Cloud Messaging (FCM)

**الخطوات:**

1. افتح [Firebase Console](https://console.firebase.google.com)
2. اختر مشروعك أو أنشئ مشروع جديد
3. اذهب إلى **Project Settings** (⚙️) → **Cloud Messaging**
4. احصل على:
   - **Server Key**: Cloud Messaging API (Legacy) Server Key
   - **Sender ID**: Sender ID
   - **Project ID**: Project ID من General Settings

**ملاحظات:**
- Server Key يبدأ بـ `AAAA`
- Sender ID عبارة عن رقم مكون من 12 خانة
- تأكد من تفعيل **Cloud Messaging API** في مشروعك

**مثال:**
```
Server Key: AAAAxxxxxxxx:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Sender ID: 123456789012
Project ID: my-greenpages-project
```

---

### 2️⃣ SMTP (البريد الإلكتروني)

#### استخدام Gmail:

**الخطوات:**

1. افتح [Google Account Security](https://myaccount.google.com/security)
2. فعّل **2-Step Verification**
3. اذهب إلى **App passwords**
4. أنشئ App Password جديد
5. استخدم هذا Password في الإعدادات

**الإعدادات:**
```
Host: smtp.gmail.com
Port: 587
Username: your-email@gmail.com
Password: App Password (16 حرف)
From Email: your-email@gmail.com
From Name: الصفحات الخضراء
TLS: نعم (✓)
```

#### استخدام Outlook/Hotmail:

**الإعدادات:**
```
Host: smtp-mail.outlook.com
Port: 587
Username: your-email@outlook.com
Password: كلمة المرور العادية
From Email: your-email@outlook.com
From Name: الصفحات الخضراء
TLS: نعم (✓)
```

#### استخدام SMTP مخصص:

استخدم الإعدادات المقدمة من مزود الاستضافة:
```
Host: mail.yourdomain.com
Port: 587 (or 465 for SSL)
Username: noreply@yourdomain.com
Password: ••••••••
```

**ملاحظات:**
- للـ Gmail: **يجب** استخدام App Password وليس كلمة المرور العادية
- Port 587 للـ TLS (موصى به)
- Port 465 للـ SSL
- Port 25 للاتصالات غير المشفرة (غير آمن)

---

### 3️⃣ SMS Gateway

#### استخدام Twilio:

**الخطوات:**

1. سجّل حساب في [Twilio](https://www.twilio.com/try-twilio)
2. من [Console Dashboard](https://console.twilio.com):
   - احصل على **Account SID**
   - احصل على **Auth Token**
3. من [Phone Numbers](https://console.twilio.com/phone-numbers):
   - اشترِ رقم أو احصل على رقم Trial
   - استخدمه كـ **From Number**

**الإعدادات:**
```
Provider: Twilio
Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Auth Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
API Key: (نفس Auth Token)
API Secret: (اتركه فارغ)
From Number: +1234567890
```

**ملاحظات:**
- Account SID يبدأ بـ `AC`
- للحسابات Trial: يمكنك الإرسال فقط للأرقام المُسجلة
- تحقق من رصيد حسابك قبل الإرسال

#### استخدام Nexmo (Vonage):

**الخطوات:**

1. سجّل حساب في [Vonage](https://dashboard.nexmo.com/sign-up)
2. من [Dashboard](https://dashboard.nexmo.com):
   - احصل على **API Key**
   - احصل على **API Secret**
3. من [Numbers](https://dashboard.nexmo.com/numbers):
   - اشترِ رقم أو احصل على رقم افتراضي

**الإعدادات:**
```
Provider: Nexmo
API Key: xxxxxxxx
API Secret: xxxxxxxxxxxxxxxx
From Number: GREENPAGES (أو رقم)
```

**ملاحظات:**
- يمكن استخدام نص بدلاً من رقم في From Number
- الحد الأقصى للنص: 11 حرف

#### استخدام Custom Provider:

للمزودين المحليين أو مخصصين:
```
Provider: Custom
API Key: (حسب المزود)
API Secret: (حسب المزود)
From Number: (حسب المزود)
```

---

## 🧪 اختبار الإعدادات

### اختبار FCM:
1. املأ جميع الحقول (Server Key, Sender ID, Project ID)
2. اضغط "اختبار الاتصال"
3. سيتحقق النظام من صحة المفاتيح

### اختبار SMTP:
1. املأ جميع حقول SMTP
2. اضغط "اختبار الاتصال وإرسال رسالة تجريبية"
3. أدخل بريدك الإلكتروني
4. ستصلك رسالة اختبار خلال ثوانٍ

### اختبار SMS:
1. املأ جميع حقول SMS
2. اضغط "اختبار الاتصال"
3. أدخل رقم هاتفك (مع كود الدولة: +963...)
4. ستصلك رسالة اختبار خلال ثوانٍ

---

## 💾 حفظ الإعدادات

بعد نجاح الاختبار:

1. اضغط "حفظ الإعدادات" في الأعلى
2. ستُحفظ جميع الإعدادات بشكل آمن في قاعدة البيانات
3. يمكنك تعديلها في أي وقت

---

## 🔐 الأمان

- جميع المفاتيح والكلمات السرية محفوظة بشكل **مشفر** في قاعدة البيانات
- لا يمكن الوصول إليها من الواجهة العامة
- فقط المشرفين (SUPER_ADMIN, ADMIN) يمكنهم الوصول لهذه الصفحة

---

## ❓ استكشاف الأخطاء

### مشاكل Firebase FCM:

| المشكلة | الحل |
|---------|------|
| Server Key غير صالح | تأكد أن المفتاح يبدأ بـ AAAA |
| Cloud Messaging غير مفعّل | فعّل Cloud Messaging API من Firebase Console |
| Project ID خاطئ | تحقق من Project Settings → General |

### مشاكل SMTP:

| المشكلة | الحل |
|---------|------|
| Authentication failed | للـ Gmail: استخدم App Password وليس كلمة المرور العادية |
| Connection timeout | تحقق من Host و Port |
| TLS/SSL error | جرّب تبديل بين Port 587 و 465 |
| Blocked by provider | فعّل "Less secure app access" أو استخدم OAuth2 |

### مشاكل SMS:

| المشكلة | الحل |
|---------|------|
| Twilio: Authentication failed | تحقق من Account SID و Auth Token |
| Invalid phone number | استخدم الصيغة الدولية: +963... |
| Insufficient balance | أضف رصيد لحسابك |
| Trial account limitations | للحسابات Trial: سجّل الأرقام المستهدفة أولاً |

---

## 📚 موارد إضافية

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Nodemailer Documentation](https://nodemailer.com/)
- [Twilio SMS API](https://www.twilio.com/docs/sms)
- [Vonage/Nexmo SMS API](https://developer.vonage.com/messaging/sms/overview)

---

## 🎉 بعد الإعداد

بعد إعداد الخدمات بنجاح، يمكنك:

1. ✅ إنشاء **قوالب إشعارات** من `/notifications/templates`
2. ✅ إرسال **إشعارات جماعية** من `/notifications/bulk`
3. ✅ استخدام الإشعارات التلقائية (Cron Jobs) التي تعمل في الخلفية

---

## 🆘 الدعم

إذا واجهت أي مشاكل:
1. تحقق من logs الـ API
2. استخدم زر "اختبار الاتصال" للتشخيص
3. راجع هذا الدليل
4. تواصل مع فريق التطوير

---

**آخر تحديث:** 4 يناير 2026
