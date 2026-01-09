import { Injectable } from '@nestjs/common';
import { AccountingService } from '../accounting/accounting.service';
import { AccountingPolicyService, ACCOUNT_CODES } from '../accounting/accounting-policy.service';
import { AccSourceModule } from '@greenpages/database';

/**
 * WalletAccountingBridge
 * 
 * هذا الجسر مسؤول عن ترجمة أحداث المحفظة إلى قيود محاسبية
 * كل حدث مالي في المحفظة يجب أن يمر عبر هذا الجسر
 * 
 * القاعدة الذهبية: أي كود لا يمر عبر Accounting هو خطر على النظام بالكامل
 * 
 * التحديث: يستخدم الآن AccountingPolicyService للحصول على القيود
 */
@Injectable()
export class WalletAccountingBridge {
  constructor(
    private readonly accountingService: AccountingService,
    private readonly policyService: AccountingPolicyService,
  ) {}

  /**
   * تسجيل عملية شحن محفظة (إيداع)
   * 
   * القيد:
   *   مدين: CASH_CLEARING أو BANK_CLEARING (حسب طريقة الشحن)
   *   دائن: WALLET_LIABILITY (التزام تجاه العميل)
   */
  async recordTopUpApproval(params: {
    userId: string;
    topUpId: string;
    walletId: string;
    amount: number;
    method: string;
    walletOwnerId: string;
    governorateId?: string;
    agentProfileId?: string;
  }): Promise<void> {
    const { userId, topUpId, walletId, amount, method, walletOwnerId, governorateId, agentProfileId } = params;

    // استخدام Policy Service للحصول على القيود
    const lines = this.policyService.mapTopUpApproval({
      amount,
      method,
      walletOwnerId,
      governorateId,
      agentProfileId,
    });

    // التحقق من التوازن
    this.policyService.validateBalance(lines);

    await this.accountingService.createJournalEntry(userId, {
      description: `Wallet top-up via ${method}`,
      descriptionAr: `شحن محفظة عبر ${this.getMethodNameAr(method)}`,
      sourceModule: AccSourceModule.WALLET,
      sourceEventId: `TOPUP-APPROVED-${topUpId}`,
      sourceEntityType: 'WalletTopUp',
      sourceEntityId: topUpId,
      lines: lines.map(line => ({
        ...line,
        dimensions: line.dimensions as Record<string, string | undefined>,
      })),
      metadata: {
        walletId,
        walletOwnerId,
        topUpId,
        method,
        governorateId,
        agentProfileId,
      },
      autoPost: true,
    });
  }

  /**
   * تسجيل عملية دفع من المحفظة (اشتراك / إعلان)
   *
   * القيد:
   *   مدين: WALLET_LIABILITY (تخفيض الالتزام)
   *   دائن: SUBSCRIPTION_REVENUE أو ADS_REVENUE (إيراد)
   *
   * إذا كانت هناك ضريبة:
   *   دائن إضافي: PLATFORM_TAX_PAYABLE
   *
   * يتم أيضاً إنشاء فاتورة للعميل تلقائياً
   */
  async recordWalletPayment(params: {
    userId: string;
    paymentId: string;
    walletId: string;
    walletOwnerId: string;
    grossAmount: number;
    taxAmount: number;
    netAmount: number;
    paymentType: 'SUBSCRIPTION' | 'AD' | 'SERVICE';
    referenceId: string;
    referenceName: string;
    governorateId?: string;
    businessId?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    taxId?: string;
  }): Promise<{ journalEntryId: string; invoiceId: string }> {
    const {
      userId,
      paymentId,
      walletId,
      walletOwnerId,
      grossAmount,
      taxAmount,
      netAmount,
      paymentType,
      referenceId,
      referenceName,
      governorateId,
      businessId,
      customerName,
      customerEmail,
      customerPhone,
      taxId,
    } = params;

    console.log('🧾 بدء إنشاء فاتورة...', {
      userId,
      paymentId,
      walletOwnerId,
      grossAmount,
      netAmount,
      referenceName,
    });

    try {
      // 1️⃣ إنشاء الفاتورة أولاً
      console.log('📝 إنشاء فاتورة...');
      const invoice = await this.accountingService.createInvoice(userId, {
        customerId: walletOwnerId,
        customerName: customerName || 'عميل',
        customerEmail,
        customerPhone,
        businessId,
        invoiceType: 'SUBSCRIPTION',
        dueDate: new Date(), // مستحق فوراً
        notes: `Payment via wallet for ${referenceName}`,
        notesAr: `دفع عبر المحفظة: ${referenceName}`,
        lines: [
          {
            description: referenceName,
            descriptionAr: referenceName,
            quantity: 1,
            unitPrice: netAmount,
            taxId: taxId || undefined,
          },
        ],
      });

      console.log('✅ تم إنشاء الفاتورة:', invoice.id, invoice.invoiceNumber);

      // 2️⃣ إصدار الفاتورة مباشرةً (تغيير الحالة من DRAFT إلى ISSUED وإنشاء القيد)
      console.log('📤 إصدار الفاتورة...');
      const issuedInvoice = await this.accountingService.issueInvoice(invoice.id, userId);
      console.log('✅ تم إصدار الفاتورة، القيد المحاسبي:', issuedInvoice.journalEntryId);

      // 3️⃣ تسجيل الدفع مباشرةً (الفاتورة مدفوعة بالكامل)
      console.log('💰 تسجيل دفع الفاتورة...');
      await this.accountingService.recordInvoicePayment(
        invoice.id,
        userId,
        grossAmount,
        'WALLET',
      );

      console.log('✅ تم تسجيل الدفع بنجاح');

      return {
        journalEntryId: issuedInvoice.journalEntryId || '',
        invoiceId: issuedInvoice.id,
      };
    } catch (error) {
      console.error('❌ فشل في إنشاء الفاتورة والقيد المحاسبي:', error);
      console.error('تفاصيل الخطأ:', error instanceof Error ? error.message : error);
      console.error('Stack:', error instanceof Error ? error.stack : 'No stack');
      throw error; // نعيد رمي الخطأ ليتم التعامل معه في المستوى الأعلى
    }
  }

  /**
   * تسجيل عمولة مندوب
   * 
   * القيد:
   *   مدين: COMMISSIONS_EXPENSE (مصروف عمولات)
   *   دائن: AGENT_PAYABLE (مستحق للمندوب)
   */
  async recordAgentCommission(params: {
    userId: string;
    commissionId: string;
    agentId: string;
    agentProfileId: string;
    amount: number;
    sourceType: string;
    sourceId: string;
    businessId?: string;
    governorateId?: string;
  }): Promise<void> {
    const { userId, commissionId, agentId, agentProfileId, amount, sourceType, sourceId, businessId, governorateId } = params;

    // استخدام Policy Service للحصول على القيود
    const lines = this.policyService.mapCommissionEarned({
      amount,
      agentProfileId,
      businessId,
      governorateId,
    });

    await this.accountingService.createJournalEntry(userId, {
      description: `Agent commission earned`,
      descriptionAr: `عمولة مندوب مستحقة`,
      sourceModule: AccSourceModule.COMMISSIONS,
      sourceEventId: `COMMISSION-EARNED-${commissionId}`,
      sourceEntityType: 'Commission',
      sourceEntityId: commissionId,
      lines: lines.map(line => ({
        ...line,
        dimensions: line.dimensions as Record<string, string | undefined>,
      })),
      metadata: {
        agentId,
        agentProfileId,
        sourceType,
        sourceId,
        businessId,
        governorateId,
      },
      autoPost: true,
    });
  }

  /**
   * تسجيل تسوية مستحقات مندوب (الدفع)
   * 
   * القيد:
   *   مدين: AGENT_PAYABLE (تخفيض الالتزام)
   *   دائن: CASH أو BANK (تم الدفع)
   */
  async recordAgentSettlement(params: {
    userId: string;
    settlementId: string;
    agentId: string;
    agentProfileId: string;
    amount: number;
    method: 'CASH' | 'BANK';
    governorateId?: string;
  }): Promise<void> {
    const { userId, settlementId, agentId, agentProfileId, amount, method, governorateId } = params;

    // استخدام Policy Service للحصول على القيود
    const lines = this.policyService.mapCommissionPayment({
      amount,
      agentProfileId,
      paymentMethod: method,
      governorateId,
    });

    await this.accountingService.createJournalEntry(userId, {
      description: `Agent settlement payment`,
      descriptionAr: `دفع مستحقات مندوب`,
      sourceModule: AccSourceModule.COMMISSIONS,
      sourceEventId: `SETTLEMENT-${settlementId}`,
      sourceEntityType: 'AgentSettlement',
      sourceEntityId: settlementId,
      lines: lines.map(line => ({
        ...line,
        dimensions: line.dimensions as Record<string, string | undefined>,
      })),
      metadata: {
        agentId,
        agentProfileId,
        method,
        governorateId,
      },
      autoPost: true,
    });
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private getClearingAccountForMethod(method: string): string {
    const map: Record<string, string> = {
      CASH: '1100',           // CASH_CLEARING
      BANK_TRANSFER: '1110',  // BANK_CLEARING
      CREDIT_CARD: '1110',    // BANK_CLEARING
      SYRIATEL_CASH: '1120',  // MOBILE_MONEY_CLEARING
      MTN_CASH: '1120',       // MOBILE_MONEY_CLEARING
      ADMIN: '1100',          // Admin direct = CASH
    };
    return map[method] || '1100';
  }

  private getRevenueAccountForType(type: string): string {
    const map: Record<string, string> = {
      SUBSCRIPTION: '4100', // SUBSCRIPTION_REVENUE
      AD: '4200',           // ADS_REVENUE
      SERVICE: '4300',      // SERVICES_REVENUE
    };
    return map[type] || '4100';
  }

  private getMethodNameAr(method: string): string {
    const map: Record<string, string> = {
      CASH: 'نقداً',
      BANK_TRANSFER: 'حوالة بنكية',
      CREDIT_CARD: 'بطاقة ائتمانية',
      SYRIATEL_CASH: 'سيريتل كاش',
      MTN_CASH: 'MTN كاش',
      ADMIN: 'شحن مباشر',
    };
    return map[method] || method;
  }

  private getPaymentTypeNameAr(type: string): string {
    const map: Record<string, string> = {
      SUBSCRIPTION: 'اشتراك',
      AD: 'إعلان',
      SERVICE: 'خدمة',
    };
    return map[type] || type;
  }
}
