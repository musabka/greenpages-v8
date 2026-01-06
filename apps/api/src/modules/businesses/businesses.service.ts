import { Injectable, NotFoundException, ConflictException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Prisma,
  Business,
  BusinessStatus,
  LimitKey,
  CapabilityStatus,
  TrustLevel,
  BusinessCapabilityRole,
  CapabilitySource,
} from '@greenpages/database';
import slugify from 'slugify';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import { PackagesService } from '../packages/packages.service';
import { CommissionsService } from '../commissions/commissions.service';
import { CapabilitiesService } from '../capabilities/capabilities.service';
import { OwnershipNotificationService } from './ownership-notification.service';

@Injectable()
export class BusinessesService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis,
    private readonly packagesService: PackagesService,
    private readonly commissionsService: CommissionsService,
    @Inject(forwardRef(() => CapabilitiesService))
    private readonly capabilitiesService: CapabilitiesService,
  ) {}

  private generateSlug(name: string): string {
    const baseSlug = slugify(name, { lower: true, strict: true, locale: 'ar' });
    return `${baseSlug}-${Date.now().toString(36)}`;
  }

  async create(data: any): Promise<Business> {
    const slug = data.slug || this.generateSlug(data.nameAr);
    
    const existing = await this.prisma.business.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException('النشاط التجاري موجود مسبقاً');
    }

    // إذا كان المنشئ مندوب، تحقق من أنه يختار محافظة من المحافظات المخصصة له
    if (data.createdById) {
      const creatorAgentProfile = await this.prisma.agentProfile.findUnique({
        where: { userId: data.createdById },
        include: {
          governorates: { select: { governorateId: true } },
        },
      });
      
      if (creatorAgentProfile) {
        const allowedGovernorateIds = new Set(creatorAgentProfile.governorates.map(g => g.governorateId));
        if (!allowedGovernorateIds.has(data.governorateId)) {
          throw new ForbiddenException('يمكنك فقط إضافة أنشطة في المحافظات المخصصة لك');
        }
      }
    }

    const { categoryIds, contacts, workingHours, branches, persons, products, media, ...businessData } = data;

    // فحص ما إذا كان المنشئ agent ولا يحتاج موافقة
    let businessStatus = businessData.status || BusinessStatus.DRAFT;
    if (data.createdById) {
      const creatorAgentProfile = await this.prisma.agentProfile.findUnique({
        where: { userId: data.createdById },
        select: { requiresApproval: true },
      });
      
      // إذا كان المنشئ agent ولا يحتاج موافقة، يتم نشر النشاط مباشرة
      if (creatorAgentProfile && !creatorAgentProfile.requiresApproval) {
        businessStatus = BusinessStatus.APPROVED;
      }
    }

    const business = await this.prisma.business.create({
      data: {
        ...businessData,
        slug,
        status: businessStatus,
        ownerStatus: data.ownerId ? 'claimed' : 'unclaimed', // تحديد ownerStatus بناءً على وجود مالك
        categories: categoryIds ? {
          create: categoryIds.map((id: string, index: number) => ({
            categoryId: id,
            isPrimary: index === 0,
          })),
        } : undefined,
        contacts: contacts ? { create: contacts } : undefined,
        workingHours: workingHours ? { create: workingHours } : undefined,
        branches: branches ? { create: branches } : undefined,
        persons: persons ? { create: persons } : undefined,
        products: products ? { create: products } : undefined,
        media: media ? { create: media } : undefined,
      },
      include: this.getFullInclude(),
    });

    // إذا تم تحديد مالك، أنشئ capability
    if (data.ownerId) {
      try {
        await this.capabilitiesService.linkOwner(
          business.id,
          data.ownerId,
          data.createdById,
          {
            trustLevel: 'FIELD_VERIFIED' as any,
            source: 'AGENT' as any,
          },
        );
      } catch (error) {
        console.error('Error creating capability:', error);
        // لا نوقف عملية إنشاء البيزنس إذا فشل إنشاء الـ capability
      }
    }

    // إذا تم الموافقة على النشاط مباشرة، أنشئ العمولات
    if (business.status === BusinessStatus.APPROVED) {
      try {
        await this.commissionsService.createCommissionsForBusiness(business.id);
      } catch (error) {
        console.error('Error creating commissions:', error);
        // لا نوقف عملية إنشاء البيزنس إذا فشل إنشاء العمولات
      }
    }

    return business;
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.BusinessWhereInput;
    orderBy?: Prisma.BusinessOrderByWithRelationInput;
    search?: string;
    categoryId?: string;
    governorateId?: string;
    cityId?: string;
    districtId?: string;
    status?: BusinessStatus;
    ownerStatus?: 'unclaimed' | 'claimed' | 'verified';
    featured?: boolean;
    verified?: boolean;
  }) {
    const { skip, take, search, categoryId, governorateId, cityId, districtId, status, ownerStatus, featured, verified } = params;
    
    const where: Prisma.BusinessWhereInput = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { nameAr: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { descriptionAr: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      // Include businesses from the selected category and all its subcategories
      const categoryIds = [categoryId];
      
      // Fetch all subcategories of the selected category
      const subcategories = await this.prisma.category.findMany({
        where: { parentId: categoryId },
        select: { id: true },
      });
      
      categoryIds.push(...subcategories.map(c => c.id));
      
      where.categories = { some: { categoryId: { in: categoryIds } } };
    }

    if (governorateId) {
      where.governorateId = governorateId;
    }

    if (cityId) {
      where.cityId = cityId;
    }

    if (districtId) {
      where.districtId = districtId;
    }

    if (status) {
      where.status = status;
    }

    if (ownerStatus) {
      where.ownerStatus = ownerStatus;
    }

    if (featured !== undefined) {
      where.isFeatured = featured;
    }

    if (verified !== undefined) {
      where.isVerified = verified;
    }

    const [businesses, total] = await Promise.all([
      this.prisma.business.findMany({
        skip,
        take,
        where,
        orderBy: params.orderBy || [
          { isFeatured: 'desc' },
          { averageRating: 'desc' },
          { createdAt: 'desc' },
        ],
        include: {
          governorate: true,
          city: true,
          district: true,
          categories: { include: { category: true } },
          userCapabilities: {
            where: { status: CapabilityStatus.ACTIVE },
            select: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                },
              },
              status: true,
              trustLevel: true,
            },
            take: 1,
          },
          _count: { select: { reviews: true, branches: true } },
        },
      }),
      this.prisma.business.count({ where }),
    ]);

    // Format response dengan owner data
    const formattedBusinesses = businesses.map(business => ({
      ...business,
      owner: business.userCapabilities?.[0]?.user || null,
    }));

    return {
      data: formattedBusinesses,
      meta: {
        total,
        page: skip ? Math.floor(skip / (take || 20)) + 1 : 1,
        pageSize: take || 20,
        totalPages: Math.ceil(total / (take || 20)),
      },
    };
  }

  async findById(id: string): Promise<Business | null> {
    return this.prisma.business.findFirst({
      where: { id, deletedAt: null },
      include: this.getFullInclude(),
    });
  }

  async findBySlug(slug: string): Promise<Business | null> {
    const business = await this.prisma.business.findFirst({
      where: { slug, deletedAt: null, status: BusinessStatus.APPROVED },
      include: this.getFullInclude(),
    });

    if (business) {
      // Increment total views count in DB
      await this.prisma.business.update({
        where: { id: business.id },
        data: { viewsCount: { increment: 1 } },
      });

      // Track daily views in Redis & DB
      await this.trackView(business.id);
    }

    return business;
  }

  async update(id: string, data: any): Promise<Business> {
    const business = await this.findById(id);
    if (!business) {
      throw new NotFoundException('النشاط التجاري غير موجود');
    }

    const { categoryIds, contacts, workingHours, branches, persons, products, media, ...businessData } = data;

    // --- Package Limits Check ---
    if (branches) {
      const maxBranches = await this.packagesService.getBusinessLimit(id, LimitKey.MAX_BRANCHES);
      if (branches.length > maxBranches) {
        throw new ForbiddenException(`بناءً على باقتك الحالية، لا يمكنك إضافة أكثر من ${maxBranches} فروع`);
      }
    }

    if (persons) {
      const maxPersons = await this.packagesService.getBusinessLimit(id, LimitKey.MAX_PERSONS);
      if (persons.length > maxPersons) {
        throw new ForbiddenException(`بناءً على باقتك الحالية، لا يمكنك إضافة أكثر من ${maxPersons} أشخاص`);
      }
    }

    if (products) {
      const maxProducts = await this.packagesService.getBusinessLimit(id, LimitKey.MAX_PRODUCTS);
      if (products.length > maxProducts) {
        throw new ForbiddenException(`بناءً على باقتك الحالية، لا يمكنك إضافة أكثر من ${maxProducts} منتجات/خدمات`);
      }
    }

    if (media) {
      const maxPhotos = await this.packagesService.getBusinessLimit(id, LimitKey.MAX_GALLERY_PHOTOS);
      if (media.length > maxPhotos) {
        throw new ForbiddenException(`بناءً على باقتك الحالية، لا يمكنك إضافة أكثر من ${maxPhotos} صور في المعرض`);
      }
    }
    // ----------------------------

    // Handle categories update
    if (categoryIds) {
      await this.prisma.businessCategory.deleteMany({ where: { businessId: id } });
      await this.prisma.businessCategory.createMany({
        data: categoryIds.map((catId: string, index: number) => ({
          businessId: id,
          categoryId: catId,
          isPrimary: index === 0,
        })),
      });
    }

    // Handle contacts update
    if (contacts) {
      await this.prisma.businessContact.deleteMany({ where: { businessId: id } });
      await this.prisma.businessContact.createMany({
        data: contacts.map((c: any) => ({ ...c, businessId: id })),
      });
    }

    // Handle working hours update
    if (workingHours) {
      await this.prisma.businessWorkingHours.deleteMany({ where: { businessId: id } });
      await this.prisma.businessWorkingHours.createMany({
        data: workingHours.map((wh: any) => ({ ...wh, businessId: id })),
      });
    }

    // Handle branches update
    if (branches) {
      await this.prisma.businessBranch.deleteMany({ where: { businessId: id } });
      if (branches.length) {
        await this.prisma.businessBranch.createMany({
          data: branches.map((b: any) => ({ ...b, businessId: id })),
        });
      }
    }

    // Handle persons (team) update
    if (persons) {
      await this.prisma.businessPerson.deleteMany({ where: { businessId: id } });
      if (persons.length) {
        await this.prisma.businessPerson.createMany({
          data: persons.map((p: any) => ({ ...p, businessId: id })),
        });
      }
    }

    // Handle products update
    if (products) {
      await this.prisma.businessProduct.deleteMany({ where: { businessId: id } });
      if (products.length) {
        await this.prisma.businessProduct.createMany({
          data: products.map((p: any) => ({ ...p, businessId: id })),
        });
      }
    }

    // Handle media update (gallery/images)
    if (media) {
      await this.prisma.businessMedia.deleteMany({ where: { businessId: id } });
      if (media.length) {
        await this.prisma.businessMedia.createMany({
          data: media.map((m: any) => ({ ...m, businessId: id })),
        });
      }
    }

    return this.prisma.business.update({
      where: { id },
      data: businessData,
      include: this.getFullInclude(),
    });
  }

  async updateStatus(id: string, status: BusinessStatus): Promise<Business> {
    const business = await this.findById(id);
    if (!business) {
      throw new NotFoundException('النشاط التجاري غير موجود');
    }

    return this.prisma.business.update({
      where: { id },
      data: {
        status,
        publishedAt: status === BusinessStatus.APPROVED ? new Date() : undefined,
      },
      include: this.getFullInclude(),
    });
  }

  async delete(id: string): Promise<void> {
    const business = await this.findById(id);
    if (!business) {
      throw new NotFoundException('النشاط التجاري غير موجود');
    }

    // Soft delete
    await this.prisma.business.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Track daily views using Redis (atomic) and sync to DB
   */
  private async trackView(businessId: string) {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const redisKey = `views:business:${businessId}:${today}`;

    try {
      // 1. Increment in Redis
      await this.redis.incr(redisKey);
      // Set expiry to 48 hours to clean up old keys
      await this.redis.expire(redisKey, 172800);
    } catch (error) {
      // Log redis error but don't break the request
      console.error('Redis increment error:', error);
    }

    // 2. Sync to DB (Upsert)
    try {
      await this.prisma.businessView.upsert({
        where: {
          businessId_date: {
            businessId,
            date: new Date(today),
          },
        },
        update: {
          count: { increment: 1 },
        },
        create: {
          businessId,
          date: new Date(today),
          count: 1,
        },
      });
    } catch (error) {
      console.error('DB views sync error:', error);
    }
  }

  async getFeatured(limit: number = 10) {
    return this.prisma.business.findMany({
      where: {
        isFeatured: true,
        isActive: true,
        status: BusinessStatus.APPROVED,
        deletedAt: null,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        governorate: true,
        city: true,
        categories: { include: { category: true } },
      },
    });
  }

  async getStats() {
    const [total, approved, pending, featured, verified, claimed, unclaimed, verifiedOwnership] = await Promise.all([
      this.prisma.business.count({ where: { deletedAt: null } }),
      this.prisma.business.count({ where: { status: BusinessStatus.APPROVED, deletedAt: null } }),
      this.prisma.business.count({ where: { status: BusinessStatus.PENDING, deletedAt: null } }),
      this.prisma.business.count({ where: { isFeatured: true, deletedAt: null } }),
      this.prisma.business.count({ where: { isVerified: true, deletedAt: null } }),
      this.prisma.business.count({ where: { ownerStatus: 'claimed', deletedAt: null } }),
      this.prisma.business.count({ where: { ownerStatus: 'unclaimed', deletedAt: null } }),
      this.prisma.business.count({
        where: {
          userCapabilities: { some: { status: CapabilityStatus.ACTIVE } },
          deletedAt: null,
        },
      }),
    ]);

    return {
      total,
      approved,
      pending,
      featured,
      verified,
      ownership: {
        claimed,
        unclaimed,
        verified: verifiedOwnership,
      },
    };
  }

  async search(query: string, params: { governorateId?: string; cityId?: string; categoryId?: string; limit?: number }) {
    const where: Prisma.BusinessWhereInput = {
      deletedAt: null,
      status: BusinessStatus.APPROVED,
      isActive: true,
      OR: [
        { nameAr: { contains: query, mode: 'insensitive' } },
        { nameEn: { contains: query, mode: 'insensitive' } },
        { shortDescAr: { contains: query, mode: 'insensitive' } },
      ],
    };

    if (params.governorateId) where.governorateId = params.governorateId;
    if (params.cityId) where.cityId = params.cityId;
    if (params.categoryId) where.categories = { some: { categoryId: params.categoryId } };

    return this.prisma.business.findMany({
      where,
      take: params.limit || 20,
      orderBy: [{ isFeatured: 'desc' }, { averageRating: 'desc' }],
      include: {
        governorate: true,
        city: true,
        categories: { include: { category: true } },
      },
    });
  }

  async getMapBusinesses(params: { governorateId?: string; cityId?: string; categoryId?: string; bounds?: { north: number; south: number; east: number; west: number } }) {
    const where: Prisma.BusinessWhereInput = {
      deletedAt: null,
      status: BusinessStatus.APPROVED,
      isActive: true,
      latitude: { not: null },
      longitude: { not: null },
    };

    if (params.governorateId) where.governorateId = params.governorateId;
    if (params.cityId) where.cityId = params.cityId;
    if (params.categoryId) where.categories = { some: { categoryId: params.categoryId } };

    if (params.bounds) {
      where.latitude = { gte: params.bounds.south, lte: params.bounds.north };
      where.longitude = { gte: params.bounds.west, lte: params.bounds.east };
    }

    return this.prisma.business.findMany({
      where,
      take: 100,
      select: {
        id: true,
        slug: true,
        nameAr: true,
        nameEn: true,
        logo: true,
        latitude: true,
        longitude: true,
        addressAr: true,
        averageRating: true,
        categories: { include: { category: { select: { nameAr: true, icon: true, color: true } } }, take: 1 },
      },
    });
  }

  private getFullInclude() {
    return {
      governorate: true,
      city: true,
      district: true,
      owner: { select: { id: true, email: true, displayName: true } },
      agent: { select: { id: true, email: true, displayName: true } },
      userCapabilities: {
        where: { status: CapabilityStatus.ACTIVE },
        select: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          status: true,
          trustLevel: true,
        },
        take: 1,
      },
      categories: { include: { category: true } },
      branches: { where: { isActive: true }, orderBy: { sortOrder: 'asc' as const } },
      workingHours: { orderBy: { dayOfWeek: 'asc' as const } },
      contacts: { where: { isPublic: true }, orderBy: { sortOrder: 'asc' as const } },
      media: { where: { isActive: true }, orderBy: { sortOrder: 'asc' as const } },
      persons: { where: { isPublic: true }, orderBy: { sortOrder: 'asc' as const } },
      products: { where: { isAvailable: true }, orderBy: { sortOrder: 'asc' as const } },
      _count: { select: { reviews: true, branches: true } },
    };
  }

  async linkOwner(businessId: string, userId: string, performedBy: string): Promise<any> {
    const business = await this.findById(businessId);
    if (!business) {
      throw new NotFoundException('النشاط التجاري غير موجود');
    }

    // Check if user exists
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    // Create audit log entry
    try {
      await this.prisma.businessOwnershipAudit.create({
        data: {
          businessId,
          userId,
          action: 'LINKED',
          performedBy,
          previousStatus: business.ownerStatus,
          newStatus: 'claimed',
          changes: {
            linkedUser: `${user.firstName} ${user.lastName}`,
            email: user.email,
          },
        },
      });
    } catch (error) {
      // If audit log fails, continue but log error
      console.error('Failed to create audit log:', error);
    }

    // Create or update the capability
    const existingCapability = await this.prisma.userBusinessCapability.findUnique({
      where: {
        userId_businessId_role: { userId, businessId, role: BusinessCapabilityRole.OWNER },
      },
    });

    if (existingCapability) {
      await this.prisma.userBusinessCapability.update({
        where: { userId_businessId_role: { userId, businessId, role: BusinessCapabilityRole.OWNER } },
        data: { status: CapabilityStatus.ACTIVE, activatedAt: new Date() },
      });
    } else {
      await this.prisma.userBusinessCapability.create({
        data: {
          userId,
          businessId,
          role: BusinessCapabilityRole.OWNER,
          status: CapabilityStatus.ACTIVE,
          trustLevel: TrustLevel.FIELD_VERIFIED,
          source: CapabilitySource.ADMIN,
          activatedAt: new Date(),
        },
      });
    }

    // Update business owner status
    await this.prisma.business.update({
      where: { id: businessId },
      data: { ownerStatus: 'claimed' },
    });

    // Send notification to the new owner
    await OwnershipNotificationService.notifyOwnerLinked({
      userId,
      businessId,
      businessName: business.nameAr,
      performedBy,
    });

    return this.findById(businessId);
  }

  async unlinkOwner(businessId: string, performedBy: string): Promise<any> {
    const business = await this.findById(businessId);
    if (!business) {
      throw new NotFoundException('النشاط التجاري غير موجود');
    }

    // Get current owner
    const currentCapability = await this.prisma.userBusinessCapability.findFirst({
      where: { businessId, role: BusinessCapabilityRole.OWNER, status: CapabilityStatus.ACTIVE },
      include: { user: true },
    });

    // Create audit log entry
    try {
      await this.prisma.businessOwnershipAudit.create({
        data: {
          businessId,
          userId: currentCapability?.userId || null,
          action: 'UNLINKED',
          performedBy,
          previousStatus: business.ownerStatus,
          newStatus: 'unclaimed',
          changes: {
            unlinkedUser: currentCapability ? `${currentCapability.user.firstName} ${currentCapability.user.lastName}` : 'N/A',
          },
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }

    // Delete the capability
    await this.prisma.userBusinessCapability.deleteMany({
      where: { businessId, role: BusinessCapabilityRole.OWNER },
    });

    // Update business owner status
    await this.prisma.business.update({
      where: { id: businessId },
      data: { ownerStatus: 'unclaimed' },
    });

    // Send notification to the unlinked owner
    if (currentCapability) {
      await OwnershipNotificationService.notifyOwnerUnlinked({
        userId: currentCapability.userId,
        businessId,
        businessName: business.nameAr,
        performedBy,
      });
    }

    return this.findById(businessId);
  }

  async getOwnershipAudit(businessId: string): Promise<any> {
    const business = await this.findById(businessId);
    if (!business) {
      throw new NotFoundException('النشاط التجاري غير موجود');
    }

    return this.prisma.businessOwnershipAudit.findMany({
      where: { businessId },
      include: {
        performedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async bulkLinkOwner(businessIds: string[], userId: string, performedBy: string): Promise<any> {
    // Validate user exists
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    const results = {
      success: [],
      failed: [],
      total: businessIds.length,
    };

    for (const businessId of businessIds) {
      try {
        await this.linkOwner(businessId, userId, performedBy);
        results.success.push(businessId);
      } catch (error) {
        results.failed.push({
          businessId,
          error: error.message || 'فشل في ربط النشاط',
        });
      }
    }

    return {
      message: `تم ربط ${results.success.length} من ${results.total} أنشطة بنجاح`,
      ...results,
    };
  }

  async bulkUnlinkOwner(businessIds: string[], performedBy: string): Promise<any> {
    const results = {
      success: [],
      failed: [],
      total: businessIds.length,
    };

    for (const businessId of businessIds) {
      try {
        await this.unlinkOwner(businessId, performedBy);
        results.success.push(businessId);
      } catch (error) {
        results.failed.push({
          businessId,
          error: error.message || 'فشل في فصل النشاط',
        });
      }
    }

    return {
      message: `تم فصل ${results.success.length} من ${results.total} أنشطة بنجاح`,
      ...results,
    };
  }
}
