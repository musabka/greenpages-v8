import { Injectable, NotFoundException, ConflictException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Package, PackageStatus, FeatureKey, LimitKey, BusinessPackage } from '@greenpages/database';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { AssignPackageDto } from './dto/assign-package.dto';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';

// Cache TTL in seconds (5 minutes)
const PACKAGE_CACHE_TTL = 300;

@Injectable()
export class PackagesService {
  private readonly logger = new Logger(PackagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async createPackage(data: CreatePackageDto): Promise<Package> {
    const { features, limits, ...packageData } = data;

    const existing = await this.prisma.package.findUnique({ where: { slug: data.slug } });
    if (existing) {
      throw new ConflictException('الباقة موجودة مسبقاً بنفس الاسم المستعار (slug)');
    }

    return this.prisma.package.create({
      data: {
        ...packageData,
        features: {
          create: features,
        },
        limits: {
          create: limits,
        },
      },
      include: {
        features: true,
        limits: true,
      },
    });
  }

  async findAllPackages() {
    return this.prisma.package.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        features: true,
        limits: true,
      },
    });
  }

  async findPackageById(id: string) {
    const pkg = await this.prisma.package.findUnique({
      where: { id },
      include: {
        features: true,
        limits: true,
      },
    });
    if (!pkg) throw new NotFoundException('الباقة غير موجودة');
    return pkg;
  }

  async updatePackage(id: string, data: UpdatePackageDto) {
    const pkg = await this.findPackageById(id);
    const { features, limits, ...packageData } = data;

    return this.prisma.$transaction(async (tx) => {
      if (features) {
        await tx.packageFeature.deleteMany({ where: { packageId: id } });
        await tx.packageFeature.createMany({
          data: features.map(f => ({ ...f, packageId: id })),
        });
      }

      if (limits) {
        await tx.packageLimit.deleteMany({ where: { packageId: id } });
        await tx.packageLimit.createMany({
          data: limits.map(l => ({ ...l, packageId: id })),
        });
      }

      return tx.package.update({
        where: { id },
        data: packageData,
        include: {
          features: true,
          limits: true,
        },
      });
    });
  }

  async deletePackage(id: string) {
    const pkg = await this.findPackageById(id);
    // Check if any business is using this package
    const usageCount = await this.prisma.businessPackage.count({ where: { packageId: id, isActive: true } });
    if (usageCount > 0) {
      throw new ForbiddenException('لا يمكن حذف الباقة لوجود مشتركين نشطين فيها');
    }

    await this.prisma.package.delete({ where: { id } });
  }

  async assignPackage(data: AssignPackageDto): Promise<BusinessPackage> {
    const { businessId, packageId, durationDays, autoRenew } = data;

    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException('النشاط التجاري غير موجود');

    const pkg = await this.findPackageById(packageId);
    
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + (durationDays || pkg.durationDays));

    const businessPackage = await this.prisma.$transaction(async (tx) => {
      // Deactivate current package if exists
      await tx.businessPackage.updateMany({
        where: { businessId, isActive: true },
        data: { isActive: false },
      });

      const bp = await tx.businessPackage.upsert({
        where: { businessId },
        update: {
          packageId,
          startDate,
          endDate,
          isActive: true,
          autoRenew: autoRenew ?? false,
          // Reset any admin override when assigning new package
          overrideEnabled: false,
          overrideReason: null,
          overrideExpiresAt: null,
          overrideByUserId: null,
        },
        create: {
          businessId,
          packageId,
          startDate,
          endDate,
          isActive: true,
          autoRenew: autoRenew ?? false,
        },
      });

      // Add to history
      await tx.packageHistory.create({
        data: {
          businessPackageId: bp.id,
          packageId,
          action: 'ASSIGN',
          price: pkg.price,
          startDate,
          endDate,
        },
      });

      return bp;
    });

    // Invalidate cache after successful assignment
    await this.invalidateBusinessPackageCache(businessId);
    this.logger.log(`Package ${pkg.nameAr} assigned to business ${businessId}`);

    return businessPackage;
  }

  /**
   * الحصول على الباقة الافتراضية للنظام
   * تُستخدم عند انتهاء اشتراك النشاط التجاري
   */
  async getDefaultPackage() {
    const cacheKey = 'package:default';
    
    // Try cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const defaultPkg = await this.prisma.package.findFirst({
      where: { isDefault: true, status: PackageStatus.ACTIVE },
      include: {
        features: true,
        limits: true,
      },
    });

    if (defaultPkg) {
      await this.redis.setex(cacheKey, PACKAGE_CACHE_TTL, JSON.stringify(defaultPkg));
    }

    return defaultPkg;
  }

  /**
   * تعيين باقة كافتراضية (يجب أن تكون واحدة فقط)
   */
  async setDefaultPackage(packageId: string) {
    return this.prisma.$transaction(async (tx) => {
      // Remove default from all packages
      await tx.package.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });

      // Set new default
      const pkg = await tx.package.update({
        where: { id: packageId },
        data: { isDefault: true },
        include: { features: true, limits: true },
      });

      // Invalidate cache
      await this.redis.del('package:default');

      return pkg;
    });
  }

  /**
   * الحصول على باقة النشاط التجاري مع دعم:
   * - Caching لتحسين الأداء
   * - الباقة الافتراضية عند انتهاء الاشتراك
   * - Admin Override
   */
  async getBusinessPackage(businessId: string) {
    const cacheKey = `business:package:${businessId}`;
    
    // Try cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      const parsedCache = JSON.parse(cached);
      // Check if cache indicates "use default"
      if (parsedCache._useDefault) {
        return this.getDefaultPackage();
      }
      return parsedCache;
    }

    const bp = await this.prisma.businessPackage.findUnique({
      where: { businessId },
      include: {
        package: {
          include: {
            features: true,
            limits: true,
          },
        },
      },
    });
    
    // Check Admin Override first
    if (bp?.overrideEnabled) {
      // Check if override has expired
      if (bp.overrideExpiresAt && bp.overrideExpiresAt < new Date()) {
        // Override expired, disable it
        await this.prisma.businessPackage.update({
          where: { id: bp.id },
          data: { overrideEnabled: false },
        });
        this.logger.log(`Admin override expired for business ${businessId}`);
      } else {
        // Override is active, return the package regardless of expiry
        await this.redis.setex(cacheKey, PACKAGE_CACHE_TTL, JSON.stringify(bp));
        return bp;
      }
    }

    // No active package or inactive
    if (!bp || !bp.isActive) {
      // Cache that this business should use default
      await this.redis.setex(cacheKey, PACKAGE_CACHE_TTL, JSON.stringify({ _useDefault: true }));
      return this.getDefaultPackage();
    }
    
    // Check if expired
    if (bp.endDate && bp.endDate < new Date()) {
      this.logger.log(`Package expired for business ${businessId}, falling back to default`);
      
      // Mark as inactive
      await this.prisma.businessPackage.update({
        where: { id: bp.id },
        data: { isActive: false },
      });

      // Cache that this business should use default
      await this.redis.setex(cacheKey, PACKAGE_CACHE_TTL, JSON.stringify({ _useDefault: true }));
      
      return this.getDefaultPackage();
    }

    // Cache the active package
    await this.redis.setex(cacheKey, PACKAGE_CACHE_TTL, JSON.stringify(bp));
    return bp;
  }

  /**
   * إبطال الـ Cache لنشاط تجاري معين
   */
  async invalidateBusinessPackageCache(businessId: string) {
    await this.redis.del(`business:package:${businessId}`);
  }

  async canBusinessUseFeature(businessId: string, featureKey: FeatureKey): Promise<boolean> {
    const bp = await this.getBusinessPackage(businessId);
    if (!bp || !bp.package) return false;

    const feature = bp.package.features.find(f => f.featureKey === featureKey);
    return feature?.isEnabled ?? false;
  }

  async getBusinessLimit(businessId: string, limitKey: LimitKey): Promise<number> {
    const bp = await this.getBusinessPackage(businessId);
    if (!bp || !bp.package) return 0;

    const limit = bp.package.limits.find(l => l.limitKey === limitKey);
    return limit?.limitValue ?? 0;
  }

  /**
   * تفعيل تجاوز إداري لنشاط تجاري
   * يتم تسجيل هذا الإجراء في ActivityLog
   */
  async enableAdminOverride(
    businessId: string,
    adminUserId: string,
    reason: string,
    expiresAt?: Date,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const bp = await this.prisma.businessPackage.findUnique({ 
      where: { businessId },
      include: { package: true },
    });
    if (!bp) {
      throw new NotFoundException('لا توجد باقة مرتبطة بهذا النشاط التجاري');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.businessPackage.update({
        where: { businessId },
        data: {
          overrideEnabled: true,
          overrideReason: reason,
          overrideExpiresAt: expiresAt,
          overrideByUserId: adminUserId,
        },
      });

      // تسجيل في ActivityLog
      await tx.activityLog.create({
        data: {
          userId: adminUserId,
          action: 'ADMIN_OVERRIDE_ENABLED',
          entity: 'BusinessPackage',
          entityId: bp.id,
          oldData: {
            overrideEnabled: false,
            overrideReason: bp.overrideReason,
            overrideExpiresAt: bp.overrideExpiresAt,
          },
          newData: {
            overrideEnabled: true,
            overrideReason: reason,
            overrideExpiresAt: expiresAt,
            businessId,
            packageName: bp.package.nameAr,
          },
          ipAddress,
          userAgent,
        },
      });

      return result;
    });

    // Invalidate cache
    await this.invalidateBusinessPackageCache(businessId);

    this.logger.warn(`Admin override enabled for business ${businessId} by user ${adminUserId}. Reason: ${reason}`);

    return updated;
  }

  /**
   * تعطيل التجاوز الإداري
   * يتم تسجيل هذا الإجراء في ActivityLog
   */
  async disableAdminOverride(
    businessId: string,
    adminUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const bp = await this.prisma.businessPackage.findUnique({ 
      where: { businessId },
      include: { package: true },
    });

    if (!bp) {
      throw new NotFoundException('لا توجد باقة مرتبطة بهذا النشاط التجاري');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.businessPackage.update({
        where: { businessId },
        data: {
          overrideEnabled: false,
          overrideReason: null,
          overrideExpiresAt: null,
          overrideByUserId: null,
        },
      });

      // تسجيل في ActivityLog
      await tx.activityLog.create({
        data: {
          userId: adminUserId,
          action: 'ADMIN_OVERRIDE_DISABLED',
          entity: 'BusinessPackage',
          entityId: bp.id,
          oldData: {
            overrideEnabled: bp.overrideEnabled,
            overrideReason: bp.overrideReason,
            overrideExpiresAt: bp.overrideExpiresAt,
            overrideByUserId: bp.overrideByUserId,
          },
          newData: {
            overrideEnabled: false,
            businessId,
            packageName: bp.package.nameAr,
          },
          ipAddress,
          userAgent,
        },
      });

      return result;
    });

    // Invalidate cache
    await this.invalidateBusinessPackageCache(businessId);

    this.logger.log(`Admin override disabled for business ${businessId}`);

    return updated;
  }
}
