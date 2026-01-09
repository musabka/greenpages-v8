import { Controller, Get, Post, Put, Param, Query, Body, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { BillingService, CreateInvoiceDto } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

/**
 * Billing Admin Controller - واجهة API للفوترة (للمشرفين)
 * 
 * يوفر endpoints متوافقة مع النظام القديم:
 * GET /admin/accounting/invoices -> /admin/billing/invoices
 * POST /admin/accounting/invoices -> /admin/billing/invoices
 * PUT /admin/accounting/invoices/:id/issue -> /admin/billing/invoices/:id/issue
 */
@ApiTags('admin-billing')
@Controller('admin/billing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class BillingAdminController {
  constructor(private readonly billingService: BillingService) {}

  @Get('invoices')
  @ApiOperation({ summary: 'جميع الفواتير' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'businessId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAllInvoices(
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
    @Query('businessId') businessId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.billingService.getAllInvoices({
      status,
      customerId,
      businessId,
      dateFrom: startDate ? new Date(startDate) : undefined,
      dateTo: endDate ? new Date(endDate) : undefined,
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

  @Post('invoices')
  @ApiOperation({ summary: 'إنشاء فاتورة جديدة' })
  async createInvoice(@Request() req: any, @Body() dto: CreateInvoiceDto) {
    return this.billingService.createInvoice(dto.userId || req.user?.userId, dto);
  }

  @Put('invoices/:id/issue')
  @ApiOperation({ summary: 'إصدار فاتورة' })
  @ApiParam({ name: 'id', description: 'معرف الفاتورة' })
  async issueInvoice(@Request() req: any, @Param('id') id: string) {
    return this.billingService.issueInvoice(id, req.user?.userId);
  }

  @Post('invoices/:id/payment')
  @ApiOperation({ summary: 'تسجيل دفعة على فاتورة' })
  @ApiParam({ name: 'id', description: 'معرف الفاتورة' })
  async recordPayment(
    @Param('id') id: string,
    @Body() body: { userId: string; amount: number; paymentMethod?: string },
  ) {
    return this.billingService.recordPayment(
      id,
      body.userId,
      body.amount,
      body.paymentMethod || 'MANUAL',
    );
  }

  @Put('invoices/:id/cancel')
  @ApiOperation({ summary: 'إلغاء فاتورة' })
  @ApiParam({ name: 'id', description: 'معرف الفاتورة' })
  async cancelInvoice(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.billingService.cancelInvoice(id, req.user?.userId, body.reason);
  }

  @Get('stats')
  @ApiOperation({ summary: 'إحصائيات الفواتير' })
  async getStats() {
    return this.billingService.getInvoiceStats();
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'لوحة التحكم المالية' })
  async getDashboard() {
    const stats = await this.billingService.getInvoiceStats();
    const recentInvoices = await this.billingService.getAllInvoices({ limit: 10 });
    const pendingInvoices = await this.billingService.getAllInvoices({ 
      status: 'ISSUED', 
      limit: 10 
    });

    return {
      stats,
      recentInvoices: recentInvoices.data,
      pendingInvoices: pendingInvoices.data,
    };
  }
}

// ============================================================================
// LEGACY COMPATIBILITY CONTROLLER
// Maintains /admin/accounting/* endpoints for frontend compatibility
// ============================================================================

@ApiTags('admin-accounting')
@Controller('admin/accounting')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminAccountingCompatController {
  constructor(private readonly billingService: BillingService) {}

  @Get('invoices')
  @ApiOperation({ summary: 'جميع الفواتير (متوافق)' })
  async getAllInvoices(
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
    @Query('businessId') businessId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.billingService.getAllInvoices({
      status,
      customerId,
      businessId,
      dateFrom: startDate ? new Date(startDate) : undefined,
      dateTo: endDate ? new Date(endDate) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'تفاصيل فاتورة (متوافق)' })
  async getInvoice(@Param('id') id: string) {
    return this.billingService.getInvoiceById(id);
  }

  @Post('invoices')
  @ApiOperation({ summary: 'إنشاء فاتورة جديدة (متوافق)' })
  async createInvoice(@Request() req: any, @Body() dto: CreateInvoiceDto) {
    return this.billingService.createInvoice(dto.userId || req.user?.userId, dto);
  }

  @Put('invoices/:id/issue')
  @ApiOperation({ summary: 'إصدار فاتورة (متوافق)' })
  async issueInvoice(@Request() req: any, @Param('id') id: string) {
    return this.billingService.issueInvoice(id, req.user?.userId);
  }

  @Post('invoices/:id/payment')
  @ApiOperation({ summary: 'تسجيل دفعة على فاتورة (متوافق)' })
  async recordPayment(
    @Param('id') id: string,
    @Body() body: { userId: string; amount: number; paymentMethod?: string },
  ) {
    return this.billingService.recordPayment(
      id,
      body.userId,
      body.amount,
      body.paymentMethod || 'MANUAL',
    );
  }

  @Put('invoices/:id/cancel')
  @ApiOperation({ summary: 'إلغاء فاتورة (متوافق)' })
  async cancelInvoice(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.billingService.cancelInvoice(id, req.user?.userId, body.reason);
  }

  @Get('stats')
  @ApiOperation({ summary: 'إحصائيات الفواتير (متوافق)' })
  async getStats() {
    return this.billingService.getInvoiceStats();
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'لوحة التحكم المالية (متوافق)' })
  async getDashboard() {
    const stats = await this.billingService.getInvoiceStats();
    const recentInvoices = await this.billingService.getAllInvoices({ limit: 10 });
    const pendingInvoices = await this.billingService.getAllInvoices({ 
      status: 'ISSUED', 
      limit: 10 
    });

    return {
      stats,
      recentInvoices: recentInvoices.data,
      pendingInvoices: pendingInvoices.data,
    };
  }

  @Get('accounts')
  @ApiOperation({ summary: 'الحسابات المحاسبية (تمت إزالتها)' })
  async getAccounts() {
    return {
      message: 'تمت إزالة نظام الحسابات المحاسبية. استخدم الفواتير بدلاً منها.',
      data: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
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

  @Get('ledger')
  @ApiOperation({ summary: 'دفتر الأستاذ (تمت إزالته)' })
  async getLedger() {
    return {
      message: 'تم إزالة دفتر الأستاذ. استخدم الفواتير بدلاً منها.',
      data: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
    };
  }

  @Get('trial-balance')
  @ApiOperation({ summary: 'ميزان المراجعة (تمت إزالته)' })
  async getTrialBalance() {
    return {
      message: 'تم إزالة ميزان المراجعة. استخدم إحصائيات الفواتير بدلاً منها.',
      data: null,
    };
  }

  @Get('financial-reports')
  @ApiOperation({ summary: 'التقارير المالية (تمت إزالتها)' })
  async getFinancialReports() {
    const stats = await this.billingService.getInvoiceStats();
    return {
      message: 'تم تبسيط التقارير المالية.',
      data: stats,
    };
  }

  @Get('currencies')
  @ApiOperation({ summary: 'العملات (متوافق)' })
  async getCurrencies() {
    return {
      data: [
        {
          id: 'default',
          code: 'SYP',
          name: 'ليرة سورية',
          symbol: 'ل.س',
          decimalPlaces: 0,
          isDefault: true,
          isActive: true,
        },
      ],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    };
  }
}
