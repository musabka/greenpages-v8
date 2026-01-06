import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PackagesService } from '../packages/packages.service';
import { LimitKey, ContactType, DayOfWeek, MediaType, ProductType } from '@greenpages/database';

@Injectable()
export class BusinessPortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly packagesService: PackagesService,
  ) {}

  // Get the business owned by the current user
  private async getBusinessByOwnerId(ownerId: string) {
    const business = await this.prisma.business.findFirst({
      where: { ownerId, deletedAt: null },
    });

    if (!business) {
      throw new NotFoundException('لم يتم العثور على نشاط تجاري مرتبط بحسابك');
    }

    return business;
  }

  // Get dashboard statistics
  async getDashboardStats(ownerId: string) {
    const business = await this.getBusinessByOwnerId(ownerId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get views statistics from BusinessView
    const [todayViews, monthViews, totalViews] = await Promise.all([
      this.prisma.businessView.aggregate({
        where: { businessId: business.id, date: { gte: today } },
        _sum: { count: true },
      }),
      this.prisma.businessView.aggregate({
        where: { businessId: business.id, date: { gte: monthStart } },
        _sum: { count: true },
      }),
      this.prisma.businessView.aggregate({
        where: { businessId: business.id },
        _sum: { count: true },
      }),
    ]);

    // Get reviews statistics
    const reviewsStats = await this.prisma.review.aggregate({
      where: { businessId: business.id, status: 'APPROVED' },
      _avg: { rating: true },
      _count: true,
    });

    // Pending reviews (reviews without reply)
    const pendingReviews = await this.prisma.review.count({
      where: {
        businessId: business.id,
        status: 'APPROVED',
        replyAr: null,
      },
    });

    // Unread notifications
    const unreadNotifications = await this.prisma.notification.count({
      where: { userId: ownerId, isRead: false },
    });

    // Recent reviews
    const recentReviews = await this.prisma.review.findMany({
      where: { businessId: business.id, status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
    });

    // Subscription info
    const subscription = await this.packagesService.getBusinessPackage(business.id);

    return {
      business: {
        id: business.id,
        nameAr: business.nameAr,
        nameEn: business.nameEn,
        logo: business.logo,
        status: business.status,
        isVerified: business.isVerified,
        isFeatured: business.isFeatured,
      },
      views: {
        today: todayViews._sum.count || 0,
        thisMonth: monthViews._sum.count || 0,
        total: totalViews._sum.count || business.viewsCount,
      },
      reviews: {
        average: reviewsStats._avg.rating || 0,
        total: reviewsStats._count || 0,
        pending: pendingReviews,
      },
      unreadNotifications,
      recentReviews: recentReviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.contentAr || r.contentEn || '',
        createdAt: r.createdAt.toISOString(),
        ownerReply: r.replyAr || r.replyEn,
        user: {
          fullName: `${r.user.firstName || ''} ${r.user.lastName || ''}`.trim() || 'مستخدم',
          avatar: r.user.avatar,
        },
      })),
      subscription: subscription
        ? {
            packageName: (subscription as any).package?.nameAr || 'الباقة الأساسية',
            daysRemaining: subscription.endDate
              ? Math.max(0, Math.ceil((new Date(subscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
              : null,
          }
        : null,
    };
  }

  // Get views chart data
  async getViewsChart(ownerId: string, period: 'week' | 'month' | 'year' = 'week') {
    const business = await this.getBusinessByOwnerId(ownerId);

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'week':
      default:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
    }

    const views = await this.prisma.businessView.findMany({
      where: {
        businessId: business.id,
        date: { gte: startDate },
      },
      orderBy: { date: 'asc' },
    });

    return views.map((v) => ({
      date: v.date.toISOString().split('T')[0],
      count: v.count,
    }));
  }

  // Get full business profile
  async getMyBusiness(ownerId: string) {
    const business = await this.prisma.business.findFirst({
      where: { ownerId, deletedAt: null },
      include: {
        governorate: true,
        city: true,
        district: true,
        categories: { include: { category: true } },
        contacts: { orderBy: { sortOrder: 'asc' } },
        workingHours: { orderBy: { dayOfWeek: 'asc' } },
      },
    });

    if (!business) {
      throw new NotFoundException('لم يتم العثور على نشاط تجاري مرتبط بحسابك');
    }

    return business;
  }

  // Update business profile
  async updateProfile(
    ownerId: string,
    data: {
      nameAr?: string;
      nameEn?: string;
      descriptionAr?: string;
      descriptionEn?: string;
      shortDescAr?: string;
      shortDescEn?: string;
      metaTitleAr?: string;
      metaTitleEn?: string;
      metaDescAr?: string;
      metaDescEn?: string;
    },
  ) {
    const business = await this.getBusinessByOwnerId(ownerId);

    return this.prisma.business.update({
      where: { id: business.id },
      data: {
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        descriptionAr: data.descriptionAr,
        descriptionEn: data.descriptionEn,
        shortDescAr: data.shortDescAr,
        shortDescEn: data.shortDescEn,
        metaTitleAr: data.metaTitleAr,
        metaTitleEn: data.metaTitleEn,
        metaDescAr: data.metaDescAr,
        metaDescEn: data.metaDescEn,
      },
    });
  }

  // Update contacts
  async updateContacts(
    ownerId: string,
    contacts: Array<{
      type: ContactType;
      value: string;
      label?: string;
      isPrimary?: boolean;
    }>,
  ) {
    const business = await this.getBusinessByOwnerId(ownerId);

    // Delete existing and create new
    await this.prisma.businessContact.deleteMany({
      where: { businessId: business.id, branchId: null },
    });

    return this.prisma.businessContact.createMany({
      data: contacts.map((contact, index) => ({
        businessId: business.id,
        type: contact.type,
        value: contact.value,
        label: contact.label,
        isPrimary: contact.isPrimary || false,
        sortOrder: index,
      })),
    });
  }

  // Update working hours
  async updateWorkingHours(
    ownerId: string,
    hours: Array<{
      dayOfWeek: DayOfWeek;
      openTime?: string;
      closeTime?: string;
      isClosed?: boolean;
      is24Hours?: boolean;
    }>,
  ) {
    const business = await this.getBusinessByOwnerId(ownerId);

    // Delete existing and create new
    await this.prisma.businessWorkingHours.deleteMany({
      where: { businessId: business.id, branchId: null },
    });

    return this.prisma.businessWorkingHours.createMany({
      data: hours.map((hour) => ({
        businessId: business.id,
        dayOfWeek: hour.dayOfWeek,
        openTime: hour.openTime,
        closeTime: hour.closeTime,
        isClosed: hour.isClosed || false,
        is24Hours: hour.is24Hours || false,
      })),
    });
  }

  // ===== BRANCHES =====
  async getBranches(ownerId: string) {
    const business = await this.getBusinessByOwnerId(ownerId);

    return this.prisma.businessBranch.findMany({
      where: { businessId: business.id },
      include: {
        city: true,
        district: true,
      },
      orderBy: [{ isMain: 'desc' }, { sortOrder: 'asc' }],
    });
  }

  async createBranch(
    ownerId: string,
    data: {
      nameAr?: string;
      nameEn?: string;
      addressAr: string;
      addressEn?: string;
      phone?: string;
      cityId: string;
      districtId?: string;
      latitude?: number;
      longitude?: number;
      isMain?: boolean;
      isActive?: boolean;
    },
  ) {
    const business = await this.getBusinessByOwnerId(ownerId);

    // Check limit
    const limit = await this.packagesService.getBusinessLimit(business.id, LimitKey.MAX_BRANCHES);
    const currentCount = await this.prisma.businessBranch.count({
      where: { businessId: business.id },
    });

    if (currentCount >= limit) {
      throw new ForbiddenException(`لقد وصلت للحد الأقصى من الفروع (${limit}). قم بترقية باقتك لإضافة المزيد.`);
    }

    return this.prisma.businessBranch.create({
      data: {
        business: { connect: { id: business.id } },
        city: { connect: { id: data.cityId } },
        district: data.districtId ? { connect: { id: data.districtId } } : undefined,
        nameAr: data.nameAr || business.nameAr,
        nameEn: data.nameEn,
        addressAr: data.addressAr,
        addressEn: data.addressEn,
        phone: data.phone,
        latitude: data.latitude,
        longitude: data.longitude,
        isMain: data.isMain || false,
        isActive: data.isActive !== false,
      },
      include: { city: true, district: true },
    });
  }

  async updateBranch(
    ownerId: string,
    branchId: string,
    data: {
      nameAr?: string;
      nameEn?: string;
      addressAr?: string;
      addressEn?: string;
      phone?: string;
      cityId?: string;
      districtId?: string;
      latitude?: number;
      longitude?: number;
      isMain?: boolean;
      isActive?: boolean;
    },
  ) {
    const business = await this.getBusinessByOwnerId(ownerId);

    const branch = await this.prisma.businessBranch.findFirst({
      where: { id: branchId, businessId: business.id },
    });

    if (!branch) {
      throw new NotFoundException('الفرع غير موجود');
    }

    return this.prisma.businessBranch.update({
      where: { id: branchId },
      data: {
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        addressAr: data.addressAr,
        addressEn: data.addressEn,
        phone: data.phone,
        cityId: data.cityId,
        districtId: data.districtId,
        latitude: data.latitude,
        longitude: data.longitude,
        isMain: data.isMain,
        isActive: data.isActive,
      },
      include: { city: true, district: true },
    });
  }

  async deleteBranch(ownerId: string, branchId: string) {
    const business = await this.getBusinessByOwnerId(ownerId);

    const branch = await this.prisma.businessBranch.findFirst({
      where: { id: branchId, businessId: business.id },
    });

    if (!branch) {
      throw new NotFoundException('الفرع غير موجود');
    }

    if (branch.isMain) {
      throw new BadRequestException('لا يمكن حذف الفرع الرئيسي');
    }

    await this.prisma.businessBranch.delete({ where: { id: branchId } });
    return { success: true };
  }

  // ===== PRODUCTS =====
  async getProducts(ownerId: string, type?: ProductType) {
    const business = await this.getBusinessByOwnerId(ownerId);

    return this.prisma.businessProduct.findMany({
      where: {
        businessId: business.id,
        ...(type ? { type } : {}),
      },
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
    });
  }

  async createProduct(
    ownerId: string,
    data: {
      type: ProductType;
      nameAr: string;
      nameEn?: string;
      descriptionAr?: string;
      descriptionEn?: string;
      image?: string;
      price?: number;
      currency?: string;
      priceNote?: string;
      isAvailable?: boolean;
      isFeatured?: boolean;
    },
  ) {
    const business = await this.getBusinessByOwnerId(ownerId);

    // Check limit
    const limit = await this.packagesService.getBusinessLimit(business.id, LimitKey.MAX_PRODUCTS);
    const currentCount = await this.prisma.businessProduct.count({
      where: { businessId: business.id },
    });

    if (currentCount >= limit) {
      throw new ForbiddenException(`لقد وصلت للحد الأقصى من المنتجات (${limit}). قم بترقية باقتك لإضافة المزيد.`);
    }

    return this.prisma.businessProduct.create({
      data: {
        businessId: business.id,
        type: data.type,
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        descriptionAr: data.descriptionAr,
        descriptionEn: data.descriptionEn,
        image: data.image,
        price: data.price,
        currency: data.currency || 'SYP',
        priceNote: data.priceNote,
        isAvailable: data.isAvailable !== false,
        isFeatured: data.isFeatured || false,
      },
    });
  }

  async updateProduct(
    ownerId: string,
    productId: string,
    data: {
      type?: ProductType;
      nameAr?: string;
      nameEn?: string;
      descriptionAr?: string;
      descriptionEn?: string;
      image?: string;
      price?: number;
      currency?: string;
      priceNote?: string;
      isAvailable?: boolean;
      isFeatured?: boolean;
    },
  ) {
    const business = await this.getBusinessByOwnerId(ownerId);

    const product = await this.prisma.businessProduct.findFirst({
      where: { id: productId, businessId: business.id },
    });

    if (!product) {
      throw new NotFoundException('المنتج غير موجود');
    }

    return this.prisma.businessProduct.update({
      where: { id: productId },
      data,
    });
  }

  async deleteProduct(ownerId: string, productId: string) {
    const business = await this.getBusinessByOwnerId(ownerId);

    const product = await this.prisma.businessProduct.findFirst({
      where: { id: productId, businessId: business.id },
    });

    if (!product) {
      throw new NotFoundException('المنتج غير موجود');
    }

    await this.prisma.businessProduct.delete({ where: { id: productId } });
    return { success: true };
  }

  // ===== GALLERY =====
  async getGallery(ownerId: string) {
    const business = await this.getBusinessByOwnerId(ownerId);

    return this.prisma.businessMedia.findMany({
      where: { businessId: business.id, type: { in: [MediaType.IMAGE, MediaType.VIDEO, MediaType.GALLERY] } },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async addMedia(
    ownerId: string,
    data: {
      type: MediaType;
      url: string;
      title?: string;
      altText?: string;
    },
  ) {
    const business = await this.getBusinessByOwnerId(ownerId);

    // Check limit
    const limit = await this.packagesService.getBusinessLimit(business.id, LimitKey.MAX_GALLERY_PHOTOS);
    const currentCount = await this.prisma.businessMedia.count({
      where: { businessId: business.id, type: { in: [MediaType.IMAGE, MediaType.VIDEO, MediaType.GALLERY] } },
    });

    if (currentCount >= limit) {
      throw new ForbiddenException(`لقد وصلت للحد الأقصى من الصور (${limit}). قم بترقية باقتك لإضافة المزيد.`);
    }

    return this.prisma.businessMedia.create({
      data: {
        businessId: business.id,
        type: data.type,
        url: data.url,
        titleAr: data.title,
        altAr: data.altText,
        sortOrder: currentCount,
      },
    });
  }

  async deleteMedia(ownerId: string, mediaId: string) {
    const business = await this.getBusinessByOwnerId(ownerId);

    const media = await this.prisma.businessMedia.findFirst({
      where: { id: mediaId, businessId: business.id },
    });

    if (!media) {
      throw new NotFoundException('الصورة غير موجودة');
    }

    await this.prisma.businessMedia.delete({ where: { id: mediaId } });
    return { success: true };
  }

  async reorderMedia(ownerId: string, mediaIds: string[]) {
    const business = await this.getBusinessByOwnerId(ownerId);

    const updates = mediaIds.map((id, index) =>
      this.prisma.businessMedia.updateMany({
        where: { id, businessId: business.id },
        data: { sortOrder: index },
      }),
    );

    await this.prisma.$transaction(updates);
    return { success: true };
  }

  // ===== REVIEWS =====
  async getReviews(ownerId: string, filter?: 'all' | 'pending' | 'replied', page = 1, limit = 10) {
    const business = await this.getBusinessByOwnerId(ownerId);

    const where: any = {
      businessId: business.id,
      status: 'APPROVED',
    };

    if (filter === 'pending') {
      where.replyAr = null;
    } else if (filter === 'replied') {
      where.replyAr = { not: null };
    }

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.titleAr || r.titleEn,
        comment: r.contentAr || r.contentEn || '',
        pros: r.pros,
        cons: r.cons,
        createdAt: r.createdAt.toISOString(),
        ownerReply: r.replyAr || r.replyEn,
        repliedAt: r.repliedAt?.toISOString(),
        user: {
          id: r.user.id,
          fullName: `${r.user.firstName || ''} ${r.user.lastName || ''}`.trim() || 'مستخدم',
          avatar: r.user.avatar,
        },
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async replyToReview(ownerId: string, reviewId: string, reply: string) {
    const business = await this.getBusinessByOwnerId(ownerId);

    const review = await this.prisma.review.findFirst({
      where: { id: reviewId, businessId: business.id, status: 'APPROVED' },
    });

    if (!review) {
      throw new NotFoundException('التقييم غير موجود');
    }

    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        replyAr: reply,
        repliedAt: new Date(),
      },
    });
  }

  async updateReviewReply(ownerId: string, reviewId: string, reply: string) {
    const business = await this.getBusinessByOwnerId(ownerId);

    const review = await this.prisma.review.findFirst({
      where: { id: reviewId, businessId: business.id, status: 'APPROVED' },
    });

    if (!review) {
      throw new NotFoundException('التقييم غير موجود');
    }

    if (!review.replyAr && !review.replyEn) {
      throw new BadRequestException('لا يوجد رد لتعديله');
    }

    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        replyAr: reply,
        repliedAt: new Date(),
      },
    });
  }

  async deleteReviewReply(ownerId: string, reviewId: string) {
    const business = await this.getBusinessByOwnerId(ownerId);

    const review = await this.prisma.review.findFirst({
      where: { id: reviewId, businessId: business.id, status: 'APPROVED' },
    });

    if (!review) {
      throw new NotFoundException('التقييم غير موجود');
    }

    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        replyAr: null,
        replyEn: null,
        repliedAt: null,
      },
    });
  }

  // ===== SUBSCRIPTION =====
  async getSubscription(ownerId: string) {
    const business = await this.getBusinessByOwnerId(ownerId);

    const subscription = await this.packagesService.getBusinessPackage(business.id);

    if (!subscription) {
      return null;
    }

    const pkg = (subscription as any).package || subscription;

    // Get usage
    const [branchesCount, productsCount, galleryCount] = await Promise.all([
      this.prisma.businessBranch.count({ where: { businessId: business.id } }),
      this.prisma.businessProduct.count({ where: { businessId: business.id } }),
      this.prisma.businessMedia.count({
        where: { businessId: business.id, type: { in: [MediaType.IMAGE, MediaType.VIDEO, MediaType.GALLERY] } },
      }),
    ]);

    // Get limits
    const limits = pkg.limits || [];
    const getLimitValue = (key: string) => limits.find((l: any) => l.limitKey === key)?.limitValue || 0;

    return {
      id: subscription.id,
      packageId: pkg.id,
      packageName: pkg.nameAr,
      packageSlug: pkg.slug,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      isActive: subscription.isActive,
      daysRemaining: subscription.endDate
        ? Math.max(0, Math.ceil((new Date(subscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null,
      usage: {
        branches: { used: branchesCount, limit: getLimitValue(LimitKey.MAX_BRANCHES) },
        products: { used: productsCount, limit: getLimitValue(LimitKey.MAX_PRODUCTS) },
        gallery: { used: galleryCount, limit: getLimitValue(LimitKey.MAX_GALLERY_PHOTOS) },
      },
      features: pkg.features || [],
    };
  }

  // ===== NOTIFICATIONS =====
  async getNotifications(ownerId: string, page = 1, limit = 20) {
    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId: ownerId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.notification.count({ where: { userId: ownerId } }),
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async markNotificationAsRead(ownerId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId: ownerId },
    });

    if (!notification) {
      throw new NotFoundException('الإشعار غير موجود');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllNotificationsAsRead(ownerId: string) {
    return this.prisma.notification.updateMany({
      where: { userId: ownerId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  // Get financial information for business owner
  async getFinancialStats(ownerId: string) {
    const business = await this.getBusinessByOwnerId(ownerId);

    // Get current subscription with package details
    const currentSubscription = await this.prisma.businessPackage.findFirst({
      where: {
        businessId: business.id,
        isActive: true,
      },
      include: {
        package: true,
      },
      orderBy: { startDate: 'desc' },
    });

    // Get all subscription history
    const subscriptionHistory = await this.prisma.businessPackage.findMany({
      where: {
        businessId: business.id,
      },
      include: {
        package: true,
      },
      orderBy: { startDate: 'desc' },
    });

    // Calculate total spent on subscriptions (using package price)
    const totalSpent = subscriptionHistory.reduce((sum, sub) => {
      return sum + Number(sub.package.price || 0);
    }, 0);

    // Get agent commission info (if this business was created by an agent)
    const agentCommission = await this.prisma.agentCommission.findFirst({
      where: {
        businessId: business.id,
      },
      include: {
        agentProfile: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    // Count total payments made
    const paymentsCount = await this.prisma.businessPackage.count({
      where: {
        businessId: business.id,
      },
    });

    // Get pending/upcoming renewal info
    let upcomingRenewal = null;
    if (currentSubscription && currentSubscription.endDate) {
      const daysUntilExpiry = Math.ceil(
        (new Date(currentSubscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      
      if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
        upcomingRenewal = {
          daysRemaining: daysUntilExpiry,
          packageName: currentSubscription.package.nameAr,
          amount: Number(currentSubscription.package.price),
          expiryDate: currentSubscription.endDate,
        };
      }
    }

    return {
      summary: {
        totalSpent: totalSpent,
        paymentsCount: paymentsCount,
        currentPackage: currentSubscription
          ? {
              name: currentSubscription.package.nameAr,
              price: Number(currentSubscription.package.price),
              startDate: currentSubscription.startDate,
              endDate: currentSubscription.endDate,
              status: currentSubscription.isActive ? 'ACTIVE' : 'EXPIRED',
              daysRemaining: currentSubscription.endDate
                ? Math.max(
                    0,
                    Math.ceil(
                      (new Date(currentSubscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
                    ),
                  )
                : null,
            }
          : null,
        upcomingRenewal,
      },
      subscriptionHistory: subscriptionHistory.map((sub) => ({
        id: sub.id,
        packageName: sub.package.nameAr,
        amount: Number(sub.package.price),
        startDate: sub.startDate,
        endDate: sub.endDate,
        status: sub.isActive ? 'ACTIVE' : 'EXPIRED',
        duration: sub.package.durationDays,
        createdAt: sub.createdAt,
      })),
      agentInfo: agentCommission
        ? {
            agentName: `${agentCommission.agentProfile.user.firstName || ''} ${agentCommission.agentProfile.user.lastName || ''}`.trim(),
            agentPhone: agentCommission.agentProfile.user.phone,
            commissionAmount: Number(agentCommission.commissionAmount || 0),
            commissionStatus: agentCommission.status,
            createdAt: agentCommission.createdAt,
          }
        : null,
    };
  }
}
