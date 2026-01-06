import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole, AccJournalStatus } from '@greenpages/database';
import { AccountingService } from './accounting.service';
import { AccountingReconciliationService } from './accounting-reconciliation.service';
import {
  CreateAccountDto,
  CreateCurrencyDto,
  CreateManualJournalEntryDto,
  VoidJournalEntryDto,
} from './dto/accounting.dto';

@ApiTags('accounting-admin')
@Controller('admin/accounting')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
@ApiBearerAuth()
export class AccountingAdminController {
  constructor(
    private readonly accountingService: AccountingService,
    private readonly reconciliationService: AccountingReconciliationService,
  ) {}

  // ==========================================================================
  // HEALTH & STATS
  // ==========================================================================

  @Get('health')
  @ApiOperation({ summary: 'فحص حالة موديول المحاسبة' })
  async health() {
    return this.accountingService.health();
  }

  @Get('stats')
  @ApiOperation({ summary: 'إحصائيات النظام المحاسبي' })
  async getStats() {
    return this.accountingService.getStats();
  }

  @Get('dashboard-stats')
  @ApiOperation({ summary: 'إحصائيات لوحة تحكم المحاسب' })
  async getDashboardStats() {
    const [journalEntries, invoices, periods, recentJournalEntries, recentInvoices] = await Promise.all([
      this.accountingService.getJournalEntryStats(),
      this.accountingService.getInvoiceStats(),
      this.accountingService.getPeriodStats(),
      this.accountingService.getJournalEntries({ limit: 5 }),
      this.accountingService.getInvoices({ limit: 5 }),
    ]);

    return {
      journalEntries,
      invoices,
      periods,
      financialSummary: {
        totalRevenue: 0, // سيتم حسابه لاحقاً
        totalExpenses: 0,
        netIncome: 0,
      },
      recentJournalEntries: recentJournalEntries.data || [],
      recentInvoices: recentInvoices.data || [],
    };
  }

  // ==========================================================================
  // CURRENCIES
  // ==========================================================================

  @Get('currencies')
  @ApiOperation({ summary: 'قائمة العملات' })
  async getCurrencies() {
    return this.accountingService.getAllCurrencies();
  }

  @Post('currencies')
  @ApiOperation({ summary: 'إضافة عملة جديدة' })
  async createCurrency(@Body() dto: CreateCurrencyDto) {
    return this.accountingService.createCurrency(dto);
  }

  @Post('currencies/seed')
  @ApiOperation({ summary: 'إنشاء العملات الأساسية للنظام' })
  async seedCurrencies() {
    return this.accountingService.seedBaseCurrencies();
  }

  // ==========================================================================
  // CHART OF ACCOUNTS
  // ==========================================================================

  @Get('accounts')
  @ApiOperation({ summary: 'شجرة الحسابات' })
  async getAccounts() {
    return this.accountingService.getAllAccounts();
  }

  @Post('accounts')
  @ApiOperation({ summary: 'إضافة حساب جديد' })
  async createAccount(@Body() dto: CreateAccountDto) {
    return this.accountingService.createAccount(dto);
  }

  @Post('accounts/seed')
  @ApiOperation({ summary: 'إنشاء الحسابات الأساسية للنظام' })
  async seedAccounts() {
    return this.accountingService.seedSystemAccounts();
  }

  // ==========================================================================
  // PERIODS
  // ==========================================================================

  @Get('periods')
  @ApiOperation({ summary: 'الفترات المحاسبية' })
  async getPeriods() {
    return this.accountingService.getAllPeriods();
  }

  @Get('periods/current')
  @ApiOperation({ summary: 'الفترة المحاسبية الحالية' })
  async getCurrentPeriod() {
    return this.accountingService.getCurrentPeriod();
  }

  @Patch('periods/:id/close')
  @ApiOperation({ summary: 'إغلاق فترة محاسبية' })
  async closePeriod(@Param('id') id: string, @Request() req: any) {
    return this.accountingService.closePeriod(id, req.user.id);
  }

  // ==========================================================================
  // JOURNAL ENTRIES
  // ==========================================================================

  @Get('journal-entries')
  @ApiOperation({ summary: 'قائمة القيود المحاسبية' })
  @ApiQuery({ name: 'periodId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: AccJournalStatus })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  async getJournalEntries(
    @Query('periodId') periodId?: string,
    @Query('status') status?: AccJournalStatus,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.accountingService.getJournalEntries({
      periodId,
      status,
      dateFrom,
      dateTo,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Get('journal-entries/:id')
  @ApiOperation({ summary: 'تفاصيل قيد محاسبي' })
  async getJournalEntry(@Param('id') id: string) {
    return this.accountingService.getJournalEntryById(id);
  }

  @Post('journal-entries/manual')
  @ApiOperation({ summary: 'إنشاء قيد يدوي' })
  async createManualEntry(
    @Request() req: any,
    @Body() dto: CreateManualJournalEntryDto,
  ) {
    return this.accountingService.createManualJournalEntry(req.user.id, dto);
  }

  @Patch('journal-entries/:id/post')
  @ApiOperation({ summary: 'ترحيل قيد محاسبي' })
  async postEntry(@Param('id') id: string, @Request() req: any) {
    return this.accountingService.postJournalEntry(id, req.user.id);
  }

  @Patch('journal-entries/:id/void')
  @ApiOperation({ summary: 'إلغاء قيد محاسبي' })
  async voidEntry(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: VoidJournalEntryDto,
  ) {
    return this.accountingService.voidJournalEntry(id, req.user.id, dto.reason);
  }

  // ==========================================================================
  // REPORTS
  // ==========================================================================

  @Get('reports/trial-balance')
  @ApiOperation({ summary: 'ميزان المراجعة' })
  @ApiQuery({ name: 'periodId', required: false })
  async getTrialBalance(@Query('periodId') periodId?: string) {
    return this.accountingService.getTrialBalance(periodId);
  }

  @Get('reports/ledger/:accountCode')
  @ApiOperation({ summary: 'دفتر الأستاذ لحساب معين' })
  @ApiQuery({ name: 'periodId', required: false })
  async getLedger(
    @Param('accountCode') accountCode: string,
    @Query('periodId') periodId?: string,
  ) {
    return this.accountingService.getLedger(accountCode, periodId);
  }

  // ==========================================================================
  // INVOICES
  // ==========================================================================

  @Get('invoices')
  @ApiOperation({ summary: 'قائمة الفواتير' })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  async getInvoices(
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.accountingService.getInvoices({
      customerId,
      status,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'تفاصيل فاتورة' })
  async getInvoice(@Param('id') id: string) {
    return this.accountingService.getInvoiceById(id);
  }

  @Patch('invoices/:id/issue')
  @ApiOperation({ summary: 'إصدار فاتورة' })
  async issueInvoice(@Param('id') id: string, @Request() req: any) {
    return this.accountingService.issueInvoice(id, req.user.id);
  }

  @Patch('invoices/:id/cancel')
  @ApiOperation({ summary: 'إلغاء فاتورة' })
  async cancelInvoice(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { reason: string },
  ) {
    return this.accountingService.cancelInvoice(id, req.user.id, body.reason);
  }

  @Post('invoices/:id/payment')
  @ApiOperation({ summary: 'تسجيل دفع فاتورة' })
  async recordInvoicePayment(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { amount: number; paymentMethod: 'WALLET' | 'CASH' | 'BANK' },
  ) {
    return this.accountingService.recordInvoicePayment(id, req.user.id, body.amount, body.paymentMethod);
  }

  @Post('invoices/:id/credit-note')
  @ApiOperation({ summary: 'إنشاء إشعار دائن (استرداد)' })
  async createCreditNote(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: {
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
    },
  ) {
    return this.accountingService.createCreditNote(req.user.id, id, body);
  }

  @Patch('credit-notes/:id/issue')
  @ApiOperation({ summary: 'إصدار إشعار دائن' })
  async issueCreditNote(@Param('id') id: string, @Request() req: any) {
    return this.accountingService.issueCreditNote(id, req.user.id);
  }

  // ==========================================================================
  // RECONCILIATION - المطابقة
  // ==========================================================================

  @Get('reconcile/wallets')
  @ApiOperation({ summary: 'مطابقة جميع المحافظ مع المحاسبة' })
  async reconcileAllWallets() {
    return this.reconciliationService.reconcileAllWallets();
  }

  @Get('reconcile/wallets/:walletId')
  @ApiOperation({ summary: 'مطابقة محفظة واحدة' })
  async reconcileWallet(@Param('walletId') walletId: string) {
    return this.reconciliationService.reconcileWallet(walletId);
  }

  @Patch('reconcile/wallets/:walletId/fix')
  @ApiOperation({ summary: 'تصحيح رصيد محفظة ليطابق المحاسبة' })
  async fixWalletProjection(@Param('walletId') walletId: string) {
    return this.reconciliationService.fixWalletProjection(walletId);
  }

  @Get('reconcile/clearing-accounts')
  @ApiOperation({ summary: 'مطابقة حسابات المقاصة' })
  async reconcileClearingAccounts() {
    return this.reconciliationService.reconcileClearingAccounts();
  }

  @Get('reconcile/wallet-liability')
  @ApiOperation({ summary: 'تقرير التزامات المحافظ الإجمالي' })
  async getWalletLiabilityReport() {
    return this.reconciliationService.getWalletLiabilityReport();
  }

  // ==========================================================================
  // AUDIT LOGS
  // ==========================================================================

  @Get('audit-logs')
  @ApiOperation({ summary: 'سجلات التدقيق' })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'entityId', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getAuditLogs(
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('limit') limit?: number,
  ) {
    return this.accountingService.getAuditLogs({
      entityType,
      entityId,
      limit: limit ? Number(limit) : undefined,
    });
  }
}
