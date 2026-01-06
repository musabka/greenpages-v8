# 🎯 خطة التحسين الشاملة - الصفحات الخضراء v8

**تاريخ الإعداد:** 4 يناير 2026  
**الإصدار:** 2.0  
**آخر تحديث:** 4 يناير 2026  
**الحالة:** قيد التنفيذ - Phase 1 مكتملة جزئياً

---

## ✅ ما تم إنجازه (4 يناير 2026)

### 1. **لوحات التحكم (Dashboards)**
- ✅ **ADMIN** - محسّنة (فلتر زمني، CTA للباقات، إزالة روابط وهمية)
- ✅ **GOVERNORATE_MANAGER** - مُنفذة (TanStack Query + skeletons + retry + status badges)
- ✅ **AGENT** - مُنفذة (TanStack Query + skeletons + retry + Today Schedule widget)
- ✅ **BUSINESS** - مبسطة (مشاهدات + اشتراك + CTA)
- ✅ **USER** - مبسطة (مراجعاتي + حالات)

### 2. **البنية التحتية**
- ✅ تنظيف الأدوار القديمة (SUPER_ADMIN → ADMIN, MODERATOR → SUPERVISOR)
- ✅ Middleware للصلاحيات في جميع Apps
- ✅ نظام الإشعارات (Templates + Settings + Bulk)
- ✅ نظام الباقات (Packages + Subscriptions)
- ✅ Shared utilities (status badges: `apps/shared/status-badge.ts`)

### 3. **Endpoints المُنجزة**
- ✅ `/me/reviews` - مراجعات المستخدم
- ✅ `/businesses/me/stats` - إحصائيات النشاط
- ✅ `/businesses/me/subscription` - حالة الاشتراك
- ✅ `/agent-portal/dashboard` - dashboard المندوب
- ✅ `/governorate-manager/dashboard` - dashboard المدير
- ✅ `/admin/stats` + `/admin/recent-activity` (مع فلتر period)

---

## 📍 مسارات لوحات التحكم

| الدور | المسار | التطبيق | Port |
|------|--------|---------|------|
| **ADMIN** | `http://localhost:3001` | `apps/admin` | 3001 |
| **SUPERVISOR** | `http://localhost:3001` | `apps/admin` | 3001 |
| **GOVERNORATE_MANAGER** | `http://localhost:3003` | `apps/manager` | 3003 |
| **AGENT** | `http://localhost:3004` | `apps/agent` | 3004 |
| **BUSINESS** | `http://localhost:3002/business/dashboard` | `apps/web` | 3002 |
| **USER** | `http://localhost:3002/dashboard` | `apps/web` | 3002 |
| **Public Web** | `http://localhost:3002` | `apps/web` | 3002 |

---

## 📊 ملخص تنفيذي (متبقي)

**النقاط المتبقية:** ~75 نقطة تحسين موزعة على:
- 🔴 **عاجلة وحرجة (P0):** 3 نقاط (Payment, Security, Logging)
- 🟠 **عالية الأولوية (P1):** 20 نقطة
- 🟡 **متوسطة الأولوية (P2):** 32 نقطة
- 🟢 **منخفضة الأولوية (P3):** 20 نقطة

**الوقت التقديري المتبقي:** 14-16 أسبوع  
**حجم الفريق المقترح:** 3-4 مطورين

---

## � قائمة المهام المنجزة والمتبقية

### ✅ المكتمل (4 يناير 2026)

| النقطة | الحالة | الملفات المتأثرة |
|--------|--------|------------------|
| **Dashboards** | | |
| ADMIN Dashboard | ✅ محسّنة | [apps/admin/src/app/(dashboard)/page.tsx](apps/admin/src/app/(dashboard)/page.tsx), [apps/admin/src/lib/api.ts](apps/admin/src/lib/api.ts) |
| GOVERNORATE_MANAGER | ✅ منفذة | [apps/manager/src/app/dashboard/page.tsx](apps/manager/src/app/dashboard/page.tsx) |
| AGENT Dashboard | ✅ منفذة | [apps/agent/src/app/dashboard/page.tsx](apps/agent/src/app/dashboard/page.tsx) |
| BUSINESS Dashboard | ✅ مبسطة | [apps/web/src/app/business/dashboard/page.tsx](apps/web/src/app/business/dashboard/page.tsx) |
| USER Dashboard | ✅ مبسطة | [apps/web/src/app/dashboard/page.tsx](apps/web/src/app/dashboard/page.tsx) |
| **Infrastructure** | | |
| نظام الإشعارات | ✅ متكامل | [apps/api/src/modules/notifications/](apps/api/src/modules/notifications/) |
| نظام الباقات | ✅ موجود | [apps/api/src/modules/packages/](apps/api/src/modules/packages/) |
| RBAC Cleanup | ✅ منظف | جميع Middlewares |
| Shared Utilities | ✅ موجود | [apps/shared/status-badge.ts](apps/shared/status-badge.ts) |
| TanStack Query | ✅ مستخدم | جميع Dashboards |

### ⏳ المتبقي (أولويات)

| النقطة | الأولوية | الوقت المقدر |
|--------|----------|---------------|
| **P0 - حرج** | | |
| نظام الدفع الإلكتروني | 🔴 P0 | 1.5 أسبوع |
| نظام الأمان (Rate Limiting) | 🔴 P0 | 3 أيام |
| نظام Logging | 🔴 P0 | 2 أيام |
| **P1 - عالي** | | |
| تحسين Agent App (خرائط + offline) | 🟠 P1 | 1.5 أسبوع |
| نظام المقارنة للمستخدمين | 🟠 P1 | 1 أسبوع |
| نظام التقارير | 🟠 P1 | 2 أسابيع |
| **P2 - متوسط** | | |
| Testing Suite | 🟡 P2 | 2 أسابيع |
| Performance Optimization | 🟡 P2 | 1.5 أسبوع |
| PWA Support | 🟡 P2 | 1 أسبوع |

---

## �🚨 المرحلة الأولى: القضايا الحرجة المتبقية (الأسبوع 1-3)

### ~~P0-1: إنشاء لوحة تحكم صاحب النشاط~~ ✅ **مكتمل**
**الحالة:** Dashboard مبسط موجود في `/business/dashboard`  
**التحسينات المستقبلية (اختياري):**

- إضافة charts متقدمة للمشاهدات (weekly/monthly trends)
- إضافة breakdown للـ click sources (phone/whatsapp/website/directions)
- إدارة المنتجات/الخدمات
- الرد على التقييمات مباشرة من Dashboard
- Analytics متقدمة (demographics, peak hours, etc.)

**Models للتحسينات المستقبلية:**
```prisma
model BusinessAnalytics {
  id            String   @id
  businessId    String   @unique
  
  // Engagement tracking
  phoneClicks   Int      @default(0)
  whatsappClicks Int     @default(0)
  websiteClicks Int      @default(0)
  directionsClicks Int   @default(0)
  
  // Source tracking
  searchViews   Int      @default(0)
  mapViews      Int      @default(0)
  directViews   Int      @default(0)
  
  lastUpdated   DateTime @updatedAt
  business      Business @relation(fields: [businessId])
  @@map("business_analytics")
}

model ViewEvent {
  id          String   @id
  businessId  String
  source      String   // 'search', 'map', 'direct', 'category'
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())
  
  business    Business @relation(fields: [businessId])
  
  @@index([businessId, source])
  @@index([createdAt])
  @@map("view_sources")
}
```

**D. مؤشرات الأداء الرئيسية للـ Dashboard**
```typescript
interface BusinessDashboardData {
  overview: {
    totalViews: number;
    todayViews: number;
    viewsTrend: 'up' | 'down' | 'stable';
    averageRating: number;
    totalReviews: number;
    packageStatus: {
      name: string;
      daysRemaining: number;
      isExpiring: boolean; // < 7 days
    };
  };
  
  recentActivity: {
    newReviews: Review[];
    recentViews: ViewLog[];
    pendingTasks: Task[];
  };
  
  quickStats: {
    phoneClicks: number;
    whatsappClicks: number;
    websiteClicks: number;
    favoriteCount: number;
  };
  
  alerts: Alert[]; // انتهاء الباقة، تقييم جديد، إلخ
}
```

**✅ Acceptance Criteria:**
- [ ] صاحب النشاط يمكنه تسجيل الدخول
- [ ] Dashboard يعرض إحصائيات واضحة
- [ ] يمكن تحديث معلومات النشاط
- [ ] يمكن الرد على التقييمات
- [ ] يمكن رؤية تفاصيل الاشتراك

---

### P0-2: نظام الدفع الإلكتروني
**الأهمية:** ⭐⭐⭐⭐⭐  
**التأثير:** لا يمكن تحصيل الإيرادات بدونه  
**الوقت المقدر:** 1.5 أسبوع

#### خطوات التنفيذ:

**A. اختيار Payment Gateway**
```
الخيارات المقترحة لسوريا:
1. Stripe (دولي - يحتاج حساب خارجي)
2. PayPal (محدود في سوريا)
3. بوابة محلية (إذا متوفرة)
4. Cryptocurrency (خيار بديل)

التوصية: البدء بـ Stripe + خيار تحويل بنكي يدوي
```

**B. Schema للدفع**
```prisma
model Payment {
  id              String    @id @default(uuid())
  businessId      String
  packageId       String
  amount          Decimal   @db.Decimal(10, 2)
  currency        String    @default("USD")
  
  status          PaymentStatus @default(PENDING)
  method          PaymentMethod
  
  // Stripe/External Gateway
  externalId      String?   // Stripe payment intent ID
  externalStatus  String?
  
  // Bank Transfer
  bankReference   String?
  bankSlip        String?   // رابط صورة الإيصال
  
  // Metadata
  createdAt       DateTime  @default(now())
  paidAt          DateTime?
  verifiedAt      DateTime?
  verifiedBy      String?   // Admin who verified
  
  business        Business  @relation(fields: [businessId])
  package         Package   @relation(fields: [packageId])
  
  @@index([businessId])
  @@index([status])
  @@map("payments")
}

enum PaymentStatus {
  PENDING         // في الانتظار
  PROCESSING      // قيد المعالجة
  COMPLETED       // مكتمل
  FAILED          // فشل
  REFUNDED        // مسترد
  CANCELLED       // ملغى
}

enum PaymentMethod {
  STRIPE
  PAYPAL
  BANK_TRANSFER
  CASH            // للمندوبين
  CRYPTO
}

model Invoice {
  id              String   @id @default(uuid())
  invoiceNumber   String   @unique
  businessId      String
  paymentId       String?  @unique
  
  amount          Decimal  @db.Decimal(10, 2)
  tax             Decimal  @db.Decimal(10, 2) @default(0)
  total           Decimal  @db.Decimal(10, 2)
  
  items           Json     // تفاصيل الفاتورة
  
  issuedAt        DateTime @default(now())
  dueAt           DateTime?
  paidAt          DateTime?
  
  pdfUrl          String?  // رابط PDF الفاتورة
  
  business        Business @relation(fields: [businessId])
  payment         Payment? @relation(fields: [paymentId])
  
  @@index([businessId])
  @@index([invoiceNumber])
  @@map("invoices")
}
```

**C. API Endpoints**
```typescript
// Payment Flow
POST   /api/payments/create-intent      # إنشاء نية دفع
POST   /api/payments/confirm            # تأكيد الدفع
GET    /api/payments/history            # سجل المدفوعات
POST   /api/payments/bank-transfer      # تحميل إيصال تحويل بنكي

// Invoices
GET    /api/invoices                    # قائمة الفواتير
GET    /api/invoices/:id/download       # تحميل فاتورة PDF

// Admin
GET    /api/admin/payments/pending      # مدفوعات تحتاج تحقق
POST   /api/admin/payments/:id/verify   # تحقق من دفع
POST   /api/admin/payments/:id/reject   # رفض دفع
```

**D. Stripe Integration**
```typescript
// apps/api/src/modules/payments/stripe.service.ts

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  async createPaymentIntent(amount: number, currency: string) {
    return await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // تحويل للسنت
      currency,
      automatic_payment_methods: { enabled: true },
    });
  }

  async confirmPayment(paymentIntentId: string) {
    return await this.stripe.paymentIntents.retrieve(paymentIntentId);
  }

  async createCustomer(email: string, name: string) {
    return await this.stripe.customers.create({
      email,
      name,
    });
  }

  async handleWebhook(signature: string, payload: Buffer) {
    const event = this.stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    // معالجة الأحداث
  }
}
```

**✅ Acceptance Criteria:**
- [ ] يمكن الدفع ببطاقة ائتمان (Stripe)
- [ ] يمكن تحميل إيصال تحويل بنكي
- [ ] يتم إنشاء فاتورة تلقائياً
- [ ] الفواتير قابلة للتحميل كـ PDF
- [ ] Admin يمكنه التحقق من المدفوعات اليدوية

---

### P0-3: نظام الأمان - Rate Limiting & Validation
**الأهمية:** ⭐⭐⭐⭐⭐  
**التأثير:** حماية النظام من الهجمات  
**الوقت المقدر:** 3 أيام

#### خطوات التنفيذ:

**A. إضافة Rate Limiting**
```bash
pnpm add @nestjs/throttler --filter=api
```

```typescript
// apps/api/src/app.module.ts

import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,    // 1 second
        limit: 3,     // 3 requests
      },
      {
        name: 'medium',
        ttl: 10000,   // 10 seconds
        limit: 20,    // 20 requests
      },
      {
        name: 'long',
        ttl: 60000,   // 1 minute
        limit: 100,   // 100 requests
      },
    ]),
    // ...
  ],
})
```

```typescript
// على Controllers حساسة

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  
  @Post('login')
  @Throttle({ short: { limit: 5, ttl: 60000 } }) // 5 محاولات في الدقيقة
  async login() { }
  
  @Post('register')
  @Throttle({ medium: { limit: 3, ttl: 3600000 } }) // 3 تسجيلات في الساعة
  async register() { }
}
```

**B. تحسين Validation**
```typescript
// تفعيل ValidationPipe globally

// apps/api/src/main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,        // إزالة الحقول غير المعرفة
    forbidNonWhitelisted: true, // رفض الطلب إذا كان فيه حقول غير معرفة
    transform: true,        // تحويل الأنواع تلقائياً
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
);
```

**C. إضافة Helmet للأمان**
```bash
pnpm add helmet --filter=api
```

```typescript
// apps/api/src/main.ts
import helmet from 'helmet';

app.use(helmet());
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
});
```

**D. تشفير البيانات الحساسة**
```typescript
// apps/api/src/common/encryption/encryption.service.ts

import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;

  constructor(private config: ConfigService) {
    const secret = this.config.get<string>('ENCRYPTION_KEY');
    this.key = crypto.scryptSync(secret, 'salt', 32);
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

**استخدام التشفير:**
```typescript
// مثال: تشفير رقم الهاتف عند الحفظ

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
  ) {}

  async create(data: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        ...data,
        phone: this.encryption.encrypt(data.phone), // تشفير
      },
    });
  }

  async findByPhone(phone: string) {
    const users = await this.prisma.user.findMany();
    return users.find(u => 
      this.encryption.decrypt(u.phone) === phone // فك التشفير للبحث
    );
  }
}
```

**✅ Acceptance Criteria:**
- [ ] Rate limiting مفعّل على Login/Register
- [ ] Validation شامل على كل DTOs
- [ ] Helmet مفعّل للأمان
- [ ] أرقام الهواتف مشفرة في قاعدة البيانات
- [ ] CORS محدد للنطاقات المسموحة

---

### P0-4: نظام Logging & Error Tracking
**الأهمية:** ⭐⭐⭐⭐  
**التأثير:** اكتشاف ومتابعة الأخطاء  
**الوقت المقدر:** 2 أيام

```bash
pnpm add winston nest-winston --filter=api
pnpm add @sentry/node @sentry/tracing --filter=api
```

```typescript
// apps/api/src/common/logger/logger.module.ts

import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, context }) => {
              return `${timestamp} [${context}] ${level}: ${message}`;
            }),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
        }),
      ],
    }),
  ],
})
export class LoggerModule {}
```

```typescript
// Sentry Integration
// apps/api/src/main.ts

import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// بعد جميع المسارات
app.use(Sentry.Handlers.errorHandler());
```

**✅ Acceptance Criteria:**
- [ ] Logging مفعّل لجميع الأخطاء
- [ ] Sentry يتلقى الأخطاء تلقائياً
- [ ] ملفات Log منظمة حسب المستوى
- [ ] يمكن البحث في Logs

---

## 🔥 المرحلة الثانية: الأولويات العالية (الأسبوع 5-9)

### ~~P1-1: نظام الإشعارات للأنشطة التجارية~~ ✅ **مكتمل**
**الحالة:** نظام إشعارات متكامل موجود في `apps/api/src/modules/notifications/`  
**المميزات المنفذة:**
- ✅ Templates نظام (BUSINESS_APPROVED, REVIEW_NEW, SUBSCRIPTION_EXPIRING, etc.)
- ✅ Settings نظام (email/sms/push preferences per user)
- ✅ Bulk notifications support
- ✅ Seeds جاهزة (seed_notification_templates.sql, seed_notification_settings.sql)
- ✅ API endpoints (/notifications, /notifications/settings, /notifications/bulk)
- ✅ Integration في business approval flow

**الموجود:**
```typescript
// Automatic notifications working:
- BUSINESS_APPROVED - عند موافقة على النشاط
- REVIEW_NEW - عند تقييم جديد  
- SUBSCRIPTION_EXPIRING - عند اقتراب انتهاء الباقة
- PAYMENT_RECEIVED - عند استلام دفعة
- RENEWAL_REMINDER - تذكير بالتجديد
```

**التحسينات المستقبلية (اختياري):**
- إضافة push notifications للموبايل
- إضافة WhatsApp notifications
- لوحة إدارة متقدمة للـ templates في Admin dashboard
```

---

### P1-2: تحسين تطبيق المندوب (Agent App)
**الوقت المقدر:** 1.5 أسبوع  
**الحالة:** Dashboard منفذ ✅، بقية المميزات قيد الانتظار

#### ✅ ما تم إنجازه:
- ✅ Agent Dashboard في `apps/agent/src/app/dashboard/page.tsx`
- ✅ Today Schedule widget مع visits list
- ✅ TanStack Query + skeletons + error/retry
- ✅ Status badges (pending/completed/approved)
- ✅ API endpoint `/agent-portal/dashboard`
- ✅ Renewals + Commissions sections

#### Features المتبقية:
1. **خريطة تفاعلية**
2. **تحسين المسار**
3. **وضع Offline**
4. **تسجيل الزيارة بالموقع GPS**
5. **التقاط صور مباشرة**

```dart
// lib/features/visits/domain/entities/visit.dart

class Visit {
  final String id;
  final String businessId;
  final String agentId;
  final VisitType type;
  final VisitStatus status;
  final GeoPoint location;  // موقع الزيارة
  final List<String> photos; // صور الزيارة
  final String? notes;
  final String? signature; // توقيع رقمي من صاحب النشاط
  final DateTime scheduledAt;
  final DateTime? startedAt;
  final DateTime? completedAt;
}
```

---

### P1-3: نظام المقارنة للمستخدمين
**الوقت المقدر:** 3 أيام

```tsx
// apps/web/src/app/compare/page.tsx

export default function ComparePage() {
  const searchParams = useSearchParams();
  const ids = searchParams.get('ids')?.split(',') || [];
  
  // Fetch businesses
  const { data: businesses } = useBusinesses({ ids });
  
  return (
    <div className="compare-table">
      <table>
        <thead>
          <tr>
            <th>المعيار</th>
            {businesses.map(b => (
              <th key={b.id}>{b.nameAr}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>التقييم</td>
            {businesses.map(b => <td key={b.id}>⭐ {b.averageRating}</td>)}
          </tr>
          <tr>
            <td>الموقع</td>
            {businesses.map(b => <td key={b.id}>{b.city.nameAr}</td>)}
          </tr>
          {/* المزيد... */}
        </tbody>
      </table>
    </div>
  );
}
```

---

### P1-4: نظام التقارير
**الوقت المقدر:** 1 أسبوع

```typescript
// apps/api/src/modules/reports/reports.service.ts

@Injectable()
export class ReportsService {
  
  async generateBusinessReport(businessId: string, month: number, year: number) {
    const data = await this.prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as views
      FROM business_views
      WHERE business_id = ${businessId}
        AND EXTRACT(MONTH FROM created_at) = ${month}
        AND EXTRACT(YEAR FROM created_at) = ${year}
      GROUP BY date
      ORDER BY date
    `;
    
    // Generate PDF
    return await this.pdfService.generateReport({
      title: 'تقرير الأداء الشهري',
      data,
      // ...
    });
  }
  
  async generateRevenueReport(startDate: Date, endDate: Date) {
    // تقرير الإيرادات للإدارة
  }
  
  async generateAgentPerformanceReport(agentId: string, period: string) {
    // تقرير أداء المندوب
  }
}
```

---

## 📚 المرحلة الثالثة: التحسينات المتوسطة (الأسبوع 10-14)

### P2-1: Testing Suite
**الوقت المقدر:** 2 أسابيع

```bash
# إعداد Jest للتطبيق
pnpm add -D @nestjs/testing jest @types/jest ts-jest --filter=api

# إعداد Playwright للـ E2E
pnpm add -D @playwright/test --filter=web
```

```typescript
// apps/api/src/modules/businesses/businesses.service.spec.ts

describe('BusinessesService', () => {
  let service: BusinessesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessesService,
        {
          provide: PrismaService,
          useValue: {
            business: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<BusinessesService>(BusinessesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    it('should create a new business', async () => {
      const dto = { nameAr: 'Test Business', /* ... */ };
      const expected = { id: '123', ...dto };

      jest.spyOn(prisma.business, 'create').mockResolvedValue(expected);

      const result = await service.create(dto);
      expect(result).toEqual(expected);
    });
  });

  // المزيد من الاختبارات...
});
```

---

### P2-2: Performance Optimization
**الوقت المقدر:** 1 أسبوع

**A. Database Indexing**
```sql
-- إضافة indexes مفقودة
CREATE INDEX idx_businesses_featured_active 
  ON businesses(is_featured, is_active) 
  WHERE status = 'APPROVED';

CREATE INDEX idx_business_views_date 
  ON business_views(business_id, date);

CREATE INDEX idx_reviews_rating 
  ON reviews(business_id, rating) 
  WHERE status = 'APPROVED';
```

**B. Query Optimization**
```typescript
// قبل: N+1 problem
const businesses = await prisma.business.findMany();
for (const business of businesses) {
  business.categories = await prisma.businessCategory.findMany({
    where: { businessId: business.id }
  });
}

// بعد: Eager loading
const businesses = await prisma.business.findMany({
  include: {
    categories: {
      include: {
        category: true
      }
    }
  }
});
```

**C. Redis Caching**
```bash
pnpm add @nestjs/cache-manager cache-manager --filter=api
pnpm add cache-manager-redis-yet --filter=api
```

```typescript
// Cache frequently accessed data
@Injectable()
export class BusinessesService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  async findById(id: string) {
    const cacheKey = `business:${id}`;
    const cached = await this.cache.get(cacheKey);
    
    if (cached) return cached;
    
    const business = await this.prisma.business.findUnique({
      where: { id },
      include: { /* ... */ },
    });
    
    await this.cache.set(cacheKey, business, 3600); // 1 hour
    return business;
  }
}
```

---

### P2-3: PWA Support
**الوقت المقدر:** 3 أيام

```bash
# تثبيت next-pwa
pnpm add next-pwa --filter=web
```

```javascript
// apps/web/next.config.ts

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

module.exports = withPWA({
  // existing config
});
```

```json
// apps/web/public/manifest.json

{
  "name": "الصفحات الخضراء",
  "short_name": "الصفحات الخضراء",
  "description": "دليل الأنشطة التجارية في سوريا",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#22c55e",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 🎨 المرحلة الرابعة: التحسينات التكميلية (الأسبوع 15-20)

### P3 Items:
- Multi-language support كامل (EN/AR)
- Accessibility improvements (WCAG 2.1 AA)
- Advanced search with AI
- CRM System
- Email Marketing
- SMS Marketing
- Ticketing System
- Mobile User App (Flutter)

---

## 📅 الجدول الزمني التفصيلي

| الأسبوع | المهام | الحالة |
|---------|---------|--------|
| 1-2 | P0-1: Business Dashboard | 🔴 |
| 3 | P0-2: Payment System | 🔴 |
| 4 | P0-3: Security, P0-4: Logging | 🔴 |
| 5 | P1-1: Business Notifications | 🟠 |
| 6-7 | P1-2: Agent App Improvements | 🟠 |
| 8 | P1-3: Comparison, P1-4: Reports | 🟠 |
| 9 | Buffer Week | 🟡 |
| 10-11 | P2-1: Testing Suite | 🟡 |
| 12 | P2-2: Performance | 🟡 |
| 13 | P2-3: PWA | 🟡 |
| 14 | Code Review & Refactoring | 🟡 |
| 15-20 | P3 Items | 🟢 |

---

## 💰 تقدير التكلفة

### حجم الفريق المقترح:
- **1 Senior Full-stack Developer** (Backend + Frontend)
- **1 Mid-level Backend Developer** (NestJS/Prisma)
- **1 Mid-level Frontend Developer** (Next.js/React)
- **1 Mobile Developer** (Flutter) - جزء من الوقت
- **1 QA Engineer** - جزء من الوقت

### التكلفة التقديرية (بالدولار):
- **الطور الأول (P0):** $8,000 - $10,000
- **الطور الثاني (P1):** $12,000 - $15,000
- **الطور الثالث (P2):** $10,000 - $12,000
- **الطور الرابع (P3):** $15,000 - $20,000

**الإجمالي:** $45,000 - $57,000

---

## 🎯 مؤشرات الأداء الرئيسية (KPIs)

### لقياس نجاح التحسينات:

**Technical KPIs:**
- Code Coverage > 80%
- API Response Time < 200ms (p95)
- Page Load Time < 2s
- Lighthouse Score > 90
- Zero Critical Security Issues

**Business KPIs:**
- Business Owner Satisfaction > 4.5/5
- Agent Productivity +30%
- User Engagement +50%
- Revenue Growth +100%
- Customer Support Tickets -40%

---

## ✅ خطوات ما بعد التنفيذ

1. **Documentation**
   - User Guides
   - Developer Docs
   - API Documentation

2. **Training**
   - تدريب الإدارة على النظام
   - تدريب المندوبين
   - دعم أصحاب الأنشطة

3. **Monitoring**
   - Performance Monitoring (New Relic / Datadog)
   - Error Tracking (Sentry)
   - User Analytics (Google Analytics / Mixpanel)

4. **Continuous Improvement**
   - Monthly reviews
   - User feedback collection
   - A/B testing for new features

---

**تمت المراجعة والموافقة:**
- [ ] فريق التطوير
- [ ] Product Manager
- [ ] Stakeholders

**الإصدار:** 1.0  
**التاريخ:** 4 يناير 2026
