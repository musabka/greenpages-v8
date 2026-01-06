import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CommissionType, CommissionStatus } from '@greenpages/database';
import { AccountingService } from '../accounting/accounting.service';

@Injectable()
export class CommissionsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => AccountingService))
    private readonly accountingService: AccountingService,
  ) {}

  /**
   * حساب وإنشاء العمولات للبيزنس
   * يتم استدعاؤها عند:
   * 1. إنشاء بيزنس بحالة APPROVED مباشرة (agent لا يحتاج موافقة)
   * 2. الموافقة على بيزنس كان PENDING
   */
  async createCommissionsForBusiness(businessId: string) {
    // التحقق من عدم وجود عمولات سابقة لتجنب التكرار
    const existingCommission = await this.prisma.agentCommission.findFirst({
      where: { businessId },
    });

    if (existingCommission) {
      console.log('Commission already exists for business:', businessId);
      return existingCommission;
    }

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: {
        package: {
          include: {
            package: true,
          },
        },
        agent: {
          include: {
            agentProfile: true,
          },
        },
      },
    });

    if (!business) {
      throw new Error('Business not found');
    }

    // إذا لم يكن هناك باكج، لا توجد عمولات
    if (!business.package?.package) {
      console.log('No package assigned to business:', businessId);
      return null;
    }

    const packagePrice = Number(business.package.package.price);
    
    // إذا كان هناك agent
    if (business.agentId && business.agent?.agentProfile) {
      const agentProfile = business.agent.agentProfile;
      const commissionRate = Number(agentProfile.commissionRate);
      const commissionAmount = (packagePrice * commissionRate) / 100;

      // إنشاء عمولة المندوب
      const commission = await this.prisma.agentCommission.create({
        data: {
          agentProfileId: agentProfile.id,
          businessId: business.id,
          subscriptionAmount: packagePrice,
          commissionRate,
          commissionAmount,
          type: CommissionType.NEW_SUBSCRIPTION,
          status: CommissionStatus.APPROVED, // دائماً APPROVED لأننا هنا بعد موافقة البيزنس
          approvedAt: new Date(),
        },
      });

      // تحديث إجمالي عمولات المندوب
      await this.prisma.agentProfile.update({
        where: { id: agentProfile.id },
        data: {
          totalCommissions: {
            increment: commissionAmount,
          },
          totalBusinesses: {
            increment: 1,
          },
        },
      });

      // ✅ تسجيل القيد المحاسبي للعمولة
      try {
        await this.accountingService.createJournalEntry(business.agentId, {
          description: 'Agent commission earned for new subscription',
          descriptionAr: `عمولة مندوب - اشتراك جديد`,
          sourceModule: 'COMMISSIONS' as any,
          sourceEventId: `COMMISSION-${commission.id}`,
          sourceEntityType: 'AgentCommission',
          sourceEntityId: commission.id,
          lines: [
            {
              accountCode: '5200', // COMMISSIONS_EXPENSE
              debit: commissionAmount,
              credit: 0,
              memo: `عمولة ${agentProfile.id}`,
            },
            {
              accountCode: '2200', // AGENT_PAYABLE
              debit: 0,
              credit: commissionAmount,
              memo: `مستحق للمندوب`,
            },
          ],
          metadata: {
            agentProfileId: agentProfile.id,
            businessId,
            commissionRate,
            subscriptionAmount: packagePrice,
          },
          autoPost: true,
        });
      } catch (error) {
        console.error('⚠️ Failed to record accounting entry for commission:', error);
      }

      console.log('Commission created:', {
        businessId,
        agentId: agentProfile.id,
        amount: commissionAmount,
        status: CommissionStatus.APPROVED,
      });

      return commission;
    }

    // TODO: إضافة عمولة مدير المحافظة
    // TODO: إضافة عمولة النظام

    return null;
  }

  /**
   * حذف العمولات عند رفض البيزنس
   */
  async deleteCommissionsForBusiness(businessId: string) {
    // حذف جميع العمولات المرتبطة بهذا البيزنس
    const deletedCommissions = await this.prisma.agentCommission.findMany({
      where: { businessId },
      include: {
        agentProfile: true,
      },
    });

    // عكس التحديثات على AgentProfile
    for (const commission of deletedCommissions) {
      await this.prisma.agentProfile.update({
        where: { id: commission.agentProfileId },
        data: {
          totalCommissions: {
            decrement: Number(commission.commissionAmount),
          },
          totalBusinesses: {
            decrement: 1,
          },
        },
      });
    }

    // حذف السجلات
    await this.prisma.agentCommission.deleteMany({
      where: { businessId },
    });

    console.log('Commissions deleted for business:', businessId);
  }
}
