import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/prisma/prisma.service';
import { RenewalStatus, RenewalDecision, ContactMethod } from '@prisma/client';
import { 
  CreateRenewalRecordDto, 
  UpdateRenewalStatusDto, 
  CreateRenewalContactDto,
  ProcessDecisionDto,
  AssignAgentDto,
  BulkAssignAgentDto 
} from './dto';

@Injectable()
export class RenewalsService {
  private readonly logger = new Logger(RenewalsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // CRON JOBS - تشغيل تلقائي
  // ============================================

  /**
   * يعمل يومياً لإنشاء سجلات تجديد للباقات التي ستنتهي خلال 30 يوم
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async generateRenewalRecords() {
    this.logger.log('🔄 بدء إنشاء سجلات التجديد التلقائية...');

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // البحث عن الباقات التي ستنتهي خلال 30 يوم ولم يتم إنشاء سجل تجديد لها
    const expiringPackages = await this.prisma.businessPackage.findMany({
      where: {
        isActive: true,
        endDate: {
          not: null,
          lte: thirtyDaysFromNow,
          gt: new Date(), // لم تنته بعد
        },
        package: {
          isDefault: false, // استثناء الباقة الافتراضية
        },
      },
      include: {
        business: true,
        package: true,
      },
    });

    let created = 0;
    for (const bp of expiringPackages) {
      // تحقق من عدم وجود سجل تجديد مسبق لنفس تاريخ الانتهاء
      const existing = await this.prisma.renewalRecord.findFirst({
        where: {
          businessId: bp.businessId,
          expiryDate: bp.endDate!,
        },
      });

      if (!existing) {
        // حساب الأولوية بناءً على المدة المتبقية
        const daysRemaining = Math.ceil((bp.endDate!.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        let priority = 0;
        if (daysRemaining <= 3) priority = 3; // حرج
        else if (daysRemaining <= 7) priority = 2; // عاجل
        else if (daysRemaining <= 14) priority = 1; // متوسط

        await this.prisma.renewalRecord.create({
          data: {
            businessId: bp.businessId,
            businessPackageId: bp.id,
            currentPackageId: bp.packageId,
            expiryDate: bp.endDate!,
            priority,
            status: RenewalStatus.PENDING,
          },
        });
        created++;
      }
    }

    this.logger.log(`✅ تم إنشاء ${created} سجل تجديد جديد`);
  }

  /**
   * تحديث الأولويات يومياً
   */
  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async updatePriorities() {
    this.logger.log('🔄 تحديث أولويات التجديدات...');

    const records = await this.prisma.renewalRecord.findMany({
      where: {
        status: {
          in: [RenewalStatus.PENDING, RenewalStatus.CONTACTED, RenewalStatus.VISIT_SCHEDULED],
        },
      },
    });

    for (const record of records) {
      const daysRemaining = Math.ceil((record.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      let newPriority = 0;
      if (daysRemaining <= 0) newPriority = 3; // منتهية - حرج
      else if (daysRemaining <= 3) newPriority = 3;
      else if (daysRemaining <= 7) newPriority = 2;
      else if (daysRemaining <= 14) newPriority = 1;

      if (record.priority !== newPriority) {
        await this.prisma.renewalRecord.update({
          where: { id: record.id },
          data: { priority: newPriority },
        });
      }

      // تحديث الحالة إلى EXPIRED إذا انتهت الباقة بدون تجديد
      if (daysRemaining < 0 && record.status !== RenewalStatus.EXPIRED && 
          record.status !== RenewalStatus.RENEWED && record.status !== RenewalStatus.DECLINED) {
        await this.prisma.renewalRecord.update({
          where: { id: record.id },
          data: { status: RenewalStatus.EXPIRED },
        });
      }
    }

    this.logger.log('✅ تم تحديث الأولويات');
  }

  // ============================================
  // CRUD Operations
  // ============================================

  async findAll(query: {
    status?: RenewalStatus;
    agentId?: string;
    priority?: number;
    fromDate?: Date;
    toDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const { status, agentId, priority, fromDate, toDate, page = 1, limit = 20 } = query;

    const where: any = {};
    if (status) where.status = status;
    if (agentId) where.assignedAgentId = agentId;
    if (priority !== undefined) where.priority = priority;
    if (fromDate || toDate) {
      where.expiryDate = {};
      if (fromDate) where.expiryDate.gte = fromDate;
      if (toDate) where.expiryDate.lte = toDate;
    }

    const [records, total] = await Promise.all([
      this.prisma.renewalRecord.findMany({
        where,
        include: {
          business: {
            select: {
              id: true,
              nameAr: true,
              nameEn: true,
              logo: true,
            },
          },
          currentPackage: {
            select: { id: true, nameAr: true, price: true },
          },
          newPackage: {
            select: { id: true, nameAr: true, price: true },
          },
          assignedAgent: {
            select: { id: true, firstName: true, lastName: true, phone: true },
          },
          contacts: {
            orderBy: { contactDate: 'desc' },
            take: 1,
            include: {
              agent: {
                select: { firstName: true, lastName: true },
              },
            },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { expiryDate: 'asc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.renewalRecord.count({ where }),
    ]);

    return {
      data: records,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const record = await this.prisma.renewalRecord.findUnique({
      where: { id },
      include: {
        business: {
          include: {
            owner: {
              select: { id: true, firstName: true, lastName: true, phone: true, email: true },
            },
            branches: {
              include: { city: true },
            },
          },
        },
        currentPackage: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            descriptionAr: true,
            descriptionEn: true,
            price: true,
            durationDays: true,
            status: true,
            isPublic: true,
            isDefault: true,
            features: true,
            limits: true,
          },
        },
        newPackage: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            descriptionAr: true,
            descriptionEn: true,
            price: true,
            durationDays: true,
            status: true,
            isPublic: true,
            isDefault: true,
            features: true,
            limits: true,
          },
        },
        assignedAgent: {
          select: { id: true, firstName: true, lastName: true, phone: true, email: true },
        },
        contacts: {
          orderBy: { contactDate: 'desc' },
          include: {
            agent: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    if (!record) {
      throw new NotFoundException('سجل التجديد غير موجود');
    }

    return record;
  }

  async create(dto: CreateRenewalRecordDto) {
    // التحقق من وجود النشاط التجاري وباقته
    const businessPackage = await this.prisma.businessPackage.findUnique({
      where: { businessId: dto.businessId },
      include: { package: true },
    });

    if (!businessPackage) {
      throw new NotFoundException('لا توجد باقة مرتبطة بهذا النشاط التجاري');
    }

    if (!businessPackage.endDate) {
      throw new BadRequestException('هذه الباقة دائمة ولا تحتاج لتجديد');
    }

    // التحقق من عدم وجود سجل تجديد نشط
    const existing = await this.prisma.renewalRecord.findFirst({
      where: {
        businessId: dto.businessId,
        status: {
          in: [RenewalStatus.PENDING, RenewalStatus.CONTACTED, RenewalStatus.VISIT_SCHEDULED],
        },
      },
    });

    if (existing) {
      throw new BadRequestException('يوجد سجل تجديد نشط لهذا النشاط التجاري بالفعل');
    }

    return this.prisma.renewalRecord.create({
      data: {
        businessId: dto.businessId,
        businessPackageId: businessPackage.id,
        currentPackageId: businessPackage.packageId,
        expiryDate: businessPackage.endDate,
        assignedAgentId: dto.assignedAgentId,
        priority: dto.priority ?? 0,
        internalNotes: dto.internalNotes,
        assignedAt: dto.assignedAgentId ? new Date() : null,
      },
      include: {
        business: { select: { nameAr: true } },
        currentPackage: { select: { nameAr: true } },
        assignedAgent: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async assignAgent(id: string, dto: AssignAgentDto) {
    const record = await this.prisma.renewalRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('سجل التجديد غير موجود');

    // التحقق من أن المستخدم هو مندوب
    const agent = await this.prisma.user.findUnique({ where: { id: dto.agentId } });
    if (!agent || agent.role !== 'AGENT') {
      throw new BadRequestException('المستخدم المحدد ليس مندوباً');
    }

    return this.prisma.renewalRecord.update({
      where: { id },
      data: {
        assignedAgentId: dto.agentId,
        assignedAt: new Date(),
        // عدم تغيير الحالة عند تعيين المندوب - تبقى كما هي
        // status لا يتم تغييره
      },
      include: {
        assignedAgent: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async bulkAssignAgent(dto: BulkAssignAgentDto) {
    const agent = await this.prisma.user.findUnique({ where: { id: dto.agentId } });
    if (!agent || agent.role !== 'AGENT') {
      throw new BadRequestException('المستخدم المحدد ليس مندوباً');
    }

    await this.prisma.renewalRecord.updateMany({
      where: { id: { in: dto.renewalRecordIds } },
      data: {
        assignedAgentId: dto.agentId,
        assignedAt: new Date(),
      },
    });

    return { success: true, count: dto.renewalRecordIds.length };
  }

  async updateStatus(id: string, dto: UpdateRenewalStatusDto) {
    const record = await this.prisma.renewalRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('سجل التجديد غير موجود');

    return this.prisma.renewalRecord.update({
      where: { id },
      data: {
        status: dto.status,
        nextFollowUpDate: dto.nextFollowUpDate ? new Date(dto.nextFollowUpDate) : undefined,
        internalNotes: dto.notes 
          ? `${record.internalNotes ? record.internalNotes + '\n---\n' : ''}${new Date().toLocaleDateString('ar-SY')}: ${dto.notes}`
          : undefined,
      },
    });
  }

  // ============================================
  // Contact Management
  // ============================================

  async addContact(dto: CreateRenewalContactDto, agentId: string) {
    const record = await this.prisma.renewalRecord.findUnique({ where: { id: dto.renewalRecordId } });
    if (!record) throw new NotFoundException('سجل التجديد غير موجود');

    const contact = await this.prisma.renewalContact.create({
      data: {
        renewalRecordId: dto.renewalRecordId,
        agentId,
        contactMethod: dto.contactMethod,
        contactDate: new Date(dto.contactDate),
        duration: dto.duration,
        outcome: dto.outcome,
        notes: dto.notes,
        visitAddress: dto.visitAddress,
        visitLatitude: dto.visitLatitude,
        visitLongitude: dto.visitLongitude,
        nextContactDate: dto.nextContactDate ? new Date(dto.nextContactDate) : null,
      },
    });

    // تحديث سجل التجديد
    const updateData: any = {
      followUpCount: { increment: 1 },
    };

    if (dto.nextContactDate) {
      updateData.nextFollowUpDate = new Date(dto.nextContactDate);
    }

    // تحديث الحالة بناءً على طريقة التواصل
    if (dto.contactMethod === ContactMethod.VISIT) {
      updateData.status = RenewalStatus.VISITED;
    } else if (record.status === RenewalStatus.PENDING) {
      updateData.status = RenewalStatus.CONTACTED;
    }

    await this.prisma.renewalRecord.update({
      where: { id: dto.renewalRecordId },
      data: updateData,
    });

    return contact;
  }

  async getContacts(renewalRecordId: string) {
    return this.prisma.renewalContact.findMany({
      where: { renewalRecordId },
      include: {
        agent: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { contactDate: 'desc' },
    });
  }

  // ============================================
  // Decision Processing
  // ============================================

  async processDecision(id: string, dto: ProcessDecisionDto, agentId: string) {
    const record = await this.prisma.renewalRecord.findUnique({
      where: { id },
      include: { business: true },
    });
    if (!record) throw new NotFoundException('سجل التجديد غير موجود');

    const now = new Date();

    switch (dto.decision) {
      case RenewalDecision.ACCEPTED:
      case RenewalDecision.UPGRADE:
      case RenewalDecision.DOWNGRADE:
        // التجديد أو الترقية/التخفيض
        if (!dto.newPackageId) {
          throw new BadRequestException('يجب تحديد الباقة الجديدة');
        }

        // تعيين الباقة الجديدة للنشاط التجاري (يتم عبر packages service)
        // هنا نسجل القرار فقط
        await this.prisma.renewalRecord.update({
          where: { id },
          data: {
            status: RenewalStatus.RENEWED,
            finalDecision: dto.decision,
            decisionDate: now,
            decisionNotes: dto.notes,
            newPackageId: dto.newPackageId,
          },
        });
        break;

      case RenewalDecision.DECLINED:
        // رفض التجديد - سيتم تعيين الباقة الافتراضية تلقائياً عند انتهاء الباقة
        await this.prisma.renewalRecord.update({
          where: { id },
          data: {
            status: RenewalStatus.DECLINED,
            finalDecision: RenewalDecision.DECLINED,
            decisionDate: now,
            decisionNotes: dto.notes,
          },
        });
        break;

      case RenewalDecision.THINKING:
        // تأجيل القرار
        await this.prisma.renewalRecord.update({
          where: { id },
          data: {
            status: RenewalStatus.POSTPONED,
            finalDecision: RenewalDecision.THINKING,
            nextFollowUpDate: dto.postponeUntil ? new Date(dto.postponeUntil) : null,
            decisionNotes: dto.notes,
          },
        });
        break;
    }

    // إضافة سجل التواصل
    await this.prisma.renewalContact.create({
      data: {
        renewalRecordId: id,
        agentId,
        contactMethod: ContactMethod.VISIT, // افتراضي
        contactDate: now,
        outcome: dto.decision,
        notes: dto.notes,
      },
    });

    return this.findOne(id);
  }

  // ============================================
  // Statistics & Reports
  // ============================================

  async getStatistics(agentId?: string) {
    const where = agentId ? { assignedAgentId: agentId } : {};

    const [
      total,
      pending,
      contacted,
      visited,
      renewed,
      declined,
      expired,
    ] = await Promise.all([
      this.prisma.renewalRecord.count({ where }),
      this.prisma.renewalRecord.count({ where: { ...where, status: RenewalStatus.PENDING } }),
      this.prisma.renewalRecord.count({ where: { ...where, status: RenewalStatus.CONTACTED } }),
      this.prisma.renewalRecord.count({ where: { ...where, status: RenewalStatus.VISITED } }),
      this.prisma.renewalRecord.count({ where: { ...where, status: RenewalStatus.RENEWED } }),
      this.prisma.renewalRecord.count({ where: { ...where, status: RenewalStatus.DECLINED } }),
      this.prisma.renewalRecord.count({ where: { ...where, status: RenewalStatus.EXPIRED } }),
    ]);

    const renewalRate = total > 0 ? ((renewed / (renewed + declined + expired)) * 100).toFixed(1) : 0;

    // الأولويات
    const byPriority = await this.prisma.renewalRecord.groupBy({
      by: ['priority'],
      where: {
        ...where,
        status: { in: [RenewalStatus.PENDING, RenewalStatus.CONTACTED, RenewalStatus.VISIT_SCHEDULED] },
      },
      _count: true,
    });

    // المتابعات المطلوبة اليوم
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const followUpsToday = await this.prisma.renewalRecord.count({
      where: {
        ...where,
        nextFollowUpDate: { gte: todayStart, lte: todayEnd },
        status: { notIn: [RenewalStatus.RENEWED, RenewalStatus.DECLINED, RenewalStatus.EXPIRED] },
      },
    });

    return {
      total,
      byStatus: { pending, contacted, visited, renewed, declined, expired },
      byPriority: byPriority.reduce((acc, p) => ({ ...acc, [p.priority]: p._count }), {}),
      renewalRate: `${renewalRate}%`,
      followUpsToday,
    };
  }

  async getAgentPerformance(agentId: string, fromDate?: Date, toDate?: Date) {
    const dateFilter: any = {};
    if (fromDate) dateFilter.gte = fromDate;
    if (toDate) dateFilter.lte = toDate;

    const [
      totalAssigned,
      renewed,
      declined,
      totalContacts,
    ] = await Promise.all([
      this.prisma.renewalRecord.count({
        where: { 
          assignedAgentId: agentId,
          ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}),
        },
      }),
      this.prisma.renewalRecord.count({
        where: { 
          assignedAgentId: agentId, 
          status: RenewalStatus.RENEWED,
          ...(Object.keys(dateFilter).length ? { decisionDate: dateFilter } : {}),
        },
      }),
      this.prisma.renewalRecord.count({
        where: { 
          assignedAgentId: agentId, 
          status: RenewalStatus.DECLINED,
          ...(Object.keys(dateFilter).length ? { decisionDate: dateFilter } : {}),
        },
      }),
      this.prisma.renewalContact.count({
        where: { 
          agentId,
          ...(Object.keys(dateFilter).length ? { contactDate: dateFilter } : {}),
        },
      }),
    ]);

    const conversionRate = totalAssigned > 0 
      ? ((renewed / totalAssigned) * 100).toFixed(1) 
      : 0;

    return {
      totalAssigned,
      renewed,
      declined,
      pending: totalAssigned - renewed - declined,
      totalContacts,
      conversionRate: `${conversionRate}%`,
    };
  }

  async getMyAssignments(agentId: string, status?: RenewalStatus) {
    return this.findAll({
      agentId,
      status,
      limit: 100,
    });
  }
}
