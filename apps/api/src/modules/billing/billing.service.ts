import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Billing Service - خدمة الفوترة المبسطة
 * 
 * تركز على الفواتير فقط بدون:
 * - القيود المحاسبية (Journal Entries)
 * - الحسابات (Accounts)
 * - الفترات المحاسبية (Periods)
 * - التقارير المحاسبية
 */

// DTO للاستخدام الخارجي
export interface CreateInvoiceDto {
  userId: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  businessId?: string;
  governorateId?: string;
  invoiceType: 'SUBSCRIPTION' | 'AD' | 'SERVICE' | 'CREDIT_NOTE';
  dueDate?: Date;
  notes?: string;
  notesAr?: string;
  lines: Array<{
    description: string;
    descriptionAr?: string;
    quantity?: number;
    unitPrice: number;
    taxAmount?: number;
  }>;
}

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================================
  // INVOICE MANAGEMENT
  // ============================================================================

  /**
   * إنشاء فاتورة جديدة
   */
  async createInvoice(
    userId: string,
    data: {
      customerId?: string;
      customerName: string;
      customerEmail?: string;
      customerPhone?: string;
      businessId?: string;
      governorateId?: string;
      invoiceType: 'SUBSCRIPTION' | 'AD' | 'SERVICE' | 'CREDIT_NOTE';
      dueDate?: Date;
      notes?: string;
      notesAr?: string;
      lines: Array<{
        description: string;
        descriptionAr?: string;
        quantity?: number;
        unitPrice: number;
        taxAmount?: number;
      }>;
    },
  ) {
    // توليد رقم الفاتورة
    const invoiceNumber = await this.generateInvoiceNumber();

    // حساب المجاميع
    let subtotal = new Decimal(0);
    let taxTotal = new Decimal(0);

    const lineItems = data.lines.map((line, index) => {
      const qty = new Decimal(line.quantity || 1);
      const price = new Decimal(line.unitPrice);
      const tax = new Decimal(line.taxAmount || 0);
      const lineSubtotal = qty.mul(price);
      const lineTotal = lineSubtotal.add(tax);

      subtotal = subtotal.add(lineSubtotal);
      taxTotal = taxTotal.add(tax);

      return {
        lineNumber: index + 1,
        description: line.description,
        descriptionAr: line.descriptionAr,
        quantity: qty,
        unitPrice: price,
        discountAmount: new Decimal(0),
        subtotal: lineSubtotal,
        taxAmount: tax,
        total: lineTotal,
      };
    });

    const total = subtotal.add(taxTotal);

    // الحصول على العملة الأساسية أو إنشاؤها
    let currency = await this.prisma.accCurrency.findFirst({
      where: { isBase: true },
    });

    if (!currency) {
      currency = await this.prisma.accCurrency.create({
        data: {
          code: 'SYP',
          nameAr: 'ليرة سورية',
          nameEn: 'Syrian Pound',
          symbol: 'ل.س',
          decimalPlaces: 0,
          isBase: true,
          isActive: true,
        },
      });
    }

    // إنشاء الفاتورة
    const invoice = await this.prisma.accInvoice.create({
      data: {
        invoiceNumber,
        invoiceDate: new Date(),
        dueDate: data.dueDate,
        invoiceType: data.invoiceType,
        status: 'DRAFT',
        currencyId: currency.id,
        subtotal,
        taxTotal,
        total,
        paidAmount: new Decimal(0),
        customerId: data.customerId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        businessId: data.businessId,
        governorateId: data.governorateId,
        createdById: userId,
        notes: data.notes,
        notesAr: data.notesAr,
        lines: {
          create: lineItems,
        },
      },
      include: {
        lines: true,
        currency: true,
      },
    });

    return invoice;
  }

  /**
   * إصدار الفاتورة (تغيير الحالة من DRAFT إلى ISSUED)
   */
  async issueInvoice(invoiceId: string, userId: string) {
    const invoice = await this.prisma.accInvoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException('الفاتورة غير موجودة');
    }

    if (invoice.status !== 'DRAFT') {
      throw new BadRequestException('يمكن إصدار الفواتير المسودة فقط');
    }

    return this.prisma.accInvoice.update({
      where: { id: invoiceId },
      data: {
        status: 'ISSUED',
        issuedAt: new Date(),
      },
      include: {
        lines: true,
        currency: true,
      },
    });
  }

  /**
   * تسجيل دفعة على الفاتورة
   */
  async recordPayment(
    invoiceId: string,
    userId: string,
    amount: number,
    paymentMethod: string,
  ) {
    const invoice = await this.prisma.accInvoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException('الفاتورة غير موجودة');
    }

    if (invoice.status === 'PAID' || invoice.status === 'CANCELLED') {
      throw new BadRequestException('لا يمكن الدفع على هذه الفاتورة');
    }

    const paymentAmount = new Decimal(amount);
    const newPaidAmount = invoice.paidAmount.add(paymentAmount);
    const isPaid = newPaidAmount.gte(invoice.total);

    return this.prisma.accInvoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaidAmount,
        status: isPaid ? 'PAID' : 'PARTIALLY_PAID',
        paidAt: isPaid ? new Date() : null,
      },
      include: {
        lines: true,
        currency: true,
      },
    });
  }

  /**
   * إلغاء فاتورة
   */
  async cancelInvoice(invoiceId: string, userId: string, reason?: string) {
    const invoice = await this.prisma.accInvoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException('الفاتورة غير موجودة');
    }

    if (invoice.status === 'PAID') {
      throw new BadRequestException('لا يمكن إلغاء فاتورة مدفوعة');
    }

    return this.prisma.accInvoice.update({
      where: { id: invoiceId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: reason,
      },
    });
  }

  /**
   * الحصول على فاتورة بالتفاصيل
   */
  async getInvoiceById(invoiceId: string) {
    const invoice = await this.prisma.accInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        lines: true,
        currency: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('الفاتورة غير موجودة');
    }

    return invoice;
  }

  /**
   * قائمة فواتير المستخدم
   */
  async getUserInvoices(
    userId: string,
    options: {
      status?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const { status, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where: any = {
      customerId: userId,
      status: { not: 'DRAFT' }, // لا نعرض المسودات للمستخدم
    };

    if (status) {
      where.status = status;
    }

    const [invoices, total] = await Promise.all([
      this.prisma.accInvoice.findMany({
        where,
        include: {
          lines: true,
          currency: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.accInvoice.count({ where }),
    ]);

    return {
      data: invoices,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * فواتير نشاط تجاري
   */
  async getBusinessInvoices(
    businessId: string,
    options: {
      status?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const { status, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where: any = {
      businessId,
      status: { not: 'DRAFT' },
    };

    if (status) {
      where.status = status;
    }

    const [invoices, total] = await Promise.all([
      this.prisma.accInvoice.findMany({
        where,
        include: {
          lines: true,
          currency: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.accInvoice.count({ where }),
    ]);

    return {
      data: invoices,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * جميع الفواتير (للإدارة)
   */
  async getAllInvoices(options: {
    status?: string;
    customerId?: string;
    businessId?: string;
    governorateId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  } = {}) {
    const { 
      status, 
      customerId, 
      businessId, 
      governorateId,
      dateFrom,
      dateTo,
      page = 1, 
      limit = 20 
    } = options;
    
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (businessId) where.businessId = businessId;
    if (governorateId) where.governorateId = governorateId;
    if (dateFrom || dateTo) {
      where.invoiceDate = {};
      if (dateFrom) where.invoiceDate.gte = dateFrom;
      if (dateTo) where.invoiceDate.lte = dateTo;
    }

    const [invoices, total] = await Promise.all([
      this.prisma.accInvoice.findMany({
        where,
        include: {
          lines: true,
          currency: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.accInvoice.count({ where }),
    ]);

    return {
      data: invoices,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * إحصائيات الفواتير
   */
  async getInvoiceStats() {
    const [draft, issued, partial, paid, cancelled, overdue] = await Promise.all([
      this.prisma.accInvoice.count({ where: { status: 'DRAFT' } }),
      this.prisma.accInvoice.count({ where: { status: 'ISSUED' } }),
      this.prisma.accInvoice.count({ where: { status: 'PARTIALLY_PAID' } }),
      this.prisma.accInvoice.count({ where: { status: 'PAID' } }),
      this.prisma.accInvoice.count({ where: { status: 'CANCELLED' } }),
      this.prisma.accInvoice.count({ 
        where: { 
          status: { in: ['ISSUED', 'PARTIALLY_PAID'] },
          dueDate: { lt: new Date() },
        } 
      }),
    ]);

    const totals = await this.prisma.accInvoice.aggregate({
      where: { status: { not: 'CANCELLED' } },
      _sum: {
        total: true,
        paidAmount: true,
      },
    });

    return {
      counts: {
        draft,
        issued,
        partial,
        paid,
        cancelled,
        overdue,
      },
      totals: {
        invoiced: Number(totals._sum.total || 0),
        collected: Number(totals._sum.paidAmount || 0),
        outstanding: Number((totals._sum.total || 0)) - Number((totals._sum.paidAmount || 0)),
      },
    };
  }

  // ============================================================================
  // WALLET BILLING BRIDGE
  // ============================================================================

  /**
   * دفع من المحفظة - إنشاء فاتورة وإصدارها وتسجيل الدفع
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
  }): Promise<{ invoiceId: string }> {
    const {
      userId,
      walletOwnerId,
      grossAmount,
      netAmount,
      taxAmount,
      paymentType,
      referenceName,
      governorateId,
      businessId,
      customerName,
      customerEmail,
      customerPhone,
    } = params;

    console.log('🧾 Billing: إنشاء فاتورة لدفع من المحفظة...', {
      userId,
      walletOwnerId,
      grossAmount,
      referenceName,
    });

    // 1. إنشاء الفاتورة
    const invoice = await this.createInvoice(userId, {
      customerId: walletOwnerId,
      customerName: customerName || 'عميل',
      customerEmail,
      customerPhone,
      businessId,
      governorateId,
      invoiceType: paymentType,
      dueDate: new Date(),
      notes: `Wallet payment: ${referenceName}`,
      notesAr: `دفع من المحفظة: ${referenceName}`,
      lines: [
        {
          description: referenceName,
          descriptionAr: referenceName,
          quantity: 1,
          unitPrice: netAmount,
          taxAmount: taxAmount,
        },
      ],
    });

    console.log('✅ تم إنشاء الفاتورة:', invoice.id, invoice.invoiceNumber);

    // 2. إصدار الفاتورة
    await this.issueInvoice(invoice.id, userId);
    console.log('✅ تم إصدار الفاتورة');

    // 3. تسجيل الدفع
    await this.recordPayment(invoice.id, userId, grossAmount, 'WALLET');
    console.log('✅ تم تسجيل الدفع');

    return { invoiceId: invoice.id };
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const prefix = `INV-${year}${month}-`;

    const lastInvoice = await this.prisma.accInvoice.findFirst({
      where: { invoiceNumber: { startsWith: prefix } },
      orderBy: { invoiceNumber: 'desc' },
    });

    let nextNumber = 1;
    if (lastInvoice) {
      const lastNumber = parseInt(lastInvoice.invoiceNumber.replace(prefix, ''), 10);
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(6, '0')}`;
  }
}
