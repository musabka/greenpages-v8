import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Business, BusinessStatus, LimitKey } from '@greenpages/database';
import slugify from 'slugify';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import { PackagesService } from '../packages/packages.service';

@Injectable()
export class BusinessesService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis,
    private readonly packagesService: PackagesService,
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

    const { categoryIds, contacts, workingHours, branches, persons, products, media, ...businessData } = data;

    const business = await this.prisma.business.create({
      data: {
        ...businessData,
        slug,
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
    featured?: boolean;
    verified?: boolean;
  }) {
    const { skip, take, search, categoryId, governorateId, cityId, districtId, status, featured, verified } = params;
    
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
          { package: { package: { sortOrder: 'desc' } } },
          { isFeatured: 'desc' },
          { averageRating: 'desc' },
          { createdAt: 'desc' },
        ],
        include: {
          governorate: true,
          city: true,
          district: true,
          categories: { include: { category: true } },
          _count: { select: { reviews: true, branches: true } },
        },
      }),
      this.prisma.business.count({ where }),
    ]);

    return {
      data: businesses,
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
    const [total, approved, pending, featured, verified] = await Promise.all([
      this.prisma.business.count({ where: { deletedAt: null } }),
      this.prisma.business.count({ where: { status: BusinessStatus.APPROVED, deletedAt: null } }),
      this.prisma.business.count({ where: { status: BusinessStatus.PENDING, deletedAt: null } }),
      this.prisma.business.count({ where: { isFeatured: true, deletedAt: null } }),
      this.prisma.business.count({ where: { isVerified: true, deletedAt: null } }),
    ]);

    return { total, approved, pending, featured, verified };
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
}
