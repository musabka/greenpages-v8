import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import {
  WalletStatus,
  WalletTransactionType,
  WalletTransactionStatus,
  WalletReferenceType,
  TopUpStatus,
  WithdrawalStatus,
  TopUpMethod,
  WithdrawalMethod,
} from '@greenpages/database';
import {
  CreateTopUpDto,
  CreateWithdrawalDto,
  WalletPaymentDto,
  AdminTopUpDto,
  AdminAdjustBalanceDto,
  WalletTransactionsQueryDto,
  AdminWalletsQueryDto,
  AdminTopUpsQueryDto,
  AdminWithdrawalsQueryDto,
} from './dto/wallet.dto';
import { WalletBillingBridge } from './wallet-billing.bridge';
import { PackagesService } from '../packages/packages.service';

@Injectable()
export class WalletService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => WalletBillingBridge))
    private readonly billingBridge: WalletBillingBridge,
    @Inject(forwardRef(() => PackagesService))
    private readonly packagesService: PackagesService,
  ) {}

  // ==========================================
  // إنشاء محفظة جديدة
  // ==========================================
  async createWallet(userId: string) {
    const existing = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.wallet.create({
      data: { userId },
    });
  }

  // ==========================================
  // الحصول على محفظة المستخدم أو إنشائها
  // ==========================================
  async getOrCreateWallet(userId: string) {
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: {
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

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: { userId },
        include: {
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

    return wallet;
  }

  // ==========================================
  // الحصول على رصيد المحفظة
  // ==========================================
  async getBalance(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);
    
    return {
      balance: Number(wallet.balance),
      frozenBalance: Number(wallet.frozenBalance),
      availableBalance: Number(wallet.balance) - Number(wallet.frozenBalance),
      totalDeposits: Number(wallet.totalDeposits),
      totalWithdrawals: Number(wallet.totalWithdrawals),
      totalSpent: Number(wallet.totalSpent),
      currency: wallet.currency,
      status: wallet.status,
    };
  }

  // ==========================================
  // سجل المعاملات
  // ==========================================
  async getTransactions(userId: string, query: WalletTransactionsQueryDto) {
    const wallet = await this.getOrCreateWallet(userId);
    const { page = 1, limit = 20, type } = query;
    const skip = (page - 1) * limit;

    const where: any = { walletId: wallet.id };
    if (type) {
      where.type = type as WalletTransactionType;
    }

    const [transactions, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.walletTransaction.count({ where }),
    ]);

    return {
      data: transactions.map((t) => ({
        ...t,
        amount: Number(t.amount),
        balanceBefore: Number(t.balanceBefore),
        balanceAfter: Number(t.balanceAfter),
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ==========================================
  // طلب شحن المحفظة
  // ==========================================
  async requestTopUp(userId: string, dto: CreateTopUpDto) {
    const wallet = await this.getOrCreateWallet(userId);

    if (wallet.status !== WalletStatus.ACTIVE) {
      throw new ForbiddenException('المحفظة غير نشطة');
    }

    return this.prisma.walletTopUp.create({
      data: {
        walletId: wallet.id,
        amount: new Decimal(dto.amount),
        method: dto.method,
        receiptNumber: dto.receiptNumber,
        proofImage: dto.proofImage,
        notes: dto.notes,
        status: TopUpStatus.PENDING,
      },
    });
  }

  // ==========================================
  // طلب سحب من المحفظة
  // ==========================================
  async requestWithdrawal(userId: string, dto: CreateWithdrawalDto) {
    const wallet = await this.getOrCreateWallet(userId);

    if (wallet.status !== WalletStatus.ACTIVE) {
      throw new ForbiddenException('المحفظة غير نشطة');
    }

    const availableBalance = Number(wallet.balance) - Number(wallet.frozenBalance);
    if (dto.amount > availableBalance) {
      throw new BadRequestException('الرصيد المتاح غير كافٍ');
    }

    // تجميد المبلغ المطلوب سحبه
    await this.prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        frozenBalance: { increment: dto.amount },
      },
    });

    return this.prisma.walletWithdrawal.create({
      data: {
        walletId: wallet.id,
        amount: new Decimal(dto.amount),
        method: dto.method,
        bankName: dto.bankName,
        accountNumber: dto.accountNumber,
        accountHolderName: dto.accountHolderName,
        mobileWalletNumber: dto.mobileWalletNumber,
        notes: dto.notes,
        status: WithdrawalStatus.PENDING,
      },
    });
  }

  // ==========================================
  // الدفع من المحفظة (اشتراك)
  // ==========================================
  async payFromWallet(userId: string, dto: WalletPaymentDto) {
    console.log('💳 WalletService.payFromWallet - بدء العملية...', {
      userId,
      packageId: dto.packageId,
      businessId: dto.businessId,
    });

    const wallet = await this.getOrCreateWallet(userId);

    if (wallet.status !== WalletStatus.ACTIVE) {
      throw new ForbiddenException('المحفظة غير نشطة');
    }

    // الحصول على الباقة
    const packageData = await this.prisma.package.findUnique({
      where: { id: dto.packageId },
    });

    if (!packageData) {
      throw new NotFoundException('الباقة غير موجودة');
    }

    // التحقق من النشاط التجاري
    const business = await this.prisma.business.findUnique({
      where: { id: dto.businessId },
      include: {
        package: {
          include: {
            package: true,
          },
        },
      },
    });

    if (!business) {
      throw new NotFoundException('النشاط التجاري غير موجود');
    }

    // تحديد ما إذا كانت العملية تجديداً لنفس الباقة أو ترقية/شراء لباقة مختلفة
    const hasActivePackage = Boolean(business.package && business.package.isActive);
    const currentPackageId = business.package?.packageId;
    const isRenewal = hasActivePackage && currentPackageId === dto.packageId;

    const baseDurationDays = Number(packageData.durationDays);
    const requestedDurationDays = dto.durationDays ? Number(dto.durationDays) : baseDurationDays;
    if (!Number.isFinite(requestedDurationDays) || requestedDurationDays <= 0) {
      throw new BadRequestException('مدة الاشتراك غير صالحة');
    }

    // حساب تكلفة الاشتراك بناءً على المدة المطلوبة (سعر يومي * عدد الأيام)
    const basePrice = Number(packageData.price);
    const dailyRate = baseDurationDays > 0 ? basePrice / baseDurationDays : basePrice;
    let amount = dailyRate * requestedDurationDays;

    // خصم قيمة الأيام المتبقية فقط في حالة الترقية/الشراء لباقة مختلفة (Pro-rating)
    let remainingDays = 0;
    let remainingValue = 0;
    if (!isRenewal && hasActivePackage) {
      const now = new Date();
      const endDate = new Date(business.package!.endDate);
      const daysDiff = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      remainingDays = Math.max(0, daysDiff);

      if (remainingDays > 0) {
        const currentPackagePrice = Number(business.package!.package.price);
        const currentPackageDuration = Number(business.package!.package.durationDays);
        const currentDailyRate = currentPackageDuration > 0 ? (currentPackagePrice / currentPackageDuration) : currentPackagePrice;
        remainingValue = currentDailyRate * remainingDays;

        amount = Math.max(0, amount - remainingValue);
      }
    }

    const availableBalance = Number(wallet.balance) - Number(wallet.frozenBalance);

    if (amount > availableBalance) {
      throw new BadRequestException('الرصيد المتاح غير كافٍ');
    }

    // تنفيذ الدفع في transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const balanceBefore = Number(wallet.balance);
      const balanceAfter = balanceBefore - amount;

      // خصم من المحفظة
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: amount },
          totalSpent: { increment: amount },
          lastTransactionAt: new Date(),
        },
      });

      // تسجيل المعاملة
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: WalletTransactionType.PAYMENT,
          amount: new Decimal(-amount),
          balanceBefore: new Decimal(balanceBefore),
          balanceAfter: new Decimal(balanceAfter),
          description: isRenewal
            ? `Renewal payment for ${packageData.nameAr} subscription`
            : `Payment for ${packageData.nameAr} subscription`,
          descriptionAr: isRenewal
            ? `تجديد اشتراك ${packageData.nameAr} لمدة ${requestedDurationDays} يوم`
            : `دفع اشتراك ${packageData.nameAr}${remainingDays > 0 ? ` (خصم ${remainingDays} يوم متبقي)` : ''}`,
          referenceType: WalletReferenceType.SUBSCRIPTION,
          referenceId: dto.businessId,
          status: WalletTransactionStatus.COMPLETED,
          metadata: {
            businessId: dto.businessId,
            businessName: business.nameAr,
            packageId: dto.packageId,
            packageName: packageData.nameAr,
            packagePrice: Number(packageData.price),
            requestedDurationDays,
            remainingDays,
            remainingValue,
            actualAmountPaid: amount,
            isRenewal,
          },
        },
      });

      return { transaction, packageData, remainingDays, remainingValue, balanceAfter, amount };
    });

    // ✅ استخدام PackagesService لتعيين الباقة (خارج transaction لتجنب deadlock)
    // هذا يضمن تسجيل PackageHistory وإنشاء عمولة المندوب بشكل صحيح
    // skipInvoice: true لأن WalletBillingBridge سيتولى إنشاء الفاتورة
    const updatedPackage = await this.packagesService.assignPackage(
      {
        businessId: dto.businessId,
        packageId: dto.packageId,
        durationDays: requestedDurationDays,
      },
      wallet.userId,
      undefined,
      { skipInvoice: true }
    );

    const { transaction, balanceAfter } = result;

    // ✅ تسجيل الفاتورة
    let invoiceId: string | undefined;

    // جلب بيانات المستخدم خارج try/catch للاستخدام في المحاولة الثانية
    const user = await this.prisma.user.findUnique({
      where: { id: wallet.userId },
      select: { firstName: true, lastName: true, email: true, phone: true },
    });

    console.log('🔵 WalletService: سنبدأ بإنشاء الفاتورة الآن...', {
      userId: wallet.userId,
      amount,
      packageName: packageData.nameAr,
      businessId: dto.businessId,
      billingBridgeExists: !!this.billingBridge,
    });

    if (!this.billingBridge) {
      console.error('❌❌❌ CRITICAL: WalletBillingBridge غير موجود! لن يتم إنشاء الفاتورة.');
      console.error('❌❌❌ this:', Object.keys(this));
      throw new Error('WalletBillingBridge is not injected - CRITICAL ERROR');
    }

    try {
      console.log('🟢 WalletService: استدعاء billingBridge.recordWalletPayment...');
      const billingResult = await this.billingBridge.recordWalletPayment({
        userId: wallet.userId,
        paymentId: transaction.id,
        walletId: wallet.id,
        walletOwnerId: wallet.userId,
        grossAmount: amount,
        taxAmount: 0,
        netAmount: amount,
        paymentType: 'SUBSCRIPTION',
        referenceId: dto.businessId,
        referenceName: isRenewal
          ? `تجديد اشتراك ${packageData.nameAr} لمدة ${requestedDurationDays} يوم`
          : `${packageData.nameAr}${remainingDays > 0 ? ` (خصم ${remainingDays} يوم متبقي)` : ''}`,
        businessId: dto.businessId,
        customerName: user ? `${user.firstName} ${user.lastName}` : 'عميل',
        customerEmail: user?.email,
        customerPhone: user?.phone,
        taxId: undefined,
      });

      invoiceId = billingResult.invoiceId;
      console.log('✅ تم إنشاء الفاتورة بنجاح:', { invoiceId });
    } catch (error) {
      console.error('❌❌❌ CRITICAL: فشل إنشاء الفاتورة!', error);
      console.error('الخطأ الكامل:', error instanceof Error ? error.message : JSON.stringify(error));
      console.error('Stack:', error instanceof Error ? error.stack : 'No stack');
      
      // تحويل الخطأ إلى رسالة واضحة
      if (error instanceof Error) {
        console.error('🔴 Error Name:', error.name);
        console.error('🔴 Error Message:', error.message);
      }
      
      // IMPORTANT: لا نتابع بدون فاتورة
      throw new Error(`فشل إنشاء الفاتورة: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      success: true,
      transaction: {
        id: transaction.id,
        amount,
        balanceAfter,
      },
      subscription: {
        packageName: packageData.nameAr,
        startDate: updatedPackage.startDate,
        endDate: updatedPackage.endDate,
      },
      discount: {
        remainingDays,
        remainingValue,
        originalPrice: Number(packageData.price),
      },
      billing: {
        invoiceId,
      },
    };
  }

  // ==========================================
  // سجل طلبات الشحن
  // ==========================================
  async getTopUpRequests(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);

    const requests = await this.prisma.walletTopUp.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return requests.map((r) => ({
      ...r,
      amount: Number(r.amount),
    }));
  }

  // ==========================================
  // سجل طلبات السحب
  // ==========================================
  async getWithdrawalRequests(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);

    const requests = await this.prisma.walletWithdrawal.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return requests.map((r) => ({
      ...r,
      amount: Number(r.amount),
    }));
  }

  // ==========================================
  // ==========================================
  // وظائف الإدارة (Admin)
  // ==========================================
  // ==========================================

  // الحصول على جميع المحافظ
  async getAllWallets(query: AdminWalletsQueryDto) {
    const { page = 1, limit = 20, search, status, minBalance } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status as WalletStatus;
    }
    if (minBalance !== undefined) {
      where.balance = { gte: minBalance };
    }
    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ],
      };
    }

    const [wallets, total] = await Promise.all([
      this.prisma.wallet.findMany({
        where,
        skip,
        take: limit,
        orderBy: { balance: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.wallet.count({ where }),
    ]);

    return {
      data: wallets.map((w) => ({
        ...w,
        balance: Number(w.balance),
        frozenBalance: Number(w.frozenBalance),
        totalDeposits: Number(w.totalDeposits),
        totalWithdrawals: Number(w.totalWithdrawals),
        totalSpent: Number(w.totalSpent),
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // إحصائيات عامة
  async getWalletStats() {
    const [
      totalWallets,
      activeWallets,
      totalBalanceResult,
      pendingTopUps,
      pendingWithdrawals,
      todayTransactions,
    ] = await Promise.all([
      this.prisma.wallet.count(),
      this.prisma.wallet.count({ where: { status: WalletStatus.ACTIVE } }),
      this.prisma.wallet.aggregate({ _sum: { balance: true } }),
      this.prisma.walletTopUp.count({ where: { status: TopUpStatus.PENDING } }),
      this.prisma.walletWithdrawal.count({ where: { status: WithdrawalStatus.PENDING } }),
      this.prisma.walletTransaction.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    return {
      totalWallets,
      activeWallets,
      totalBalance: Number(totalBalanceResult._sum.balance || 0),
      pendingTopUps,
      pendingWithdrawals,
      todayTransactions,
    };
  }

  // طلبات الشحن المعلقة
  async getPendingTopUps(query: AdminTopUpsQueryDto) {
    const { page = 1, limit = 20, status, method } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status as TopUpStatus;
    } else {
      where.status = TopUpStatus.PENDING;
    }
    if (method) {
      where.method = method as TopUpMethod;
    }

    const [topUps, total] = await Promise.all([
      this.prisma.walletTopUp.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: {
          wallet: {
            include: {
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
          },
          processedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.walletTopUp.count({ where }),
    ]);

    return {
      data: topUps.map((t) => ({
        ...t,
        amount: Number(t.amount),
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // الموافقة على طلب شحن
  async approveTopUp(topUpId: string, adminUserId: string, notes?: string) {
    const topUp = await this.prisma.walletTopUp.findUnique({
      where: { id: topUpId },
      include: { wallet: true },
    });

    if (!topUp) {
      throw new NotFoundException('طلب الشحن غير موجود');
    }

    if (topUp.status !== TopUpStatus.PENDING) {
      throw new BadRequestException('هذا الطلب تمت معالجته مسبقاً');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const wallet = topUp.wallet;
      const amount = Number(topUp.amount);
      const balanceBefore = Number(wallet.balance);
      const balanceAfter = balanceBefore + amount;

      // تحديث المحفظة
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: amount },
          totalDeposits: { increment: amount },
          lastTransactionAt: new Date(),
        },
      });

      // تسجيل المعاملة
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: WalletTransactionType.DEPOSIT,
          amount: new Decimal(amount),
          balanceBefore: new Decimal(balanceBefore),
          balanceAfter: new Decimal(balanceAfter),
          description: `Top-up via ${topUp.method}`,
          descriptionAr: `شحن عبر ${this.getTopUpMethodAr(topUp.method)}`,
          referenceType: WalletReferenceType.TOP_UP,
          referenceId: topUp.id,
          status: WalletTransactionStatus.COMPLETED,
        },
      });

      // تحديث طلب الشحن
      await tx.walletTopUp.update({
        where: { id: topUpId },
        data: {
          status: TopUpStatus.COMPLETED,
          processedByUserId: adminUserId,
          processedAt: new Date(),
          notes: notes || topUp.notes,
        },
      });

      return { wallet, amount, balanceAfter };
    });

    // ✅ تسجيل الشحن (خارج الـ transaction)
    try {
      await this.billingBridge.recordTopUpApproval({
        userId: adminUserId,
        topUpId: topUpId,
        walletId: result.wallet.id,
        amount: result.amount,
        method: topUp.method,
        walletOwnerId: result.wallet.userId,
      });
    } catch (error) {
      // log but don't fail - the wallet transaction is already complete
      console.error('⚠️ Failed to record top-up:', error);
    }

    return { success: true, newBalance: result.balanceAfter };
  }

  // رفض طلب شحن
  async rejectTopUp(topUpId: string, adminUserId: string, reason: string) {
    const topUp = await this.prisma.walletTopUp.findUnique({
      where: { id: topUpId },
    });

    if (!topUp) {
      throw new NotFoundException('طلب الشحن غير موجود');
    }

    if (topUp.status !== TopUpStatus.PENDING) {
      throw new BadRequestException('هذا الطلب تمت معالجته مسبقاً');
    }

    return this.prisma.walletTopUp.update({
      where: { id: topUpId },
      data: {
        status: TopUpStatus.REJECTED,
        processedByUserId: adminUserId,
        processedAt: new Date(),
        rejectionReason: reason,
      },
    });
  }

  // طلبات السحب المعلقة
  async getPendingWithdrawals(query: AdminWithdrawalsQueryDto) {
    const { page = 1, limit = 20, status, method } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status as WithdrawalStatus;
    } else {
      where.status = WithdrawalStatus.PENDING;
    }
    if (method) {
      where.method = method as WithdrawalMethod;
    }

    const [withdrawals, total] = await Promise.all([
      this.prisma.walletWithdrawal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: {
          wallet: {
            include: {
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
          },
          processedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.walletWithdrawal.count({ where }),
    ]);

    return {
      data: withdrawals.map((w) => ({
        ...w,
        amount: Number(w.amount),
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // الموافقة على طلب سحب
  async approveWithdrawal(
    withdrawalId: string,
    adminUserId: string,
    receiptNumber?: string,
    notes?: string,
  ) {
    const withdrawal = await this.prisma.walletWithdrawal.findUnique({
      where: { id: withdrawalId },
      include: { wallet: true },
    });

    if (!withdrawal) {
      throw new NotFoundException('طلب السحب غير موجود');
    }

    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      throw new BadRequestException('هذا الطلب تمت معالجته مسبقاً');
    }

    return this.prisma.$transaction(async (tx) => {
      const wallet = withdrawal.wallet;
      const amount = Number(withdrawal.amount);
      const balanceBefore = Number(wallet.balance);
      const balanceAfter = balanceBefore - amount;

      // خصم من المحفظة وإلغاء التجميد
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: amount },
          frozenBalance: { decrement: amount },
          totalWithdrawals: { increment: amount },
          lastTransactionAt: new Date(),
        },
      });

      // تسجيل المعاملة
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: WalletTransactionType.WITHDRAWAL,
          amount: new Decimal(-amount),
          balanceBefore: new Decimal(balanceBefore),
          balanceAfter: new Decimal(balanceAfter),
          description: `Withdrawal via ${withdrawal.method}`,
          descriptionAr: `سحب عبر ${this.getWithdrawalMethodAr(withdrawal.method)}`,
          referenceType: WalletReferenceType.WITHDRAWAL,
          referenceId: withdrawal.id,
          status: WalletTransactionStatus.COMPLETED,
        },
      });

      // تحديث طلب السحب
      await tx.walletWithdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: WithdrawalStatus.COMPLETED,
          processedByUserId: adminUserId,
          processedAt: new Date(),
          completedAt: new Date(),
          receiptNumber,
          notes: notes || withdrawal.notes,
        },
      });

      return { success: true, newBalance: balanceAfter };
    });
  }

  // رفض طلب سحب
  async rejectWithdrawal(withdrawalId: string, adminUserId: string, reason: string) {
    const withdrawal = await this.prisma.walletWithdrawal.findUnique({
      where: { id: withdrawalId },
      include: { wallet: true },
    });

    if (!withdrawal) {
      throw new NotFoundException('طلب السحب غير موجود');
    }

    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      throw new BadRequestException('هذا الطلب تمت معالجته مسبقاً');
    }

    // إلغاء تجميد المبلغ
    await this.prisma.wallet.update({
      where: { id: withdrawal.wallet.id },
      data: {
        frozenBalance: { decrement: Number(withdrawal.amount) },
      },
    });

    return this.prisma.walletWithdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: WithdrawalStatus.REJECTED,
        processedByUserId: adminUserId,
        processedAt: new Date(),
        rejectionReason: reason,
      },
    });
  }

  // إضافة رصيد إداري
  async adminTopUp(adminUserId: string, dto: AdminTopUpDto) {
    const wallet = await this.getOrCreateWallet(dto.userId);
    const amount = dto.amount;
    const balanceBefore = Number(wallet.balance);
    const balanceAfter = balanceBefore + amount;

    return this.prisma.$transaction(async (tx) => {
      // تحديث المحفظة
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: amount },
          totalDeposits: { increment: amount },
          lastTransactionAt: new Date(),
        },
      });

      // تسجيل المعاملة
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: WalletTransactionType.DEPOSIT,
          amount: new Decimal(amount),
          balanceBefore: new Decimal(balanceBefore),
          balanceAfter: new Decimal(balanceAfter),
          description: `Admin credit: ${dto.reason || 'N/A'}`,
          descriptionAr: `إضافة إدارية: ${dto.reason || 'غير محدد'}`,
          referenceType: WalletReferenceType.ADMIN_ACTION,
          status: WalletTransactionStatus.COMPLETED,
          metadata: {
            adminId: adminUserId,
            reason: dto.reason,
          },
        },
      });

      return {
        success: true,
        transaction: {
          id: transaction.id,
          amount,
          balanceAfter,
        },
      };
    });
  }

  // تعديل رصيد إداري
  async adjustBalance(adminUserId: string, dto: AdminAdjustBalanceDto) {
    const wallet = await this.getOrCreateWallet(dto.userId);
    const amount = dto.amount;
    const balanceBefore = Number(wallet.balance);
    const balanceAfter = balanceBefore + amount;

    if (balanceAfter < 0) {
      throw new BadRequestException('لا يمكن أن يكون الرصيد سالباً');
    }

    return this.prisma.$transaction(async (tx) => {
      // تحديث المحفظة
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: balanceAfter,
          lastTransactionAt: new Date(),
        },
      });

      // تسجيل المعاملة
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: WalletTransactionType.ADJUSTMENT,
          amount: new Decimal(amount),
          balanceBefore: new Decimal(balanceBefore),
          balanceAfter: new Decimal(balanceAfter),
          description: `Balance adjustment: ${dto.reason}`,
          descriptionAr: `تعديل الرصيد: ${dto.reason}`,
          referenceType: WalletReferenceType.ADMIN_ACTION,
          status: WalletTransactionStatus.COMPLETED,
          metadata: {
            adminId: adminUserId,
            reason: dto.reason,
          },
        },
      });

      return {
        success: true,
        transaction: {
          id: transaction.id,
          amount,
          balanceAfter,
        },
      };
    });
  }

  // تجميد/إلغاء تجميد محفظة
  async updateWalletStatus(walletId: string, status: WalletStatus) {
    return this.prisma.wallet.update({
      where: { id: walletId },
      data: { status },
    });
  }

  // شحن جماعي
  async bulkCredit(
    adminUserId: string,
    dto: {
      targetType: 'ALL' | 'GOVERNORATE';
      governorateId?: string;
      amount: number;
      description: string;
    },
  ) {
    // التحقق من صحة المبلغ
    if (dto.amount <= 0) {
      throw new BadRequestException('المبلغ يجب أن يكون أكبر من صفر');
    }

    // الحصول على المستخدمين المستهدفين (USER role فقط)
    let users;
    if (dto.targetType === 'ALL') {
      users = await this.prisma.user.findMany({
        where: { role: 'USER' },
        select: { id: true, firstName: true, lastName: true, email: true },
      });
    } else if (dto.targetType === 'GOVERNORATE') {
      if (!dto.governorateId) {
        throw new BadRequestException('يجب تحديد المحافظة');
      }
      users = await this.prisma.user.findMany({
        where: {
          role: 'USER',
          governorateId: dto.governorateId,
        },
        select: { id: true, firstName: true, lastName: true, email: true },
      });
    }

    if (!users || users.length === 0) {
      throw new BadRequestException('لم يتم العثور على مستخدمين');
    }

    const results = [];
    const errors = [];

    // شحن كل مستخدم
    for (const user of users) {
      try {
        await this.adminTopUp(adminUserId, {
          userId: user.id,
          amount: dto.amount,
          reason: dto.description,
        });
        results.push({
          userId: user.id,
          name: `${user.firstName} ${user.lastName}`,
          success: true,
        });
      } catch (error) {
        errors.push({
          userId: user.id,
          name: `${user.firstName} ${user.lastName}`,
          error: error.message,
        });
      }
    }

    return {
      success: true,
      totalUsers: users.length,
      successCount: results.length,
      errorCount: errors.length,
      results,
      errors,
    };
  }

  // ==========================================
  // وظائف مساعدة لإضافة العمولات
  // ==========================================
  async addCommission(userId: string, amount: number, description: string, metadata?: any) {
    const wallet = await this.getOrCreateWallet(userId);
    const balanceBefore = Number(wallet.balance);
    const balanceAfter = balanceBefore + amount;

    return this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: amount },
          totalDeposits: { increment: amount },
          lastTransactionAt: new Date(),
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: WalletTransactionType.COMMISSION,
          amount: new Decimal(amount),
          balanceBefore: new Decimal(balanceBefore),
          balanceAfter: new Decimal(balanceAfter),
          description,
          descriptionAr: description,
          referenceType: WalletReferenceType.COMMISSION,
          status: WalletTransactionStatus.COMPLETED,
          metadata,
        },
      });

      return { success: true, newBalance: balanceAfter };
    });
  }

  // ==========================================
  // Helper Methods
  // ==========================================
  private getTopUpMethodAr(method: TopUpMethod): string {
    const methods: Record<TopUpMethod, string> = {
      [TopUpMethod.BANK_TRANSFER]: 'تحويل بنكي',
      [TopUpMethod.CASH_DEPOSIT]: 'إيداع نقدي',
      [TopUpMethod.MOBILE_WALLET]: 'محفظة إلكترونية',
      [TopUpMethod.CREDIT_CARD]: 'بطاقة ائتمان',
      [TopUpMethod.AGENT_COLLECTION]: 'تحصيل من مندوب',
      [TopUpMethod.ADMIN_CREDIT]: 'إضافة إدارية',
    };
    return methods[method] || method;
  }

  private getWithdrawalMethodAr(method: WithdrawalMethod): string {
    const methods: Record<WithdrawalMethod, string> = {
      [WithdrawalMethod.BANK_TRANSFER]: 'تحويل بنكي',
      [WithdrawalMethod.CASH]: 'نقدي',
      [WithdrawalMethod.MOBILE_WALLET]: 'محفظة إلكترونية',
      [WithdrawalMethod.CHECK]: 'شيك',
    };
    return methods[method] || method;
  }
}
