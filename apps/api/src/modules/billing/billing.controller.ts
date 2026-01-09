import { Controller, Get, Post, Param, Query, Body, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Billing Controller - واجهة API للفوترة (للمستخدمين)
 * 
 * يوفر endpoints متوافقة مع النظام القديم:
 * GET /user/accounting/invoices -> /billing/invoices
 * GET /user/accounting/invoices/:id -> /billing/invoices/:id
 * POST /user/accounting/invoices/:id/pay -> /billing/invoices/:id/pay
 */
@ApiTags('billing')
@Controller('billing')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('invoices')
  @ApiOperation({ summary: 'قائمة فواتيري' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getMyInvoices(
    @Request() req,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.billingService.getUserInvoices(req.user.userId, {
      status,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'تفاصيل فاتورة' })
  @ApiParam({ name: 'id', description: 'معرف الفاتورة' })
  async getInvoice(@Param('id') id: string) {
    return this.billingService.getInvoiceById(id);
  }

  @Get('business/:businessId/invoices')
  @ApiOperation({ summary: 'فواتير نشاط تجاري' })
  @ApiParam({ name: 'businessId', description: 'معرف النشاط' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getBusinessInvoices(
    @Param('businessId') businessId: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.billingService.getBusinessInvoices(businessId, {
      status,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Post('invoices/:id/pay')
  @ApiOperation({ summary: 'دفع فاتورة' })
  @ApiParam({ name: 'id', description: 'معرف الفاتورة' })
  async payInvoice(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { amount: number; paymentMethod?: string },
  ) {
    return this.billingService.recordPayment(
      id,
      req.user.userId,
      body.amount,
      body.paymentMethod || 'WALLET',
    );
  }
}

// ============================================================================
// LEGACY COMPATIBILITY CONTROLLER
// Maintains /user/accounting/* endpoints for frontend compatibility
// ============================================================================

@ApiTags('user-accounting')
@Controller('user/accounting')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserAccountingCompatController {
  constructor(private readonly billingService: BillingService) {}

  @Get('invoices')
  @ApiOperation({ summary: 'قائمة فواتير المستخدم (متوافق)' })
  async getMyInvoices(
    @Request() req,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.billingService.getUserInvoices(req.user.userId, {
      status,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'تفاصيل فاتورة (متوافق)' })
  async getInvoice(@Param('id') id: string) {
    return this.billingService.getInvoiceById(id);
  }

  @Post('invoices/:id/pay')
  @ApiOperation({ summary: 'دفع فاتورة (متوافق)' })
  async payInvoice(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { amount: number; paymentMethod?: string },
  ) {
    return this.billingService.recordPayment(
      id,
      req.user.userId,
      body.amount,
      body.paymentMethod || 'WALLET',
    );
  }

  @Get('business/:businessId/invoices')
  @ApiOperation({ summary: 'فواتير نشاط تجاري (متوافق)' })
  async getBusinessInvoices(
    @Param('businessId') businessId: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.billingService.getBusinessInvoices(businessId, {
      status,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get('business/:businessId/financial-summary')
  @ApiOperation({ summary: 'ملخص مالي للنشاط (متوافق)' })
  async getBusinessFinancialSummary(@Param('businessId') businessId: string) {
    const invoices = await this.billingService.getBusinessInvoices(businessId, { limit: 1000 });
    
    const totals = invoices.data.reduce(
      (acc, inv) => {
        acc.total += Number(inv.total);
        acc.paid += Number(inv.paidAmount);
        return acc;
      },
      { total: 0, paid: 0 },
    );

    return {
      invoicesCount: invoices.meta.total,
      totalAmount: totals.total,
      paidAmount: totals.paid,
      outstandingAmount: totals.total - totals.paid,
    };
  }

  @Get('payments')
  @ApiOperation({ summary: 'سجل المدفوعات (متوافق)' })
  async getPayments(@Request() req) {
    // نعيد الفواتير المدفوعة كسجل مدفوعات مبسط
    const invoices = await this.billingService.getUserInvoices(req.user.userId, {
      status: 'PAID',
      limit: 100,
    });

    return {
      data: invoices.data.map(inv => ({
        id: inv.id,
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        amount: inv.paidAmount,
        method: 'WALLET',
        paidAt: inv.paidAt,
        createdAt: inv.paidAt,
      })),
      meta: invoices.meta,
    };
  }

  @Get('journal-entries')
  @ApiOperation({ summary: 'القيود المحاسبية (تمت إزالتها)' })
  async getJournalEntries() {
    return {
      message: 'تمت إزالة نظام القيود المحاسبية. استخدم الفواتير بدلاً منها.',
      data: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
    };
  }
}
