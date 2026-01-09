/**
 * User Accounting Controller
 * للفواتير والمدفوعات الخاصة بالمستخدمين العاديين وأصحاب الأنشطة
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  Request,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AccountingService } from './accounting.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@greenpages/database';

@ApiTags('user-accounting')
@Controller('user/accounting')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.USER, UserRole.AGENT)
@ApiBearerAuth()
export class AccountingUserController {
  constructor(private readonly accountingService: AccountingService) {}

  // ==========================================================================
  // INVOICES - الفواتير
  // ==========================================================================

  @Get('invoices')
  @ApiOperation({ summary: 'قائمة فواتير المستخدم' })
  @ApiQuery({ name: 'status', required: false, description: 'DRAFT, ISSUED, PARTIAL, PAID, CANCELLED' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  async getMyInvoices(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    console.log('📋 AccountingUserController.getMyInvoices - استدعاء...', {
      userId: req.user.id,
      status,
      limit,
      offset,
    });
    
    const result = await this.accountingService.getUserVisibleInvoices(req.user.id, {
      status,
      limit: limit ? Number(limit) : 20,
      offset: offset ? Number(offset) : 0,
    });
    
    console.log('📋 نتيجة getInvoices:', {
      count: result.data?.length || 0,
      total: result.total,
    });
    
    return result;
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'تفاصيل فاتورة' })
  async getInvoiceById(@Request() req: any, @Param('id') id: string) {
    const invoice = await this.accountingService.getInvoiceById(id);
    
    // تحقق من أن الفاتورة خاصة بالمستخدم الحالي
    if (invoice.customerId !== req.user.id) {
      throw new BadRequestException('ليس لديك صلاحية الوصول لهذه الفاتورة');
    }

    return invoice;
  }

  @Get('invoices/:id/pdf')
  @ApiOperation({ summary: 'تنزيل فاتورة PDF' })
  async downloadInvoicePdf(@Request() req: any, @Param('id') id: string) {
    const invoice = await this.accountingService.getInvoiceById(id);
    
    // تحقق من أن الفاتورة خاصة بالمستخدم الحالي
    if (invoice.customerId !== req.user.id) {
      throw new BadRequestException('ليس لديك صلاحية تنزيل هذه الفاتورة');
    }

    // إرجاع بيانات الفاتورة للـ Frontend لإنشاء PDF
    // TODO: إنشاء PDF فعلي في الـ Backend
    return {
      success: true,
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName,
        customerEmail: invoice.customerEmail,
        customerPhone: invoice.customerPhone,
        invoiceType: invoice.invoiceType,
        status: invoice.status,
        total: invoice.total,
        paidAmount: invoice.paidAmount,
        issuedAt: invoice.issuedAt,
        paidAt: invoice.paidAt,
        lines: invoice.lines,
        createdAt: invoice.createdAt,
      },
    };
  }

  @Post('invoices/:id/pay')
  @ApiOperation({ summary: 'دفع فاتورة من المحفظة' })
  @ApiQuery({ name: 'amount', required: false, description: 'المبلغ المراد دفعه (للدفع الجزئي)' })
  async payInvoiceFromWallet(
    @Request() req: any,
    @Param('id') id: string,
    @Query('amount') amount?: string,
  ) {
    const invoice = await this.accountingService.getInvoiceById(id);
    
    // تحقق من أن الفاتورة خاصة بالمستخدم الحالي
    if (invoice.customerId !== req.user.id) {
      throw new BadRequestException('ليس لديك صلاحية دفع هذه الفاتورة');
    }

    const paymentAmount = amount ? Number(amount) : (Number(invoice.total) - Number(invoice.paidAmount));
    
    return this.accountingService.recordInvoicePayment(
      id,
      req.user.id,
      paymentAmount,
      'WALLET',
    );
  }

  // ==========================================================================
  // BUSINESS INVOICES - فواتير النشاط التجاري
  // ==========================================================================

  @Get('business/:businessId/invoices')
  @ApiOperation({ summary: 'قائمة فواتير نشاط تجاري معين' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  async getBusinessInvoices(
    @Request() req: any,
    @Param('businessId') businessId: string,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    // TODO: التحقق من صلاحيات المستخدم للنشاط التجاري
    const invoices = await this.accountingService.getInvoices({
      customerId: req.user.id,
      status,
      limit: limit ? Number(limit) : 20,
      offset: offset ? Number(offset) : 0,
    });
    
    // Filter by businessId manually
    const filtered = invoices.data.filter(inv => inv.businessId === businessId);
    return { data: filtered, total: filtered.length };
  }

  @Get('business/:businessId/financial-summary')
  @ApiOperation({ summary: 'ملخص مالي لنشاط تجاري' })
  async getBusinessFinancialSummary(
    @Request() req: any,
    @Param('businessId') businessId: string,
  ) {
    // TODO: التحقق من صلاحيات المستخدم للنشاط التجاري
    
    const result = await this.accountingService.getInvoices({
      customerId: req.user.id,
    });
    
    // Filter by businessId
    const invoices = result.data.filter(inv => inv.businessId === businessId);

    const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.paidAmount), 0);
    const totalPending = invoices.filter(inv => inv.status === 'PAID' || inv.status === 'PARTIALLY_PAID')
      .reduce((sum, inv) => sum + (Number(inv.total) - Number(inv.paidAmount)), 0);

    return {
      totalInvoices: invoices.length,
      totalInvoiced,
      totalPaid,
      totalPending,
      invoices: invoices.slice(0, 10), // آخر 10 فواتير
    };
  }

  // ==========================================================================
  // JOURNAL ENTRIES - القيود المحاسبية
  // ==========================================================================

  @Get('journal-entries')
  @ApiOperation({ summary: 'القيود المحاسبية المرتبطة بحساب المستخدم' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  async getMyJournalEntries(
    @Request() req: any,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    // جلب القيود المرتبطة بالمستخدم من خلال sourceModule = WALLET أو INVOICING
    const entries = await this.accountingService.getJournalEntries({
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
    });

    // Filter entries related to this user
    // TODO: يجب إضافة فلتر أفضل في قاعدة البيانات
    const filteredEntries = entries.data.filter(entry => {
      // إذا كان القيد من WALLET أو INVOICING، تحقق من أنه مرتبط بالمستخدم
      if (entry.metadata && typeof entry.metadata === 'object') {
        const metadata = entry.metadata as any;
        return metadata.walletOwnerId === req.user.id || 
               metadata.customerId === req.user.id;
      }

      // Fallback: بعض القيود قد لا تحتوي metadata، لكن تحتوي dimensions على مستوى السطور
      if (Array.isArray((entry as any).lines)) {
        return (entry as any).lines.some((line: any) => {
          const dims = line?.dimensions;
          return dims && typeof dims === 'object' && (dims as any).userId === req.user.id;
        });
      }

      return false;
    });

    return {
      data: filteredEntries,
      total: filteredEntries.length,
    };
  }

  // ==========================================================================
  // PAYMENT HISTORY - سجل المدفوعات
  // ==========================================================================

  @Get('payments')
  @ApiOperation({ summary: 'سجل مدفوعات المستخدم' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  async getMyPayments(
    @Request() req: any,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    // سيتم ربطه مع WalletTransaction من نوع PAYMENT
    return {
      message: 'سيتم التنفيذ قريباً - Payment History',
      userId: req.user.id,
    };
  }
}
