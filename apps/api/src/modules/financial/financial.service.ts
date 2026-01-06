import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { ApproveSettlementDto, RejectSettlementDto } from './dto/update-settlement.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class FinancialService {
  constructor(private prisma: PrismaService) {}

  // =================== AGENT BALANCE ===================

  /**
   * الحصول على رصيد المندوب الشامل
   */
  async getAgentBalance(userId: string) {
    const agentProfile = await this.prisma.agentProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        totalCommissions: true,
      },
    });

    if (!agentProfile) {
      throw new ForbiddenException('المستخدم ليس مندوباً');
    }

    const [
      totalCollectedResult,
      totalSubmittedResult,
      currentBalanceResult,
    ] = await Promise.all([
      // إجمالي المقبوضات
      this.prisma.agentCollection.aggregate({
        where: { agentProfileId: agentProfile.id },
        _sum: { amount: true },
      }),
      // إجمالي المُسلّم (التسويات المكتملة)
      this.prisma.agentSettlement.aggregate({
        where: { 
          agentProfileId: agentProfile.id,
          status: 'COMPLETED',
        },
        _sum: { totalAmount: true },
      }),
      // الرصيد الحالي (المقبوضات غير المُسلّمة)
      this.prisma.agentCollection.aggregate({
        where: { 
          agentProfileId: agentProfile.id,
          status: 'COLLECTED',
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      currentBalance: Number(currentBalanceResult._sum.amount || 0),
      totalCollected: Number(totalCollectedResult._sum.amount || 0),
      totalSubmitted: Number(totalSubmittedResult._sum.totalAmount || 0),
      totalCommissions: Number(agentProfile.totalCommissions || 0),
    };
  }

  /**
   * الحصول على عمولات المندوب
   */
  async getAgentCommissions(userId: string, query: {
    status?: 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED';
    page?: number;
    limit?: number;
  }) {
    const agentProfile = await this.prisma.agentProfile.findUnique({
      where: { userId },
    });

    if (!agentProfile) {
      throw new ForbiddenException('المستخدم ليس مندوباً');
    }

    const { status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { agentProfileId: agentProfile.id };
    if (status) where.status = status;

    const [commissions, total] = await Promise.all([
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
    ]);

    return {
      data: commissions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // =================== AGENT COLLECTIONS ===================

  /**
   * تسجيل تحصيل جديد للمندوب
   */
  async createCollection(userId: string, dto: CreateCollectionDto) {
    const agentProfile = await this.prisma.agentProfile.findUnique({
      where: { userId },
    });

    if (!agentProfile) {
      throw new ForbiddenException('المستخدم ليس مندوباً');
    }

    return this.prisma.agentCollection.create({
      data: {
        agentProfileId: agentProfile.id,
        businessId: dto.businessId,
        amount: new Decimal(dto.amount),
        description: dto.description,
        receiptNumber: dto.receiptNumber,
        attachments: dto.attachments || [],
        notes: dto.notes,
        collectedAt: dto.collectedAt ? new Date(dto.collectedAt) : new Date(),
        status: 'COLLECTED',
      },
      include: {
        business: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
          },
        },
      },
    });
  }

  /**
   * الحصول على تحصيلات المندوب
   */
  async getAgentCollections(userId: string, query: {
    status?: 'COLLECTED' | 'SETTLED' | 'VERIFIED' | 'DISPUTED';
    page?: number;
    limit?: number;
  }) {
    const agentProfile = await this.prisma.agentProfile.findUnique({
      where: { userId },
    });

    if (!agentProfile) {
      throw new ForbiddenException('المستخدم ليس مندوباً');
    }

    const { status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { agentProfileId: agentProfile.id };
    if (status) where.status = status;

    const [collections, total] = await Promise.all([
      this.prisma.agentCollection.findMany({
        where,
        skip,
        take: limit,
        orderBy: { collectedAt: 'desc' },
        include: {
          business: {
            select: {
              id: true,
              nameAr: true,
            },
          },
          settlement: {
            select: {
              id: true,
              status: true,
              requestedAt: true,
            },
          },
        },
      }),
      this.prisma.agentCollection.count({ where }),
    ]);

    return {
      data: collections,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // =================== MANAGER FINANCIALS ===================

  /**
   * إحصائيات مدير المحافظة المالية
   */
  async getManagerFinancialStats(userId: string) {
    // 1. Get Manager Governorates
    const managerRecords = await this.prisma.governorateManager.findMany({
      where: { userId, isActive: true },
      include: { governorate: true }
    });

    if (managerRecords.length === 0) {
      throw new ForbiddenException('المستخدم ليس مدير محافظة نشط');
    }

    const governorateIds = managerRecords.map(r => r.governorateId);

    // 2. Get all commissions for businesses in these governorates
    const [
      totalIncomeResult,
      totalCommissionsResult,
      approvedCommissionsResult,
      paidCommissionsResult,
    ] = await Promise.all([
      // إجمالي الاشتراكات (Subscription amounts)
      this.prisma.agentCommission.aggregate({
        _sum: { subscriptionAmount: true },
        where: {
          business: { governorateId: { in: governorateIds } },
        },
      }),
      // إجمالي العمولات للمندوبين
      this.prisma.agentCommission.aggregate({
        _sum: { commissionAmount: true },
        where: {
          business: { governorateId: { in: governorateIds } },
        },
      }),
      // العمولات المعتمدة
      this.prisma.agentCommission.aggregate({
        _sum: { commissionAmount: true },
        where: {
          business: { governorateId: { in: governorateIds } },
          status: 'APPROVED',
        },
      }),
      // العمولات المدفوعة
      this.prisma.agentCommission.aggregate({
        _sum: { commissionAmount: true },
        where: {
          business: { governorateId: { in: governorateIds } },
          status: 'PAID',
        },
      }),
    ]);

    const totalIncome = Number(totalIncomeResult._sum.subscriptionAmount || 0);
    const delegatesProfit = Number(totalCommissionsResult._sum.commissionAmount || 0);
    
    // حساب نسبة الشركة (متوسط نسبة الشركة من جميع المحافظات)
    const avgCompanyRate = managerRecords.reduce((sum, r) => sum + Number(r.companyCommissionRate), 0) / managerRecords.length;
    const greenPagesProfit = totalIncome * (avgCompanyRate / 100);
    
    // الرصيد الحالي (الدخل الإجمالي - أرباح المندوبين)
    const currentBalance = totalIncome - delegatesProfit;
    
    // الربح الصافي (الرصيد الحالي - نسبة الصفحات الخضراء)
    const netProfit = currentBalance - greenPagesProfit;

    return {
      totalIncome,
      greenPagesProfit,
      delegatesProfit,
      currentBalance,
      netProfit,
      currency: 'SYP',
      stats: {
        approvedCommissions: Number(approvedCommissionsResult._sum.commissionAmount || 0),
        paidCommissions: Number(paidCommissionsResult._sum.commissionAmount || 0),
        pendingCommissions: Number(approvedCommissionsResult._sum.commissionAmount || 0) - Number(paidCommissionsResult._sum.commissionAmount || 0),
      },
    };
  }

  /**
   * الحصول على ملخص الذمة المالية للمندوب
   */
  async getAgentFinancialSummary(userId: string) {
    const agentProfile = await this.prisma.agentProfile.findUnique({
      where: { userId },
    });

    if (!agentProfile) {
      throw new ForbiddenException('المستخدم ليس مندوباً');
    }

    const [
      totalCollected,
      totalSettled,
      pendingAmount,
      collectionsCount,
      settledCount,
    ] = await Promise.all([
      this.prisma.agentCollection.aggregate({
        where: { agentProfileId: agentProfile.id },
        _sum: { amount: true },
      }),
      this.prisma.agentCollection.aggregate({
        where: { 
          agentProfileId: agentProfile.id,
          status: { in: ['SETTLED', 'VERIFIED'] },
        },
        _sum: { amount: true },
      }),
      this.prisma.agentCollection.aggregate({
        where: { 
          agentProfileId: agentProfile.id,
          status: 'COLLECTED',
        },
        _sum: { amount: true },
      }),
      this.prisma.agentCollection.count({
        where: { agentProfileId: agentProfile.id },
      }),
      this.prisma.agentCollection.count({
        where: { 
          agentProfileId: agentProfile.id,
          status: { in: ['SETTLED', 'VERIFIED'] },
        },
      }),
    ]);

    return {
      totalCollected: totalCollected._sum.amount || 0,
      totalSettled: totalSettled._sum.amount || 0,
      pendingAmount: pendingAmount._sum.amount || 0,
      collectionsCount,
      settledCount,
      pendingCount: collectionsCount - settledCount,
    };
  }

  // =================== AGENT SETTLEMENTS ===================

  /**
   * إنشاء طلب تسوية (تسليم المندوب للأموال)
   */
  async createAgentSettlement(userId: string, dto: CreateSettlementDto) {
    const agentProfile = await this.prisma.agentProfile.findUnique({
      where: { userId },
    });

    if (!agentProfile) {
      throw new ForbiddenException('المستخدم ليس مندوباً');
    }

    // التحقق من أن جميع التحصيلات تخص المندوب وغير مسواة
    const collections = await this.prisma.agentCollection.findMany({
      where: {
        id: { in: dto.collectionIds },
        agentProfileId: agentProfile.id,
        status: 'COLLECTED',
      },
    });

    if (collections.length !== dto.collectionIds.length) {
      throw new BadRequestException('بعض التحصيلات غير صحيحة أو مُسواة مسبقاً');
    }

    // حساب المبلغ الإجمالي
    const totalAmount = collections.reduce(
      (sum, c) => sum.add(c.amount),
      new Decimal(0)
    );

    return this.prisma.$transaction(async (tx) => {
      // إنشاء التسوية
      const settlement = await tx.agentSettlement.create({
        data: {
          agentProfileId: agentProfile.id,
          totalAmount,
          collectionIds: dto.collectionIds,
          notes: dto.notes,
          attachments: dto.attachments || [],
          status: 'PENDING',
        },
      });

      // تحديث حالة التحصيلات
      await tx.agentCollection.updateMany({
        where: { id: { in: dto.collectionIds } },
        data: {
          status: 'SETTLED',
          settlementId: settlement.id,
          settledAt: new Date(),
        },
      });

      return settlement;
    });
  }

  /**
   * الحصول على تسويات المندوب
   */
  async getAgentSettlements(userId: string, query: {
    status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
    page?: number;
    limit?: number;
  }) {
    const agentProfile = await this.prisma.agentProfile.findUnique({
      where: { userId },
    });

    if (!agentProfile) {
      throw new ForbiddenException('المستخدم ليس مندوباً');
    }

    const { status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { agentProfileId: agentProfile.id };
    if (status) where.status = status;

    const [settlements, total] = await Promise.all([
      this.prisma.agentSettlement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { requestedAt: 'desc' },
        include: {
          receivedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
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
   * اعتماد تسوية المندوب (للمحاسب)
   */
  async approveAgentSettlement(settlementId: string, userId: string, dto: ApproveSettlementDto) {
    const settlement = await this.prisma.agentSettlement.findUnique({
      where: { id: settlementId },
    });

    if (!settlement) {
      throw new NotFoundException('التسوية غير موجودة');
    }

    if (settlement.status !== 'PENDING') {
      throw new BadRequestException('التسوية ليست معلقة');
    }

    return this.prisma.$transaction(async (tx) => {
      // تحديث التسوية
      const updated = await tx.agentSettlement.update({
        where: { id: settlementId },
        data: {
          status: 'COMPLETED',
          receivedByUserId: userId,
          approvedAt: new Date(),
          completedAt: new Date(),
          receiptNumber: dto.receiptNumber,
          notes: dto.notes || settlement.notes,
        },
        include: {
          agentProfile: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          receivedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // تحديث حالة التحصيلات إلى موثقة
      await tx.agentCollection.updateMany({
        where: { id: { in: settlement.collectionIds } },
        data: { status: 'VERIFIED', verifiedAt: new Date() },
      });

      return updated;
    });
  }

  /**
   * رفض تسوية المندوب
   */
  async rejectAgentSettlement(settlementId: string, userId: string, dto: RejectSettlementDto) {
    const settlement = await this.prisma.agentSettlement.findUnique({
      where: { id: settlementId },
    });

    if (!settlement) {
      throw new NotFoundException('التسوية غير موجودة');
    }

    if (settlement.status !== 'PENDING') {
      throw new BadRequestException('التسوية ليست معلقة');
    }

    return this.prisma.$transaction(async (tx) => {
      // تحديث التسوية
      const updated = await tx.agentSettlement.update({
        where: { id: settlementId },
        data: {
          status: 'REJECTED',
          receivedByUserId: userId,
          rejectionReason: dto.rejectionReason,
        },
      });

      // إعادة التحصيلات إلى حالة محصلة
      await tx.agentCollection.updateMany({
        where: { id: { in: settlement.collectionIds } },
        data: {
          status: 'COLLECTED',
          settlementId: null,
          settledAt: null,
        },
      });

      return updated;
    });
  }

  /**
   * الحصول على جميع التسويات المعلقة (للمحاسب/الإدارة)
   */
  async getAllPendingSettlements(query: {
    governorateId?: string;
    page?: number;
    limit?: number;
  }) {
    const { governorateId, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { status: 'PENDING' };

    // إذا تم تحديد محافظة، نفلتر حسب المندوبين في تلك المحافظة
    if (governorateId) {
      where.agentProfile = {
        governorates: {
          some: { governorateId },
        },
      };
    }

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

  // =================== FINANCIAL REPORTS ===================

  /**
   * تقرير مالي شامل للإدارة
   */
  async getFinancialReport(query: {
    startDate?: string;
    endDate?: string;
    governorateId?: string;
  }) {
    const where: any = {};

    if (query.startDate) {
      where.collectedAt = { ...where.collectedAt, gte: new Date(query.startDate) };
    }
    if (query.endDate) {
      where.collectedAt = { ...where.collectedAt, lte: new Date(query.endDate) };
    }

    const [
      totalCollections,
      settledCollections,
      pendingCollections,
      totalSettlements,
    ] = await Promise.all([
      this.prisma.agentCollection.aggregate({
        where,
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.agentCollection.aggregate({
        where: { ...where, status: { in: ['SETTLED', 'VERIFIED'] } },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.agentCollection.aggregate({
        where: { ...where, status: 'COLLECTED' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.agentSettlement.count({
        where: { status: 'PENDING' },
      }),
    ]);

    return {
      totalCollections: {
        amount: totalCollections._sum.amount || 0,
        count: totalCollections._count,
      },
      settledCollections: {
        amount: settledCollections._sum.amount || 0,
        count: settledCollections._count,
      },
      pendingCollections: {
        amount: pendingCollections._sum.amount || 0,
        count: pendingCollections._count,
      },
      pendingSettlements: totalSettlements,
    };
  }

  // =================== ADMIN FINANCIAL MANAGEMENT ===================

  /**
   * نظرة عامة مالية للمدراء
   */
  async getAdminFinancialOverview() {
    const [
      totalCollections,
      totalSettled,
      pendingSettlements,
      totalManagers,
      totalAgents,
      activeAgents,
      totalBusinesses,
    ] = await Promise.all([
      this.prisma.agentCollection.aggregate({
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.agentCollection.aggregate({
        where: { status: { in: ['SETTLED', 'VERIFIED'] } },
        _sum: { amount: true },
      }),
      this.prisma.agentSettlement.count({
        where: { status: 'PENDING' },
      }),
      this.prisma.user.count({
        where: { role: 'GOVERNORATE_MANAGER' },
      }),
      this.prisma.agentProfile.count(),
      this.prisma.agentProfile.count({
        where: {
          collections: {
            some: {
              collectedAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
              },
            },
          },
        },
      }),
      this.prisma.business.count({
        where: { status: 'APPROVED' },
      }),
    ]);

    const totalRevenue = parseFloat(totalCollections._sum.amount?.toString() || '0');
    const totalSettledAmount = parseFloat(totalSettled._sum.amount?.toString() || '0');
    const totalOutstanding = totalRevenue - totalSettledAmount;

    return {
      totalRevenue,
      totalSettled: totalSettledAmount,
      totalOutstanding,
      pendingSettlements,
      totalManagers,
      totalAgents,
      activeAgents,
      totalBusinesses,
      totalCollections: totalCollections._count,
    };
  }

  /**
   * الحصول على أرصدة المدراء (placeholder - will be implemented with manager balance ledger)
   */
  async getManagerBalances(query: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    // For now, return governorate managers with their agent statistics
    const [managers, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { role: 'GOVERNORATE_MANAGER' },
        skip,
        take: limit,
        include: {
          governorateManagers: {
            include: {
              governorate: true,
            },
          },
          managedAgents: {
            include: {
              collections: {
                where: { status: 'COLLECTED' },
              },
            },
          },
        },
      }),
      this.prisma.user.count({ where: { role: 'GOVERNORATE_MANAGER' } }),
    ]);

    const data = managers.map(manager => {
      const managerProfile = manager.governorateManagers[0]; // Get first governorate
      const totalCollected = manager.managedAgents.reduce((sum, agent) => {
        const agentTotal = agent.collections.reduce(
          (s, c) => s + parseFloat(c.amount.toString()),
          0
        );
        return sum + agentTotal;
      }, 0);

      return {
        id: manager.id,
        name: `${manager.firstName} ${manager.lastName}`,
        phone: manager.phone,
        governorate: managerProfile?.governorate?.nameAr || '-',
        totalCollected,
        currentBalance: totalCollected, // Placeholder - will be actual balance when ledger is implemented
        agentCount: manager.managedAgents.length,
        commissionRate: 0, // Will be implemented with commission settings
        balance: 0, // Will be implemented with balance ledger
      };
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * تحديث نسبة عمولة المدير (placeholder)
   */
  async updateManagerCommission(managerId: string, commissionRate: number) {
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId, role: 'GOVERNORATE_MANAGER' },
    });

    if (!manager) {
      throw new NotFoundException('المدير غير موجود');
    }

    // This will be implemented when we add ManagerCommissionSetting model
    return {
      success: true,
      message: 'تم تحديث نسبة العمولة بنجاح',
      managerId,
      commissionRate,
    };
  }

  /**
   * استلام دفعة من المدير (placeholder)
   */
  async receiveManagerPayment(
    managerId: string,
    amount: number,
    receivedBy: string,
    notes?: string,
  ) {
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId, role: 'GOVERNORATE_MANAGER' },
    });

    if (!manager) {
      throw new NotFoundException('المدير غير موجود');
    }

    // This will be implemented when we add ManagerBalanceLedger model
    return {
      success: true,
      message: 'تم استلام الدفعة بنجاح',
      managerId,
      amount,
      receivedBy,
      receivedAt: new Date(),
      notes,
    };
  }
}

