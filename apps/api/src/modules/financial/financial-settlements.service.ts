import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { 
  CreateAgentFinancialSettlementDto, 
  ConfirmAgentSettlementDto,
  CreateManagerFinancialSettlementDto,
  ConfirmManagerSettlementDto 
} from './dto/create-financial-settlement.dto';

@Injectable()
export class FinancialSettlementsService {
  constructor(private prisma: PrismaService) {}

  // =================== AGENT FINANCIAL SETTLEMENTS ===================

  /**
   * توليد رقم التسوية الفريد
   */
  private async generateAgentSettlementNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `GPAGENT-${year}-`;
    
    // Get last settlement number for this year
    const lastSettlement = await this.prisma.agentFinancialSettlement.findFirst({
      where: { settlementNumber: { startsWith: prefix } },
      orderBy: { settlementNumber: 'desc' },
    });
    
    let nextNumber = 1;
    if (lastSettlement) {
      const lastNumber = parseInt(lastSettlement.settlementNumber.replace(prefix, ''), 10);
      nextNumber = lastNumber + 1;
    }
    
    return `${prefix}${nextNumber.toString().padStart(7, '0')}`;
  }

  private async generateManagerSettlementNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `GPMANAGER-${year}-`;
    
    const lastSettlement = await this.prisma.managerFinancialSettlement.findFirst({
      where: { settlementNumber: { startsWith: prefix } },
      orderBy: { settlementNumber: 'desc' },
    });
    
    let nextNumber = 1;
    if (lastSettlement) {
      const lastNumber = parseInt(lastSettlement.settlementNumber.replace(prefix, ''), 10);
      nextNumber = lastNumber + 1;
    }
    
    return `${prefix}${nextNumber.toString().padStart(7, '0')}`;
  }

  /**
   * إنشاء تسوية مالية جديدة للمندوب (بواسطة مدير المحافظة)
   */
  async createAgentSettlement(managerUserId: string, dto: CreateAgentFinancialSettlementDto) {
    // 1. Get manager profile
    const managerRecord = await this.prisma.governorateManager.findFirst({
      where: { userId: managerUserId, isActive: true },
      include: {
        governorate: true,
        user: { select: { firstName: true, lastName: true, phone: true } },
      },
    });

    if (!managerRecord) {
      throw new ForbiddenException('المستخدم ليس مدير محافظة نشط');
    }

    // 2. Get agent profile
    const agentProfile = await this.prisma.agentProfile.findUnique({
      where: { id: dto.agentProfileId },
      include: {
        user: { select: { firstName: true, lastName: true, phone: true } },
        collections: { where: { status: 'COLLECTED' } },
        commissions: { where: { status: { in: ['PENDING', 'APPROVED'] } } },
      },
    });

    if (!agentProfile) {
      throw new NotFoundException('ملف المندوب غير موجود');
    }

    // 3. Check if there's already a pending settlement
    const pendingSettlement = await this.prisma.agentFinancialSettlement.findFirst({
      where: {
        agentProfileId: dto.agentProfileId,
        status: { in: ['DRAFT', 'PENDING_AGENT', 'PENDING_MANAGER'] },
      },
    });

    if (pendingSettlement) {
      throw new BadRequestException('يوجد تسوية معلقة لهذا المندوب بالفعل');
    }

    // 4. Calculate amounts
    const cashOnHand = agentProfile.collections.reduce(
      (sum, c) => sum.add(c.amount),
      new Decimal(0)
    );

    // Get total collected (all time)
    const totalCollectedResult = await this.prisma.agentCollection.aggregate({
      where: { agentProfileId: dto.agentProfileId },
      _sum: { amount: true },
    });
    const totalCollected = totalCollectedResult._sum.amount || new Decimal(0);

    // Get previously delivered (completed settlements)
    const previouslyDeliveredResult = await this.prisma.agentFinancialSettlement.aggregate({
      where: { 
        agentProfileId: dto.agentProfileId, 
        status: 'CONFIRMED' 
      },
      _sum: { amountDelivered: true },
    });
    const previouslyDelivered = previouslyDeliveredResult._sum.amountDelivered || new Decimal(0);

    // Get pending commissions
    const totalCommissions = agentProfile.commissions.reduce(
      (sum, c) => sum.add(c.commissionAmount),
      new Decimal(0)
    );

    // 5. Create settlement
    const settlementNumber = await this.generateAgentSettlementNumber();

    const settlement = await this.prisma.agentFinancialSettlement.create({
      data: {
        settlementNumber,
        agentProfileId: dto.agentProfileId,
        governorateManagerId: managerRecord.id,
        
        totalCollected,
        cashOnHand,
        previouslyDelivered,
        totalCommissions,
        amountDelivered: cashOnHand, // سيتم تسليم كامل النقد بحوزته
        commissionsPaid: totalCommissions, // سيتم دفع كامل عمولاته
        
        collectionIds: agentProfile.collections.map(c => c.id),
        collectionsCount: agentProfile.collections.length,
        commissionIds: agentProfile.commissions.map(c => c.id),
        commissionsCount: agentProfile.commissions.length,
        
        status: 'PENDING_MANAGER',
        
        agentName: `${agentProfile.user.firstName} ${agentProfile.user.lastName}`,
        agentPhone: agentProfile.user.phone,
        managerName: `${managerRecord.user.firstName} ${managerRecord.user.lastName}`,
        managerPhone: managerRecord.user.phone,
        governorateName: managerRecord.governorate.nameAr,
        
        notes: dto.notes,
      },
      include: {
        agentProfile: {
          include: { user: { select: { firstName: true, lastName: true, phone: true } } },
        },
      },
    });

    return settlement;
  }

  /**
   * تأكيد التسوية من قبل مدير المحافظة
   */
  async confirmAgentSettlementByManager(
    settlementId: string, 
    managerUserId: string, 
    dto: ConfirmAgentSettlementDto
  ) {
    const settlement = await this.prisma.agentFinancialSettlement.findUnique({
      where: { id: settlementId },
      include: {
        governorateManager: { include: { user: true } },
      },
    });

    if (!settlement) {
      throw new NotFoundException('التسوية غير موجودة');
    }

    if (settlement.governorateManager.userId !== managerUserId) {
      throw new ForbiddenException('غير مصرح لك بتأكيد هذه التسوية');
    }

    if (settlement.status !== 'PENDING_MANAGER') {
      throw new BadRequestException('حالة التسوية لا تسمح بالتأكيد');
    }

    // Update settlement and related records in transaction
    return this.prisma.$transaction(async (tx) => {
      // 1. Update settlement
      const updated = await tx.agentFinancialSettlement.update({
        where: { id: settlementId },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
          confirmedByManagerAt: new Date(),
          managerSignature: dto.signature,
          notes: dto.notes ? `${settlement.notes || ''}\n${dto.notes}` : settlement.notes,
        },
      });

      // 2. Update collections to VERIFIED
      await tx.agentCollection.updateMany({
        where: { id: { in: settlement.collectionIds } },
        data: { 
          status: 'VERIFIED',
          verifiedAt: new Date(),
        },
      });

      // 3. Update commissions to PAID
      await tx.agentCommission.updateMany({
        where: { id: { in: settlement.commissionIds } },
        data: { 
          status: 'PAID',
          paidAt: new Date(),
        },
      });

      // 4. Update agent profile totals
      await tx.agentProfile.update({
        where: { id: settlement.agentProfileId },
        data: {
          totalEarnings: { increment: Number(settlement.commissionsPaid) },
        },
      });

      return updated;
    });
  }

  /**
   * الحصول على تسويات المندوب
   */
  async getAgentSettlements(
    agentUserId: string,
    query: { status?: string; page?: number; limit?: number }
  ) {
    const agentProfile = await this.prisma.agentProfile.findUnique({
      where: { userId: agentUserId },
    });

    if (!agentProfile) {
      throw new ForbiddenException('المستخدم ليس مندوباً');
    }

    const { status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { agentProfileId: agentProfile.id };
    if (status) where.status = status;

    const [settlements, total] = await Promise.all([
      this.prisma.agentFinancialSettlement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.agentFinancialSettlement.count({ where }),
    ]);

    return {
      data: settlements,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * الحصول على تسويات المندوبين (لمدير المحافظة)
   */
  async getAgentSettlementsByManager(
    managerUserId: string,
    query: { status?: string; page?: number; limit?: number }
  ) {
    const managerRecord = await this.prisma.governorateManager.findFirst({
      where: { userId: managerUserId, isActive: true },
    });

    if (!managerRecord) {
      throw new ForbiddenException('المستخدم ليس مدير محافظة نشط');
    }

    const { status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { governorateManagerId: managerRecord.id };
    if (status) where.status = status;

    const [settlements, total] = await Promise.all([
      this.prisma.agentFinancialSettlement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          agentProfile: {
            include: { user: { select: { firstName: true, lastName: true, phone: true } } },
          },
        },
      }),
      this.prisma.agentFinancialSettlement.count({ where }),
    ]);

    return {
      data: settlements,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * الحصول على تفاصيل تسوية واحدة
   */
  async getSettlementById(settlementId: string) {
    const settlement = await this.prisma.agentFinancialSettlement.findUnique({
      where: { id: settlementId },
      include: {
        agentProfile: {
          include: { 
            user: { select: { firstName: true, lastName: true, phone: true, email: true } },
            governorates: { include: { governorate: true } },
          },
        },
        governorateManager: {
          include: { 
            user: { select: { firstName: true, lastName: true, phone: true, email: true } },
            governorate: true,
          },
        },
      },
    });

    if (!settlement) {
      throw new NotFoundException('التسوية غير موجودة');
    }

    // Get related collections details
    const collections = await this.prisma.agentCollection.findMany({
      where: { id: { in: settlement.collectionIds } },
      include: {
        business: { select: { nameAr: true, nameEn: true } },
      },
    });

    // Get related commissions details
    const commissions = await this.prisma.agentCommission.findMany({
      where: { id: { in: settlement.commissionIds } },
      include: {
        business: { select: { nameAr: true, nameEn: true } },
      },
    });

    return {
      ...settlement,
      collections,
      commissions,
    };
  }

  // =================== MANAGER FINANCIAL SETTLEMENTS ===================

  /**
   * إنشاء تسوية مالية لمدير المحافظة (بواسطة المدير العام)
   */
  async createManagerSettlement(adminUserId: string, managerId: string, dto: CreateManagerFinancialSettlementDto) {
    // 1. Get manager record
    const managerRecord = await this.prisma.governorateManager.findUnique({
      where: { id: managerId },
      include: {
        governorate: true,
        user: { select: { firstName: true, lastName: true, phone: true } },
      },
    });

    if (!managerRecord) {
      throw new NotFoundException('مدير المحافظة غير موجود');
    }

    // 2. Check if there's already a pending settlement
    const pendingSettlement = await this.prisma.managerFinancialSettlement.findFirst({
      where: {
        governorateManagerId: managerId,
        status: { in: ['DRAFT', 'PENDING_MANAGER', 'PENDING_ADMIN'] },
      },
    });

    if (pendingSettlement) {
      throw new BadRequestException('يوجد تسوية معلقة لهذا المدير بالفعل');
    }

    // 3. Get confirmed agent settlements for this period
    const periodStart = new Date(dto.periodStart);
    const periodEnd = new Date(dto.periodEnd);

    const agentSettlements = await this.prisma.agentFinancialSettlement.findMany({
      where: {
        governorateManagerId: managerId,
        status: 'CONFIRMED',
        confirmedAt: { gte: periodStart, lte: periodEnd },
      },
    });

    // 4. Calculate amounts
    const totalRevenue = agentSettlements.reduce(
      (sum, s) => sum.add(s.amountDelivered),
      new Decimal(0)
    );

    const agentsCommissions = agentSettlements.reduce(
      (sum, s) => sum.add(s.commissionsPaid),
      new Decimal(0)
    );

    const managerNetAmount = totalRevenue.minus(agentsCommissions);
    const companyShareRate = managerRecord.companyCommissionRate;
    const companyShareAmount = totalRevenue.mul(companyShareRate).div(100);
    const managerProfit = managerNetAmount.minus(companyShareAmount);

    // 5. Create settlement
    const settlementNumber = await this.generateManagerSettlementNumber();

    const settlement = await this.prisma.managerFinancialSettlement.create({
      data: {
        settlementNumber,
        governorateManagerId: managerId,
        receivedByUserId: adminUserId,
        
        totalRevenue,
        agentsCommissions,
        managerNetAmount,
        companyShareRate,
        companyShareAmount,
        managerProfit,
        amountDelivered: companyShareAmount,
        
        periodStart,
        periodEnd,
        agentSettlementIds: agentSettlements.map(s => s.id),
        agentSettlementsCount: agentSettlements.length,
        
        status: 'PENDING_MANAGER',
        
        managerName: `${managerRecord.user.firstName} ${managerRecord.user.lastName}`,
        managerPhone: managerRecord.user.phone,
        governorateName: managerRecord.governorate.nameAr,
        
        notes: dto.notes,
      },
    });

    return settlement;
  }

  /**
   * تأكيد تسوية المدير من قبل المدير العام
   */
  async confirmManagerSettlementByAdmin(
    settlementId: string,
    adminUserId: string,
    dto: ConfirmManagerSettlementDto
  ) {
    const settlement = await this.prisma.managerFinancialSettlement.findUnique({
      where: { id: settlementId },
    });

    if (!settlement) {
      throw new NotFoundException('التسوية غير موجودة');
    }

    if (settlement.status !== 'PENDING_ADMIN' && settlement.status !== 'PENDING_MANAGER') {
      throw new BadRequestException('حالة التسوية لا تسمح بالتأكيد');
    }

    // Get admin user
    const adminUser = await this.prisma.user.findUnique({
      where: { id: adminUserId },
      select: { firstName: true, lastName: true },
    });

    return this.prisma.managerFinancialSettlement.update({
      where: { id: settlementId },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        confirmedByAdminAt: new Date(),
        receivedByUserId: adminUserId,
        receivedByName: adminUser ? `${adminUser.firstName} ${adminUser.lastName}` : null,
        adminSignature: dto.signature,
        notes: dto.notes ? `${settlement.notes || ''}\n${dto.notes}` : settlement.notes,
      },
    });
  }

  /**
   * الحصول على تسويات مدير المحافظة
   */
  async getManagerSettlements(
    managerUserId: string,
    query: { status?: string; page?: number; limit?: number }
  ) {
    const managerRecord = await this.prisma.governorateManager.findFirst({
      where: { userId: managerUserId, isActive: true },
    });

    if (!managerRecord) {
      throw new ForbiddenException('المستخدم ليس مدير محافظة نشط');
    }

    const { status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { governorateManagerId: managerRecord.id };
    if (status) where.status = status;

    const [settlements, total] = await Promise.all([
      this.prisma.managerFinancialSettlement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.managerFinancialSettlement.count({ where }),
    ]);

    return {
      data: settlements,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * الحصول على جميع تسويات المدراء (للمدير العام)
   */
  async getAllManagerSettlements(query: { status?: string; page?: number; limit?: number }) {
    const { status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;

    const [settlements, total] = await Promise.all([
      this.prisma.managerFinancialSettlement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          governorateManager: {
            include: {
              user: { select: { firstName: true, lastName: true, phone: true } },
              governorate: true,
            },
          },
        },
      }),
      this.prisma.managerFinancialSettlement.count({ where }),
    ]);

    return {
      data: settlements,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * الحصول على تفاصيل تسوية المدير
   */
  async getManagerSettlementById(settlementId: string) {
    const settlement = await this.prisma.managerFinancialSettlement.findUnique({
      where: { id: settlementId },
      include: {
        governorateManager: {
          include: {
            user: { select: { firstName: true, lastName: true, phone: true, email: true } },
            governorate: true,
          },
        },
        receivedBy: { select: { firstName: true, lastName: true, phone: true } },
      },
    });

    if (!settlement) {
      throw new NotFoundException('التسوية غير موجودة');
    }

    // Get related agent settlements
    const agentSettlements = await this.prisma.agentFinancialSettlement.findMany({
      where: { id: { in: settlement.agentSettlementIds } },
      include: {
        agentProfile: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    return {
      ...settlement,
      agentSettlements,
    };
  }

  /**
   * إلغاء تسوية
   */
  async cancelSettlement(settlementId: string, type: 'agent' | 'manager', userId: string) {
    if (type === 'agent') {
      const settlement = await this.prisma.agentFinancialSettlement.findUnique({
        where: { id: settlementId },
      });

      if (!settlement) {
        throw new NotFoundException('التسوية غير موجودة');
      }

      if (settlement.status === 'CONFIRMED') {
        throw new BadRequestException('لا يمكن إلغاء تسوية مؤكدة');
      }

      return this.prisma.agentFinancialSettlement.update({
        where: { id: settlementId },
        data: { status: 'CANCELLED' },
      });
    } else {
      const settlement = await this.prisma.managerFinancialSettlement.findUnique({
        where: { id: settlementId },
      });

      if (!settlement) {
        throw new NotFoundException('التسوية غير موجودة');
      }

      if (settlement.status === 'CONFIRMED') {
        throw new BadRequestException('لا يمكن إلغاء تسوية مؤكدة');
      }

      return this.prisma.managerFinancialSettlement.update({
        where: { id: settlementId },
        data: { status: 'CANCELLED' },
      });
    }
  }

  /**
   * ملخص التسويات للمندوب
   */
  async getAgentSettlementsSummary(agentUserId: string) {
    const agentProfile = await this.prisma.agentProfile.findUnique({
      where: { userId: agentUserId },
    });

    if (!agentProfile) {
      throw new ForbiddenException('المستخدم ليس مندوباً');
    }

    const [confirmed, pending, totalDelivered, totalCommissionsPaid] = await Promise.all([
      this.prisma.agentFinancialSettlement.count({
        where: { agentProfileId: agentProfile.id, status: 'CONFIRMED' },
      }),
      this.prisma.agentFinancialSettlement.count({
        where: { 
          agentProfileId: agentProfile.id, 
          status: { in: ['DRAFT', 'PENDING_AGENT', 'PENDING_MANAGER'] },
        },
      }),
      this.prisma.agentFinancialSettlement.aggregate({
        where: { agentProfileId: agentProfile.id, status: 'CONFIRMED' },
        _sum: { amountDelivered: true },
      }),
      this.prisma.agentFinancialSettlement.aggregate({
        where: { agentProfileId: agentProfile.id, status: 'CONFIRMED' },
        _sum: { commissionsPaid: true },
      }),
    ]);

    return {
      confirmedCount: confirmed,
      pendingCount: pending,
      totalDelivered: Number(totalDelivered._sum.amountDelivered || 0),
      totalCommissionsPaid: Number(totalCommissionsPaid._sum.commissionsPaid || 0),
    };
  }
}
