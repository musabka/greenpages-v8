import { Injectable } from '@nestjs/common';
import { BillingService } from '../billing/billing.service';

/**
 * WalletBillingBridge - جسر المحفظة والفوترة المبسط
 * 
 * هذا الجسر يحل محل WalletAccountingBridge القديم
 * ويركز فقط على إنشاء الفواتير وتسجيل المدفوعات
 * 
 * تم إزالة:
 * - القيود المحاسبية (Journal Entries)
 * - نظام الحسابات المحاسبية
 * - Policy Service
 * 
 * الآن يركز فقط على:
 * - إنشاء فواتير للمدفوعات
 * - تسجيل المدفوعات على الفواتير
 */
@Injectable()
export class WalletBillingBridge {
  constructor(private readonly billingService: BillingService) {}

  /**
   * تسجيل عملية شحن محفظة (إيداع)
   * لا نحتاج لإنشاء فاتورة للشحن - فقط سجل
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
    // الشحن لا يحتاج فاتورة - السجل موجود في WalletTopUp
    console.log('📥 شحن محفظة مسجل:', {
      topUpId: params.topUpId,
      amount: params.amount,
      method: params.method,
    });
  }

  /**
   * تسجيل عملية دفع من المحفظة (اشتراك / إعلان)
   * 
   * يتم إنشاء فاتورة للعميل تلقائياً
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
  }): Promise<{ invoiceId: string }> {
    const {
      userId,
      paymentId,
      walletId,
      walletOwnerId,
      netAmount,
      taxAmount,
      grossAmount,
      paymentType,
      referenceId,
      referenceName,
      governorateId,
      businessId,
      customerName,
      customerEmail,
      customerPhone,
    } = params;

    console.log('🧾 بدء إنشاء فاتورة...', {
      walletOwnerId,
      grossAmount,
      netAmount,
      referenceName,
    });

    try {
      // استخدام BillingService لإنشاء الفاتورة وتسجيل الدفع
      const result = await this.billingService.recordWalletPayment({
        userId: walletOwnerId,
        paymentId: paymentId,
        walletId: walletId,
        walletOwnerId: walletOwnerId,
        grossAmount,
        taxAmount,
        netAmount,
        paymentType,
        referenceId: paymentId,
        referenceName,
        businessId,
        customerName: customerName || 'عميل',
        customerEmail,
        customerPhone,
      });

      console.log('✅ تم إنشاء الفاتورة ودفعها:', result.invoiceId);

      return {
        invoiceId: result.invoiceId,
      };
    } catch (error) {
      console.error('❌ فشل في إنشاء الفاتورة:', error);
      throw error;
    }
  }

  /**
   * تسجيل عمولة مندوب
   * لا نحتاج لقيود محاسبية - السجل موجود في Commission
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
    console.log('💰 عمولة مندوب مسجلة:', {
      commissionId: params.commissionId,
      agentId: params.agentId,
      amount: params.amount,
    });
  }

  /**
   * تسجيل تسوية مستحقات مندوب (الدفع)
   * لا نحتاج لقيود محاسبية - السجل موجود في AgentSettlement
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
    console.log('📤 تسوية مندوب مسجلة:', {
      settlementId: params.settlementId,
      agentId: params.agentId,
      amount: params.amount,
      method: params.method,
    });
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

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
