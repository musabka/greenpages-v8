import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { randomUUID } from 'crypto';
import {
  AccAccountType,
  AccNormalBalance,
  AccJournalStatus,
  AccSourceModule,
  AccPeriodStatus,
  Prisma,
} from '@greenpages/database';
import { Decimal } from '@prisma/client/runtime/library';
import { AccountingPolicyService } from './accounting-policy.service';

// ============================================================================
// TYPES
// ============================================================================

export interface JournalLineInput {
  accountCode: string;
  debit: number;
  credit: number;
  memo?: string;
  dimensions?: Record<string, string | undefined>;
}

export interface CreateJournalEntryInput {
  description: string;
  descriptionAr?: string;
  occurredAt?: Date;
  sourceModule: AccSourceModule;
  sourceEventId?: string;
  sourceEntityType?: string;
  sourceEntityId?: string;
  currencyCode?: string;
  lines: JournalLineInput[];
  metadata?: Record<string, any>;
  autoPost?: boolean;
}

export interface AccountBalance {
  accountCode: string;
  accountName: string;
  debitTotal: number;
  creditTotal: number;
  balance: number;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class AccountingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policyService: AccountingPolicyService,
  ) { }

  // ==========================================================================
  // HEALTH CHECK
  // ==========================================================================

  async health() {
    const counts = await Promise.all([
      this.prisma.accAccount.count(),
      this.prisma.accJournalEntry.count(),
      this.prisma.accCurrency.count(),
    ]);
    return {
      ok: true,
      module: 'accounting',
      accounts: counts[0],
      journalEntries: counts[1],
      currencies: counts[2],
    };
  }

  // ==========================================================================
  // CURRENCY MANAGEMENT
  // ==========================================================================

  async getBaseCurrency() {
    const base = await this.prisma.accCurrency.findFirst({
      where: { isBase: true, isActive: true },
    });
    if (!base) {
      throw new NotFoundException('لم يتم تحديد عملة أساسية للنظام');
    }
    return base;
  }

  async getCurrencyByCode(code: string) {
    const currency = await this.prisma.accCurrency.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (!currency) {
      throw new NotFoundException(`العملة ${code} غير موجودة`);
    }
    return currency;
  }

  async createCurrency(data: {
    code: string;
    nameAr: string;
    nameEn: string;
    symbol: string;
    decimalPlaces?: number;
    isBase?: boolean;
  }) {
    if (data.isBase) {
      await this.prisma.accCurrency.updateMany({
        where: { isBase: true },
        data: { isBase: false },
      });
    }
    return this.prisma.accCurrency.create({
      data: {
        code: data.code.toUpperCase(),
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        symbol: data.symbol,
        decimalPlaces: data.decimalPlaces ?? 2,
        isBase: data.isBase ?? false,
      },
    });
  }

  async getAllCurrencies() {
    return this.prisma.accCurrency.findMany({
      where: { isActive: true },
      orderBy: { isBase: 'desc' },
    });
  }

  /**
   * إنشاء العملات الأساسية للنظام
   */
  async seedBaseCurrencies() {
    const baseCurrencies = [
      { code: 'SYP', nameAr: 'الليرة السورية', nameEn: 'Syrian Pound', symbol: 'ل.س', isBase: true },
      { code: 'USD', nameAr: 'الدولار الأمريكي', nameEn: 'US Dollar', symbol: '$', isBase: false },
      { code: 'EUR', nameAr: 'اليورو', nameEn: 'Euro', symbol: '€', isBase: false },
      { code: 'SAR', nameAr: 'الريال السعودي', nameEn: 'Saudi Riyal', symbol: 'ر.س', isBase: false },
      { code: 'AED', nameAr: 'الدرهم الإماراتي', nameEn: 'UAE Dirham', symbol: 'د.إ', isBase: false },
    ];

    let created = 0;
    for (const curr of baseCurrencies) {
      const exists = await this.prisma.accCurrency.findUnique({
        where: { code: curr.code },
      });
      if (!exists) {
        await this.prisma.accCurrency.create({
          data: {
            code: curr.code,
            nameAr: curr.nameAr,
            nameEn: curr.nameEn,
            symbol: curr.symbol,
            isBase: curr.isBase,
            decimalPlaces: 2,
          },
        });
        created++;
      }
    }

    return { message: 'تم إنشاء العملات الأساسية', created, total: baseCurrencies.length };
  }

  // ==========================================================================
  // CHART OF ACCOUNTS (COA)
  // ==========================================================================

  async getAccountByCode(code: string) {
    const account = await this.prisma.accAccount.findUnique({
      where: { code },
    });
    if (!account) {
      throw new NotFoundException(`الحساب ${code} غير موجود`);
    }
    return account;
  }

  async createAccount(data: {
    code: string;
    nameAr: string;
    nameEn: string;
    accountType: AccAccountType;
    normalBalance: AccNormalBalance;
    parentCode?: string;
    isSystemAccount?: boolean;
    currencyCode?: string;
  }) {
    let parentId: string | undefined;
    let level = 1;

    if (data.parentCode) {
      const parent = await this.getAccountByCode(data.parentCode);
      parentId = parent.id;
      level = parent.level + 1;
    }

    let currencyId: string | undefined;
    if (data.currencyCode) {
      const currency = await this.getCurrencyByCode(data.currencyCode);
      currencyId = currency.id;
    }

    return this.prisma.accAccount.create({
      data: {
        code: data.code,
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        accountType: data.accountType,
        normalBalance: data.normalBalance,
        parentId,
        level,
        isSystemAccount: data.isSystemAccount ?? false,
        currencyId,
      },
    });
  }

  async getAllAccounts() {
    return this.prisma.accAccount.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
      include: { parent: true },
    });
  }

  // ==========================================================================
  // PERIODS
  // ==========================================================================

  async getCurrentPeriod() {
    const now = new Date();
    const period = await this.prisma.accPeriod.findFirst({
      where: {
        status: AccPeriodStatus.OPEN,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });
    if (!period) {
      throw new NotFoundException('لا توجد فترة محاسبية مفتوحة للتاريخ الحالي');
    }
    return period;
  }

  async getAllPeriods() {
    return this.prisma.accPeriod.findMany({
      orderBy: { startDate: 'desc' },
    });
  }

  async getOrCreatePeriodForDate(date: Date) {
    let period = await this.prisma.accPeriod.findFirst({
      where: {
        startDate: { lte: date },
        endDate: { gte: date },
      },
    });

    if (!period) {
      const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
      const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
      const name = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;

      period = await this.prisma.accPeriod.create({
        data: { name, startDate, endDate, status: AccPeriodStatus.OPEN },
      });
    }

    return period;
  }

  async closePeriod(periodId: string, userId: string) {
    const period = await this.prisma.accPeriod.findUnique({ where: { id: periodId } });
    if (!period) throw new NotFoundException('الفترة غير موجودة');
    if (period.status === AccPeriodStatus.CLOSED) {
      throw new BadRequestException('الفترة مغلقة مسبقاً');
    }

    const draftCount = await this.prisma.accJournalEntry.count({
      where: { periodId, status: AccJournalStatus.DRAFT },
    });
    if (draftCount > 0) {
      throw new BadRequestException(`يوجد ${draftCount} قيد في حالة مسودة، يجب ترحيلها أو إلغائها أولاً`);
    }

    const updatedPeriod = await this.prisma.accPeriod.update({
      where: { id: periodId },
      data: {
        status: AccPeriodStatus.CLOSED,
        closedAt: new Date(),
        closedById: userId,
      },
    });

    await this.createAuditLog(
      userId,
      'CLOSE',
      'Period',
      periodId,
      { status: period.status },
      { status: 'CLOSED', closedAt: updatedPeriod.closedAt }
    );

    return updatedPeriod;
  }

  // ==========================================================================
  // JOURNAL ENTRIES - THE CORE
  // ==========================================================================

  private async generateEntryNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `JE-${year}-`;

    const lastEntry = await this.prisma.accJournalEntry.findFirst({
      where: { entryNumber: { startsWith: prefix } },
      orderBy: { entryNumber: 'desc' },
    });

    let nextNum = 1;
    if (lastEntry) {
      const lastNum = parseInt(lastEntry.entryNumber.replace(prefix, ''), 10);
      nextNum = lastNum + 1;
    }

    return `${prefix}${nextNum.toString().padStart(6, '0')}`;
  }

  async createJournalEntry(userId: string, input: CreateJournalEntryInput) {
    // 1. Idempotency check
    if (input.sourceEventId) {
      const existing = await this.prisma.accJournalEntry.findUnique({
        where: { sourceEventId: input.sourceEventId },
      });
      if (existing) {
        return existing;
      }
    }

    // 2. Validate lines balance
    let totalDebit = 0;
    let totalCredit = 0;
    for (const line of input.lines) {
      totalDebit += line.debit;
      totalCredit += line.credit;
    }
    if (Math.abs(totalDebit - totalCredit) > 0.0001) {
      throw new BadRequestException(
        `القيد غير متوازن: مدين=${totalDebit}, دائن=${totalCredit}`,
      );
    }

    // 3. Get currency
    const currency = input.currencyCode
      ? await this.getCurrencyByCode(input.currencyCode)
      : await this.getBaseCurrency();

    // 4. Get period
    const occurredAt = input.occurredAt ?? new Date();
    const period = await this.getOrCreatePeriodForDate(occurredAt);
    if (period.status === AccPeriodStatus.CLOSED) {
      throw new BadRequestException('لا يمكن إنشاء قيد في فترة مغلقة');
    }

    // 5. Resolve account codes to IDs
    const accountCodes = input.lines.map((l) => l.accountCode);
    const accounts = await this.prisma.accAccount.findMany({
      where: { code: { in: accountCodes }, isActive: true, isPosting: true },
    });
    const accountMap = new Map(accounts.map((a) => [a.code, a]));

    for (const code of accountCodes) {
      if (!accountMap.has(code)) {
        throw new BadRequestException(`الحساب ${code} غير موجود أو غير قابل للترحيل`);
      }
    }

    // 5.5. Validate currency compatibility
    await this.policyService.validateCurrencyCompatibility(accountCodes, currency.id);

    // 6. Generate entry number
    const entryNumber = await this.generateEntryNumber();

    // 7. Create entry with lines
    const entry = await this.prisma.accJournalEntry.create({
      data: {
        entryNumber,
        occurredAt,
        description: input.description,
        descriptionAr: input.descriptionAr,
        status: input.autoPost ? AccJournalStatus.POSTED : AccJournalStatus.DRAFT,
        postedAt: input.autoPost ? new Date() : null,
        sourceModule: input.sourceModule,
        sourceEventId: input.sourceEventId,
        sourceEntityType: input.sourceEntityType,
        sourceEntityId: input.sourceEntityId,
        currencyId: currency.id,
        periodId: period.id,
        createdById: userId,
        metadata: input.metadata as Prisma.InputJsonValue,
        lines: {
          create: input.lines.map((line) => ({
            accountId: accountMap.get(line.accountCode)!.id,
            debit: new Decimal(line.debit),
            credit: new Decimal(line.credit),
            memo: line.memo,
            dimensions: line.dimensions as Prisma.InputJsonValue,
          })),
        },
      },
      include: { lines: { include: { account: true } }, currency: true, period: true },
    });

    await this.createAuditLog(userId, 'CREATE', 'JournalEntry', entry.id, null, entry);

    return entry;
  }

  async getJournalEntries(query: {
    periodId?: string;
    status?: AccJournalStatus;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number
  }) {
    const where: Prisma.AccJournalEntryWhereInput = {};
    if (query.periodId) where.periodId = query.periodId;
    if (query.status) where.status = query.status;
    if (query.dateFrom || query.dateTo) {
      // Filter by occurrence date range
      where.occurredAt = {};
      if (query.dateFrom) where.occurredAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.occurredAt.lte = new Date(query.dateTo);
    }

    const [data, total] = await Promise.all([
      this.prisma.accJournalEntry.findMany({
        where,
        include: { lines: { include: { account: true } }, currency: true, period: true },
        orderBy: { occurredAt: 'desc' },
        take: query.limit ?? 50,
        skip: query.offset ?? 0,
      }),
      this.prisma.accJournalEntry.count({ where }),
    ]);

    return { data, total };
  }

  async getJournalEntryById(id: string) {
    const entry = await this.prisma.accJournalEntry.findUnique({
      where: { id },
      include: { lines: { include: { account: true } }, currency: true, period: true },
    });
    if (!entry) throw new NotFoundException('القيد غير موجود');
    return entry;
  }

  async postJournalEntry(entryId: string, userId: string) {
    const entry = await this.prisma.accJournalEntry.findUnique({
      where: { id: entryId },
      include: { period: true, lines: true },
    });
    if (!entry) throw new NotFoundException('القيد غير موجود');
    if (entry.status === AccJournalStatus.POSTED) {
      throw new BadRequestException('القيد مرحّل مسبقاً');
    }
    if (entry.status === AccJournalStatus.VOID) {
      throw new BadRequestException('لا يمكن ترحيل قيد ملغي');
    }
    if (entry.period.status === AccPeriodStatus.CLOSED) {
      throw new BadRequestException('لا يمكن الترحيل في فترة مغلقة');
    }

    // منع القيود الصفرية
    let totalAmount = 0;
    for (const line of entry.lines) {
      totalAmount += Number(line.debit) + Number(line.credit);
    }
    if (totalAmount === 0) {
      throw new BadRequestException('لا يمكن ترحيل قيد بدون قيمة مالية (القيد صفري)');
    }

    const updated = await this.prisma.accJournalEntry.update({
      where: { id: entryId },
      data: { status: AccJournalStatus.POSTED, postedAt: new Date() },
    });

    await this.createAuditLog(userId, 'POST', 'JournalEntry', entryId, { status: entry.status }, { status: updated.status });

    return updated;
  }

  async voidJournalEntry(entryId: string, userId: string, reason: string) {
    const entry = await this.prisma.accJournalEntry.findUnique({
      where: { id: entryId },
      include: { period: true },
    });
    if (!entry) throw new NotFoundException('القيد غير موجود');
    if (entry.status === AccJournalStatus.VOID) {
      throw new BadRequestException('القيد ملغي مسبقاً');
    }
    if (entry.period.status === AccPeriodStatus.CLOSED) {
      throw new BadRequestException('لا يمكن إلغاء قيد في فترة مغلقة - يجب إنشاء قيد عكسي في فترة مفتوحة');
    }

    // Immutability Guard: يمكن إلغاء POSTED فقط عبر void (قيد عكسي)
    if (entry.status !== AccJournalStatus.POSTED) {
      throw new BadRequestException('يمكن إلغاء القيود المرحّلة فقط');
    }

    const updated = await this.prisma.accJournalEntry.update({
      where: { id: entryId },
      data: {
        status: AccJournalStatus.VOID,
        voidedAt: new Date(),
        voidedById: userId,
        voidReason: reason,
      },
    });

    await this.createAuditLog(userId, 'VOID', 'JournalEntry', entryId, { status: entry.status }, { status: updated.status, voidReason: reason });

    return updated;
  }

  /**
   * إنشاء قيد يدوي من خلال لوحة تحكم المحاسبة
   */
  async createManualJournalEntry(
    userId: string,
    dto: {
      descriptionAr: string;
      descriptionEn?: string;
      lines: { accountCode: string; debit: number; credit: number; memo?: string }[];
      idempotencyKey?: string;
    },
  ) {
    return this.createJournalEntry(userId, {
      description: dto.descriptionEn ?? dto.descriptionAr,
      descriptionAr: dto.descriptionAr,
      sourceModule: AccSourceModule.MANUAL,
      sourceEventId: dto.idempotencyKey,
      lines: dto.lines,
      autoPost: false, // القيود اليدوية تبقى في حالة مسودة
    });
  }

  // ==========================================================================
  // REPORTING
  // ==========================================================================

  async getTrialBalance(periodId?: string): Promise<AccountBalance[]> {
    const journalEntryFilter: Prisma.AccJournalEntryWhereInput = {
      status: AccJournalStatus.POSTED,
    };
    if (periodId) {
      journalEntryFilter.periodId = periodId;
    }

    const whereClause: Prisma.AccJournalLineWhereInput = {
      journalEntry: journalEntryFilter,
    };

    const lines = await this.prisma.accJournalLine.findMany({
      where: whereClause,
      include: { account: true },
    });

    const balanceMap = new Map<string, { debit: number; credit: number; name: string }>();

    for (const line of lines) {
      const code = line.account.code;
      if (!balanceMap.has(code)) {
        balanceMap.set(code, { debit: 0, credit: 0, name: line.account.nameAr });
      }
      const bal = balanceMap.get(code)!;
      bal.debit += Number(line.debit);
      bal.credit += Number(line.credit);
    }

    return Array.from(balanceMap.entries())
      .map(([code, bal]) => ({
        accountCode: code,
        accountName: bal.name,
        debitTotal: bal.debit,
        creditTotal: bal.credit,
        balance: bal.debit - bal.credit,
      }))
      .sort((a, b) => a.accountCode.localeCompare(b.accountCode));
  }

  async getLedger(accountCode: string, periodId?: string) {
    const account = await this.getAccountByCode(accountCode);

    const journalEntryFilter: Prisma.AccJournalEntryWhereInput = {
      status: AccJournalStatus.POSTED,
    };
    if (periodId) {
      journalEntryFilter.periodId = periodId;
    }

    const whereClause: Prisma.AccJournalLineWhereInput = {
      accountId: account.id,
      journalEntry: journalEntryFilter,
    };

    const lines = await this.prisma.accJournalLine.findMany({
      where: whereClause,
      include: {
        journalEntry: { include: { currency: true } },
      },
      orderBy: { journalEntry: { occurredAt: 'asc' } },
    });

    let runningBalance = 0;
    return lines.map((line) => {
      const amount = Number(line.debit) - Number(line.credit);
      runningBalance += amount;
      return {
        date: line.journalEntry.occurredAt,
        entryNumber: line.journalEntry.entryNumber,
        description: line.journalEntry.descriptionAr || line.journalEntry.description,
        debit: Number(line.debit),
        credit: Number(line.credit),
        balance: runningBalance,
        memo: line.memo,
      };
    });
  }

  async getStats() {
    const [
      totalAccounts,
      totalJournalEntries,
      postedEntries,
      draftEntries,
      openPeriods,
      totalCurrencies,
    ] = await Promise.all([
      this.prisma.accAccount.count({ where: { isActive: true } }),
      this.prisma.accJournalEntry.count(),
      this.prisma.accJournalEntry.count({ where: { status: AccJournalStatus.POSTED } }),
      this.prisma.accJournalEntry.count({ where: { status: AccJournalStatus.DRAFT } }),
      this.prisma.accPeriod.count({ where: { status: AccPeriodStatus.OPEN } }),
      this.prisma.accCurrency.count({ where: { isActive: true } }),
    ]);

    return {
      totalAccounts,
      totalJournalEntries,
      postedEntries,
      draftEntries,
      openPeriods,
      totalCurrencies,
    };
  }

  // ==========================================================================
  // AUDIT LOG
  // ==========================================================================

  private async createAuditLog(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    oldValues: any,
    newValues: any,
    reason?: string,
  ) {
    await this.prisma.accAuditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        oldValues: oldValues as Prisma.InputJsonValue,
        newValues: newValues as Prisma.InputJsonValue,
        reason,
      },
    });
  }

  async getAuditLogs(query: { entityType?: string; entityId?: string; limit?: number }) {
    const where: Prisma.AccAuditLogWhereInput = {};
    if (query.entityType) where.entityType = query.entityType;
    if (query.entityId) where.entityId = query.entityId;

    return this.prisma.accAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query.limit ?? 100,
    });
  }

  // ==========================================================================
  // SEEDING SYSTEM ACCOUNTS
  // ==========================================================================

  async seedSystemAccounts() {
    const existing = await this.prisma.accAccount.count({ where: { isSystemAccount: true } });
    if (existing > 0) {
      return { message: 'الحسابات الأساسية موجودة مسبقاً', count: existing };
    }

    let currency = await this.prisma.accCurrency.findFirst({ where: { isBase: true } });
    if (!currency) {
      currency = await this.createCurrency({
        code: 'SYP',
        nameAr: 'ليرة سورية',
        nameEn: 'Syrian Pound',
        symbol: 'ل.س',
        decimalPlaces: 0,
        isBase: true,
      });
    }

    const systemAccounts = [
      { code: '1000', nameAr: 'الأصول', nameEn: 'Assets', type: AccAccountType.ASSET, normal: AccNormalBalance.DEBIT, posting: false },
      { code: '1100', nameAr: 'النقدية والبنوك', nameEn: 'Cash & Banks', type: AccAccountType.ASSET, normal: AccNormalBalance.DEBIT, posting: false, parent: '1000' },
      { code: '1101', nameAr: 'الصندوق النقدي', nameEn: 'Cash on Hand', type: AccAccountType.ASSET, normal: AccNormalBalance.DEBIT, posting: true, parent: '1100' },
      { code: '1102', nameAr: 'البنك', nameEn: 'Bank Account', type: AccAccountType.ASSET, normal: AccNormalBalance.DEBIT, posting: true, parent: '1100' },
      { code: '1110', nameAr: 'مقاصة التحويلات البنكية', nameEn: 'Bank Transfer Clearing', type: AccAccountType.ASSET, normal: AccNormalBalance.DEBIT, posting: true, parent: '1100' },
      { code: '1111', nameAr: 'مقاصة المحافظ الإلكترونية', nameEn: 'Mobile Wallet Clearing', type: AccAccountType.ASSET, normal: AccNormalBalance.DEBIT, posting: true, parent: '1100' },
      { code: '1112', nameAr: 'مقاصة البطاقات الائتمانية', nameEn: 'Credit Card Clearing', type: AccAccountType.ASSET, normal: AccNormalBalance.DEBIT, posting: true, parent: '1100' },
      { code: '1200', nameAr: 'الذمم المدينة', nameEn: 'Receivables', type: AccAccountType.ASSET, normal: AccNormalBalance.DEBIT, posting: false, parent: '1000' },
      { code: '1201', nameAr: 'ذمم العملاء', nameEn: 'Customer Receivables', type: AccAccountType.ASSET, normal: AccNormalBalance.DEBIT, posting: true, parent: '1200' },
      { code: '2000', nameAr: 'الالتزامات', nameEn: 'Liabilities', type: AccAccountType.LIABILITY, normal: AccNormalBalance.CREDIT, posting: false },
      { code: '2100', nameAr: 'أرصدة المحافظ', nameEn: 'Wallet Liabilities', type: AccAccountType.LIABILITY, normal: AccNormalBalance.CREDIT, posting: false, parent: '2000' },
      { code: '2101', nameAr: 'أرصدة محافظ المستخدمين', nameEn: 'User Wallet Balances', type: AccAccountType.LIABILITY, normal: AccNormalBalance.CREDIT, posting: true, parent: '2100' },
      { code: '2200', nameAr: 'مستحقات المندوبين', nameEn: 'Agent Payables', type: AccAccountType.LIABILITY, normal: AccNormalBalance.CREDIT, posting: false, parent: '2000' },
      { code: '2201', nameAr: 'عمولات مستحقة للمندوبين', nameEn: 'Agent Commissions Payable', type: AccAccountType.LIABILITY, normal: AccNormalBalance.CREDIT, posting: true, parent: '2200' },
      { code: '2300', nameAr: 'الضرائب المستحقة', nameEn: 'Taxes Payable', type: AccAccountType.LIABILITY, normal: AccNormalBalance.CREDIT, posting: false, parent: '2000' },
      { code: '2301', nameAr: 'ضريبة المنصة المستحقة', nameEn: 'Platform Tax Payable', type: AccAccountType.LIABILITY, normal: AccNormalBalance.CREDIT, posting: true, parent: '2300' },
      { code: '2302', nameAr: 'ضريبة القيمة المضافة المستحقة', nameEn: 'VAT Payable', type: AccAccountType.LIABILITY, normal: AccNormalBalance.CREDIT, posting: true, parent: '2300' },
      { code: '3000', nameAr: 'حقوق الملكية', nameEn: 'Equity', type: AccAccountType.EQUITY, normal: AccNormalBalance.CREDIT, posting: false },
      { code: '3100', nameAr: 'رأس المال', nameEn: 'Capital', type: AccAccountType.EQUITY, normal: AccNormalBalance.CREDIT, posting: true, parent: '3000' },
      { code: '3200', nameAr: 'الأرباح المحتجزة', nameEn: 'Retained Earnings', type: AccAccountType.EQUITY, normal: AccNormalBalance.CREDIT, posting: true, parent: '3000' },
      { code: '4000', nameAr: 'الإيرادات', nameEn: 'Revenue', type: AccAccountType.REVENUE, normal: AccNormalBalance.CREDIT, posting: false },
      { code: '4100', nameAr: 'إيرادات الاشتراكات', nameEn: 'Subscription Revenue', type: AccAccountType.REVENUE, normal: AccNormalBalance.CREDIT, posting: true, parent: '4000' },
      { code: '4200', nameAr: 'إيرادات الإعلانات', nameEn: 'Advertising Revenue', type: AccAccountType.REVENUE, normal: AccNormalBalance.CREDIT, posting: true, parent: '4000' },
      { code: '4300', nameAr: 'إيرادات الخدمات', nameEn: 'Service Revenue', type: AccAccountType.REVENUE, normal: AccNormalBalance.CREDIT, posting: true, parent: '4000' },
      { code: '4400', nameAr: 'إيرادات رسوم الشحن', nameEn: 'Top-up Fee Revenue', type: AccAccountType.REVENUE, normal: AccNormalBalance.CREDIT, posting: true, parent: '4000' },
      { code: '5000', nameAr: 'المصروفات', nameEn: 'Expenses', type: AccAccountType.EXPENSE, normal: AccNormalBalance.DEBIT, posting: false },
      { code: '5100', nameAr: 'مصروفات العمولات', nameEn: 'Commission Expenses', type: AccAccountType.EXPENSE, normal: AccNormalBalance.DEBIT, posting: true, parent: '5000' },
      { code: '5200', nameAr: 'رسوم بوابات الدفع', nameEn: 'Payment Gateway Fees', type: AccAccountType.EXPENSE, normal: AccNormalBalance.DEBIT, posting: true, parent: '5000' },
      { code: '5300', nameAr: 'مصروفات تشغيلية', nameEn: 'Operating Expenses', type: AccAccountType.EXPENSE, normal: AccNormalBalance.DEBIT, posting: true, parent: '5000' },
    ];

    for (const acc of systemAccounts) {
      let parentId: string | undefined;
      if (acc.parent) {
        const parent = await this.prisma.accAccount.findUnique({ where: { code: acc.parent } });
        parentId = parent?.id;
      }

      await this.prisma.accAccount.create({
        data: {
          code: acc.code,
          nameAr: acc.nameAr,
          nameEn: acc.nameEn,
          accountType: acc.type,
          normalBalance: acc.normal,
          isPosting: acc.posting,
          isSystemAccount: true,
          parentId,
          level: acc.parent ? 2 : 1,
        },
      });
    }

    return { message: 'تم إنشاء الحسابات الأساسية بنجاح', count: systemAccounts.length };
  }

  // ==========================================================================
  // INVOICING SYSTEM
  // ==========================================================================

  /**
   * إنشاء رقم فاتورة تسلسلي
   */
  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;

    const lastInvoice = await this.prisma.accInvoice.findFirst({
      where: { invoiceNumber: { startsWith: prefix } },
      orderBy: { invoiceNumber: 'desc' },
    });

    let nextNum = 1;
    if (lastInvoice) {
      const lastNum = parseInt(lastInvoice.invoiceNumber.replace(prefix, ''), 10);
      nextNum = lastNum + 1;
    }

    return `${prefix}${nextNum.toString().padStart(6, '0')}`;
  }

  /**
   * إنشاء فاتورة جديدة
   */
  async createInvoice(userId: string, data: {
    customerId: string;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    businessId?: string;
    invoiceType: 'SUBSCRIPTION' | 'AD' | 'SERVICE' | 'TOP_UP' | 'CREDIT_NOTE';
    currencyId?: string;
    dueDate?: Date;
    notes?: string;
    notesAr?: string;
    lines: {
      description: string;
      descriptionAr?: string;
      quantity: number;
      unitPrice: number;
      taxId?: string;
    }[];
  }) {
    console.log('🟣 AccountingService.createInvoice - بدء الإنشاء...', {
      userId,
      customerId: data.customerId,
      customerName: data.customerName,
      invoiceType: data.invoiceType,
      linesCount: data.lines.length,
    });

    // الحصول على العملة
    const currency = data.currencyId
      ? await this.prisma.accCurrency.findUnique({ where: { id: data.currencyId } })
      : await this.getBaseCurrency();

    if (!currency) {
      throw new NotFoundException('العملة غير موجودة');
    }

    // احتساب الأسطر والضرائب
    let subtotalSum = 0;
    let taxTotalSum = 0;
    const processedLines: {
      description: string;
      descriptionAr: string | null;
      quantity: Decimal;
      unitPrice: Decimal;
      subtotal: Decimal;
      taxId: string | null;
      taxAmount: Decimal;
      total: Decimal;
    }[] = [];

    for (const line of data.lines) {
      const lineSubtotal = line.quantity * line.unitPrice;
      subtotalSum += lineSubtotal;

      let taxAmount = 0;
      if (line.taxId) {
        const tax = await this.prisma.accTax.findUnique({ where: { id: line.taxId } });
        if (tax) {
          taxAmount = (lineSubtotal * Number(tax.rate)) / 100;
          taxTotalSum += taxAmount;
        }
      }

      const lineTotal = lineSubtotal + taxAmount;

      processedLines.push({
        description: line.description,
        descriptionAr: line.descriptionAr ?? null,
        quantity: new Decimal(line.quantity),
        unitPrice: new Decimal(line.unitPrice),
        subtotal: new Decimal(lineSubtotal),
        taxId: line.taxId ?? null,
        taxAmount: new Decimal(taxAmount),
        total: new Decimal(lineTotal),
      });
    }

    const total = subtotalSum + taxTotalSum;
    const invoiceNumber = await this.generateInvoiceNumber();

    // إنشاء الفاتورة مع الأسطر
    const invoice = await this.prisma.accInvoice.create({
      data: {
        invoiceNumber,
        invoiceDate: new Date(),
        invoiceType: data.invoiceType,
        status: 'DRAFT',
        customerId: data.customerId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        businessId: data.businessId,
        currencyId: currency.id,
        subtotal: new Decimal(subtotalSum),
        taxTotal: new Decimal(taxTotalSum),
        total: new Decimal(total),
        dueDate: data.dueDate,
        notes: data.notes,
        notesAr: data.notesAr,
        createdById: userId, // المستخدم الذي أنشأ الفاتورة
        lines: {
          create: processedLines,
        },
      },
      include: { lines: true, currency: true },
    });

    await this.createAuditLog(userId, 'CREATE', 'Invoice', invoice.id, null, invoice);

    return invoice;
  }

  /**
   * إصدار الفاتورة (تغيير الحالة من DRAFT إلى ISSUED)
   * وإنشاء القيد المحاسبي المرتبط
   */
  async issueInvoice(invoiceId: string, userId: string) {
    const invoice = await this.prisma.accInvoice.findUnique({
      where: { id: invoiceId },
      include: { lines: true, currency: true },
    });

    if (!invoice) throw new NotFoundException('الفاتورة غير موجودة');
    if (invoice.status !== 'DRAFT') {
      throw new BadRequestException('لا يمكن إصدار فاتورة غير مسودة');
    }

    // إنشاء القيد المحاسبي أولاً
    const lines = [];

    // مدين: ذمم العملاء
    lines.push({
      accountCode: '1201', // Customer Receivables
      debit: Number(invoice.total),
      credit: 0,
      memo: `فاتورة ${invoice.invoiceNumber}`,
      dimensions: {
        userId: invoice.customerId,
        businessId: invoice.businessId || undefined,
        governorateId: invoice.governorateId || undefined,
      },
    });

    // دائن: الإيرادات (الصافي)
    lines.push({
      accountCode: '4100', // Subscription Revenue (default)
      debit: 0,
      credit: Number(invoice.subtotal),
      memo: `إيراد فاتورة ${invoice.invoiceNumber}`,
      dimensions: {
        userId: invoice.customerId,
        businessId: invoice.businessId || undefined,
        sourceModule: 'INVOICING',
      },
    });

    // دائن: الضريبة المستحقة (إن وجدت)
    if (Number(invoice.taxTotal) > 0) {
      lines.push({
        accountCode: '2302', // VAT Payable
        debit: 0,
        credit: Number(invoice.taxTotal),
        memo: `ضريبة فاتورة ${invoice.invoiceNumber}`,
      });
    }

    const journalEntry = await this.createJournalEntry(userId, {
      description: `Invoice ${invoice.invoiceNumber}`,
      descriptionAr: `فاتورة ${invoice.invoiceNumber}`,
      sourceModule: AccSourceModule.INVOICING,
      sourceEventId: `INVOICE-ISSUED-${invoiceId}`,
      sourceEntityType: 'Invoice',
      sourceEntityId: invoiceId,
      lines,
      metadata: {
        customerId: invoice.customerId,
        businessId: invoice.businessId || undefined,
        invoiceId,
        invoiceNumber: invoice.invoiceNumber,
      },
      autoPost: true,
    });

    // تحديث الفاتورة مع ربط القيد وتسجيل وقت الإصدار
    const updatedInvoice = await this.prisma.accInvoice.update({
      where: { id: invoiceId },
      data: {
        status: 'ISSUED' as any,
        journalEntryId: journalEntry.id,
        issuedAt: new Date(),
        createdById: userId,
      },
      include: { lines: true, currency: true },
    });

    // التحقق النهائي: Invoice Rule - journalEntryId إلزامي عند ISSUE
    if (!updatedInvoice.journalEntryId) {
      throw new InternalServerErrorException('خطأ في النظام: الفاتورة المصدرة يجب أن تحتوي على journalEntryId');
    }

    await this.createAuditLog(userId, 'ISSUE', 'Invoice', invoiceId, { status: 'DRAFT' }, { status: 'ISSUED', journalEntryId: journalEntry.id });

    return updatedInvoice;
  }

  /**
   * الحصول على الفواتير
   */
  async getInvoices(query: { customerId?: string; status?: string; limit?: number; offset?: number }) {
    console.log('🔍 AccountingService.getInvoices - بدء البحث...', query);

    const where: any = {};
    if (query.customerId) where.customerId = query.customerId;
    if (query.status) where.status = query.status;

    console.log('🔍 WHERE clause:', where);

    const [data, total] = await Promise.all([
      this.prisma.accInvoice.findMany({
        where,
        include: { lines: true, currency: true },
        orderBy: { createdAt: 'desc' },
        take: query.limit ?? 50,
        skip: query.offset ?? 0,
      }),
      this.prisma.accInvoice.count({ where }),
    ]);

    console.log('🔍 نتيجة البحث:', { foundCount: data.length, total });

    return { data, total };
  }

  /**
   * فواتير المستخدم المرئية
   *
   * القاعدة:
   * - يرى المستخدم أي فاتورة يكون هو customerId فيها
   * - ويرى أيضاً فواتير الأنشطة التي يملكها (ownerId أو Capability)
   *   حتى لو كانت الفاتورة قد أُنشئت قبل ربط النشاط بالمستخدم.
   */
  async getUserVisibleInvoices(
    userId: string,
    query: { status?: string; limit?: number; offset?: number },
  ) {
    const { status, limit = 20, offset = 0 } = query;

    const ownedBusinessIds = await this.prisma.business.findMany({
      where: {
        OR: [
          { ownerId: userId },
          {
            userCapabilities: {
              some: {
                userId,
                role: 'OWNER',
              },
            },
          },
        ],
      },
      select: { id: true },
    });

    const businessIdList = ownedBusinessIds.map((b) => b.id);

    const where: any = {
      OR: [
        { customerId: userId },
        businessIdList.length ? { businessId: { in: businessIdList } } : undefined,
      ].filter(Boolean),
    };

    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.accInvoice.findMany({
        where,
        include: { lines: true, currency: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.accInvoice.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * الحصول على فاتورة بالمعرف
   */
  async getInvoiceById(id: string) {
    const invoice = await this.prisma.accInvoice.findUnique({
      where: { id },
      include: { lines: true, currency: true },
    });
    if (!invoice) throw new NotFoundException('الفاتورة غير موجودة');
    return invoice;
  }

  /**
   * تسجيل دفع فاتورة
   */
  async recordInvoicePayment(invoiceId: string, userId: string, amount: number, paymentMethod: 'WALLET' | 'CASH' | 'BANK') {
    const invoice = await this.prisma.accInvoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) throw new NotFoundException('الفاتورة غير موجودة');
    if (invoice.status === 'PAID' || invoice.status === 'CANCELLED') {
      throw new BadRequestException('الفاتورة مدفوعة أو ملغاة');
    }
    if (invoice.status === 'DRAFT') {
      throw new BadRequestException('لا يمكن دفع فاتورة مسودة. يجب إصدارها أولاً');
    }

    const paidAmount = Number(invoice.paidAmount) + amount;
    const totalAmount = Number(invoice.total);
    const newStatus = paidAmount >= totalAmount ? 'PAID' : 'PARTIAL';

    // القيد المحاسبي للدفع
    const journalLines = [];

    if (paymentMethod === 'WALLET') {
      // خصم من محفظة العميل
      journalLines.push({
        accountCode: '2101', // Wallet Liability
        debit: amount,
        credit: 0,
        memo: `دفع من محفظة - فاتورة ${invoice.invoiceNumber}`,
        dimensions: {
          userId: invoice.customerId,
          sourceModule: 'WALLET',
        },
      });
    } else {
      // استلام نقدي أو بنكي
      journalLines.push({
        accountCode: paymentMethod === 'CASH' ? '1101' : '1102',
        debit: amount,
        credit: 0,
        memo: `استلام ${paymentMethod === 'CASH' ? 'نقدي' : 'بنكي'} - فاتورة ${invoice.invoiceNumber}`,
      });
    }

    // تخفيض ذمم العملاء
    journalLines.push({
      accountCode: '1201', // Customer Receivables
      debit: 0,
      credit: amount,
      memo: `تسديد فاتورة ${invoice.invoiceNumber}`,
      dimensions: {
        userId: invoice.customerId,
      },
    });

    // توليد معرّف فريد للدفعة (Enterprise-grade uniqueness)
    const paymentUuid = randomUUID();

    const journalEntry = await this.createJournalEntry(userId, {
      description: `Payment for invoice ${invoice.invoiceNumber}`,
      descriptionAr: `دفع فاتورة ${invoice.invoiceNumber}`,
      sourceModule: AccSourceModule.INVOICING,
      // Enterprise Rule: sourceEventId فريد تماماً باستخدام UUID (أقوى من timestamp)
      sourceEventId: `INVOICE-PAYMENT-${invoiceId}-${paymentUuid}`,
      sourceEntityType: 'InvoicePayment',
      sourceEntityId: invoiceId,
      lines: journalLines,
      metadata: {
        customerId: invoice.customerId,
        invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        paymentMethod,
      },
      autoPost: true,
    });

    // تحديث الفاتورة
    const updatedInvoice = await this.prisma.accInvoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: new Decimal(paidAmount),
        status: newStatus as any,
        paidAt: newStatus === 'PAID' ? new Date() : null,
      },
    });

    // تسجيل في Audit Log
    await this.createAuditLog(
      userId,
      'PAYMENT',
      'Invoice',
      invoiceId,
      { paidAmount: invoice.paidAmount, status: invoice.status },
      { paidAmount: paidAmount, status: newStatus, paymentMethod, journalEntryId: journalEntry.id }
    );

    return { success: true, paidAmount, status: newStatus, journalEntryId: journalEntry.id };
  }

  /**
   * إنشاء إشعار دائن (Credit Note) / استرداد
   */
  async createCreditNote(userId: string, originalInvoiceId: string, data: {
    reason: string;
    reasonAr?: string;
    refundType: 'FULL' | 'PARTIAL';
    amount?: number;
    lines?: {
      description: string;
      descriptionAr?: string;
      quantity: number;
      unitPrice: number;
    }[];
  }) {
    const originalInvoice = await this.prisma.accInvoice.findUnique({
      where: { id: originalInvoiceId },
      include: { lines: true, currency: true },
    });

    if (!originalInvoice) {
      throw new NotFoundException('الفاتورة الأصلية غير موجودة');
    }
    if (originalInvoice.status === 'DRAFT' || originalInvoice.status === 'CANCELLED') {
      throw new BadRequestException('لا يمكن استرداد فاتورة مسودة أو ملغاة');
    }

    let refundAmount: number;
    let processedLines: any[] = [];

    if (data.refundType === 'FULL') {
      // استرداد كامل
      refundAmount = Number(originalInvoice.total);
      processedLines = originalInvoice.lines.map((line) => ({
        description: `Refund: ${line.description}`,
        descriptionAr: `استرداد: ${line.descriptionAr || line.description}`,
        quantity: new Decimal(Number(line.quantity)),
        unitPrice: new Decimal(Number(line.unitPrice)),
        subtotal: new Decimal(Number(line.subtotal)),
        taxId: line.taxId,
        taxAmount: new Decimal(Number(line.taxAmount)),
        total: new Decimal(Number(line.total)),
        lineNumber: line.lineNumber,
      }));
    } else {
      // استرداد جزئي
      if (!data.amount && (!data.lines || data.lines.length === 0)) {
        throw new BadRequestException('يجب تحديد المبلغ أو الأسطر للاسترداد الجزئي');
      }

      if (data.amount) {
        refundAmount = data.amount;
        processedLines.push({
          description: data.reason,
          descriptionAr: data.reasonAr || data.reason,
          quantity: new Decimal(1),
          unitPrice: new Decimal(data.amount),
          subtotal: new Decimal(data.amount),
          taxId: null,
          taxAmount: new Decimal(0),
          total: new Decimal(data.amount),
          lineNumber: 1,
        });
      } else {
        refundAmount = data.lines!.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
        processedLines = data.lines!.map((line, idx) => ({
          description: line.description,
          descriptionAr: line.descriptionAr || line.description,
          quantity: new Decimal(line.quantity),
          unitPrice: new Decimal(line.unitPrice),
          subtotal: new Decimal(line.quantity * line.unitPrice),
          taxId: null,
          taxAmount: new Decimal(0),
          total: new Decimal(line.quantity * line.unitPrice),
          lineNumber: idx + 1,
        }));
      }
    }

    // التحقق من عدم تجاوز المبلغ الأصلي
    if (refundAmount > Number(originalInvoice.total)) {
      throw new BadRequestException('مبلغ الاسترداد يتجاوز قيمة الفاتورة الأصلية');
    }

    // إنشاء رقم إشعار الدائن
    const year = new Date().getFullYear();
    const prefix = `CN-${year}-`;
    const lastCN = await this.prisma.accInvoice.findFirst({
      where: { invoiceNumber: { startsWith: prefix } },
      orderBy: { invoiceNumber: 'desc' },
    });
    let nextNum = 1;
    if (lastCN) {
      const lastNum = parseInt(lastCN.invoiceNumber.replace(prefix, ''), 10);
      nextNum = lastNum + 1;
    }
    const creditNoteNumber = `${prefix}${nextNum.toString().padStart(6, '0')}`;

    // إنشاء إشعار الدائن
    const creditNote = await this.prisma.accInvoice.create({
      data: {
        invoiceNumber: creditNoteNumber,
        invoiceDate: new Date(),
        invoiceType: 'CREDIT_NOTE' as any,
        status: 'DRAFT' as any,
        customerId: originalInvoice.customerId,
        customerName: originalInvoice.customerName,
        customerEmail: originalInvoice.customerEmail,
        customerPhone: originalInvoice.customerPhone,
        customerLanguage: originalInvoice.customerLanguage,
        billingAddress: originalInvoice.billingAddress,
        businessId: originalInvoice.businessId,
        governorateId: originalInvoice.governorateId,
        currencyId: originalInvoice.currencyId,
        originalInvoiceId: originalInvoiceId,
        subtotal: new Decimal(refundAmount),
        taxTotal: new Decimal(0),
        total: new Decimal(refundAmount),
        notes: data.reason,
        notesAr: data.reasonAr,
        lines: {
          create: processedLines,
        },
      },
      include: { lines: true, currency: true },
    });

    await this.createAuditLog(userId, 'CREATE', 'CreditNote', creditNote.id, null, creditNote);

    return creditNote;
  }

  /**
   * إصدار إشعار الدائن وإنشاء قيد الاسترداد
   */
  async issueCreditNote(creditNoteId: string, userId: string) {
    const creditNote = await this.prisma.accInvoice.findUnique({
      where: { id: creditNoteId },
      include: { lines: true, currency: true, originalInvoice: true },
    });

    if (!creditNote) throw new NotFoundException('إشعار الدائن غير موجود');
    if (creditNote.invoiceType !== 'CREDIT_NOTE') {
      throw new BadRequestException('هذه ليست إشعار دائن');
    }
    if (creditNote.status !== 'DRAFT') {
      throw new BadRequestException('إشعار الدائن ليس في حالة مسودة');
    }

    // إنشاء قيد عكسي
    const lines = [
      // دائن: ذمم العملاء (تخفيض)
      {
        accountCode: '1201',
        debit: 0,
        credit: Number(creditNote.total),
        memo: `استرداد - ${creditNote.invoiceNumber}`,
        dimensions: {
          userId: creditNote.customerId,
        },
      },
      // مدين: تعديل الإيرادات
      {
        accountCode: '4199', // Revenue Adjustment
        debit: Number(creditNote.total),
        credit: 0,
        memo: `تعديل إيرادات - ${creditNote.invoiceNumber}`,
      },
    ];

    const journalEntry = await this.createJournalEntry(userId, {
      description: `Credit Note ${creditNote.invoiceNumber}`,
      descriptionAr: `إشعار دائن ${creditNote.invoiceNumber}`,
      sourceModule: AccSourceModule.INVOICING,
      sourceEventId: `CREDIT-NOTE-ISSUED-${creditNoteId}`,
      sourceEntityType: 'CreditNote',
      sourceEntityId: creditNoteId,
      lines,
      autoPost: true,
    });

    // تحديث إشعار الدائن
    const updatedCreditNote = await this.prisma.accInvoice.update({
      where: { id: creditNoteId },
      data: {
        status: 'ISSUED' as any,
        journalEntryId: journalEntry.id,
        issuedAt: new Date(),
        createdById: userId,
      },
      include: { lines: true, currency: true },
    });

    await this.createAuditLog(userId, 'ISSUE', 'CreditNote', creditNoteId, { status: 'DRAFT' }, { status: 'ISSUED' });

    return updatedCreditNote;
  }

  /**
   * إلغاء فاتورة
   */
  async cancelInvoice(invoiceId: string, userId: string, reason: string) {
    const invoice = await this.prisma.accInvoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) throw new NotFoundException('الفاتورة غير موجودة');
    if (invoice.status === 'PAID') {
      throw new BadRequestException('لا يمكن إلغاء فاتورة مدفوعة. استخدم إشعار دائن بدلاً من ذلك');
    }
    if (invoice.status === 'CANCELLED') {
      throw new BadRequestException('الفاتورة ملغاة مسبقاً');
    }

    // إذا كانت الفاتورة صادرة ولها قيد، نلغي القيد
    if (invoice.journalEntryId) {
      await this.voidJournalEntry(invoice.journalEntryId, userId, `إلغاء فاتورة: ${reason}`);
    }

    // تحديث الفاتورة
    const updatedInvoice = await this.prisma.accInvoice.update({
      where: { id: invoiceId },
      data: {
        status: 'CANCELLED' as any,
        cancelledAt: new Date(),
        cancelReason: reason,
      },
    });

    await this.createAuditLog(userId, 'CANCEL', 'Invoice', invoiceId, { status: invoice.status }, { status: 'CANCELLED', cancelReason: reason });

    return updatedInvoice;
  }

  // ==========================================================================
  // DASHBOARD STATS
  // ==========================================================================

  async getJournalEntryStats() {
    const [total, draft, posted, voidCount] = await Promise.all([
      this.prisma.accJournalEntry.count(),
      this.prisma.accJournalEntry.count({ where: { status: AccJournalStatus.DRAFT } }),
      this.prisma.accJournalEntry.count({ where: { status: AccJournalStatus.POSTED } }),
      this.prisma.accJournalEntry.count({ where: { status: AccJournalStatus.VOID } }),
    ]);

    return {
      total,
      draft,
      posted,
      void: voidCount,
    };
  }

  async getInvoiceStats() {
    const [total, draft, issued, paid, cancelled] = await Promise.all([
      this.prisma.accInvoice.count(),
      this.prisma.accInvoice.count({ where: { status: 'DRAFT' } }),
      this.prisma.accInvoice.count({ where: { status: 'ISSUED' } }),
      this.prisma.accInvoice.count({ where: { status: 'PAID' } }),
      this.prisma.accInvoice.count({ where: { status: 'CANCELLED' } }),
    ]);

    return {
      total,
      draft,
      issued,
      paid,
      cancelled,
    };
  }

  async getPeriodStats() {
    const [total, open, closed] = await Promise.all([
      this.prisma.accPeriod.count(),
      this.prisma.accPeriod.count({ where: { status: AccPeriodStatus.OPEN } }),
      this.prisma.accPeriod.count({ where: { status: AccPeriodStatus.CLOSED } }),
    ]);

    return {
      total,
      open,
      closed,
    };
  }
}

