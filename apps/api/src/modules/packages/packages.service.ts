import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Package, PackageStatus, FeatureKey, LimitKey, BusinessPackage, UserRole, CommissionType, CommissionStatus } from '@greenpages/database';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { AssignPackageDto } from './dto/assign-package.dto';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import { Decimal } from '@prisma/client/runtime/library';
import { WalletAccountingBridge } from '../wallet/wallet-accounting.bridge';
import { AccountingService } from '../accounting/accounting.service';

// Cache TTL in seconds (5 minutes)
const PACKAGE_CACHE_TTL = 300;

@Injectable()
export class PackagesService {
  private readonly logger = new Logger(PackagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis,
    private readonly accountingBridge: WalletAccountingBridge,
    private readonly accountingService: AccountingService,
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

  async assignPackage(
    data: AssignPackageDto, 
    userId?: string, 
    userRole?: UserRole,
    options?: { skipInvoice?: boolean }
  ): Promise<BusinessPackage> {
    const { businessId, packageId, durationDays, autoRenew, customExpiryDate } = data;

    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException('النشاط التجاري غير موجود');

    // تحقق من الصلاحيات إذا كان المستخدم مدير محافظة
    if (userRole === UserRole.GOVERNORATE_MANAGER && userId) {
      const governorateIds = await this.prisma.governorateManager
        .findMany({
          where: { userId, isActive: true },
          select: { governorateId: true },
        })
        .then(managers => managers.map(m => m.governorateId));

      if (!governorateIds.includes(business.governorateId)) {
        throw new ForbiddenException('ليس لديك صلاحية لتعيين باقة لنشاط في محافظة أخرى');
      }
    }

    const pkg = await this.findPackageById(packageId);
    
    // تسجيل معلومات الباقة للتشخيص
    this.logger.log(`📦 تعيين باقة: ${pkg.nameAr} (isDefault=${pkg.isDefault})`);
    
    let startDate = new Date();
    let endDate: Date | null = null;
    
    // 1. الباقة الافتراضية دائمة لا نهاية لها
    if (pkg.isDefault) {
      endDate = null;
      this.logger.log(`✅ باقة افتراضية - تاريخ النهاية = null (دائمة)`);
    } 
    // 2. إذا تم تحديد تاريخ انتهاء مخصص (تجاوز يدوي)
    else if (customExpiryDate) {
      endDate = new Date(customExpiryDate);
      // التأكد من أن التاريخ في المستقبل
      if (endDate <= startDate) {
        throw new BadRequestException('تاريخ الانتهاء يجب أن يكون في المستقبل');
      }
      this.logger.log(`📅 تاريخ مخصص: ${endDate.toISOString()}`);
    } 
    // 3. الحساب التلقائي بناءً على المدة
    else {
      const daysToAdd = durationDays || pkg.durationDays;
      this.logger.log(`⏱️ مدة الاشتراك: ${daysToAdd} يوم`);
      
      // التحقق من وجود اشتراك نشط حالي للتمديد
      const currentBP = await this.prisma.businessPackage.findUnique({
        where: { businessId },
        include: { package: true },
      });

      this.logger.log(`📦 الاشتراك الحالي: ${currentBP ? 'موجود' : 'غير موجود'}`);
      
      if (currentBP) {
        this.logger.log(`   - isActive: ${currentBP.isActive}`);
        this.logger.log(`   - endDate: ${currentBP.endDate}`);
        this.logger.log(`   - packageId: ${currentBP.packageId} (طلب: ${packageId})`);
      }

      // إذا كان هناك اشتراك نشط وغير منتهي، نقوم بالتمديد من تاريخ الانتهاء الحالي
      if (currentBP && currentBP.isActive && currentBP.endDate && currentBP.endDate > new Date()) {
        // إذا كانت نفس الباقة، نقوم بالتمديد
        if (currentBP.packageId === packageId) {
          startDate = currentBP.startDate; // نحافظ على تاريخ البدء الأصلي عند التمديد
          endDate = new Date(currentBP.endDate);
          endDate.setDate(endDate.getDate() + daysToAdd);
          this.logger.log(`✅ تجديد نفس الباقة - التمديد من ${currentBP.endDate.toISOString()} إلى ${endDate.toISOString()}`);
        } else {
          // إذا كانت باقة مختلفة، تبدأ من الآن (ترقية/تغيير)
          startDate = new Date(); // إعادة ضبط تاريخ البدء لتاريخ اليوم
          endDate = new Date();
          endDate.setDate(endDate.getDate() + daysToAdd);
          this.logger.log(`🔄 ترقية/تغيير باقة - البدء من الآن حتى ${endDate.toISOString()}`);
        }
      } else {
        // اشتراك جديد أو منتهي
        endDate = new Date();
        endDate.setDate(endDate.getDate() + daysToAdd);
        this.logger.log(`🆕 اشتراك جديد أو منتهي - من الآن حتى ${endDate.toISOString()}`);
      }
    }

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

      // تحديد نوع العمولة
      let commissionType: 'NEW_SUBSCRIPTION' | 'RENEWAL' | 'UPGRADE' = 'NEW_SUBSCRIPTION';
      
      // التحقق من وجود اشتراك سابق لتحديد نوع العملية
      const previousBP = await tx.businessPackage.findFirst({
        where: { 
          businessId, 
          isActive: false,
          id: { not: bp.id }
        },
        orderBy: { updatedAt: 'desc' }
      });
      
      if (previousBP) {
        if (previousBP.packageId === packageId) {
          commissionType = 'RENEWAL';
        } else {
          commissionType = 'UPGRADE';
        }
      }

      // إنشاء سجل العمولة للمندوب (فقط إذا كانت الباقة غير مجانية)
      if (!pkg.isDefault && Number(pkg.price) > 0) {
        await this.createAgentCommission(tx, {
          businessId,
          packagePrice: pkg.price,
          commissionType,
        });
      }

      return bp;
    });

    // Invalidate cache after successful assignment
    await this.invalidateBusinessPackageCache(businessId);
    
    // إنشاء فاتورة للباقة (فقط إذا كانت الباقة غير مجانية ولم يتم تخطي إنشاء الفاتورة)
    // skipInvoice: يستخدم عندما يتم الدفع من المحفظة لأن WalletAccountingBridge يتولى إنشاء الفاتورة
    if (!pkg.isDefault && Number(pkg.price) > 0 && !options?.skipInvoice) {
      try {
        console.log(`📄 Creating package invoice for business: ${businessId}`);
        
        const business = await this.prisma.business.findUnique({
          where: { id: businessId },
          select: {
            id: true,
            nameAr: true,
            ownerId: true,
            agentId: true,
            owner: {
              select: {
                email: true,
                phone: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        if (business) {
          // الفاتورة للمالك، وإن لم يكن هناك مالك فللمندوب
          const customerId = business.ownerId || business.agentId;
          const customerName = business.owner 
            ? `${business.owner.firstName} ${business.owner.lastName}`.trim()
            : business.nameAr;
          const customerEmail = business.owner?.email;
          const customerPhone = business.owner?.phone;
          
          // المُنشئ هو المستخدم الذي قام بتعيين/تجديد الباقة (Agent/Admin/User)
          // مهم: لا نستخدم business.agentId هنا لأن هذا يخلط "من نفّذ العملية" مع "المندوب المرتبط بالنشاط".
          const createdById = userId ?? business.agentId;
          
          if (customerId && createdById) {
            const invoice = await this.accountingService.createInvoice(createdById, {
              businessId,
              customerId,
              customerName,
              customerEmail,
              customerPhone,
              invoiceType: 'SUBSCRIPTION',
              lines: [
                {
                  description: `Package subscription: ${pkg.nameAr}`,
                  descriptionAr: `اشتراك الباقة: ${pkg.nameAr}`,
                  quantity: 1,
                  unitPrice: Number(pkg.price),
                },
              ],
              notesAr: `فاتورة اشتراك الباقة ${pkg.nameAr} للنشاط التجاري: ${business.nameAr}`,
            });
            console.log(`✅ Package invoice created: ${invoice.invoiceNumber} - Status: ${invoice.status}`);
            
            // ✅ إصدار الفاتورة تلقائياً (تغيير من DRAFT إلى ISSUED)
            const issuedInvoice = await this.accountingService.issueInvoice(invoice.id, createdById);
            console.log(`✅ Invoice issued - New Status: ${issuedInvoice.status}`);
            
            // ✅ دائماً نحول الفاتورة إلى PAID مباشرة
            // المندوب يحصّل نقدياً، والمستخدم/الأدمن يدفع مباشرة
            const paymentMethod = userRole === UserRole.AGENT ? 'CASH' : 'WALLET';
            const paymentResult = await this.accountingService.recordInvoicePayment(
              invoice.id,
              createdById,
              Number(pkg.price),
              paymentMethod,
            );
            console.log(`✅ Invoice payment recorded - New Status: ${paymentResult.status}`);
          }
        }
      } catch (error) {
        console.error('❌ Error creating package invoice:', error);
        // لا نوقف عملية تعيين الباقة
      }
    }
    
    this.logger.log(`Package ${pkg.nameAr} assigned to business ${businessId}`);

    return businessPackage;
  }

  async getExpiringPackages(days: number = 30) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + days);

    return this.prisma.businessPackage.findMany({
      where: {
        isActive: true,
        endDate: {
          not: null,
          gt: new Date(),
          lte: thresholdDate,
        },
      },
      include: {
        business: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            logo: true,
          },
        },
        package: {
          select: {
            id: true,
            nameAr: true,
          },
        },
      },
      orderBy: {
        endDate: 'asc',
      },
    });
  }

  async getAllSubscriptions(filters?: {
    search?: string;
    status?: 'active' | 'expired' | 'expiring';
    packageId?: string;
    daysThreshold?: number;
  }) {
    const { search, status, packageId, daysThreshold = 30 } = filters || {};

    const where: any = {};

    // Search filter
    if (search) {
      where.business = {
        OR: [
          { nameAr: { contains: search, mode: 'insensitive' } },
          { nameEn: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    // Package filter
    if (packageId) {
      where.packageId = packageId;
    }

    // Status filter
    if (status === 'active') {
      where.isActive = true;
      where.OR = [
        { endDate: null },
        { endDate: { gt: new Date() } },
      ];
    } else if (status === 'expired') {
      where.isActive = false;
      where.endDate = { lte: new Date() };
    } else if (status === 'expiring') {
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
      where.isActive = true;
      where.endDate = {
        not: null,
        gt: new Date(),
        lte: thresholdDate,
      };
    }

    return this.prisma.businessPackage.findMany({
      where,
      include: {
        business: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            logo: true,
            status: true,
          },
        },
        package: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            price: true,
          },
        },
      },
      orderBy: [
        { endDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });
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
    if (!bp) return false;

    // Handle both BusinessPackage (bp.package) and direct Package (when using default)
    const pkg = bp.package || bp;
    if (!pkg || !pkg.features) return false;

    const feature = pkg.features.find(f => f.featureKey === featureKey);
    return feature?.isEnabled ?? false;
  }

  async getBusinessLimit(businessId: string, limitKey: LimitKey): Promise<number> {
    const bp = await this.getBusinessPackage(businessId);
    if (!bp) return 0;

    // Handle both BusinessPackage (bp.package) and direct Package (when using default)
    const pkg = bp.package || bp;
    if (!pkg || !pkg.limits) return 0;

    const limit = pkg.limits.find(l => l.limitKey === limitKey);
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

  // =================== COMMISSION MANAGEMENT ===================

  /**
   * إنشاء سجل عمولة للمندوب عند تعيين باقة أو تجديد
   */
  private async createAgentCommission(
    tx: any,
    data: {
      businessId: string;
      packagePrice: Decimal;
      commissionType: 'NEW_SUBSCRIPTION' | 'RENEWAL' | 'UPGRADE';
    },
  ) {
    // جلب معلومات النشاط التجاري مع المندوب
    const business = await tx.business.findUnique({
      where: { id: data.businessId },
      select: {
        id: true,
        agentId: true,
        governorateId: true,
      },
    });

    if (!business || !business.agentId) {
      this.logger.log(`⚠️ لا يوجد مندوب مرتبط بالنشاط ${data.businessId} - لن يتم إنشاء عمولة`);
      return null;
    }

    // جلب profile المندوب
    const agentProfile = await tx.agentProfile.findUnique({
      where: { userId: business.agentId },
      select: {
        id: true,
        commissionRate: true,
        user: { select: { firstName: true, lastName: true } },
      },
    });

    if (!agentProfile) {
      this.logger.log(`⚠️ لم يتم العثور على profile للمندوب ${business.agentId}`);
      return null;
    }

    // حساب العمولة
    const packagePrice = Number(data.packagePrice);
    const commissionRate = Number(agentProfile.commissionRate);
    const commissionAmount = (packagePrice * commissionRate) / 100;

    // إنشاء سجل العمولة
    const commission = await tx.agentCommission.create({
      data: {
        agentProfileId: agentProfile.id,
        businessId: data.businessId,
        subscriptionAmount: new Decimal(packagePrice),
        commissionRate: new Decimal(commissionRate),
        commissionAmount: new Decimal(commissionAmount),
        type: data.commissionType,
        status: 'APPROVED', // العمولة معتمدة مباشرة لأن المندوب أضاف النشاط ودفع العميل
        approvedAt: new Date(),
        notes: `عمولة ${data.commissionType === 'NEW_SUBSCRIPTION' ? 'اشتراك جديد' : data.commissionType === 'RENEWAL' ? 'تجديد' : 'ترقية'}`,
      },
    });

    this.logger.log(`✅ تم إنشاء عمولة للمندوب ${agentProfile.user.firstName}: ${commissionAmount} ل.س (${commissionRate}% من ${packagePrice})`);

    // تحديث إجمالي العمولات في profile المندوب
    await tx.agentProfile.update({
      where: { id: agentProfile.id },
      data: {
        totalCommissions: {
          increment: new Decimal(commissionAmount),
        },
      },
    });

    // ✅ إضافة العمولة إلى agentCollection لتحديث الرصيد الحالي
    await tx.agentCollection.create({
      data: {
        agentProfileId: agentProfile.id,
        businessId: data.businessId,
        amount: new Decimal(commissionAmount),
        status: 'COLLECTED', // العمولة محصلة مباشرة
        description: 'Commission',
        notes: `عمولة ${data.commissionType === 'NEW_SUBSCRIPTION' ? 'اشتراك جديد' : data.commissionType === 'RENEWAL' ? 'تجديد' : 'ترقية'} - ${packagePrice} ل.س`,
      },
    });

    return commission;
  }
}
