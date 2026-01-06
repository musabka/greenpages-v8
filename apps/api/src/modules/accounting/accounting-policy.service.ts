import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * AccountingPolicyService - طبقة السياسات المحاسبية
 * 
 * هذه الطبقة مسؤولة عن:
 * - ترجمة الأحداث المالية إلى قيود محاسبية
 * - تحديد الحسابات الصحيحة لكل نوع عملية
 * - التحقق من صحة dimensions
 * - احتساب الضرائب والرسوم
 * 
 * ممنوع: وضع account codes مباشرة في WalletService/CommissionsService
 */

// ============================================================================
// TYPES
// ============================================================================

export interface JournalLineSpec {
  accountCode: string;
  debit: number;
  credit: number;
  memo?: string;
  dimensions?: JournalDimensions;
}

export interface JournalDimensions {
  governorateId?: string;
  cityId?: string;
  districtId?: string;
  userId?: string;
  businessId?: string;
  agentProfileId?: string;
  sourceModule?: string;
  projectKey?: string;
}

// Whitelist للـ dimensions المسموحة
const ALLOWED_DIMENSION_KEYS = [
  'governorateId',
  'cityId', 
  'districtId',
  'userId',
  'businessId',
  'agentProfileId',
  'sourceModule',
  'projectKey',
];

export interface TaxCalculation {
  taxId: string;
  taxCode: string;
  taxableAmount: number;
  taxAmount: number;
  taxAccountCode: string;
}

// ============================================================================
// ACCOUNT CODES - الحسابات الأساسية
// ============================================================================

export const ACCOUNT_CODES = {
  // الأصول (1xxx)
  CASH: '1101',
  BANK_MAIN: '1102',
  PAYMENT_GATEWAYS: '1103',
  MOBILE_MONEY: '1104',
  CUSTOMER_RECEIVABLES: '1201',
  
  // الالتزامات (2xxx)
  WALLET_LIABILITY: '2101',
  AGENT_PAYABLE: '2201',
  MANAGER_PAYABLE: '2202',
  PLATFORM_TAX_PAYABLE: '2301',
  VAT_PAYABLE: '2302',
  GOVERNORATE_TAX_PAYABLE: '2303',
  
  // حقوق الملكية (3xxx)
  CAPITAL: '3100',
  RETAINED_EARNINGS: '3200',
  
  // الإيرادات (4xxx)
  SUBSCRIPTION_REVENUE: '4100',
  ADS_REVENUE: '4200',
  SERVICE_REVENUE: '4300',
  TOPUP_FEE_REVENUE: '4400',
  GOVERNORATE_REVENUE: '4500',
  
  // المصروفات (5xxx)
  COMMISSION_EXPENSE: '5100',
  PAYMENT_FEES_EXPENSE: '5200',
  OPERATING_EXPENSE: '5300',
  GAMIFICATION_EXPENSE: '5400',
} as const;

// ============================================================================
// CLEARING ACCOUNTS حسب طريقة الشحن
// ============================================================================

export const TOPUP_CLEARING_ACCOUNTS: Record<string, string> = {
  CASH: ACCOUNT_CODES.CASH,
  BANK_TRANSFER: ACCOUNT_CODES.BANK_MAIN,
  CREDIT_CARD: ACCOUNT_CODES.PAYMENT_GATEWAYS,
  SYRIATEL_CASH: ACCOUNT_CODES.MOBILE_MONEY,
  MTN_CASH: ACCOUNT_CODES.MOBILE_MONEY,
  ADMIN: ACCOUNT_CODES.CASH,
};

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class AccountingPolicyService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================================================
  // VALIDATION
  // ==========================================================================

  /**
   * التحقق من صحة الـ dimensions
   */
  validateDimensions(dimensions: Record<string, any>): JournalDimensions {
    const validated: JournalDimensions = {};
    
    // فلترة المفاتيح المسموحة فقط (تجاهل غير المصرح به)
    for (const key of Object.keys(dimensions)) {
      if (ALLOWED_DIMENSION_KEYS.includes(key)) {
        (validated as any)[key] = dimensions[key];
      }
      // تجاهل أي مفتاح خارج القائمة البيضاء
    }
    
    return validated;
  }

  /**
   * التحقق من توازن القيد
   */
  validateBalance(lines: JournalLineSpec[]): void {
    let totalDebit = 0;
    let totalCredit = 0;
    
    for (const line of lines) {
      if (line.debit < 0 || line.credit < 0) {
        throw new BadRequestException('Debit and credit amounts must be non-negative');
      }
      if (line.debit > 0 && line.credit > 0) {
        throw new BadRequestException('A single line cannot have both debit and credit > 0');
      }
      totalDebit += line.debit;
      totalCredit += line.credit;
    }
    
    if (Math.abs(totalDebit - totalCredit) > 0.0001) {
      throw new BadRequestException(
        `Journal entry is not balanced: Debit=${totalDebit}, Credit=${totalCredit}`
      );
    }
  }

  /**
   * التحقق من توافق العملات
   * يمنع خلط العملات في نفس القيد
   */
  async validateCurrencyCompatibility(
    accountCodes: string[],
    entryCurrencyId: string,
  ): Promise<void> {
    // جلب الحسابات
    const accounts = await this.prisma.accAccount.findMany({
      where: {
        code: { in: accountCodes },
      },
      include: {
        currency: true,
      },
    });

    const accountMap = new Map(accounts.map(a => [a.code, a]));

    for (const code of accountCodes) {
      const account = accountMap.get(code);
      if (!account) {
        throw new BadRequestException(`Account ${code} not found`);
      }

      // التحقق من currencyMode
      if (account.currencyMode === 'MONO') {
        // يجب أن تطابق العملة المحددة للحساب
        if (account.currencyId && account.currencyId !== entryCurrencyId) {
          throw new BadRequestException(
            `Account ${code} (${account.nameAr}) only accepts ${account.currency?.code}, but entry uses a different currency`
          );
        }
      }
      // إذا كان MULTI، يقبل أي عملة
    }
  }

  // ==========================================================================
  // WALLET TOP-UP MAPPING
  // ==========================================================================

  /**
   * تحويل حدث شحن المحفظة إلى قيود محاسبية
   */
  mapTopUpApproval(params: {
    amount: number;
    method: string;
    fee?: number;
    taxAmount?: number;
    walletOwnerId: string;
    governorateId?: string;
    agentProfileId?: string;
  }): JournalLineSpec[] {
    const { amount, method, fee = 0, taxAmount = 0, walletOwnerId, governorateId, agentProfileId } = params;
    
    const clearingAccount = TOPUP_CLEARING_ACCOUNTS[method] || ACCOUNT_CODES.CASH;
    const netAmount = amount - fee - taxAmount;
    
    const lines: JournalLineSpec[] = [];
    const dimensions = this.validateDimensions({
      userId: walletOwnerId,
      governorateId,
      agentProfileId,
    });
    
    // مدين: حساب المقاصة (الاستلام)
    lines.push({
      accountCode: clearingAccount,
      debit: amount,
      credit: 0,
      memo: `Top-up received via ${method}`,
      dimensions,
    });
    
    // دائن: التزام المحفظة
    lines.push({
      accountCode: ACCOUNT_CODES.WALLET_LIABILITY,
      debit: 0,
      credit: netAmount,
      memo: `Wallet credit for ${walletOwnerId}`,
      dimensions,
    });
    
    // دائن: رسوم الشحن (إن وجدت)
    if (fee > 0) {
      lines.push({
        accountCode: ACCOUNT_CODES.TOPUP_FEE_REVENUE,
        debit: 0,
        credit: fee,
        memo: 'Top-up fee revenue',
        dimensions,
      });
    }
    
    // دائن: الضريبة (إن وجدت)
    if (taxAmount > 0) {
      lines.push({
        accountCode: ACCOUNT_CODES.PLATFORM_TAX_PAYABLE,
        debit: 0,
        credit: taxAmount,
        memo: 'Top-up tax',
        dimensions,
      });
    }
    
    this.validateBalance(lines);
    return lines;
  }

  // ==========================================================================
  // WALLET PAYMENT MAPPING
  // ==========================================================================

  /**
   * تحويل حدث الدفع من المحفظة إلى قيود محاسبية
   */
  mapWalletPayment(params: {
    grossAmount: number;
    netAmount: number;
    taxAmount: number;
    paymentType: 'SUBSCRIPTION' | 'AD' | 'SERVICE';
    walletOwnerId: string;
    businessId?: string;
    governorateId?: string;
  }): JournalLineSpec[] {
    const { grossAmount, netAmount, taxAmount, paymentType, walletOwnerId, businessId, governorateId } = params;
    
    const revenueAccount = this.getRevenueAccountForType(paymentType);
    const dimensions = this.validateDimensions({
      userId: walletOwnerId,
      businessId,
      governorateId,
    });
    
    const lines: JournalLineSpec[] = [];
    
    // مدين: تخفيض التزام المحفظة
    lines.push({
      accountCode: ACCOUNT_CODES.WALLET_LIABILITY,
      debit: grossAmount,
      credit: 0,
      memo: `Payment from wallet for ${paymentType}`,
      dimensions,
    });
    
    // دائن: الإيراد
    lines.push({
      accountCode: revenueAccount,
      debit: 0,
      credit: netAmount,
      memo: `${paymentType} revenue`,
      dimensions,
    });
    
    // دائن: الضريبة
    if (taxAmount > 0) {
      lines.push({
        accountCode: ACCOUNT_CODES.PLATFORM_TAX_PAYABLE,
        debit: 0,
        credit: taxAmount,
        memo: `Tax on ${paymentType}`,
        dimensions,
      });
    }
    
    this.validateBalance(lines);
    return lines;
  }

  // ==========================================================================
  // COMMISSION MAPPING
  // ==========================================================================

  /**
   * تحويل استحقاق عمولة إلى قيود محاسبية
   */
  mapCommissionEarned(params: {
    amount: number;
    agentProfileId: string;
    businessId?: string;
    governorateId?: string;
  }): JournalLineSpec[] {
    const { amount, agentProfileId, businessId, governorateId } = params;
    
    const dimensions = this.validateDimensions({
      agentProfileId,
      businessId,
      governorateId,
    });
    
    const lines: JournalLineSpec[] = [
      {
        accountCode: ACCOUNT_CODES.COMMISSION_EXPENSE,
        debit: amount,
        credit: 0,
        memo: `Commission earned by agent ${agentProfileId}`,
        dimensions,
      },
      {
        accountCode: ACCOUNT_CODES.AGENT_PAYABLE,
        debit: 0,
        credit: amount,
        memo: `Payable to agent ${agentProfileId}`,
        dimensions,
      },
    ];
    
    this.validateBalance(lines);
    return lines;
  }

  /**
   * تحويل دفع عمولة إلى قيود محاسبية
   */
  mapCommissionPayment(params: {
    amount: number;
    agentProfileId: string;
    paymentMethod: 'CASH' | 'BANK';
    governorateId?: string;
  }): JournalLineSpec[] {
    const { amount, agentProfileId, paymentMethod, governorateId } = params;
    
    const paymentAccount = paymentMethod === 'CASH' 
      ? ACCOUNT_CODES.CASH 
      : ACCOUNT_CODES.BANK_MAIN;
    
    const dimensions = this.validateDimensions({
      agentProfileId,
      governorateId,
    });
    
    const lines: JournalLineSpec[] = [
      {
        accountCode: ACCOUNT_CODES.AGENT_PAYABLE,
        debit: amount,
        credit: 0,
        memo: `Settlement payment to agent ${agentProfileId}`,
        dimensions,
      },
      {
        accountCode: paymentAccount,
        debit: 0,
        credit: amount,
        memo: `Cash/Bank payment to agent`,
        dimensions,
      },
    ];
    
    this.validateBalance(lines);
    return lines;
  }

  // ==========================================================================
  // MANAGER SETTLEMENT MAPPING
  // ==========================================================================

  /**
   * تحويل تسوية مدير المحافظة إلى قيود محاسبية
   */
  mapManagerSettlement(params: {
    totalAmount: number;
    governorateShare: number;
    companyShare: number;
    managerId: string;
    governorateId: string;
  }): JournalLineSpec[] {
    const { totalAmount, governorateShare, companyShare, managerId, governorateId } = params;
    
    const dimensions = this.validateDimensions({
      userId: managerId,
      governorateId,
    });
    
    const lines: JournalLineSpec[] = [];
    
    // مدين: الإيراد من المحافظة
    lines.push({
      accountCode: ACCOUNT_CODES.GOVERNORATE_REVENUE,
      debit: 0,
      credit: totalAmount,
      memo: `Revenue from governorate ${governorateId}`,
      dimensions,
    });
    
    // دائن: حصة المدير
    lines.push({
      accountCode: ACCOUNT_CODES.MANAGER_PAYABLE,
      debit: 0,
      credit: governorateShare,
      memo: `Manager share for ${managerId}`,
      dimensions,
    });
    
    // دائن: حصة الشركة
    lines.push({
      accountCode: ACCOUNT_CODES.SUBSCRIPTION_REVENUE,
      debit: 0,
      credit: companyShare,
      memo: `Company share from governorate`,
      dimensions,
    });
    
    // مدين: التوازن
    lines.push({
      accountCode: ACCOUNT_CODES.CASH,
      debit: totalAmount,
      credit: 0,
      memo: `Collection from governorate`,
      dimensions,
    });
    
    this.validateBalance(lines);
    return lines;
  }

  // ==========================================================================
  // GAMIFICATION MAPPING
  // ==========================================================================

  /**
   * تحويل مكافأة Gamification إلى قيود محاسبية
   * (بدون حركة نقدية - فقط platform expense مقابل wallet liability)
   */
  mapGamificationReward(params: {
    amount: number;
    userId: string;
    rewardType: string;
  }): JournalLineSpec[] {
    const { amount, userId, rewardType } = params;
    
    const dimensions = this.validateDimensions({ userId });
    
    const lines: JournalLineSpec[] = [
      {
        accountCode: ACCOUNT_CODES.GAMIFICATION_EXPENSE,
        debit: amount,
        credit: 0,
        memo: `Gamification reward: ${rewardType}`,
        dimensions,
      },
      {
        accountCode: ACCOUNT_CODES.WALLET_LIABILITY,
        debit: 0,
        credit: amount,
        memo: `Reward credit to user ${userId}`,
        dimensions,
      },
    ];
    
    this.validateBalance(lines);
    return lines;
  }

  // ==========================================================================
  // INVOICE MAPPING
  // ==========================================================================

  /**
   * تحويل إصدار فاتورة إلى قيود محاسبية
   */
  mapInvoiceIssued(params: {
    subtotal: number;
    taxTotal: number;
    total: number;
    customerId: string;
    businessId?: string;
    governorateId?: string;
    invoiceType: string;
    taxes: TaxCalculation[];
  }): JournalLineSpec[] {
    const { subtotal, taxTotal, total, customerId, businessId, governorateId, invoiceType, taxes } = params;
    
    const revenueAccount = this.getRevenueAccountForInvoiceType(invoiceType);
    const dimensions = this.validateDimensions({
      userId: customerId,
      businessId,
      governorateId,
    });
    
    const lines: JournalLineSpec[] = [];
    
    // مدين: ذمم العملاء
    lines.push({
      accountCode: ACCOUNT_CODES.CUSTOMER_RECEIVABLES,
      debit: total,
      credit: 0,
      memo: `Invoice receivable`,
      dimensions,
    });
    
    // دائن: الإيراد
    lines.push({
      accountCode: revenueAccount,
      debit: 0,
      credit: subtotal,
      memo: `${invoiceType} revenue`,
      dimensions,
    });
    
    // دائن: الضرائب
    for (const tax of taxes) {
      if (tax.taxAmount > 0) {
        lines.push({
          accountCode: tax.taxAccountCode,
          debit: 0,
          credit: tax.taxAmount,
          memo: `Tax: ${tax.taxCode}`,
          dimensions,
        });
      }
    }
    
    this.validateBalance(lines);
    return lines;
  }

  /**
   * تحويل دفع فاتورة إلى قيود محاسبية
   */
  mapInvoicePayment(params: {
    amount: number;
    paymentMethod: 'WALLET' | 'CASH' | 'BANK';
    customerId: string;
    governorateId?: string;
  }): JournalLineSpec[] {
    const { amount, paymentMethod, customerId, governorateId } = params;
    
    const dimensions = this.validateDimensions({
      userId: customerId,
      governorateId,
    });
    
    const lines: JournalLineSpec[] = [];
    
    // حسب طريقة الدفع
    if (paymentMethod === 'WALLET') {
      // الدفع من المحفظة
      lines.push({
        accountCode: ACCOUNT_CODES.WALLET_LIABILITY,
        debit: amount,
        credit: 0,
        memo: `Payment from wallet`,
        dimensions,
      });
    } else {
      // الدفع نقداً أو بنكياً
      const paymentAccount = paymentMethod === 'CASH' 
        ? ACCOUNT_CODES.CASH 
        : ACCOUNT_CODES.BANK_MAIN;
      lines.push({
        accountCode: paymentAccount,
        debit: amount,
        credit: 0,
        memo: `${paymentMethod} payment received`,
        dimensions,
      });
    }
    
    // تخفيض ذمم العملاء
    lines.push({
      accountCode: ACCOUNT_CODES.CUSTOMER_RECEIVABLES,
      debit: 0,
      credit: amount,
      memo: `Invoice payment`,
      dimensions,
    });
    
    this.validateBalance(lines);
    return lines;
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private getRevenueAccountForType(type: string): string {
    const map: Record<string, string> = {
      SUBSCRIPTION: ACCOUNT_CODES.SUBSCRIPTION_REVENUE,
      AD: ACCOUNT_CODES.ADS_REVENUE,
      SERVICE: ACCOUNT_CODES.SERVICE_REVENUE,
    };
    return map[type] || ACCOUNT_CODES.SUBSCRIPTION_REVENUE;
  }

  private getRevenueAccountForInvoiceType(type: string): string {
    const map: Record<string, string> = {
      SUBSCRIPTION: ACCOUNT_CODES.SUBSCRIPTION_REVENUE,
      AD: ACCOUNT_CODES.ADS_REVENUE,
      SERVICE: ACCOUNT_CODES.SERVICE_REVENUE,
      TOP_UP: ACCOUNT_CODES.TOPUP_FEE_REVENUE,
    };
    return map[type] || ACCOUNT_CODES.SUBSCRIPTION_REVENUE;
  }

  /**
   * الحصول على حساب الضريبة حسب النوع
   */
  getTaxAccountCode(taxType: string): string {
    const map: Record<string, string> = {
      VAT: ACCOUNT_CODES.VAT_PAYABLE,
      SALES_TAX: ACCOUNT_CODES.VAT_PAYABLE,
      PLATFORM_TAX: ACCOUNT_CODES.PLATFORM_TAX_PAYABLE,
      GOVERNORATE_TAX: ACCOUNT_CODES.GOVERNORATE_TAX_PAYABLE,
      SERVICE_TAX: ACCOUNT_CODES.PLATFORM_TAX_PAYABLE,
    };
    return map[taxType] || ACCOUNT_CODES.PLATFORM_TAX_PAYABLE;
  }

  /**
   * احتساب الضرائب على مبلغ
   */
  async calculateTaxes(
    amount: number,
    scope: string,
    governorateId?: string,
  ): Promise<TaxCalculation[]> {
    const taxes = await this.prisma.accTax.findMany({
      where: {
        isActive: true,
        OR: [
          { scope: 'ALL' as any },
          { scope: scope as any },
        ],
        ...(governorateId && { governorateId }),
      },
    });

    return taxes.map((tax) => {
      const taxableAmount = amount;
      let taxAmount: number;
      
      if (tax.isPercentage) {
        taxAmount = (taxableAmount * Number(tax.rate)) / 100;
      } else {
        taxAmount = Number(tax.rate);
      }
      
      if (tax.isInclusive) {
        // الضريبة مضمنة في السعر
        taxAmount = (taxableAmount * Number(tax.rate)) / (100 + Number(tax.rate));
      }
      
      return {
        taxId: tax.id,
        taxCode: tax.code,
        taxableAmount,
        taxAmount,
        taxAccountCode: this.getTaxAccountCode(tax.taxType),
      };
    });
  }
}
