import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole, VisitStatus, VisitPurpose, CommissionType } from '@greenpages/database';
import { WalletService } from '../wallet/wallet.service';
import { PackagesService } from '../packages/packages.service';

@Injectable()
export class AgentPortalService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => WalletService))
    private walletService: WalletService,
    private readonly packagesService: PackagesService,
  ) { }

  /**
   * الحصول على لوحة التحكم للمندوب
   */
  async getDashboard(userId: string) {
    // جلب ملف المندوب
    const agentProfile = await this.prisma.agentProfile.findUnique({
      where: { userId },
      include: {
        governorates: {
          where: { isActive: true },
          include: { governorate: { select: { nameAr: true } } },
        },
        manager: { select: { firstName: true, lastName: true } },
      },
    });

    if (!agentProfile) {
      throw new ForbiddenException('لم يتم إنشاء ملف المندوب الخاص بك بعد');
    }

    const governorateIds = agentProfile.governorates.map(g => g.governorateId);

    // إحصائيات
    const [
      totalBusinesses,
      pendingBusinesses,
      approvedBusinesses,
      pendingRenewals,
      completedRenewals,
      approvedCommissions,
      paidCommissions,
      todayVisits,
      plannedVisits,
    ] = await Promise.all([
      // الأنشطة التي أضافها
      this.prisma.business.count({
        where: { agentId: userId },
      }),
      // المعلقة
      this.prisma.business.count({
        where: { agentId: userId, status: 'PENDING' },
      }),
      // الموافق عليها
      this.prisma.business.count({
        where: { agentId: userId, status: 'APPROVED' },
      }),
      // التجديدات المعلقة
      this.prisma.renewalRecord.count({
        where: { assignedAgentId: userId, status: 'PENDING' },
      }),
      // التجديدات المكتملة
      this.prisma.renewalRecord.count({
        where: { assignedAgentId: userId, status: 'RENEWED' },
      }),
      // العمولات المعتمدة (APPROVED)
      this.prisma.agentCommission.aggregate({
        where: { agentProfile: { userId }, status: 'APPROVED' },
        _sum: { commissionAmount: true },
      }),
      // العمولات المدفوعة
      this.prisma.agentCommission.aggregate({
        where: { agentProfile: { userId }, status: 'PAID' },
        _sum: { commissionAmount: true },
      }),
      // زيارات اليوم
      this.prisma.agentVisit.count({
        where: {
          agentProfile: { userId },
          scheduledAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      // الزيارات المخططة
      this.prisma.agentVisit.count({
        where: {
          agentProfile: { userId },
          status: 'PLANNED',
        },
      }),
    ]);

    // آخر الأنشطة
    const recentBusinesses = await this.prisma.business.findMany({
      where: { agentId: userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        nameAr: true,
        status: true,
        createdAt: true,
        governorate: { select: { nameAr: true } },
        city: { select: { nameAr: true } },
      },
    });

    // الزيارات القادمة
    const upcomingVisits = await this.prisma.agentVisit.findMany({
      where: {
        agentProfile: { userId },
        status: 'PLANNED',
        scheduledAt: { gte: new Date() },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 5,
      select: {
        id: true,
        purpose: true,
        scheduledAt: true,
        governorate: { select: { nameAr: true } },
        city: { select: { nameAr: true } },
        business: { select: { nameAr: true } },
      },
    });

    return {
      profile: {
        id: agentProfile.id,
        baseSalary: agentProfile.baseSalary,
        commissionRate: agentProfile.commissionRate,
        totalEarnings: Number(agentProfile.baseSalary) + Number(paidCommissions._sum.commissionAmount || 0),
        totalCommissions: agentProfile.totalCommissions,
        hiredAt: agentProfile.hiredAt,
        manager: agentProfile.manager,
      },
      governorates: agentProfile.governorates.map(g => ({
        id: g.governorateId,
        name: g.governorate.nameAr,
      })),
      stats: {
        businesses: {
          total: totalBusinesses,
          pending: pendingBusinesses,
          approved: approvedBusinesses,
        },
        renewals: {
          pending: pendingRenewals,
          completed: completedRenewals,
        },
        commissions: {
          approved: Number(approvedCommissions._sum.commissionAmount || 0),
          paid: Number(paidCommissions._sum.commissionAmount || 0),
          pending: Number(approvedCommissions._sum.commissionAmount || 0) - Number(paidCommissions._sum.commissionAmount || 0),
        },
        visits: {
          today: todayVisits,
          planned: plannedVisits,
        },
      },
      recentBusinesses,
      upcomingVisits,
    };
  }

  /**
   * الأنشطة التي يديرها المندوب
   */
  async getMyBusinesses(userId: string, query: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) {
    const { page = 1, limit = 20, status, search } = query;
    const skip = (page - 1) * limit;

    const where: any = { agentId: userId };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { nameAr: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [businesses, total] = await Promise.all([
      this.prisma.business.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          governorate: { select: { nameAr: true } },
          city: { select: { nameAr: true } },
          district: { select: { nameAr: true } },
          owner: { select: { firstName: true, lastName: true } },
          package: { select: { package: { select: { nameAr: true } } } },
          categories: { select: { category: { select: { nameAr: true } } } },
        },
      }),
      this.prisma.business.count({ where }),
    ]);

    return {
      data: businesses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * التجديدات المخصصة للمندوب
   */
  async getMyRenewals(userId: string, query: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const { page = 1, limit = 20, status } = query;
    const skip = (page - 1) * limit;

    const where: any = { assignedAgentId: userId };

    if (status) {
      where.status = status;
    }

    const [renewals, total] = await Promise.all([
      this.prisma.renewalRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          business: {
            select: {
              id: true,
              nameAr: true,
              contacts: { where: { isPrimary: true, type: 'PHONE' }, take: 1, select: { value: true } },
              governorate: { select: { nameAr: true } },
              city: { select: { nameAr: true } },
              owner: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
      this.prisma.renewalRecord.count({ where }),
    ]);

    return {
      data: renewals,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * تحديث حالة التجديد
   */
  async updateRenewalStatus(
    userId: string,
    renewalId: string,
    data: { status: string; notes?: string }
  ) {
    const renewal = await this.prisma.renewalRecord.findUnique({
      where: { id: renewalId },
    });

    if (!renewal) {
      throw new NotFoundException('التجديد غير موجود');
    }

    if (renewal.assignedAgentId !== userId) {
      throw new ForbiddenException('هذا التجديد غير مخصص لك');
    }

    await this.prisma.renewalRecord.update({
      where: { id: renewalId },
      data: {
        status: data.status as any,
        internalNotes: data.notes,
      },
    });

    return { message: 'تم تحديث حالة التجديد' };
  }

  /**
   * العمولات
   */
  async getMyCommissions(userId: string, query: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const agentProfile = await this.prisma.agentProfile.findUnique({
      where: { userId },
    });

    if (!agentProfile) {
      throw new ForbiddenException('لم يتم إنشاء ملف المندوب الخاص بك بعد');
    }

    const { page = 1, limit = 20, status } = query;
    const skip = (page - 1) * limit;

    const where: any = { agentProfileId: agentProfile.id };

    if (status) {
      where.status = status;
    }

    const [commissions, total, summary] = await Promise.all([
      this.prisma.agentCommission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          business: {
            select: {
              id: true,
              nameAr: true,
            },
          },
        },
      }),
      this.prisma.agentCommission.count({ where }),
      this.prisma.agentCommission.groupBy({
        by: ['status'],
        where: { agentProfileId: agentProfile.id },
        _sum: { commissionAmount: true },
        _count: true,
      }),
    ]);

    return {
      data: commissions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      summary: summary.map(s => ({
        status: s.status,
        count: s._count,
        total: s._sum.commissionAmount || 0,
      })),
    };
  }

  /**
   * الزيارات الميدانية
   */
  async getMyVisits(userId: string, query: {
    page?: number;
    limit?: number;
    status?: string;
    date?: string;
  }) {
    const agentProfile = await this.prisma.agentProfile.findUnique({
      where: { userId },
    });

    if (!agentProfile) {
      throw new ForbiddenException('لم يتم إنشاء ملف المندوب الخاص بك بعد');
    }

    const { page = 1, limit = 20, status, date } = query;
    const skip = (page - 1) * limit;

    const where: any = { agentProfileId: agentProfile.id };

    if (status) {
      where.status = status;
    }

    if (date) {
      const targetDate = new Date(date);
      where.scheduledAt = {
        gte: new Date(targetDate.setHours(0, 0, 0, 0)),
        lt: new Date(targetDate.setHours(23, 59, 59, 999)),
      };
    }

    const [visits, total] = await Promise.all([
      this.prisma.agentVisit.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledAt: 'desc' },
        include: {
          governorate: { select: { nameAr: true } },
          city: { select: { nameAr: true } },
          business: { select: { id: true, nameAr: true, contacts: { where: { isPrimary: true, type: 'PHONE' }, take: 1, select: { value: true } } } },
        },
      }),
      this.prisma.agentVisit.count({ where }),
    ]);

    return {
      data: visits,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * إنشاء زيارة جديدة
   */
  async createVisit(userId: string, data: {
    purpose: VisitPurpose;
    governorateId: string;
    cityId?: string;
    businessId?: string;
    scheduledAt: Date;
    address?: string;
    notes?: string;
  }) {
    const agentProfile = await this.prisma.agentProfile.findUnique({
      where: { userId },
      include: {
        governorates: { where: { isActive: true } },
      },
    });

    if (!agentProfile) {
      throw new ForbiddenException('لم يتم إنشاء ملف المندوب الخاص بك بعد');
    }

    // التحقق من أن المحافظة ضمن صلاحياته
    const allowedGovernorateIds = agentProfile.governorates.map(g => g.governorateId);
    if (!allowedGovernorateIds.includes(data.governorateId)) {
      throw new ForbiddenException('ليس لديك صلاحية إنشاء زيارة في هذه المحافظة');
    }

    const visit = await this.prisma.agentVisit.create({
      data: {
        agentProfileId: agentProfile.id,
        purpose: data.purpose,
        governorateId: data.governorateId,
        cityId: data.cityId,
        businessId: data.businessId,
        scheduledAt: new Date(data.scheduledAt),
        address: data.address,
        notes: data.notes,
        status: 'PLANNED',
      },
      include: {
        governorate: { select: { nameAr: true } },
        city: { select: { nameAr: true } },
        business: { select: { nameAr: true } },
      },
    });

    return visit;
  }

  /**
   * تحديث حالة الزيارة
   */
  async updateVisitStatus(
    userId: string,
    visitId: string,
    data: {
      status: VisitStatus;
      outcome?: string;
      notes?: string;
      photos?: string[];
    }
  ) {
    const agentProfile = await this.prisma.agentProfile.findUnique({
      where: { userId },
    });

    if (!agentProfile) {
      throw new ForbiddenException('لم يتم إنشاء ملف المندوب الخاص بك بعد');
    }

    const visit = await this.prisma.agentVisit.findUnique({
      where: { id: visitId },
    });

    if (!visit) {
      throw new NotFoundException('الزيارة غير موجودة');
    }

    if (visit.agentProfileId !== agentProfile.id) {
      throw new ForbiddenException('هذه الزيارة غير مخصصة لك');
    }

    const updateData: any = { status: data.status };

    if (data.status === 'IN_PROGRESS') {
      updateData.startedAt = new Date();
    }

    if (data.status === 'COMPLETED') {
      updateData.completedAt = new Date();
      updateData.outcome = data.outcome;
    }

    if (data.notes) {
      updateData.notes = data.notes;
    }

    if (data.photos) {
      updateData.photos = data.photos;
    }

    const updatedVisit = await this.prisma.agentVisit.update({
      where: { id: visitId },
      data: updateData,
    });

    // تحديث إحصائيات المندوب
    if (data.status === 'COMPLETED') {
      await this.prisma.agentProfile.update({
        where: { id: agentProfile.id },
        data: { totalVisits: { increment: 1 } },
      });
    }

    return updatedVisit;
  }

  /**
   * الملف الشخصي
   */
  async getProfile(userId: string) {
    const agentProfile = await this.prisma.agentProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
            governorate: { select: { nameAr: true } },
            city: { select: { nameAr: true } },
          },
        },
        manager: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        governorates: {
          where: { isActive: true },
          include: { governorate: { select: { nameAr: true } } },
        },
      },
    });

    if (!agentProfile) {
      throw new ForbiddenException('لم يتم إنشاء ملف المندوب الخاص بك بعد');
    }

    return {
      ...agentProfile,
      governorates: agentProfile.governorates.map(g => ({
        id: g.governorateId,
        name: g.governorate.nameAr,
      })),
    };
  }

  /**
   * تحديث الملف الشخصي
   */
  async updateProfile(userId: string, data: {
    phone?: string;
    avatar?: string;
  }) {
    await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return { message: 'تم تحديث الملف الشخصي' };
  }

  /**
   * الفواتير الخاصة بالأنشطة التي يديرها المندوب
   * (الفواتير التي أُنشئت للمستخدمين/أصحاب الأنشطة التي سجلها المندوب)
   */
  async getMyInvoices(userId: string, query: {
    page?: number;
    limit?: number;
    status?: string;
    businessId?: string;
  }) {
    console.log('📋 AgentPortalService.getMyInvoices called:', { userId, query });

    const { page = 1, limit = 20, status, businessId } = query;
    const skip = (page - 1) * limit;

    // جلب معرفات الأنشطة التي يتبع لها هذا المندوب
    const myBusinesses = await this.prisma.business.findMany({
      where: { agentId: userId },
      select: { id: true },
    });
    const myBusinessIds = myBusinesses.map((b) => b.id);

    // بناء شرط البحث
    const where: any = {};

    if (businessId) {
      // إذا تم تمرير نشاط تجاري محدد، نتأكد أنه تابع للمندوب
      // نستخدم AND لضمان أن النشاط يعود للمندوب والفاتورة لهذا النشاط
      where.AND = [
        { businessId: businessId },
        { businessId: { in: myBusinessIds } },
      ];
    } else {
      // إذا لم يتم تمرير نشاط، نعرض فواتير جميع أنشطته + الفواتير التي أنشأها هو
      where.OR = [
        { createdById: userId },
        { businessId: { in: myBusinessIds } },
      ];
    }

    if (status) {
      where.status = status;
    }

    console.log('🔍 Invoice query where:', JSON.stringify(where, null, 2));

    const [invoices, total] = await Promise.all([
      this.prisma.accInvoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          lines: {
            select: {
              description: true,
              descriptionAr: true,
              quantity: true,
              unitPrice: true,
              total: true,
            },
          },
          currency: true,
        },
      }),
      this.prisma.accInvoice.count({ where }),
    ]);

    // Manually fetch business names for invoices that have businessId
    const businessIds = [...new Set(invoices.map(i => i.businessId).filter(Boolean))];
    const businesses = businessIds.length > 0
      ? await this.prisma.business.findMany({
        where: { id: { in: businessIds } },
        select: { id: true, nameAr: true, nameEn: true },
      })
      : [];

    const businessMap = new Map(businesses.map(b => [b.id, b]));

    // Map business data to invoices
    const invoicesWithBusiness = invoices.map(invoice => ({
      ...invoice,
      business: invoice.businessId ? businessMap.get(invoice.businessId) || null : null,
    }));

    console.log('✅ Found invoices:', { count: invoices.length, total, withBusiness: businesses.length });

    return {
      data: invoicesWithBusiness,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * الحصول على تفاصيل فاتورة واحدة
   */
  async getInvoiceById(userId: string, invoiceId: string) {
    console.log('📋 AgentPortalService.getInvoiceById called:', { userId, invoiceId });

    const invoice = await this.prisma.accInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        lines: true,
        currency: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('الفاتورة غير موجودة');
    }

    // التحقق من أن الفاتورة أنشأها المندوب
    if (invoice.createdById !== userId) {
      throw new ForbiddenException('ليس لديك صلاحية الوصول لهذه الفاتورة');
    }

    return invoice;
  }

  /**
   * تجديد/تمديد باقة لنشاط تجاري
   * يستخدم نفس آلية إنشاء الفواتير الموجودة في WalletService
   */
  async renewBusinessPackage(
    userId: string,
    businessId: string,
    data: {
      packageId: string;
      paymentMethod: 'CASH' | 'WALLET';
      notes?: string;
    }
  ) {
    console.log('📦 AgentPortalService.renewBusinessPackage - بدء العملية...', {
      userId,
      businessId,
      packageId: data.packageId,
      paymentMethod: data.paymentMethod,
    });

    // التحقق من أن النشاط تابع للمندوب
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: {
        package: {
          include: {
            package: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!business) {
      throw new NotFoundException('النشاط التجاري غير موجود');
    }

    if (business.agentId !== userId) {
      throw new ForbiddenException('هذا النشاط غير مسجل لك');
    }

    // التحقق من وجود مالك للنشاط
    if (!business.ownerId || !business.owner) {
      throw new BadRequestException(
        'لا يمكن تجديد الباقة. النشاط التجاري غير مرتبط بمستخدم. يرجى ربط النشاط بمالكه أولاً.'
      );
    }

    // جلب الباقة
    const packageData = await this.prisma.package.findUnique({
      where: { id: data.packageId },
    });

    if (!packageData) {
      throw new NotFoundException('الباقة غير موجودة');
    }

    console.log('✅ التحقق من البيانات: النشاط موجود والمالك موجود', {
      businessId: business.id,
      ownerId: business.ownerId,
      ownerName: `${business.owner.firstName} ${business.owner.lastName}`,
      packageName: packageData.nameAr,
    });

    // إذا كان الدفع من المحفظة: استخدام WalletService (نفس آلية المستخدم)
    if (data.paymentMethod === 'WALLET') {
      console.log('💳 الدفع من المحفظة - استخدام WalletService...');

      const walletPaymentResult = await this.walletService.payFromWallet(
        business.ownerId, // ✅ المالك هو من يدفع من محفظته
        {
          businessId,
          packageId: data.packageId,
          durationDays: packageData.durationDays,
        }
      );

      console.log('✅ تم الدفع من المحفظة بنجاح', {
        invoiceId: walletPaymentResult.accounting?.invoiceId,
        transactionId: walletPaymentResult.transaction?.id,
      });

      // ✅ إنشاء عمولة للمندوب (تتم في PackagesService تلقائياً)
      // ✅ الفاتورة تُنشأ تلقائياً بـ customerId = المالك

      return {
        success: true,
        message: 'تم تجديد الباقة وخصم المبلغ من محفظة المالك بنجاح',
        ...walletPaymentResult,
      };
    }

    // إذا كان الدفع نقدي: نستخدم PackagesService مباشرة ونسجل تحصيل للمندوب
    if (data.paymentMethod === 'CASH') {
      console.log('💵 الدفع نقدي - استخدام PackagesService مع تسجيل تحصيل...');

      // تعيين الباقة (سيتم إنشاء الفاتورة وربط createdById بالمنفذ)
      const packagesService = await this.packagesService.assignPackage(
        {
          businessId,
          packageId: data.packageId,
          durationDays: packageData.durationDays,
        },
        userId,
        UserRole.AGENT,
      );

      console.log('✅ تم تعيين الباقة بنجاح');

      // تسجيل تحصيل نقدي للمندوب
      const agentProfile = await this.prisma.agentProfile.findUnique({
        where: { userId },
      });

      if (!agentProfile) {
        throw new ForbiddenException('لم يتم العثور على ملف المندوب');
      }

      const collection = await this.prisma.agentCollection.create({
        data: {
          agentProfileId: agentProfile.id,
          businessId,
          amount: packageData.price,
          status: 'COLLECTED',
          collectedAt: new Date(),
          notes: data.notes || `تحصيل نقدي لتجديد باقة ${packageData.nameAr}`,
        },
      });

      console.log('✅ تم تسجيل التحصيل النقدي للمندوب');

      // ✅ إنشاء فاتورة باستخدام نفس آلية المحاسبة
      const { AccountingService } = await import('../accounting/accounting.service');
      const accountingService = new AccountingService(
        this.prisma,
        null as any,
      );

      const invoice = await accountingService.createInvoice(userId, {
        customerId: business.ownerId,
        customerName: `${business.owner.firstName} ${business.owner.lastName}`,
        businessId,
        invoiceType: 'SUBSCRIPTION',
        notes: data.notes,
        lines: [
          {
            description: `تجديد باقة ${packageData.nameAr}`,
            quantity: 1,
            unitPrice: Number(packageData.price),
          },
        ],
      });

      console.log('✅ تم إنشاء الفاتورة بنجاح', { invoiceId: invoice.id });

      return {
        success: true,
        message: 'تم تجديد الباقة بنجاح. تحصيل نقدي مسجل.',
        subscription: {
          packageName: packageData.nameAr,
          startDate: packagesService.startDate,
          endDate: packagesService.endDate,
        },
        collection: {
          id: collection.id,
          amount: Number(collection.amount),
        },
        accounting: {
          invoiceId: invoice.id,
        },
      };
    }

    throw new BadRequestException('طريقة دفع غير صحيحة');
  }

  /**
   * تسجيل نتيجة زيارة تجديد
   */
  async recordRenewalVisit(
    userId: string,
    renewalId: string,
    data: {
      outcome: 'ACCEPTED' | 'DECLINED' | 'POSTPONED' | 'NOT_AVAILABLE';
      newPackageId?: string;
      notes?: string;
      nextVisitDate?: string;
    }
  ) {
    const renewal = await this.prisma.renewalRecord.findUnique({
      where: { id: renewalId },
      include: {
        business: true,
      },
    });

    if (!renewal) {
      throw new NotFoundException('سجل التجديد غير موجود');
    }

    if (renewal.assignedAgentId !== userId) {
      throw new ForbiddenException('هذا التجديد غير مخصص لك');
    }

    const agentProfile = await this.prisma.agentProfile.findUnique({
      where: { userId },
    });

    if (!agentProfile) {
      throw new ForbiddenException('لم يتم إنشاء ملف المندوب الخاص بك بعد');
    }

    // تسجيل محاولة الاتصال/الزيارة
    await this.prisma.renewalContact.create({
      data: {
        renewalRecordId: renewalId,
        agentId: userId,
        contactMethod: 'VISIT',
        contactDate: new Date(),
        notes: data.notes,
        outcome: data.outcome as any,
        nextContactDate: data.nextVisitDate ? new Date(data.nextVisitDate) : null,
      },
    });

    // تحديث حالة التجديد بناءً على النتيجة
    let newStatus: any = renewal.status;

    switch (data.outcome) {
      case 'ACCEPTED':
        newStatus = 'RENEWED';
        break;
      case 'DECLINED':
        newStatus = 'DECLINED';
        break;
      case 'POSTPONED':
        newStatus = 'VISIT_SCHEDULED';
        break;
      case 'NOT_AVAILABLE':
        // زيادة عداد المحاولات
        break;
    }

    await this.prisma.renewalRecord.update({
      where: { id: renewalId },
      data: {
        status: newStatus,
        decisionDate: data.outcome === 'ACCEPTED' || data.outcome === 'DECLINED' ? new Date() : null,
        finalDecision: data.outcome === 'ACCEPTED' ? 'ACCEPTED' : data.outcome === 'DECLINED' ? 'DECLINED' : null,
        newPackageId: data.newPackageId,
        internalNotes: data.notes,
        followUpCount: { increment: 1 },
        nextFollowUpDate: data.nextVisitDate ? new Date(data.nextVisitDate) : null,
      },
    });

    // إذا قبل التجديد، نقوم بتنفيذه
    if (data.outcome === 'ACCEPTED' && data.newPackageId) {
      await this.renewBusinessPackage(userId, renewal.businessId, {
        packageId: data.newPackageId,
        paymentMethod: 'CASH',
        notes: `تجديد تلقائي بعد زيارة المندوب - ${data.notes || ''}`,
      });
    }

    return {
      success: true,
      message: 'تم تسجيل نتيجة الزيارة بنجاح',
    };
  }
}
