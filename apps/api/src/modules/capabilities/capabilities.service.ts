import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BusinessCapabilityRole,
  CapabilityStatus,
  TrustLevel,
  CapabilitySource,
} from '@greenpages/database';
import * as crypto from 'crypto';

@Injectable()
export class CapabilitiesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * ربط مالك موجود بنشاط تجاري
   */
  async linkOwner(
    businessId: string,
    userId: string,
    createdById: string,
    options?: {
      trustLevel?: TrustLevel;
      source?: CapabilitySource;
    },
  ) {
    // التحقق من وجود النشاط
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException('النشاط التجاري غير موجود');
    }

    // التحقق من وجود المستخدم
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    // التحقق من عدم وجود ربط مسبق كمالك
    const existingCapability = await this.prisma.userBusinessCapability.findFirst({
      where: {
        userId,
        businessId,
        role: BusinessCapabilityRole.OWNER,
      },
    });

    if (existingCapability) {
      throw new ConflictException('المستخدم مرتبط بهذا النشاط مسبقاً');
    }

    // إنشاء capability جديدة
    const capability = await this.prisma.userBusinessCapability.create({
      data: {
        userId,
        businessId,
        role: BusinessCapabilityRole.OWNER,
        status: CapabilityStatus.ACTIVE,
        trustLevel: options?.trustLevel || TrustLevel.FIELD_VERIFIED,
        source: options?.source || CapabilitySource.AGENT,
        createdById,
        activatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        business: {
          select: {
            id: true,
            nameAr: true,
            slug: true,
          },
        },
      },
    });

    // تحديث حالة النشاط إلى claimed
    await this.prisma.business.update({
      where: { id: businessId },
      data: {
        ownerStatus: 'claimed',
        ownerId: userId, // للتوافق مع الكود القديم
      },
    });

    // زيادة tokenVersion للمستخدم لتحديث الـ JWT
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        tokenVersion: { increment: 1 },
      },
    });

    return capability;
  }

  /**
   * دعوة مالك جديد (ليس لديه حساب)
   */
  async inviteOwner(
    businessId: string,
    phone: string,
    createdById: string,
    options?: {
      email?: string;
      ownerName?: string;
    },
  ) {
    // التحقق من وجود النشاط
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException('النشاط التجاري غير موجود');
    }

    // التحقق من عدم وجود دعوة نشطة مسبقاً
    const existingInvitation = await this.prisma.businessOwnershipInvitation.findFirst({
      where: {
        businessId,
        status: CapabilityStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      throw new ConflictException('يوجد دعوة نشطة لهذا النشاط بالفعل');
    }

    // التحقق من عدم وجود مستخدم بنفس الرقم
    const existingUser = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (existingUser) {
      throw new BadRequestException('يوجد مستخدم بهذا الرقم بالفعل. استخدم ربط المالك الموجود.');
    }

    // توليد claim token فريد
    const claimToken = this.generateClaimToken();

    // إنشاء الدعوة
    const invitation = await this.prisma.businessOwnershipInvitation.create({
      data: {
        businessId,
        phone,
        email: options?.email,
        ownerName: options?.ownerName,
        claimToken,
        createdById,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 يوم
        status: CapabilityStatus.PENDING,
      },
      include: {
        business: {
          select: {
            id: true,
            nameAr: true,
            slug: true,
          },
        },
      },
    });

    // تحديث ownerStatus إلى unclaimed (مع معلومات الدعوة)
    await this.prisma.business.update({
      where: { id: businessId },
      data: {
        ownerStatus: 'unclaimed',
      },
    });

    // TODO: إرسال SMS/Email بالدعوة
    // await this.sendInvitationMessage(phone, claimToken, business.nameAr);

    return invitation;
  }

  /**
   * المطالبة بملكية نشاط عبر claim token
   */
  async claimOwnership(claimToken: string, userId: string) {
    // البحث عن الدعوة
    const invitation = await this.prisma.businessOwnershipInvitation.findUnique({
      where: { claimToken },
      include: {
        business: true,
      },
    });

    if (!invitation) {
      throw new NotFoundException('رمز المطالبة غير صحيح');
    }

    // التحقق من صلاحية الدعوة
    if (invitation.status !== CapabilityStatus.PENDING) {
      throw new BadRequestException('الدعوة غير نشطة');
    }

    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('الدعوة منتهية الصلاحية');
    }

    // التحقق من المستخدم
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    // التحقق من تطابق رقم الهاتف (اختياري - للأمان)
    if (user.phone !== invitation.phone) {
      throw new ForbiddenException('رقم الهاتف غير مطابق للدعوة');
    }

    // إنشاء capability
    const capability = await this.linkOwner(
      invitation.businessId,
      userId,
      userId, // المستخدم نفسه هو من يقوم بالمطالبة
      {
        trustLevel: TrustLevel.OWNER_CONFIRMED,
        source: CapabilitySource.SELF_CLAIMED,
      },
    );

    // تحديث الدعوة
    await this.prisma.businessOwnershipInvitation.update({
      where: { id: invitation.id },
      data: {
        status: CapabilityStatus.ACTIVE,
        claimedByUserId: userId,
        claimedAt: new Date(),
      },
    });

    // تحديث ownerStatus إلى verified
    await this.prisma.business.update({
      where: { id: invitation.businessId },
      data: {
        ownerStatus: 'verified',
      },
    });

    return capability;
  }

  /**
   * الحصول على قدرات المستخدم
   */
  async getUserCapabilities(userId: string) {
    return this.prisma.userBusinessCapability.findMany({
      where: {
        userId,
        status: CapabilityStatus.ACTIVE,
      },
      include: {
        business: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            slug: true,
            logo: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * التحقق من قدرة المستخدم على الوصول لنشاط معين
   */
  async canAccessBusiness(
    userId: string,
    businessId: string,
    requiredRole?: BusinessCapabilityRole,
  ): Promise<boolean> {
    const capability = await this.prisma.userBusinessCapability.findFirst({
      where: {
        userId,
        businessId,
        status: CapabilityStatus.ACTIVE,
      },
    });

    if (!capability) {
      return false;
    }

    if (requiredRole && capability.role !== requiredRole) {
      // يمكن تطوير هذا لاحقاً لدعم التدرج الهرمي (OWNER > MANAGER > CASHIER > STAFF > VIEWER)
      return false;
    }

    return true;
  }

  /**
   * الحصول على capability معينة
   */
  async getCapability(userId: string, businessId: string) {
    return this.prisma.userBusinessCapability.findFirst({
      where: {
        userId,
        businessId,
      },
      include: {
        business: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  /**
   * إلغاء capability
   */
  async revokeCapability(capabilityId: string, revokedById: string) {
    const capability = await this.prisma.userBusinessCapability.findUnique({
      where: { id: capabilityId },
    });

    if (!capability) {
      throw new NotFoundException('الصلاحية غير موجودة');
    }

    const updated = await this.prisma.userBusinessCapability.update({
      where: { id: capabilityId },
      data: {
        status: CapabilityStatus.REVOKED,
        revokedAt: new Date(),
        notes: `تم الإلغاء بواسطة ${revokedById}`,
      },
    });

    // زيادة tokenVersion للمستخدم
    await this.prisma.user.update({
      where: { id: capability.userId },
      data: {
        tokenVersion: { increment: 1 },
      },
    });

    return updated;
  }

  /**
   * البحث عن مستخدم بالهاتف أو البريد
   */
  async findUserByIdentifier(identifier: string) {
    // محاولة البحث برقم الهاتف
    let user = await this.prisma.user.findUnique({
      where: { phone: identifier },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatar: true,
        businessCapabilities: {
          where: { status: CapabilityStatus.ACTIVE },
          include: {
            business: {
              select: {
                id: true,
                nameAr: true,
              },
            },
          },
        },
      },
    });

    // إذا لم يتم العثور، حاول بالبريد الإلكتروني
    if (!user && identifier.includes('@')) {
      user = await this.prisma.user.findUnique({
        where: { email: identifier },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatar: true,
          businessCapabilities: {
            where: { status: CapabilityStatus.ACTIVE },
            include: {
              business: {
                select: {
                  id: true,
                  nameAr: true,
                },
              },
            },
          },
        },
      });
    }

    return user;
  }

  /**
   * توليد claim token فريد
   */
  private generateClaimToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
