import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateTopUpDto,
  CreateWithdrawalDto,
  WalletPaymentDto,
  WalletTransactionsQueryDto,
} from './dto/wallet.dto';

@ApiTags('wallet')
@Controller('wallet')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  // ==========================================
  // الرصيد الحالي
  // ==========================================
  @Get('balance')
  @ApiOperation({ summary: 'الحصول على رصيد المحفظة' })
  async getBalance(@Request() req: any) {
    return this.walletService.getBalance(req.user.id);
  }

  // ==========================================
  // سجل المعاملات
  // ==========================================
  @Get('transactions')
  @ApiOperation({ summary: 'سجل معاملات المحفظة' })
  async getTransactions(
    @Request() req: any,
    @Query() query: WalletTransactionsQueryDto,
  ) {
    return this.walletService.getTransactions(req.user.id, query);
  }

  // ==========================================
  // طلب شحن
  // ==========================================
  @Post('top-up')
  @ApiOperation({ summary: 'طلب شحن المحفظة' })
  async requestTopUp(@Request() req: any, @Body() dto: CreateTopUpDto) {
    return this.walletService.requestTopUp(req.user.id, dto);
  }

  // ==========================================
  // طلب سحب
  // ==========================================
  @Post('withdraw')
  @ApiOperation({ summary: 'طلب سحب من المحفظة' })
  async requestWithdrawal(@Request() req: any, @Body() dto: CreateWithdrawalDto) {
    return this.walletService.requestWithdrawal(req.user.id, dto);
  }

  // ==========================================
  // الدفع من المحفظة
  // ==========================================
  @Post('pay')
  @ApiOperation({ summary: 'دفع اشتراك من المحفظة' })
  async payFromWallet(@Request() req: any, @Body() dto: WalletPaymentDto) {
    console.log('🎯 WalletController.payFromWallet - استُدعي!', {
      userId: req.user.id,
      packageId: dto.packageId,
      businessId: dto.businessId,
    });
    
    const result = await this.walletService.payFromWallet(req.user.id, dto);
    
    console.log('🎯 WalletController.payFromWallet - انتهى!', {
      success: result.success,
      hasInvoiceId: !!result.accounting?.invoiceId,
      invoiceId: result.accounting?.invoiceId,
    });
    
    return result;
  }

  // ==========================================
  // سجل طلبات الشحن
  // ==========================================
  @Get('top-ups')
  @ApiOperation({ summary: 'طلبات الشحن الخاصة بي' })
  async getTopUpRequests(@Request() req: any) {
    return this.walletService.getTopUpRequests(req.user.id);
  }

  // ==========================================
  // سجل طلبات السحب
  // ==========================================
  @Get('withdrawals')
  @ApiOperation({ summary: 'طلبات السحب الخاصة بي' })
  async getWithdrawalRequests(@Request() req: any) {
    return this.walletService.getWithdrawalRequests(req.user.id);
  }
}
