import { PrismaClient, NotificationType, UserRole, UserStatus } from '@greenpages/database';

const prisma = new PrismaClient();

export class OwnershipNotificationService {
  /**
   * إرسال إشعار عند ربط مالك جديد
   */
  static async notifyOwnerLinked(params: {
    userId: string;
    businessId: string;
    businessName: string;
    performedBy: string;
  }) {
    const { userId, businessId, businessName, performedBy } = params;

    try {
      // Create notification in database
      await prisma.notification.create({
        data: {
          userId,
          type: NotificationType.BUSINESS_UPDATE,
          titleAr: 'تم ربطك كمالك لنشاط تجاري',
          titleEn: 'You have been linked as a business owner',
          messageAr: `تم ربطك كمالك للنشاط التجاري "${businessName}". يمكنك الآن إدارة بيانات النشاط وتحديثها.`,
          messageEn: `You have been linked as an owner for "${businessName}". You can now manage and update the business details.`,
          data: {
            businessId,
            businessName,
            action: 'LINKED',
            performedBy,
          },
          isRead: false,
        },
      });

      // TODO: Send push notification if user has devices
      // TODO: Send email notification if configured
      
      console.log(`Ownership notification sent to user ${userId} for business ${businessId}`);
    } catch (error) {
      console.error('Failed to send ownership linked notification:', error);
      // Don't throw - notification failure shouldn't break the main flow
    }
  }

  /**
   * إرسال إشعار عند فصل مالك
   */
  static async notifyOwnerUnlinked(params: {
    userId: string;
    businessId: string;
    businessName: string;
    performedBy: string;
  }) {
    const { userId, businessId, businessName, performedBy } = params;

    try {
      await prisma.notification.create({
        data: {
          userId,
          type: NotificationType.BUSINESS_UPDATE,
          titleAr: 'تم فصلك عن نشاط تجاري',
          titleEn: 'You have been unlinked from a business',
          messageAr: `تم فصلك عن النشاط التجاري "${businessName}". لم تعد تملك صلاحيات إدارة هذا النشاط.`,
          messageEn: `You have been unlinked from "${businessName}". You no longer have permissions to manage this business.`,
          data: {
            businessId,
            businessName,
            action: 'UNLINKED',
            performedBy,
          },
          isRead: false,
        },
      });

      console.log(`Ownership unlink notification sent to user ${userId} for business ${businessId}`);
    } catch (error) {
      console.error('Failed to send ownership unlinked notification:', error);
    }
  }

  /**
   * إرسال إشعار عند توثيق المالك
   */
  static async notifyOwnerVerified(params: {
    userId: string;
    businessId: string;
    businessName: string;
    performedBy: string;
  }) {
    const { userId, businessId, businessName, performedBy } = params;

    try {
      await prisma.notification.create({
        data: {
          userId,
          type: NotificationType.VERIFICATION,
          titleAr: 'تم توثيق ملكيتك للنشاط التجاري',
          titleEn: 'Your business ownership has been verified',
          messageAr: `تم توثيق ملكيتك للنشاط التجاري "${businessName}". هذا يمنحك مزايا إضافية وثقة أكبر من العملاء.`,
          messageEn: `Your ownership for "${businessName}" has been verified. This can increase customer trust and unlock additional benefits.`,
          data: {
            businessId,
            businessName,
            action: 'VERIFIED',
            performedBy,
          },
          isRead: false,
        },
      });

      console.log(`Ownership verification notification sent to user ${userId} for business ${businessId}`);
    } catch (error) {
      console.error('Failed to send ownership verified notification:', error);
    }
  }

  /**
   * إرسال إشعار للمسؤولين عند طلب توثيق
   */
  static async notifyAdminsVerificationRequested(params: {
    businessId: string;
    businessName: string;
    ownerId: string;
    ownerName: string;
  }) {
    const { businessId, businessName, ownerId, ownerName } = params;

    try {
      // Get all admins and supervisors
      const admins = await prisma.user.findMany({
        where: {
          role: { in: [UserRole.ADMIN, UserRole.SUPERVISOR] },
          status: UserStatus.ACTIVE,
        },
        select: { id: true },
      });

      // Create notification for each admin
      const notifications = admins.map(admin => ({
        userId: admin.id,
        type: NotificationType.VERIFICATION,
        titleAr: 'طلب توثيق ملكية نشاط تجاري',
        titleEn: 'Business ownership verification request',
        messageAr: `قام ${ownerName} بطلب توثيق ملكيته للنشاط التجاري "${businessName}". يرجى مراجعة الطلب.`,
        messageEn: `${ownerName} requested ownership verification for "${businessName}". Please review the request.`,
        data: {
          businessId,
          businessName,
          ownerId,
          ownerName,
          action: 'VERIFICATION_REQUESTED',
        },
        isRead: false,
      }));

      await prisma.notification.createMany({
        data: notifications,
      });

      console.log(`Verification request notification sent to ${admins.length} admins for business ${businessId}`);
    } catch (error) {
      console.error('Failed to send verification request notifications:', error);
    }
  }
}
