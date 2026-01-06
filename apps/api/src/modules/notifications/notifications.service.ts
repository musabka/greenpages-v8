import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateNotificationDto,
  UpdateNotificationDto,
  NotificationQueryDto,
  CreateTemplateDto,
  UpdateTemplateDto,
  CreateBulkNotificationDto,
  UpdatePreferencesDto,
  RegisterDeviceDto,
  TargetCriteriaDto,
} from './dto';
import { UserRole } from '@greenpages/database';

// Note: TypeScript may show errors until prisma types are refreshed.
// The schema and migration are correct. Restart VS Code if needed.

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // إنشاء الإشعارات
  // ==========================================

  /**
   * إنشاء إشعار فردي
   */
  async create(dto: CreateNotificationDto, senderId?: string) {
    const notification = await (this.prisma as any).notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        priority: dto.priority || 'MEDIUM',
        titleAr: dto.titleAr,
        titleEn: dto.titleEn,
        messageAr: dto.messageAr,
        messageEn: dto.messageEn,
        data: dto.data,
        actionUrl: dto.actionUrl,
        imageUrl: dto.imageUrl,
        channels: dto.channels || ['IN_APP'],
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        senderId,
        sentAt: dto.scheduledAt ? null : new Date(),
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    // إذا كان فوري ويتضمن قنوات أخرى، أرسل عبرها
    if (!dto.scheduledAt) {
      await this.dispatchToChannels(notification);
    }

    return notification;
  }

  /**
   * إنشاء إشعار باستخدام قالب
   */
  async createFromTemplate(
    templateCode: string,
    userId: string,
    variables: Record<string, string> = {},
    referenceType?: string,
    referenceId?: string,
    senderId?: string,
  ) {
    const template = await (this.prisma as any).notificationTemplate.findUnique({
      where: { code: templateCode },
    });

    if (!template) {
      throw new NotFoundException(`قالب الإشعار "${templateCode}" غير موجود`);
    }

    if (!template.isActive) {
      throw new BadRequestException(`قالب الإشعار "${templateCode}" غير مفعل`);
    }

    // استبدال المتغيرات
    const titleAr = this.replaceVariables(template.titleAr, variables);
    const titleEn = template.titleEn ? this.replaceVariables(template.titleEn, variables) : null;
    const messageAr = this.replaceVariables(template.messageAr, variables);
    const messageEn = template.messageEn ? this.replaceVariables(template.messageEn, variables) : null;

    return this.create({
      userId,
      type: template.type,
      priority: template.priority,
      titleAr,
      titleEn,
      messageAr,
      messageEn,
      channels: template.channels,
      referenceType,
      referenceId,
    }, senderId);
  }

  /**
   * إشعار متعدد المستخدمين
   */
  async createForMultipleUsers(
    userIds: string[],
    dto: Omit<CreateNotificationDto, 'userId'>,
    senderId?: string,
  ) {
    const notifications = await (this.prisma as any).notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: dto.type,
        priority: dto.priority || 'MEDIUM',
        titleAr: dto.titleAr,
        titleEn: dto.titleEn,
        messageAr: dto.messageAr,
        messageEn: dto.messageEn,
        data: dto.data,
        actionUrl: dto.actionUrl,
        imageUrl: dto.imageUrl,
        channels: dto.channels || ['IN_APP'],
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        senderId,
        sentAt: new Date(),
      })),
    });

    return notifications;
  }

  // ==========================================
  // قراءة الإشعارات
  // ==========================================

  /**
   * جلب إشعارات المستخدم
   */
  async findUserNotifications(userId: string, query: NotificationQueryDto) {
    const { page = 1, limit = 20, type, isRead, isArchived, priority } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
      isArchived: isArchived ?? false,
      ...(type && { type }),
      ...(isRead !== undefined && { isRead }),
      ...(priority && { priority }),
      OR: [
        { scheduledAt: null },
        { scheduledAt: { lte: new Date() } },
      ],
    };

    const [notifications, total, unreadCount] = await Promise.all([
      (this.prisma as any).notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          sender: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
        },
      }),
      (this.prisma as any).notification.count({ where }),
      (this.prisma as any).notification.count({
        where: { userId, isRead: false, isArchived: false },
      }),
    ]);

    return {
      data: notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        unreadCount,
      },
    };
  }

  /**
   * جلب إشعار واحد
   */
  async findOne(id: string, userId?: string) {
    const notification = await (this.prisma as any).notification.findUnique({
      where: { id },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
    });

    if (!notification) {
      throw new NotFoundException('الإشعار غير موجود');
    }

    if (userId && notification.userId !== userId) {
      throw new NotFoundException('الإشعار غير موجود');
    }

    return notification;
  }

  /**
   * تحديث إشعار (قراءة/أرشفة)
   */
  async update(id: string, userId: string, dto: UpdateNotificationDto) {
    await this.findOne(id, userId);

    return (this.prisma as any).notification.update({
      where: { id },
      data: {
        ...(dto.isRead !== undefined && {
          isRead: dto.isRead,
          readAt: dto.isRead ? new Date() : null,
        }),
        ...(dto.isArchived !== undefined && {
          isArchived: dto.isArchived,
          archivedAt: dto.isArchived ? new Date() : null,
        }),
      },
    });
  }

  /**
   * تعليم الكل كمقروء
   */
  async markAllAsRead(userId: string) {
    return (this.prisma as any).notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  /**
   * حذف إشعار
   */
  async delete(id: string, userId: string) {
    await this.findOne(id, userId);
    return (this.prisma as any).notification.delete({ where: { id } });
  }

  /**
   * حذف كل الإشعارات المقروءة
   */
  async deleteAllRead(userId: string) {
    return (this.prisma as any).notification.deleteMany({
      where: { userId, isRead: true },
    });
  }

  // ==========================================
  // إشعارات خاصة بالأدوار
  // ==========================================

  /**
   * إشعار للمدراء
   */
  async notifyAdmins(
    type: string,
    titleAr: string,
    messageAr: string,
    data?: Record<string, any>,
    priority = 'MEDIUM',
  ) {
    const admins = await this.prisma.user.findMany({
      where: { role: { in: [UserRole.ADMIN, UserRole.SUPERVISOR] } },
      select: { id: true },
    });

    if (admins.length === 0) return;

    return this.createForMultipleUsers(
      admins.map((a) => a.id),
      { type: type as any, titleAr, messageAr, data, priority: priority as any },
    );
  }

  /**
   * إشعار للمندوب
   */
  async notifyAgent(
    agentId: string,
    type: string,
    titleAr: string,
    messageAr: string,
    data?: Record<string, any>,
    referenceType?: string,
    referenceId?: string,
  ) {
    return this.create({
      userId: agentId,
      type: type as any,
      titleAr,
      messageAr,
      data,
      referenceType,
      referenceId,
      priority: 'HIGH' as any,
    });
  }

  /**
   * إشعار لمديري المحافظات في محافظة معينة
   */
  async notifyGovernorateManagers(
    governorateId: string,
    type: string,
    titleAr: string,
    messageAr: string,
    data?: Record<string, any>,
  ) {
    const managers = await this.prisma.governorateManager.findMany({
      where: { governorateId, isActive: true },
      select: { userId: true },
    });

    if (managers.length === 0) return;

    return this.createForMultipleUsers(
      managers.map((m) => m.userId),
      { type: type as any, titleAr, messageAr, data, priority: 'HIGH' as any },
    );
  }

  /**
   * إشعار لصاحب النشاط
   */
  async notifyBusinessOwner(
    businessId: string,
    type: string,
    titleAr: string,
    messageAr: string,
    data?: Record<string, any>,
  ) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true },
    });

    if (!business?.ownerId) return;

    return this.create({
      userId: business.ownerId,
      type: type as any,
      titleAr,
      messageAr,
      data,
      referenceType: 'business',
      referenceId: businessId,
    });
  }

  // ==========================================
  // القوالب
  // ==========================================

  async createTemplate(dto: CreateTemplateDto) {
    return (this.prisma as any).notificationTemplate.create({
      data: {
        ...dto,
        channels: dto.channels || ['IN_APP'],
      },
    });
  }

  async findAllTemplates(type?: string) {
    return (this.prisma as any).notificationTemplate.findMany({
      where: type ? { type } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findTemplate(id: string) {
    const template = await (this.prisma as any).notificationTemplate.findUnique({
      where: { id },
    });
    if (!template) throw new NotFoundException('القالب غير موجود');
    return template;
  }

  async updateTemplate(id: string, dto: UpdateTemplateDto) {
    await this.findTemplate(id);
    return (this.prisma as any).notificationTemplate.update({
      where: { id },
      data: dto,
    });
  }

  async deleteTemplate(id: string) {
    const template = await this.findTemplate(id);
    if (template.isSystem) {
      throw new BadRequestException('لا يمكن حذف قالب نظام');
    }
    return (this.prisma as any).notificationTemplate.delete({ where: { id } });
  }

  // ==========================================
  // الإشعارات الجماعية
  // ==========================================

  async createBulkNotification(dto: CreateBulkNotificationDto, createdById: string) {
    // حساب عدد المستهدفين
    const targetCount = await this.countTargetedUsers(dto.targetCriteria);

    const bulk = await (this.prisma as any).bulkNotification.create({
      data: {
        titleAr: dto.titleAr,
        titleEn: dto.titleEn,
        messageAr: dto.messageAr,
        messageEn: dto.messageEn,
        actionUrl: dto.actionUrl,
        imageUrl: dto.imageUrl,
        priority: dto.priority || 'MEDIUM',
        channels: dto.channels || ['IN_APP'],
        targetCriteria: dto.targetCriteria,
        totalRecipients: targetCount,
        status: dto.scheduledAt ? 'SCHEDULED' : 'DRAFT',
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        createdById,
      },
    });

    return bulk;
  }

  async findAllBulkNotifications(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      (this.prisma as any).bulkNotification.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
      (this.prisma as any).bulkNotification.count(),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findBulkNotification(id: string) {
    const bulk = await (this.prisma as any).bulkNotification.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
    if (!bulk) throw new NotFoundException('الإشعار الجماعي غير موجود');
    return bulk;
  }

  /**
   * إرسال الإشعار الجماعي
   */
  async sendBulkNotification(id: string) {
    const bulk = await this.findBulkNotification(id);

    if (bulk.status === 'COMPLETED') {
      throw new BadRequestException('تم إرسال هذا الإشعار مسبقاً');
    }

    if (bulk.status === 'PROCESSING') {
      throw new BadRequestException('جاري إرسال هذا الإشعار');
    }

    // تحديث الحالة إلى قيد المعالجة
    await (this.prisma as any).bulkNotification.update({
      where: { id },
      data: { status: 'PROCESSING', startedAt: new Date() },
    });

    try {
      // جلب المستخدمين المستهدفين
      const targetedUsers = await this.getTargetedUsers(bulk.targetCriteria as TargetCriteriaDto);

      // إنشاء الإشعارات
      let sentCount = 0;
      let failedCount = 0;

      // معالجة على دفعات
      const batchSize = 100;
      for (let i = 0; i < targetedUsers.length; i += batchSize) {
        const batch = targetedUsers.slice(i, i + batchSize);

        try {
          await (this.prisma as any).notification.createMany({
            data: batch.map((user) => ({
              userId: user.id,
              type: 'TARGETED',
              priority: bulk.priority,
              titleAr: bulk.titleAr,
              titleEn: bulk.titleEn,
              messageAr: bulk.messageAr,
              messageEn: bulk.messageEn,
              actionUrl: bulk.actionUrl,
              imageUrl: bulk.imageUrl,
              channels: bulk.channels,
              bulkNotificationId: id,
              sentAt: new Date(),
            })),
          });

          sentCount += batch.length;
        } catch (error) {
          failedCount += batch.length;
          this.logger.error(`فشل إرسال دفعة من الإشعارات: ${error.message}`);
        }

        // تحديث الإحصائيات
        await (this.prisma as any).bulkNotification.update({
          where: { id },
          data: { sentCount, failedCount },
        });
      }

      // تحديث الحالة النهائية
      await (this.prisma as any).bulkNotification.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          sentCount,
          failedCount,
        },
      });

      return { sentCount, failedCount, total: targetedUsers.length };
    } catch (error) {
      await (this.prisma as any).bulkNotification.update({
        where: { id },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
        },
      });
      throw error;
    }
  }

  async cancelBulkNotification(id: string) {
    const bulk = await this.findBulkNotification(id);

    if (bulk.status !== 'SCHEDULED' && bulk.status !== 'DRAFT') {
      throw new BadRequestException('لا يمكن إلغاء هذا الإشعار');
    }

    return (this.prisma as any).bulkNotification.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  // ==========================================
  // تفضيلات المستخدم
  // ==========================================

  async getPreferences(userId: string) {
    let prefs = await (this.prisma as any).notificationPreference.findUnique({
      where: { userId },
    });

    if (!prefs) {
      prefs = await (this.prisma as any).notificationPreference.create({
        data: { userId },
      });
    }

    return prefs;
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    return (this.prisma as any).notificationPreference.upsert({
      where: { userId },
      update: dto,
      create: { userId, ...dto },
    });
  }

  // ==========================================
  // إدارة الأجهزة
  // ==========================================

  async registerDevice(userId: string, dto: RegisterDeviceDto) {
    return (this.prisma as any).userDevice.upsert({
      where: {
        userId_deviceToken: {
          userId,
          deviceToken: dto.deviceToken,
        },
      },
      update: {
        ...dto,
        isActive: true,
        lastActiveAt: new Date(),
      },
      create: {
        userId,
        ...dto,
      },
    });
  }

  async unregisterDevice(userId: string, deviceToken: string) {
    return (this.prisma as any).userDevice.updateMany({
      where: { userId, deviceToken },
      data: { isActive: false },
    });
  }

  async getUserDevices(userId: string) {
    return (this.prisma as any).userDevice.findMany({
      where: { userId, isActive: true },
    });
  }

  async estimateTargetedUsers(criteria: any): Promise<number> {
    const whereClause: any = {};

    if (criteria.roles && criteria.roles.length > 0) {
      whereClause.role = { in: criteria.roles };
    }

    if (criteria.governorates && criteria.governorates.length > 0) {
      whereClause.governorateId = { in: criteria.governorates };
    }

    if (criteria.cities && criteria.cities.length > 0) {
      whereClause.cityId = { in: criteria.cities };
    }

    if (criteria.districts && criteria.districts.length > 0) {
      whereClause.districtId = { in: criteria.districts };
    }

    if (criteria.professions && criteria.professions.length > 0) {
      whereClause.profession = { in: criteria.professions };
    }

    if (criteria.activeLastDays) {
      const date = new Date();
      date.setDate(date.getDate() - criteria.activeLastDays);
      whereClause.lastLoginAt = { gte: date };
    }

    return (this.prisma as any).user.count({ where: whereClause });
  }

  // ==========================================
  // الوظائف المساعدة
  // ==========================================

  private replaceVariables(text: string, variables: Record<string, string>): string {
    let result = text;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result;
  }

  private async dispatchToChannels(notification: any) {
    const channels = notification.channels as string[];

    if (channels.includes('PUSH')) {
      await this.sendPushNotification(notification);
    }

    if (channels.includes('EMAIL')) {
      await this.sendEmailNotification(notification);
    }

    if (channels.includes('SMS')) {
      await this.sendSmsNotification(notification);
    }
  }

  private async sendPushNotification(notification: any) {
    // TODO: تنفيذ إرسال Push Notification عبر FCM
    this.logger.log(`Push notification would be sent to user ${notification.userId}`);
  }

  private async sendEmailNotification(notification: any) {
    // TODO: تنفيذ إرسال Email
    this.logger.log(`Email notification would be sent to user ${notification.userId}`);
  }

  private async sendSmsNotification(notification: any) {
    // TODO: تنفيذ إرسال SMS
    this.logger.log(`SMS notification would be sent to user ${notification.userId}`);
  }

  private async countTargetedUsers(criteria: TargetCriteriaDto): Promise<number> {
    const where = this.buildTargetWhereClause(criteria);
    return this.prisma.user.count({ where });
  }

  private async getTargetedUsers(criteria: TargetCriteriaDto) {
    const where = this.buildTargetWhereClause(criteria);
    return this.prisma.user.findMany({
      where,
      select: { id: true },
    });
  }

  private buildTargetWhereClause(criteria: TargetCriteriaDto): any {
    const where: any = {
      status: 'ACTIVE',
    };

    if (criteria.roles && criteria.roles.length > 0) {
      where.role = { in: criteria.roles };
    }

    if (criteria.governorates && criteria.governorates.length > 0) {
      where.governorateId = { in: criteria.governorates };
    }

    if (criteria.cities && criteria.cities.length > 0) {
      where.cityId = { in: criteria.cities };
    }

    if (criteria.districts && criteria.districts.length > 0) {
      where.districtId = { in: criteria.districts };
    }

    if (criteria.professions && criteria.professions.length > 0) {
      where.profession = { in: criteria.professions };
    }

    if (criteria.activeLastDays) {
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - criteria.activeLastDays);
      where.lastLoginAt = { gte: sinceDate };
    }

    return where;
  }

  // ==========================================
  // إحصائيات الإشعارات
  // ==========================================

  async getNotificationStats(userId?: string) {
    const where = userId ? { userId } : {};

    const [total, unread, byType] = await Promise.all([
      (this.prisma as any).notification.count({ where }),
      (this.prisma as any).notification.count({ where: { ...where, isRead: false } }),
      (this.prisma as any).notification.groupBy({
        by: ['type'],
        where,
        _count: true,
      }),
    ]);

    return {
      total,
      unread,
      byType: byType.reduce((acc: Record<string, number>, item: any) => {
        acc[item.type] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}
