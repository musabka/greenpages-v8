import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole, VisitStatus, VisitPurpose, CommissionType } from '@greenpages/database';

@Injectable()
export class AgentPortalService {
  constructor(private prisma: PrismaService) {}

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
        totalEarnings: agentProfile.totalEarnings,
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
          owner: { select: { firstName: true, lastName: true } },
          package: { select: { package: { select: { nameAr: true } } } },
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
}
