import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, WalletStatus } from '@greenpages/database';
import {
  AdminTopUpDto,
  AdminAdjustBalanceDto,
  AdminWalletsQueryDto,
  AdminTopUpsQueryDto,
  AdminWithdrawalsQueryDto,
  ProcessTopUpDto,
  RejectTopUpDto,
  ProcessWithdrawalDto,
  RejectWithdrawalDto,
} from './dto/wallet.dto';

@ApiTags('wallet-admin')
@Controller('admin/wallet')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
@ApiBearerAuth()
export class WalletAdminController {
  constructor(private readonly walletService: WalletService) {}

  // ==========================================
  // إحصائيات عامة
  // ==========================================
  @Get('stats')
  @ApiOperation({ summary: 'إحصائيات المحافظ' })
  async getStats() {
    return this.walletService.getWalletStats();
  }

  // ==========================================
  // جميع المحافظ
  // ==========================================
  @Get('wallets')
  @ApiOperation({ summary: 'قائمة جميع المحافظ' })
  async getAllWallets(@Query() query: AdminWalletsQueryDto) {
    return this.walletService.getAllWallets(query);
  }

  // ==========================================
  // طلبات الشحن
  // ==========================================
  @Get('top-ups')
  @ApiOperation({ summary: 'طلبات الشحن' })
  async getTopUps(@Query() query: AdminTopUpsQueryDto) {
    return this.walletService.getPendingTopUps(query);
  }

  @Post('top-ups/:id/approve')
  @ApiOperation({ summary: 'الموافقة على طلب شحن' })
  async approveTopUp(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: ProcessTopUpDto,
  ) {
    return this.walletService.approveTopUp(id, req.user.id, dto.notes);
  }

  @Post('top-ups/:id/reject')
  @ApiOperation({ summary: 'رفض طلب شحن' })
  async rejectTopUp(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: RejectTopUpDto,
  ) {
    return this.walletService.rejectTopUp(id, req.user.id, dto.reason);
  }

  // ==========================================
  // طلبات السحب
  // ==========================================
  @Get('withdrawals')
  @ApiOperation({ summary: 'طلبات السحب' })
  async getWithdrawals(@Query() query: AdminWithdrawalsQueryDto) {
    return this.walletService.getPendingWithdrawals(query);
  }

  @Post('withdrawals/:id/approve')
  @ApiOperation({ summary: 'الموافقة على طلب سحب' })
  async approveWithdrawal(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: ProcessWithdrawalDto,
  ) {
    return this.walletService.approveWithdrawal(
      id,
      req.user.id,
      dto.receiptNumber,
      dto.notes,
    );
  }

  @Post('withdrawals/:id/reject')
  @ApiOperation({ summary: 'رفض طلب سحب' })
  async rejectWithdrawal(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: RejectWithdrawalDto,
  ) {
    return this.walletService.rejectWithdrawal(id, req.user.id, dto.reason);
  }

  // ==========================================
  // إضافة رصيد
  // ==========================================
  @Post('credit')
  @ApiOperation({ summary: 'إضافة رصيد لمستخدم' })
  async adminTopUp(@Request() req: any, @Body() dto: AdminTopUpDto) {
    return this.walletService.adminTopUp(req.user.id, dto);
  }

  // ==========================================
  // شحن جماعي
  // ==========================================
  @Post('bulk-credit')
  @ApiOperation({ summary: 'شحن جماعي للمستخدمين' })
  async bulkCredit(
    @Request() req: any,
    @Body() dto: {
      targetType: 'ALL' | 'GOVERNORATE';
      governorateId?: string;
      amount: number;
      description: string;
    },
  ) {
    return this.walletService.bulkCredit(req.user.id, dto);
  }

  // ==========================================
  // تعديل رصيد
  // ==========================================
  @Post('adjust')
  @ApiOperation({ summary: 'تعديل رصيد مستخدم' })
  async adjustBalance(@Request() req: any, @Body() dto: AdminAdjustBalanceDto) {
    return this.walletService.adjustBalance(req.user.id, dto);
  }

  // ==========================================
  // تغيير حالة محفظة
  // ==========================================
  @Patch('wallets/:id/status')
  @ApiOperation({ summary: 'تغيير حالة محفظة' })
  async updateWalletStatus(
    @Param('id') id: string,
    @Body('status') status: WalletStatus,
  ) {
    return this.walletService.updateWalletStatus(id, status);
  }
}
