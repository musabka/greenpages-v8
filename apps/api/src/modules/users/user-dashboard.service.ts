/**
 * User Dashboard Service
 * خدمة لوحة تحكم المستخدم - توفر بيانات موحدة للمستخدمين العاديين وأصحاب الأنشطة
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * الحصول على ملخص لوحة التحكم للمستخدم العادي
   */
  async getUserDashboardSummary(userId: string) {
    // الحصول على معلومات المستخدم الأساسية
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatar: true,
        governorate: {
          select: { id: true, nameAr: true, slug: true },
        },
        city: {
          select: { id: true, nameAr: true, slug: true },
        },
        district: {
          select: { id: true, nameAr: true, slug: true },
        },
      },
    });

    // رصيد المحفظة
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      select: {
        balance: true,
        frozenBalance: true,
        totalDeposits: true,
        totalWithdrawals: true,
        totalSpent: true,
        status: true,
      },
    });

    // القدرات على الأنشطة التجارية
    const businessCapabilities = await this.prisma.userBusinessCapability.findMany({
      where: {
        userId,
        status: 'ACTIVE',
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
            ownerStatus: true,
            isVerified: true,
            viewsCount: true,
            averageRating: true,
            governorate: { select: { nameAr: true } },
            city: { select: { nameAr: true } },
          },
        },
      },
    });

    // عدد المراجعات
    const reviewsCount = await this.prisma.review.count({
      where: { userId },
    });

    // متوسط تقييمات المستخدم
    const reviewsAverage = await this.prisma.review.aggregate({
      where: { userId },
      _avg: { rating: true },
    });

    return {
      user,
      wallet: wallet || {
        balance: 0,
        frozenBalance: 0,
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalSpent: 0,
        status: 'ACTIVE',
      },
      businessCapabilities,
      reviews: {
        count: reviewsCount,
        averageRating: reviewsAverage._avg.rating || 0,
      },
      hasBusinessAccess: businessCapabilities.length > 0,
    };
  }

  /**
   * الحصول على إحصائيات الأنشطة التجارية للمستخدم
   */
  async getBusinessStats(userId: string) {
    const capabilities = await this.prisma.userBusinessCapability.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      select: { businessId: true },
    });

    if (capabilities.length === 0) {
      return null;
    }

    const businessIds = capabilities.map((c) => c.businessId);

    // إحصائيات المشاهدات
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const viewsToday = await this.prisma.businessView.aggregate({
      where: {
        businessId: { in: businessIds },
        date: { gte: today },
      },
      _sum: { count: true },
    });

    const viewsTotal = await this.prisma.businessView.aggregate({
      where: { businessId: { in: businessIds } },
      _sum: { count: true },
    });

    return {
      viewsToday: viewsToday._sum.count || 0,
      viewsTotal: viewsTotal._sum.count || 0,
    };
  }

  /**
   * الحصول على معلومات الاشتراك لنشاط تجاري
   */
  async getBusinessSubscription(userId: string, businessId: string) {
    // التحقق من صلاحية المستخدم
    const capability = await this.prisma.userBusinessCapability.findFirst({
      where: {
        userId,
        businessId,
        status: 'ACTIVE',
      },
    });

    if (!capability) {
      return null;
    }

    // جلب معلومات النشاط
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        nameAr: true,
        nameEn: true,
        slug: true,
        logo: true,
        createdAt: true,
      },
    });

    if (!business) {
      return null;
    }

    const subscription = await this.prisma.businessPackage.findFirst({
      where: { businessId },
      include: { 
        package: {
          include: {
            features: true,
            limits: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    if (!subscription) {
      return null;
    }

    const now = new Date();
    const endDate = subscription.endDate;
    const daysRemaining = endDate 
      ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      business,
      currentPackage: {
        packageId: subscription.packageId,
        packageName: subscription.package.nameAr,
        packageSlug: subscription.package.slug,
        price: subscription.package.price,
        durationDays: subscription.package.durationDays,
        isDefault: subscription.package.isDefault,
        features: subscription.package.features,
        limits: subscription.package.limits,
      },
      packageActivatedAt: subscription.startDate,
      packageExpiresAt: subscription.endDate,
      daysRemaining,
      status: subscription.isActive ? 'ACTIVE' : 'EXPIRED',
    };
  }

  /**
   * الحصول على تفاصيل الباقات الحالية لجميع أنشطة المستخدم التجارية
   * مع تواريخ مفصلة ومعلومات التجديد
   */
  async getUserPackagesDetails(userId: string) {
    // الحصول على جميع الأنشطة التجارية للمستخدم
    const capabilities = await this.prisma.userBusinessCapability.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      include: {
        business: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            slug: true,
            logo: true,
            createdAt: true, // تاريخ إضافة النشاط
          },
        },
      },
    });

    if (capabilities.length === 0) {
      return [];
    }

    // جلب معلومات الباقات لكل نشاط
    const packagesDetails = await Promise.all(
      capabilities.map(async (cap) => {
        const businessId = cap.business.id;

        // الباقة الحالية
        const currentPackage = await this.prisma.businessPackage.findFirst({
          where: { businessId, isActive: true },
          include: {
            package: {
              include: {
                features: true,
                limits: true,
              },
            },
          },
          orderBy: { startDate: 'desc' },
        });

        // تاريخ إضافة النشاط
        const businessCreatedAt = cap.business.createdAt;

        if (!currentPackage) {
          return {
            business: cap.business,
            businessCreatedAt,
            role: cap.role,
            currentPackage: null,
            packageActivatedAt: null,
            packageExpiresAt: null,
            daysRemaining: null,
            status: 'NO_PACKAGE',
            canRenew: false,
            canUpgrade: false,
          };
        }

        const now = new Date();
        const startDate = currentPackage.startDate;
        const endDate = currentPackage.endDate;
        
        // حساب الأيام المتبقية
        const daysRemaining = endDate
          ? Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
          : null;

        // تحديد الحالة
        let status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' = 'ACTIVE';
        if (daysRemaining !== null) {
          if (daysRemaining <= 0) {
            status = 'EXPIRED';
          } else if (daysRemaining <= 30) {
            status = 'EXPIRING_SOON';
          }
        }

        // الباقة الافتراضية لا تحتاج تجديد أو ترقية
        const isDefaultPackage = currentPackage.package.isDefault;

        return {
          business: cap.business,
          businessCreatedAt,
          role: cap.role,
          currentPackage: {
            id: currentPackage.id,
            packageId: currentPackage.packageId,
            packageName: currentPackage.package.nameAr,
            packageSlug: currentPackage.package.slug,
            price: currentPackage.package.price,
            durationDays: currentPackage.package.durationDays,
            isDefault: isDefaultPackage,
            features: currentPackage.package.features,
            limits: currentPackage.package.limits,
          },
          packageActivatedAt: startDate,
          packageExpiresAt: endDate,
          daysRemaining,
          status,
          canRenew: !isDefaultPackage && status !== 'EXPIRED',
          canUpgrade: !isDefaultPackage,
        };
      })
    );

    return packagesDetails;
  }

  /**
   * الحصول على جميع الباقات المتاحة للشراء/التجديد/الترقية
   */
  async getAvailablePackages() {
    const packages = await this.prisma.package.findMany({
      where: {
        status: 'ACTIVE',
        isPublic: true,
        isDefault: false, // استبعاد الباقة الافتراضية
      },
      include: {
        features: true,
        limits: true,
      },
      orderBy: [
        { sortOrder: 'asc' },
        { price: 'asc' },
      ],
    });

    return packages;
  }

  /**
   * الحصول على الملخص المالي لنشاط تجاري
   */
  async getBusinessFinancialSummary(userId: string, businessId: string) {
    // التحقق من صلاحية المستخدم
    const capability = await this.prisma.userBusinessCapability.findFirst({
      where: {
        userId,
        businessId,
        status: 'ACTIVE',
      },
    });

    if (!capability) {
      return null;
    }

    // الحصول على الفواتير
    const invoices = await this.prisma.accInvoice.findMany({
      where: {
        businessId,
      },
      select: {
        id: true,
        invoiceNumber: true,
        invoiceDate: true,
        dueDate: true,
        status: true,
        total: true,
        paidAmount: true,
      },
      orderBy: { invoiceDate: 'desc' },
      take: 10,
    });

    const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.paidAmount), 0);
    const totalPending = invoices
      .filter((inv) => inv.status === 'DRAFT' || inv.status === 'PARTIALLY_PAID')
      .reduce((sum, inv) => sum + (Number(inv.total) - Number(inv.paidAmount)), 0);

    const pendingInvoicesCount = invoices.filter(
      (inv) => inv.status === 'DRAFT' || inv.status === 'PARTIALLY_PAID'
    ).length;

    return {
      totalInvoiced,
      totalPaid,
      totalPending,
      invoicesCount: invoices.length,
      pendingInvoicesCount,
      paymentsCount: invoices.filter((inv) => Number(inv.paidAmount) > 0).length,
      recentInvoices: invoices.slice(0, 5),
    };
  }

  /**
   * الحصول على عروض وإعلانات محلية حسب موقع المستخدم
   */
  async getLocalOffers(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        governorateId: true,
        cityId: true,
        districtId: true,
      },
    });

    if (!user || !user.governorateId) {
      return [];
    }

    // البحث عن الإعلانات المستهدفة لمنطقة المستخدم
    const ads = await this.prisma.ad.findMany({
      where: {
        status: 'ACTIVE',
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
        OR: [
          { targetAllLocations: true },
          {
            targetGovernorates: {
              some: { governorateId: user.governorateId },
            },
          },
          ...(user.cityId
            ? [
                {
                  targetCities: {
                    some: { cityId: user.cityId },
                  },
                },
              ]
            : []),
        ],
      },
      take: 5,
      orderBy: { priority: 'desc' },
    });

    return ads;
  }
}
