import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

// Note: TypeScript may show errors until prisma types are refreshed.
// The schema and migration are correct. Restart VS Code if needed.

@Injectable()
export class NotificationSchedulerService {
  private readonly logger = new Logger(NotificationSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ==========================================
  // تذكيرات انتهاء الاشتراكات
  // ==========================================

  /**
   * يعمل كل يوم الساعة 9 صباحاً
   * يرسل تذكيرات للأنشطة التي ستنتهي اشتراكاتها
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendSubscriptionReminders() {
    this.logger.log('بدء إرسال تذكيرات انتهاء الاشتراكات...');

    try {
      const now = new Date();

      // الفترات: 30 يوم، 14 يوم، 7 أيام، 3 أيام، يوم واحد
      const reminderDays = [30, 14, 7, 3, 1];

      for (const days of reminderDays) {
        const targetDate = new Date(now);
        targetDate.setDate(targetDate.getDate() + days);
        targetDate.setHours(0, 0, 0, 0);

        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);

        // جلب الأنشطة التي ستنتهي في هذا اليوم باستخدام raw SQL
        const businesses = await (this.prisma as any).$queryRaw`
          SELECT b.id, b.name_ar as "nameAr", b.owner_id as "ownerId",
                 p.name_ar as "packageNameAr"
          FROM businesses b
          LEFT JOIN packages p ON b.current_package_id = p.id
          WHERE b.status = 'APPROVED'
            AND b.package_expires_at >= ${targetDate}
            AND b.package_expires_at < ${nextDay}
            AND b.owner_id IS NOT NULL
        `;

        for (const business of businesses as any[]) {
          // تحديد الأولوية حسب قرب الموعد
          let priority = 'LOW';
          if (days <= 3) priority = 'URGENT';
          else if (days <= 7) priority = 'HIGH';
          else if (days <= 14) priority = 'MEDIUM';

          await this.notificationsService.create({
            userId: business.ownerId,
            type: 'SUBSCRIPTION_EXPIRING' as any,
            priority: priority as any,
            titleAr: `⏰ اشتراكك ينتهي خلال ${days} ${days === 1 ? 'يوم' : 'أيام'}`,
            messageAr: `اشتراك "${business.nameAr}" في باقة "${business.packageNameAr || 'الباقة الحالية'}" سينتهي قريباً. قم بتجديد اشتراكك الآن للحفاظ على ظهور نشاطك.`,
            titleEn: `⏰ Your subscription expires in ${days} day${days > 1 ? 's' : ''}`,
            referenceType: 'business',
            referenceId: business.id,
            actionUrl: `/business/${business.id}/renew`,
          });

          this.logger.log(`تم إرسال تذكير ${days} يوم للنشاط: ${business.nameAr}`);
        }
      }

      this.logger.log('انتهى إرسال تذكيرات الاشتراكات');
    } catch (error) {
      this.logger.error('خطأ في إرسال تذكيرات الاشتراكات', error.stack);
    }
  }

  /**
   * يعمل كل يوم الساعة 10 صباحاً
   * يرسل إشعارات للأنشطة المنتهية
   */
  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async sendExpiredSubscriptionNotifications() {
    this.logger.log('بدء إرسال إشعارات الاشتراكات المنتهية...');

    try {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date(now);
      today.setHours(0, 0, 0, 0);

      // الأنشطة التي انتهت بالأمس
      const expiredBusinesses = await (this.prisma as any).$queryRaw`
        SELECT b.id, b.name_ar as "nameAr", b.owner_id as "ownerId"
        FROM businesses b
        WHERE b.package_expires_at >= ${yesterday}
          AND b.package_expires_at < ${today}
          AND b.owner_id IS NOT NULL
      `;

      for (const business of expiredBusinesses as any[]) {
        await this.notificationsService.create({
          userId: business.ownerId,
          type: 'SUBSCRIPTION_EXPIRED' as any,
          priority: 'URGENT' as any,
          titleAr: '❌ انتهى اشتراكك!',
          messageAr: `انتهى اشتراك "${business.nameAr}". نشاطك لم يعد ظاهراً للزوار. جدد اشتراكك الآن لإعادة الظهور.`,
          titleEn: '❌ Your subscription has expired!',
          referenceType: 'business',
          referenceId: business.id,
          actionUrl: `/business/${business.id}/renew`,
        });
      }

      this.logger.log(`تم إرسال ${(expiredBusinesses as any[]).length} إشعار انتهاء اشتراك`);
    } catch (error) {
      this.logger.error('خطأ في إرسال إشعارات الانتهاء', error.stack);
    }
  }

  // ==========================================
  // تذكيرات تحديث البيانات
  // ==========================================

  /**
   * يعمل كل يوم اثنين الساعة 9 صباحاً
   * يرسل تذكيرات للأنشطة التي لم تُحدث منذ 90 يوم
   */
  @Cron('0 9 * * 1') // Every Monday at 9 AM
  async sendDataUpdateReminders() {
    this.logger.log('بدء إرسال تذكيرات تحديث البيانات...');

    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const staleBusinesses = await (this.prisma as any).$queryRaw`
        SELECT b.id, b.name_ar as "nameAr", b.owner_id as "ownerId"
        FROM businesses b
        WHERE b.status = 'APPROVED'
          AND b.updated_at < ${ninetyDaysAgo}
          AND b.owner_id IS NOT NULL
        LIMIT 100
      `;

      for (const business of staleBusinesses as any[]) {
        await this.notificationsService.create({
          userId: business.ownerId,
          type: 'BUSINESS_UPDATE_REMINDER' as any,
          priority: 'LOW' as any,
          titleAr: '📝 حان وقت تحديث بياناتك',
          messageAr: `مرت أكثر من 90 يوماً منذ آخر تحديث لـ "${business.nameAr}". تأكد من أن معلوماتك محدثة لجذب المزيد من العملاء.`,
          titleEn: '📝 Time to update your data',
          referenceType: 'business',
          referenceId: business.id,
          actionUrl: `/business/${business.id}/edit`,
        });
      }

      this.logger.log(`تم إرسال ${(staleBusinesses as any[]).length} تذكير تحديث بيانات`);
    } catch (error) {
      this.logger.error('خطأ في إرسال تذكيرات التحديث', error.stack);
    }
  }

  // ==========================================
  // إشعارات المندوبين
  // ==========================================

  /**
   * يعمل كل ساعة
   * يرسل تذكيرات للمندوبين عن المهام القريبة
   */
  @Cron(CronExpression.EVERY_HOUR)
  async sendAgentTaskReminders() {
    this.logger.log('بدء إرسال تذكيرات مهام المندوبين...');

    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // التجديدات المعلقة التي تم تعيين مندوب لها ولم يتم التواصل معها
      const pendingRenewals = await (this.prisma as any).$queryRaw`
        SELECT r.id, r.assigned_agent_id as "agentId", b.name_ar as "businessNameAr"
        FROM renewal_records r
        JOIN businesses b ON r.business_id = b.id
        WHERE r.status = 'ASSIGNED'
          AND r.assigned_agent_id IS NOT NULL
          AND r.updated_at < ${oneDayAgo}
        LIMIT 50
      `;

      for (const renewal of pendingRenewals as any[]) {
        await this.notificationsService.create({
          userId: renewal.agentId,
          type: 'AGENT_REMINDER' as any,
          priority: 'HIGH' as any,
          titleAr: '⚠️ لديك مهمة معلقة',
          messageAr: `تم تعيينك للتواصل مع "${renewal.businessNameAr}" لتجديد الاشتراك. يرجى التواصل في أقرب وقت.`,
          titleEn: '⚠️ You have a pending task',
          referenceType: 'renewal',
          referenceId: renewal.id,
          actionUrl: `/renewals/${renewal.id}`,
        });
      }

      this.logger.log(`تم إرسال ${(pendingRenewals as any[]).length} تذكير للمندوبين`);
    } catch (error) {
      this.logger.error('خطأ في إرسال تذكيرات المندوبين', error.stack);
    }
  }

  // ==========================================
  // إرسال الإشعارات الجماعية المجدولة
  // ==========================================

  /**
   * يعمل كل 5 دقائق
   * يرسل الإشعارات الجماعية المجدولة
   */
  @Cron('*/5 * * * *')
  async processScheduledBulkNotifications() {
    const now = new Date();

    const scheduledBulks = await (this.prisma as any).bulkNotification.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: now },
      },
    });

    for (const bulk of scheduledBulks) {
      try {
        this.logger.log(`إرسال إشعار جماعي مجدول: ${bulk.id}`);
        await this.notificationsService.sendBulkNotification(bulk.id);
      } catch (error) {
        this.logger.error(`خطأ في إرسال الإشعار الجماعي ${bulk.id}`, error.stack);
      }
    }
  }

  // ==========================================
  // معالجة الإشعارات المجدولة الفردية
  // ==========================================

  /**
   * يعمل كل دقيقة
   * يرسل الإشعارات الفردية المجدولة
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processScheduledNotifications() {
    const now = new Date();

    const scheduled = await (this.prisma as any).scheduledNotification.findMany({
      where: {
        status: 'pending',
        scheduledFor: { lte: now },
      },
      take: 100,
    });

    for (const job of scheduled) {
      try {
        await this.executeScheduledJob(job);

        await (this.prisma as any).scheduledNotification.update({
          where: { id: job.id },
          data: { status: 'executed', executedAt: new Date() },
        });
      } catch (error) {
        this.logger.error(`خطأ في تنفيذ المهمة المجدولة ${job.id}`, error.stack);

        await (this.prisma as any).scheduledNotification.update({
          where: { id: job.id },
          data: {
            status: job.retryCount >= 3 ? 'failed' : 'pending',
            retryCount: { increment: 1 },
            errorMessage: error.message,
          },
        });
      }
    }
  }

  private async executeScheduledJob(job: any) {
    const data = job.jobData as Record<string, any>;

    switch (job.jobType) {
      case 'subscription_reminder':
        // إرسال تذكير اشتراك
        if (data.userId && data.businessId) {
          await this.notificationsService.create({
            userId: data.userId,
            type: 'SUBSCRIPTION_EXPIRING' as any,
            priority: data.priority || 'MEDIUM',
            titleAr: data.titleAr,
            messageAr: data.messageAr,
            referenceType: 'business',
            referenceId: data.businessId,
          });
        }
        break;

      case 'custom_notification':
        // إشعار مخصص
        if (data.userId) {
          await this.notificationsService.create({
            userId: data.userId,
            type: data.type || 'SYSTEM',
            priority: data.priority || 'MEDIUM',
            titleAr: data.titleAr,
            messageAr: data.messageAr,
            titleEn: data.titleEn,
            messageEn: data.messageEn,
            actionUrl: data.actionUrl,
          });
        }
        break;

      default:
        this.logger.warn(`نوع مهمة غير معروف: ${job.jobType}`);
    }
  }

  // ==========================================
  // تنظيف الإشعارات القديمة
  // ==========================================

  /**
   * يعمل كل يوم الساعة 3 صباحاً
   * يحذف الإشعارات القديمة (أكثر من 90 يوم)
   */
  @Cron('0 3 * * *')
  async cleanOldNotifications() {
    this.logger.log('بدء تنظيف الإشعارات القديمة...');

    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const result = await (this.prisma as any).notification.deleteMany({
        where: {
          createdAt: { lt: ninetyDaysAgo },
          isRead: true,
        },
      });

      this.logger.log(`تم حذف ${result.count} إشعار قديم`);
    } catch (error) {
      this.logger.error('خطأ في تنظيف الإشعارات', error.stack);
    }
  }

  // ==========================================
  // إحصائيات يومية للمدراء
  // ==========================================

  /**
   * يعمل كل يوم الساعة 8 صباحاً
   * يرسل ملخص يومي للمدراء
   */
  @Cron('0 8 * * *')
  async sendDailyStatsToAdmins() {
    this.logger.log('بدء إرسال الإحصائيات اليومية للمدراء...');

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      const [newBusinesses, newReviews, newUsers, expiringCount] = await Promise.all([
        this.prisma.business.count({
          where: { createdAt: { gte: yesterday, lt: today } },
        }),
        this.prisma.review.count({
          where: { createdAt: { gte: yesterday, lt: today } },
        }),
        this.prisma.user.count({
          where: { createdAt: { gte: yesterday, lt: today } },
        }),
        (this.prisma as any).$queryRaw`
          SELECT COUNT(*)::int as count
          FROM businesses
          WHERE status = 'APPROVED'
            AND package_expires_at >= ${today}
            AND package_expires_at < ${sevenDaysLater}
        `.then((r: any[]) => r[0]?.count || 0),
      ]);

      const message = `📊 ملخص الأمس:
• أنشطة جديدة: ${newBusinesses}
• تقييمات جديدة: ${newReviews}
• مستخدمون جدد: ${newUsers}
• اشتراكات تنتهي خلال 7 أيام: ${expiringCount}`;

      await this.notificationsService.notifyAdmins(
        'SYSTEM',
        '📊 التقرير اليومي',
        message,
        { newBusinesses, newReviews, newUsers, expiringCount },
        'LOW',
      );

      this.logger.log('تم إرسال التقرير اليومي للمدراء');
    } catch (error) {
      this.logger.error('خطأ في إرسال التقرير اليومي', error.stack);
    }
  }
}
