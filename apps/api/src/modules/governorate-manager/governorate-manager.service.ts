import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole, BusinessStatus } from '@greenpages/database';
import * as bcrypt from 'bcrypt';
import { CreateAgentDto } from './dto/create-agent.dto';
import { BusinessesService } from '../businesses/businesses.service';
import { CommissionsService } from '../commissions/commissions.service';

@Injectable()
export class GovernorateManagerService {
  constructor(
    private prisma: PrismaService,
    private businessesService: BusinessesService,
    private commissionsService: CommissionsService,
  ) {}

  private async assertManagerCanAccessGovernorate(managerUserId: string, governorateId: string) {
    const governorateIds = await this.getManagerGovernorateIds(managerUserId);
    if (!governorateIds.includes(governorateId)) {
      throw new ForbiddenException('ليس لديك صلاحية الوصول لهذه المحافظة');
    }
    return governorateIds;
  }

  private async assertManagerCanAccessBusiness(managerUserId: string, businessId: string) {
    const governorateIds = await this.getManagerGovernorateIds(managerUserId);
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, governorateId: true },
    });
    if (!business) {
      throw new NotFoundException('النشاط التجاري غير موجود');
    }
    if (!governorateIds.includes(business.governorateId)) {
      throw new ForbiddenException('ليس لديك صلاحية الوصول لهذا النشاط التجاري');
    }
    return business;
  }

  /**
   * الحصول على لوحة التحكم لمدير المحافظة
   */
  async getDashboard(userId: string) {
    // جلب المحافظات المخصصة للمدير
    const managerGovernorates = await this.prisma.governorateManager.findMany({
      where: { userId, isActive: true },
      include: { governorate: true },
    });

    if (managerGovernorates.length === 0) {
      throw new ForbiddenException('لم يتم تعيين محافظات لك بعد');
    }

    const governorateIds = managerGovernorates.map(g => g.governorateId);

    // إحصائيات الأنشطة
    const [
      totalBusinesses,
      pendingBusinesses,
      approvedBusinesses,
      totalAgents,
      activeAgents,
      pendingRenewals,
      completedRenewals,
      totalVisits,
      totalCommissions,
      approvedCommissions,
      paidCommissions,
      totalSubscriptions,
    ] = await Promise.all([
      // إجمالي الأنشطة في المحافظات
      this.prisma.business.count({
        where: { governorateId: { in: governorateIds } },
      }),
      // الأنشطة المعلقة
      this.prisma.business.count({
        where: { 
          governorateId: { in: governorateIds },
          status: 'PENDING',
        },
      }),
      // الأنشطة الموافق عليها
      this.prisma.business.count({
        where: { 
          governorateId: { in: governorateIds },
          status: 'APPROVED',
        },
      }),
      // إجمالي المندوبين
      this.prisma.agentProfile.count({
        where: {
          governorates: {
            some: { governorateId: { in: governorateIds } },
          },
        },
      }),
      // المندوبين النشطين
      this.prisma.agentProfile.count({
        where: {
          isActive: true,
          governorates: {
            some: { governorateId: { in: governorateIds } },
          },
        },
      }),
      // التجديدات المعلقة
      this.prisma.renewalRecord.count({
        where: {
          business: { governorateId: { in: governorateIds } },
          status: 'PENDING',
        },
      }),
      // التجديدات المكتملة
      this.prisma.renewalRecord.count({
        where: {
          business: { governorateId: { in: governorateIds } },
          status: 'RENEWED',
        },
      }),
      // الزيارات الميدانية
      this.prisma.agentVisit.count({
        where: { governorateId: { in: governorateIds } },
      }),
      // إجمالي العمولات في المحافظات
      this.prisma.agentCommission.aggregate({
        where: {
          business: { governorateId: { in: governorateIds } },
        },
        _sum: { commissionAmount: true },
        _count: true,
      }),
      // العمولات المعتمدة
      this.prisma.agentCommission.aggregate({
        where: {
          business: { governorateId: { in: governorateIds } },
          status: 'APPROVED',
        },
        _sum: { commissionAmount: true },
      }),
      // العمولات المدفوعة
      this.prisma.agentCommission.aggregate({
        where: {
          business: { governorateId: { in: governorateIds } },
          status: 'PAID',
        },
        _sum: { commissionAmount: true },
      }),
      // إجمالي الاشتراكات (من العمولات)
      this.prisma.agentCommission.aggregate({
        where: {
          business: { governorateId: { in: governorateIds } },
        },
        _sum: { subscriptionAmount: true },
      }),
    ]);

    // آخر الأنشطة المضافة
    const recentBusinesses = await this.prisma.business.findMany({
      where: { governorateId: { in: governorateIds } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        governorate: { select: { nameAr: true } },
        city: { select: { nameAr: true } },
        agent: { select: { firstName: true, lastName: true } },
      },
    });

    // أفضل المندوبين
    const topAgents = await this.prisma.agentProfile.findMany({
      where: {
        governorates: {
          some: { governorateId: { in: governorateIds } },
        },
        isActive: true,
      },
      orderBy: { totalCommissions: 'desc' },
      take: 5,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        governorates: {
          include: {
            governorate: { select: { nameAr: true } },
          },
        },
      },
    });

    // إحصائيات المحافظات
    const governorateStats = await Promise.all(
      governorateIds.map(async (govId) => {
        const [businessCount, commissionsSum, agentsCount] = await Promise.all([
          this.prisma.business.count({
            where: { governorateId: govId, status: 'APPROVED' },
          }),
          this.prisma.agentCommission.aggregate({
            where: { business: { governorateId: govId } },
            _sum: { subscriptionAmount: true, commissionAmount: true },
          }),
          this.prisma.agentProfile.count({
            where: {
              governorates: { some: { governorateId: govId } },
              isActive: true,
            },
          }),
        ]);

        const gov = managerGovernorates.find(g => g.governorateId === govId);

        return {
          governorateId: govId,
          governorateName: gov?.governorate?.nameAr || '',
          businessCount,
          totalRevenue: Number(commissionsSum._sum.subscriptionAmount || 0),
          totalCommissions: Number(commissionsSum._sum.commissionAmount || 0),
          agentsCount,
        };
      })
    );

    return {
      governorates: managerGovernorates.map(g => ({
        id: g.governorateId,
        name: g.governorate.nameAr,
      })),
      stats: {
        businesses: {
          total: totalBusinesses,
          pending: pendingBusinesses,
          approved: approvedBusinesses,
        },
        agents: {
          total: totalAgents,
          active: activeAgents,
        },
        renewals: {
          pending: pendingRenewals,
          completed: completedRenewals,
        },
        visits: totalVisits,
        financial: {
          totalSubscriptions: Number(totalSubscriptions._sum.subscriptionAmount || 0),
          totalCommissions: Number(totalCommissions._sum.commissionAmount || 0),
          approvedCommissions: Number(approvedCommissions._sum.commissionAmount || 0),
          paidCommissions: Number(paidCommissions._sum.commissionAmount || 0),
          pendingCommissions: Number(approvedCommissions._sum.commissionAmount || 0) - Number(paidCommissions._sum.commissionAmount || 0),
          commissionsCount: totalCommissions._count || 0,
        },
      },
      recentBusinesses,
      topAgents: topAgents.map(agent => ({
        id: agent.id,
        userId: agent.user.id,
        name: `${agent.user.firstName} ${agent.user.lastName}`,
        email: agent.user.email,
        avatar: agent.user.avatar,
        totalCommissions: Number(agent.totalCommissions),
        totalBusinesses: agent.totalBusinesses,
        commissionRate: Number(agent.commissionRate),
        governorates: agent.governorates.map(g => g.governorate.nameAr),
      })),
      governorateStats,
    };
  }

  /**
   * الحصول على الأنشطة في محافظات المدير
   */
  async getBusinesses(userId: string, query: {
    page?: number;
    limit?: number;
    status?: string;
    governorateId?: string;
    search?: string;
  }) {
    const governorateIds = await this.getManagerGovernorateIds(userId);
    
    const { page = 1, limit = 20, status, governorateId, search } = query;
    const skip = (page - 1) * limit;

    // التحقق من أن المحافظة المطلوبة ضمن صلاحياته
    if (governorateId && !governorateIds.includes(governorateId)) {
      throw new ForbiddenException('ليس لديك صلاحية الوصول لهذه المحافظة');
    }

    const where: any = {
      governorateId: governorateId 
        ? governorateId 
        : { in: governorateIds },
    };

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
          categories: {
            where: { isPrimary: true },
            include: { category: { select: { nameAr: true } } },
            take: 1,
          },
          package: {
            include: {
              package: { select: { nameAr: true } },
            },
          },
          agent: { select: { id: true, firstName: true, lastName: true } },
          owner: { select: { id: true, firstName: true, lastName: true, email: true } },
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
   * عرض نشاط تجاري ضمن محافظات المدير
   */
  async getBusiness(managerUserId: string, businessId: string) {
    await this.assertManagerCanAccessBusiness(managerUserId, businessId);
    return this.businessesService.findById(businessId);
  }

  /**
   * إنشاء نشاط تجاري ضمن محافظات المدير
   */
  async createBusiness(managerUserId: string, dto: any) {
    if (!dto?.governorateId) {
      throw new BadRequestException('يجب تحديد المحافظة');
    }
    await this.assertManagerCanAccessGovernorate(managerUserId, dto.governorateId);

    const data = {
      ...dto,
      createdById: managerUserId,
      // governorate manager creates as himself; agentId can be optionally provided in dto if backend supports it.
    };

    return this.businessesService.create(data);
  }

  /**
   * تحديث نشاط تجاري ضمن محافظات المدير
   */
  async updateBusiness(managerUserId: string, businessId: string, dto: any) {
    await this.assertManagerCanAccessBusiness(managerUserId, businessId);
    return this.businessesService.update(businessId, dto);
  }

  /**
   * التسويات المعلقة ضمن محافظات المدير
   */
  async getPendingSettlements(managerUserId: string, query: { page?: number; limit?: number }) {
    const governorateIds = await this.getManagerGovernorateIds(managerUserId);
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      status: 'PENDING',
      agentProfile: {
        governorates: {
          some: { governorateId: { in: governorateIds } },
        },
      },
    };

    const [settlements, total] = await Promise.all([
      this.prisma.agentSettlement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { requestedAt: 'desc' },
        include: {
          agentProfile: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  phone: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.agentSettlement.count({ where }),
    ]);

    return {
      data: settlements,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * إنشاء مندوب جديد
   */
  async createAgent(managerUserId: string, dto: CreateAgentDto) {
    // 1. Verify manager has access to at least one of the managed governorates
    const managerGovernorates = await this.getManagerGovernorateIds(managerUserId);
    
    // التحقق من المحافظات المخصصة للمندوب بدلاً من الموقع الجغرافي
    const governoratesToAssign = Array.isArray(dto.managedGovernorateIds) && dto.managedGovernorateIds.length > 0
      ? dto.managedGovernorateIds
      : (dto.governorateId ? [dto.governorateId] : []);

    if (governoratesToAssign.length === 0) {
      throw new BadRequestException('يجب تحديد محافظة واحدة على الأقل للمندوب');
    }

    // التأكد من أن جميع المحافظات المخصصة ضمن صلاحيات المدير
    const invalidGovernorates = governoratesToAssign.filter(id => !managerGovernorates.includes(id));
    if (invalidGovernorates.length > 0) {
      throw new ForbiddenException('ليس لديك صلاحية إضافة مندوب لبعض المحافظات المحددة');
    }

    // 2. Check if user exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.email },
          { phone: dto.phone }
        ]
      }
    });

    if (existingUser) {
      throw new BadRequestException('المستخدم موجود مسبقاً (البريد الإلكتروني أو رقم الهاتف)');
    }

    // 3. Create User and AgentProfile
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.$transaction(async (tx) => {
      // Create User
      const user = await tx.user.create({
        data: {
          email: dto.email,
          phone: dto.phone,
          firstName: dto.firstName,
          lastName: dto.lastName,
          password: hashedPassword,
          role: UserRole.AGENT,
          status: 'ACTIVE',
          governorateId: dto.governorateId,
          cityId: dto.cityId,
          districtId: dto.districtId,
          emailVerified: true,
        }
      });

      // Create Agent Profile
      const agentProfile = await tx.agentProfile.create({
        data: {
          userId: user.id,
          managerId: managerUserId,
          baseSalary: dto.baseSalary ?? 0,
          commissionRate: dto.commissionRate ?? 10,
          isActive: true,
          requiresApproval: dto.requiresApproval ?? true,
        }
      });

      // Assign to Governorates (either selected list or fallback to primary governorateId)
      const governoratesToAssignRaw =
        Array.isArray(dto.managedGovernorateIds) && dto.managedGovernorateIds.length > 0
          ? dto.managedGovernorateIds
          : (dto.governorateId ? [dto.governorateId] : []);

      const governoratesToAssign = Array.from(new Set(governoratesToAssignRaw));

      if (governoratesToAssign.length > 0) {
        await tx.agentGovernorate.createMany({
          data: governoratesToAssign.map((governorateId) => ({
            agentProfileId: agentProfile.id,
            governorateId,
            isActive: true,
          })),
        });
      }

      return agentProfile;
    });
  }

  /**
   * الحصول على المندوبين التابعين
   */
  async getAgents(userId: string, query: {
    page?: number;
    limit?: number;
    isActive?: boolean;
  }) {
    const governorateIds = await this.getManagerGovernorateIds(userId);
    
    const { page = 1, limit = 20, isActive } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      governorates: {
        some: { governorateId: { in: governorateIds } },
      },
    };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [agents, total] = await Promise.all([
      this.prisma.agentProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              avatar: true,
            },
          },
          governorates: {
            include: {
              governorate: { select: { nameAr: true } },
            },
          },
          _count: {
            select: {
              commissions: true,
              visits: true,
            },
          },
        },
      }),
      this.prisma.agentProfile.count({ where }),
    ]);

    return {
      data: agents,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * تعيين مندوب لمحافظة
   */
  async assignAgentToGovernorate(
    userId: string, 
    agentUserId: string, 
    governorateId: string
  ) {
    const governorateIds = await this.getManagerGovernorateIds(userId);

    // التحقق من أن المحافظة ضمن صلاحياته
    if (!governorateIds.includes(governorateId)) {
      throw new ForbiddenException('ليس لديك صلاحية تعيين مندوب لهذه المحافظة');
    }

    // التحقق من وجود ملف المندوب
    let agentProfile = await this.prisma.agentProfile.findUnique({
      where: { userId: agentUserId },
    });

    if (!agentProfile) {
      // إنشاء ملف مندوب جديد
      agentProfile = await this.prisma.agentProfile.create({
        data: {
          userId: agentUserId,
          managerId: userId,
        },
      });
    }

    // تعيين المندوب للمحافظة
    await this.prisma.agentGovernorate.upsert({
      where: {
        agentProfileId_governorateId: {
          agentProfileId: agentProfile.id,
          governorateId,
        },
      },
      update: { isActive: true },
      create: {
        agentProfileId: agentProfile.id,
        governorateId,
      },
    });

    return { message: 'تم تعيين المندوب بنجاح' };
  }

  /**
   * إزالة مندوب من محافظة
   */
  async removeAgentFromGovernorate(
    userId: string, 
    agentProfileId: string, 
    governorateId: string
  ) {
    const governorateIds = await this.getManagerGovernorateIds(userId);

    if (!governorateIds.includes(governorateId)) {
      throw new ForbiddenException('ليس لديك صلاحية إزالة مندوب من هذه المحافظة');
    }

    await this.prisma.agentGovernorate.updateMany({
      where: {
        agentProfileId,
        governorateId,
      },
      data: { isActive: false },
    });

    return { message: 'تم إزالة المندوب من المحافظة' };
  }

  /**
   * الحصول على التجديدات في المحافظات
   */
  async getRenewals(userId: string, query: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const governorateIds = await this.getManagerGovernorateIds(userId);
    
    const { page = 1, limit = 20, status } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      business: { governorateId: { in: governorateIds } },
    };

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
              governorate: { select: { nameAr: true } },
              city: { select: { nameAr: true } },
            },
          },
          assignedAgent: { select: { firstName: true, lastName: true } },
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
   * تعيين مندوب لتجديد
   */
  async assignRenewalToAgent(
    userId: string,
    renewalId: string,
    agentUserId: string
  ) {
    const governorateIds = await this.getManagerGovernorateIds(userId);

    const renewal = await this.prisma.renewalRecord.findUnique({
      where: { id: renewalId },
      include: { business: { select: { governorateId: true } } },
    });

    if (!renewal) {
      throw new NotFoundException('التجديد غير موجود');
    }

    if (!governorateIds.includes(renewal.business.governorateId)) {
      throw new ForbiddenException('ليس لديك صلاحية إدارة هذا التجديد');
    }

    await this.prisma.renewalRecord.update({
      where: { id: renewalId },
      data: {
        assignedAgentId: agentUserId,
        status: 'CONTACTED',
      },
    });

    return { message: 'تم تعيين المندوب للتجديد' };
  }

  /**
   * الحصول على تقارير المحافظة
   */
  async getReports(userId: string, period: 'day' | 'week' | 'month' | 'year' = 'month') {
    const governorateIds = await this.getManagerGovernorateIds(userId);

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    const [
      totalBusinesses,
      newBusinesses,
      renewedBusinesses,
      rejectedBusinesses,
      agentVisits,
      commissions,
      governoratesData,
      agentsData,
    ] = await Promise.all([
      // Total businesses in manager's governorates
      this.prisma.business.count({
        where: { governorateId: { in: governorateIds } },
      }),
      // New businesses in period
      this.prisma.business.count({
        where: {
          governorateId: { in: governorateIds },
          createdAt: { gte: startDate },
        },
      }),
      // Renewals in period
      this.prisma.renewalRecord.count({
        where: {
          business: { governorateId: { in: governorateIds } },
          status: 'RENEWED',
          updatedAt: { gte: startDate },
        },
      }),
      this.prisma.business.count({
        where: {
          governorateId: { in: governorateIds },
          status: 'REJECTED',
          updatedAt: { gte: startDate },
        },
      }),
      this.prisma.agentVisit.count({
        where: {
          governorateId: { in: governorateIds },
          createdAt: { gte: startDate },
        },
      }),
      this.prisma.agentCommission.aggregate({
        where: {
          business: { governorateId: { in: governorateIds } },
          createdAt: { gte: startDate },
        },
        _sum: { commissionAmount: true },
      }),
      // Stats per governorate
      this.prisma.governorate.findMany({
        where: { id: { in: governorateIds } },
        select: {
          id: true,
          nameAr: true,
          _count: {
            select: {
              businesses: true,
            },
          },
        },
      }),
      // Top agents by businesses created in period
      this.prisma.business.groupBy({
        by: ['createdById'],
        where: {
          governorateId: { in: governorateIds },
          createdAt: { gte: startDate },
          createdById: { not: null },
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 5,
      }),
    ]);

    // Get agent counts per governorate
    const governorateAgentCounts = await Promise.all(
      governorateIds.map(async (govId) => {
        const count = await this.prisma.agentProfile.count({
          where: {
            governorates: {
              some: { governorateId: govId },
            },
          },
        });
        return { governorateId: govId, count };
      }),
    );

    // Fetch agent details for top agents
    const topAgentsWithDetails = await Promise.all(
      agentsData.map(async (group) => {
        if (!group.createdById) return null;
        const user = await this.prisma.user.findUnique({
          where: { id: group.createdById },
          select: { firstName: true, lastName: true },
        });
        return {
          name: user ? `${user.firstName} ${user.lastName}` : 'غير محدد',
          businesses: group._count.id,
          revenue: 0, // Can be calculated from commissions if needed
        };
      }),
    );


    const totalRevenue = commissions._sum.commissionAmount || 0;
    const previousPeriodStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));
    const previousNewBusinesses = await this.prisma.business.count({
      where: {
        governorateId: { in: governorateIds },
        createdAt: { gte: previousPeriodStart, lt: startDate },
      },
    });
    const growthRate = previousNewBusinesses > 0
      ? ((newBusinesses - previousNewBusinesses) / previousNewBusinesses) * 100
      : newBusinesses > 0 ? 100 : 0;

    // Build governorateStats
    const governorateStats = governoratesData.map((gov) => {
      const agentCount = governorateAgentCounts.find((g) => g.governorateId === gov.id)?.count || 0;
      return {
        name: gov.nameAr,
        businesses: gov._count.businesses,
        agents: agentCount,
        revenue: 0, // Can be calculated if package revenue is tracked per governorate
      };
    });

    // Build topAgents
    const topAgents = topAgentsWithDetails.filter((agent) => agent !== null);

    // Monthly trend (simplified - just return current period data)
    const monthlyTrend = [
      {
        month: period === 'month' ? 'الشهر الحالي' : period === 'week' ? 'الأسبوع الحالي' : 'الفترة الحالية',
        businesses: newBusinesses,
        renewals: renewedBusinesses,
        revenue: totalRevenue,
      },
    ];

    return {
      summary: {
        totalBusinesses,
        newBusinesses,
        renewals: renewedBusinesses,
        revenue: totalRevenue,
        growthRate: Math.round(growthRate * 10) / 10,
      },
      governorateStats,
      monthlyTrend,
      topAgents,
    };
  }

  /**
   * تحديث البيانات المالية للمندوب
   */
  async updateAgentFinancials(
    managerUserId: string,
    agentProfileId: string,
    data: { baseSalary?: number; commissionRate?: number },
  ) {
    // 1. Verify Manager
    const managerGovernorates = await this.prisma.governorateManager.findMany({
      where: { userId: managerUserId, isActive: true },
    });
    const governorateIds = managerGovernorates.map(g => g.governorateId);

    // 2. Verify Agent belongs to Manager's governorates
    const agent = await this.prisma.agentProfile.findFirst({
      where: {
        id: agentProfileId,
        governorates: {
          some: { governorateId: { in: governorateIds } }
        }
      }
    });

    if (!agent) {
      throw new ForbiddenException('هذا المندوب لا يتبع للمحافظات التي تديرها');
    }

    // 3. Update
    return this.prisma.agentProfile.update({
      where: { id: agentProfileId },
      data: {
        baseSalary: data.baseSalary,
        commissionRate: data.commissionRate,
      },
    });
  }

  /**
   * تحديث المحافظات المخصصة للمندوب
   */
  async updateAgentGovernorates(
    managerUserId: string,
    agentProfileId: string,
    newGovernorateIds: string[],
  ) {
    // 1. Get manager's accessible governorates
    const managerGovIds = await this.getManagerGovernorateIds(managerUserId);

    // 2. Verify all new governorate IDs are within manager's scope
    const invalidIds = newGovernorateIds.filter(id => !managerGovIds.includes(id));
    if (invalidIds.length > 0) {
      throw new ForbiddenException('بعض المحافظات المحددة ليست ضمن صلاحياتك');
    }

    // 3. Verify agent belongs to manager's governorates
    const agent = await this.prisma.agentProfile.findFirst({
      where: {
        id: agentProfileId,
        governorates: {
          some: { governorateId: { in: managerGovIds } }
        }
      }
    });

    if (!agent) {
      throw new ForbiddenException('هذا المندوب لا يتبع للمحافظات التي تديرها');
    }

    // 4. Update: Delete old + Create new
    await this.prisma.$transaction(async (tx) => {
      await tx.agentGovernorate.deleteMany({
        where: { agentProfileId }
      });

      if (newGovernorateIds.length > 0) {
        await tx.agentGovernorate.createMany({
          data: newGovernorateIds.map(governorateId => ({
            agentProfileId,
            governorateId,
            isActive: true,
          })),
        });
      }
    });

    return { success: true, message: 'تم تحديث المحافظات المخصصة بنجاح' };
  }

  /**
   * تفاصيل المندوب
   */
  async getAgent(managerUserId: string, agentProfileId: string) {
    const governorateIds = await this.getManagerGovernorateIds(managerUserId);

    const agent = await this.prisma.agentProfile.findFirst({
      where: {
        id: agentProfileId,
        governorates: { some: { governorateId: { in: governorateIds } } }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
          }
        },
        governorates: { include: { governorate: true } },
        _count: { select: { visits: true, commissions: true } }
      }
    });

    if (!agent) throw new NotFoundException('المندوب غير موجود');
    return agent;
  }

  /**
   * الموافقة على نشاط تجاري
   */
  async approveBusiness(managerUserId: string, businessId: string) {
    const governorateIds = await this.getManagerGovernorateIds(managerUserId);

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, governorateId: true, status: true },
    });

    if (!business) {
      throw new NotFoundException('النشاط التجاري غير موجود');
    }

    if (!governorateIds.includes(business.governorateId)) {
      throw new ForbiddenException('ليس لديك صلاحية الموافقة على هذا النشاط');
    }

    if (business.status !== BusinessStatus.PENDING) {
      throw new BadRequestException('هذا النشاط ليس في حالة الانتظار');
    }

    await this.prisma.business.update({
      where: { id: businessId },
      data: {
        status: BusinessStatus.APPROVED,
        verificationStatus: 'VERIFIED',
      },
    });

    // إنشاء العمولات عند الموافقة على النشاط
    try {
      await this.commissionsService.createCommissionsForBusiness(businessId);
    } catch (error) {
      console.error('Error creating commissions:', error);
      // نكمل عملية الموافقة حتى لو فشل إنشاء العمولات
    }

    return { success: true, message: 'تمت الموافقة على النشاط التجاري' };
  }

  /**
   * رفض نشاط تجاري
   */
  async rejectBusiness(managerUserId: string, businessId: string, reason?: string) {
    const governorateIds = await this.getManagerGovernorateIds(managerUserId);

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, governorateId: true, status: true },
    });

    if (!business) {
      throw new NotFoundException('النشاط التجاري غير موجود');
    }

    if (!governorateIds.includes(business.governorateId)) {
      throw new ForbiddenException('ليس لديك صلاحية رفض هذا النشاط');
    }

    if (business.status !== BusinessStatus.PENDING) {
      throw new BadRequestException('هذا النشاط ليس في حالة الانتظار');
    }

    // حذف العمولات إن وجدت (في حالة تم إنشاؤها بالخطأ)
    try {
      await this.commissionsService.deleteCommissionsForBusiness(businessId);
    } catch (error) {
      console.error('Error deleting commissions:', error);
    }

    await this.prisma.business.update({
      where: { id: businessId },
      data: {
        status: BusinessStatus.REJECTED,
      },
    });

    return { success: true, message: 'تم رفض النشاط التجاري' };
  }

  /**
   * تقارير أداء المندوبين
   */
  async getAgentsPerformance(managerUserId: string, query: {
    page?: number;
    limit?: number;
    period?: 'week' | 'month' | 'year';
    sortBy?: 'businesses' | 'commissions' | 'collections';
  }) {
    const governorateIds = await this.getManagerGovernorateIds(managerUserId);
    const { page = 1, limit = 20, period = 'month', sortBy = 'businesses' } = query;
    const skip = (page - 1) * limit;

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    // Get agents with performance data
    const agents = await this.prisma.agentProfile.findMany({
      where: {
        governorates: {
          some: { governorateId: { in: governorateIds } },
        },
        isActive: true,
      },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        governorates: {
          include: {
            governorate: { select: { nameAr: true } },
          },
        },
        _count: {
          select: {
            visits: true,
            commissions: true,
            collections: true,
          },
        },
      },
    });

    // Get detailed performance for each agent
    const agentsWithPerformance = await Promise.all(
      agents.map(async (agent) => {
        const [
          businessesCreated,
          totalCommissions,
          totalCollections,
          pendingCollections,
          recentVisits,
        ] = await Promise.all([
          // Businesses created in period
          this.prisma.business.count({
            where: {
              createdById: agent.userId,
              createdAt: { gte: startDate },
            },
          }),
          // Total commissions earned in period
          this.prisma.agentCommission.aggregate({
            where: {
              agentProfileId: agent.id,
              createdAt: { gte: startDate },
            },
            _sum: { commissionAmount: true },
            _count: true,
          }),
          // Total collections in period
          this.prisma.agentCollection.aggregate({
            where: {
              agentProfileId: agent.id,
              collectedAt: { gte: startDate },
            },
            _sum: { amount: true },
            _count: true,
          }),
          // Pending collections (not settled yet)
          this.prisma.agentCollection.aggregate({
            where: {
              agentProfileId: agent.id,
              status: 'COLLECTED',
            },
            _sum: { amount: true },
          }),
          // Recent visits in period
          this.prisma.agentVisit.count({
            where: {
              agentProfileId: agent.id,
              createdAt: { gte: startDate },
            },
          }),
        ]);

        return {
          ...agent,
          performance: {
            businessesCreated,
            commissionsEarned: totalCommissions._sum.commissionAmount || 0,
            commissionsCount: totalCommissions._count || 0,
            collectionsTotal: totalCollections._sum.amount || 0,
            collectionsCount: totalCollections._count || 0,
            pendingCollections: pendingCollections._sum.amount || 0,
            visitsCount: recentVisits,
          },
        };
      })
    );

    // Sort based on selected criteria
    agentsWithPerformance.sort((a, b) => {
      switch (sortBy) {
        case 'commissions':
          return Number(b.performance.commissionsEarned) - Number(a.performance.commissionsEarned);
        case 'collections':
          return Number(b.performance.collectionsTotal) - Number(a.performance.collectionsTotal);
        case 'businesses':
        default:
          return b.performance.businessesCreated - a.performance.businessesCreated;
      }
    });

    // Get total count
    const total = await this.prisma.agentProfile.count({
      where: {
        governorates: {
          some: { governorateId: { in: governorateIds } },
        },
        isActive: true,
      },
    });

    // Calculate summary stats
    const summary = {
      totalAgents: total,
      totalBusinesses: agentsWithPerformance.reduce(
        (sum, a) => sum + a.performance.businessesCreated,
        0
      ),
      totalCommissions: agentsWithPerformance.reduce(
        (sum, a) => sum + Number(a.performance.commissionsEarned),
        0
      ),
      totalCollections: agentsWithPerformance.reduce(
        (sum, a) => sum + Number(a.performance.collectionsTotal),
        0
      ),
      totalVisits: agentsWithPerformance.reduce(
        (sum, a) => sum + a.performance.visitsCount,
        0
      ),
      averageBusinessesPerAgent:
        total > 0
          ? agentsWithPerformance.reduce((sum, a) => sum + a.performance.businessesCreated, 0) /
            total
          : 0,
    };

    return {
      data: agentsWithPerformance,
      summary,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        period,
        startDate,
        endDate: now,
      },
    };
  }

  /**
   * الحصول على الأعمال المعلقة (بانتظار الموافقة)
   */
  async getPendingBusinesses(managerUserId: string, query: { page?: number; limit?: number }) {
    const governorateIds = await this.getManagerGovernorateIds(managerUserId);
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [businesses, total] = await Promise.all([
      this.prisma.business.findMany({
        where: {
          governorateId: { in: governorateIds },
          status: BusinessStatus.PENDING,
          deletedAt: null,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          governorate: { select: { nameAr: true } },
          city: { select: { nameAr: true } },
          district: { select: { nameAr: true } },
          categories: {
            include: { category: { select: { nameAr: true } } },
          },
        },
      }),
      this.prisma.business.count({
        where: {
          governorateId: { in: governorateIds },
          status: BusinessStatus.PENDING,
          deletedAt: null,
        },
      }),
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
   * الحصول على أرصدة المندوبين (المبالغ في ذمتهم)
   */
  async getAgentsBalances(managerUserId: string, query: { page?: number; limit?: number }) {
    const governorateIds = await this.getManagerGovernorateIds(managerUserId);
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    // Get agents in manager's governorates
    const [agents, total] = await Promise.all([
      this.prisma.agentProfile.findMany({
        where: {
          governorates: {
            some: { governorateId: { in: governorateIds } },
          },
          isActive: true,
        },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              avatar: true,
            },
          },
          governorates: {
            include: {
              governorate: { select: { nameAr: true } },
            },
          },
        },
      }),
      this.prisma.agentProfile.count({
        where: {
          governorates: {
            some: { governorateId: { in: governorateIds } },
          },
          isActive: true,
        },
      }),
    ]);

    // Get financial data for each agent
    const agentsWithBalances = await Promise.all(
      agents.map(async (agent) => {
        const [
          totalCollectedResult,
          pendingCollectionsResult,
          totalSubmittedResult,
          lastCollection,
        ] = await Promise.all([
          // إجمالي المقبوضات
          this.prisma.agentCollection.aggregate({
            where: { agentProfileId: agent.id },
            _sum: { amount: true },
          }),
          // المقبوضات غير المُسلّمة (الرصيد الحالي في الذمة)
          this.prisma.agentCollection.aggregate({
            where: {
              agentProfileId: agent.id,
              status: 'COLLECTED',
            },
            _sum: { amount: true },
            _count: true,
          }),
          // إجمالي المسلّم
          this.prisma.agentSettlement.aggregate({
            where: {
              agentProfileId: agent.id,
              status: 'COMPLETED',
            },
            _sum: { totalAmount: true },
          }),
          // آخر تحصيل
          this.prisma.agentCollection.findFirst({
            where: { agentProfileId: agent.id },
            orderBy: { collectedAt: 'desc' },
            select: { collectedAt: true, amount: true },
          }),
        ]);

        return {
          id: agent.id,
          userId: agent.userId,
          user: agent.user,
          governorates: agent.governorates.map(g => g.governorate.nameAr),
          commissionRate: Number(agent.commissionRate),
          balance: {
            currentBalance: Number(pendingCollectionsResult._sum.amount || 0),
            pendingCollectionsCount: pendingCollectionsResult._count || 0,
            totalCollected: Number(totalCollectedResult._sum.amount || 0),
            totalSubmitted: Number(totalSubmittedResult._sum.totalAmount || 0),
          },
          lastCollection: lastCollection ? {
            amount: Number(lastCollection.amount),
            date: lastCollection.collectedAt,
          } : null,
        };
      })
    );

    // Sort by current balance (highest first - agents with most money in custody)
    agentsWithBalances.sort((a, b) => b.balance.currentBalance - a.balance.currentBalance);

    // Calculate summary
    const summary = {
      totalAgents: total,
      totalPendingBalance: agentsWithBalances.reduce((sum, a) => sum + a.balance.currentBalance, 0),
      agentsWithBalance: agentsWithBalances.filter(a => a.balance.currentBalance > 0).length,
    };

    return {
      data: agentsWithBalances,
      summary,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * الحصول على تفاصيل المقبوضات غير المسلمة لمندوب معين
   */
  async getAgentPendingCollections(managerUserId: string, agentProfileId: string) {
    const governorateIds = await this.getManagerGovernorateIds(managerUserId);

    // Verify agent belongs to manager's governorates
    const agent = await this.prisma.agentProfile.findFirst({
      where: {
        id: agentProfileId,
        governorates: {
          some: { governorateId: { in: governorateIds } },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!agent) {
      throw new ForbiddenException('هذا المندوب لا يتبع للمحافظات التي تديرها');
    }

    // Get pending collections
    const collections = await this.prisma.agentCollection.findMany({
      where: {
        agentProfileId,
        status: 'COLLECTED',
      },
      orderBy: { collectedAt: 'desc' },
      include: {
        business: {
          select: {
            id: true,
            nameAr: true,
            governorate: { select: { nameAr: true } },
          },
        },
      },
    });

    const totalAmount = collections.reduce((sum, c) => sum + Number(c.amount), 0);

    return {
      agent: {
        id: agent.id,
        userId: agent.userId,
        name: `${agent.user.firstName} ${agent.user.lastName}`,
      },
      collections,
      summary: {
        count: collections.length,
        totalAmount,
      },
    };
  }

  /**
   * استلام المبلغ من المندوب (إنشاء تسوية مكتملة)
   */
  async receivePaymentFromAgent(
    managerUserId: string,
    agentProfileId: string,
    data: {
      amount?: number;
      collectionIds?: string[];
      notes?: string;
      receiptNumber?: string;
    },
  ) {
    const governorateIds = await this.getManagerGovernorateIds(managerUserId);

    // Verify agent belongs to manager's governorates
    const agent = await this.prisma.agentProfile.findFirst({
      where: {
        id: agentProfileId,
        governorates: {
          some: { governorateId: { in: governorateIds } },
        },
      },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!agent) {
      throw new ForbiddenException('هذا المندوب لا يتبع للمحافظات التي تديرها');
    }

    // Get pending collections
    const pendingCollections = await this.prisma.agentCollection.findMany({
      where: {
        agentProfileId,
        status: 'COLLECTED',
        ...(data.collectionIds && data.collectionIds.length > 0
          ? { id: { in: data.collectionIds } }
          : {}),
      },
    });

    if (pendingCollections.length === 0) {
      throw new BadRequestException('لا توجد مقبوضات معلقة لهذا المندوب');
    }

    const totalPending = pendingCollections.reduce((sum, c) => sum + Number(c.amount), 0);

    // If specific amount provided, validate it
    if (data.amount && data.amount > totalPending) {
      throw new BadRequestException('المبلغ المحدد أكبر من المقبوضات المعلقة');
    }

    // Determine which collections to settle
    let collectionsToSettle = pendingCollections;
    let settleAmount = totalPending;

    if (data.amount && data.amount < totalPending) {
      // Partial settlement - select collections up to the amount
      collectionsToSettle = [];
      let runningTotal = 0;
      for (const collection of pendingCollections) {
        if (runningTotal >= data.amount) break;
        collectionsToSettle.push(collection);
        runningTotal += Number(collection.amount);
      }
      settleAmount = runningTotal;
    }

    const collectionIds = collectionsToSettle.map(c => c.id);

    // Create settlement in transaction
    return this.prisma.$transaction(async (tx) => {
      // Create completed settlement directly
      const settlement = await tx.agentSettlement.create({
        data: {
          agentProfileId,
          totalAmount: settleAmount,
          collectionIds,
          notes: data.notes,
          receiptNumber: data.receiptNumber || `RCP-${Date.now()}`,
          status: 'COMPLETED',
          requestedAt: new Date(),
          approvedAt: new Date(),
          completedAt: new Date(),
          receivedByUserId: managerUserId,
        },
      });

      // Update collections status
      await tx.agentCollection.updateMany({
        where: { id: { in: collectionIds } },
        data: {
          status: 'VERIFIED',
          settlementId: settlement.id,
          settledAt: new Date(),
          verifiedAt: new Date(),
        },
      });

      return {
        success: true,
        message: `تم استلام ${settleAmount.toLocaleString()} ل.س من المندوب ${agent.user.firstName} ${agent.user.lastName}`,
        settlement: {
          id: settlement.id,
          amount: settleAmount,
          collectionsCount: collectionIds.length,
          receiptNumber: settlement.receiptNumber,
          completedAt: settlement.completedAt,
        },
      };
    });
  }

  /**
   * Helper: الحصول على معرفات المحافظات للمدير
   */
  private async getManagerGovernorateIds(userId: string): Promise<string[]> {
    const managerGovernorates = await this.prisma.governorateManager.findMany({
      where: { userId, isActive: true },
      select: { governorateId: true },
    });

    if (managerGovernorates.length === 0) {
      throw new ForbiddenException('لم يتم تعيين محافظات لك بعد');
    }

    return managerGovernorates.map(g => g.governorateId);
  }
}
