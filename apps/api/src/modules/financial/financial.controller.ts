import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FinancialService } from './financial.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@greenpages/database';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { ApproveSettlementDto, RejectSettlementDto } from './dto/update-settlement.dto';

@ApiTags('financial')
@Controller('financial')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  // =================== AGENT BALANCE & COMMISSIONS ===================

  @Get('agent/balance')
  @Roles(UserRole.AGENT)
  @ApiOperation({ summary: 'رصيد المندوب الشامل' })
  async getAgentBalance(@Request() req) {
    return this.financialService.getAgentBalance(req.user.id);
  }

  @Get('agent/commissions')
  @Roles(UserRole.AGENT)
  @ApiOperation({ summary: 'عمولات المندوب' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'PAID', 'CANCELLED'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAgentCommissions(
    @Request() req,
    @Query('status') status?: 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED',
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.financialService.getAgentCommissions(req.user.id, { status, page, limit });
  }

  @Get('agent/collections')
  @Roles(UserRole.AGENT)
  @ApiOperation({ summary: 'الحصول على تحصيلات المندوب' })
  @ApiQuery({ name: 'status', required: false, enum: ['COLLECTED', 'SETTLED', 'VERIFIED', 'DISPUTED'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAgentCollections(
    @Request() req,
    @Query('status') status?: 'COLLECTED' | 'SETTLED' | 'VERIFIED' | 'DISPUTED',
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.financialService.getAgentCollections(req.user.id, { status, page, limit });
  }

  // =================== AGENT COLLECTIONS (Legacy) ===================

  @Post('collections')
  @Roles(UserRole.AGENT)
  @ApiOperation({ summary: 'تسجيل تحصيل جديد' })
  @ApiResponse({ status: 201, description: 'تم تسجيل التحصيل بنجاح' })
  async createCollection(@Request() req, @Body() dto: CreateCollectionDto) {
    return this.financialService.createCollection(req.user.id, dto);
  }

  @Get('collections')
  @Roles(UserRole.AGENT)
  @ApiOperation({ summary: 'الحصول على تحصيلات المندوب (legacy)' })
  @ApiQuery({ name: 'status', required: false, enum: ['COLLECTED', 'SETTLED', 'VERIFIED', 'DISPUTED'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAgentCollectionsLegacy(
    @Request() req,
    @Query('status') status?: 'COLLECTED' | 'SETTLED' | 'VERIFIED' | 'DISPUTED',
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.financialService.getAgentCollections(req.user.id, { status, page, limit });
  }

  @Get('summary')
  @Roles(UserRole.AGENT)
  @ApiOperation({ summary: 'ملخص الذمة المالية للمندوب' })
  async getAgentFinancialSummary(@Request() req) {
    return this.financialService.getAgentFinancialSummary(req.user.id);
  }

  // =================== AGENT SETTLEMENTS ===================

  @Post('settlements')
  @Roles(UserRole.AGENT)
  @ApiOperation({ summary: 'إنشاء طلب تسوية (تسليم الأموال)' })
  @ApiResponse({ status: 201, description: 'تم إنشاء طلب التسوية بنجاح' })
  async createAgentSettlement(@Request() req, @Body() dto: CreateSettlementDto) {
    return this.financialService.createAgentSettlement(req.user.id, dto);
  }

  @Get('settlements')
  @Roles(UserRole.AGENT)
  @ApiOperation({ summary: 'الحصول على تسويات المندوب' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAgentSettlements(
    @Request() req,
    @Query('status') status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED',
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.financialService.getAgentSettlements(req.user.userId, { status, page, limit });
  }

  // =================== ADMIN SETTLEMENT MANAGEMENT ===================

  @Get('settlements/pending')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.GOVERNORATE_MANAGER)
  @ApiOperation({ summary: 'الحصول على جميع التسويات المعلقة' })
  @ApiQuery({ name: 'governorateId', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAllPendingSettlements(
    @Query('governorateId') governorateId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.financialService.getAllPendingSettlements({ governorateId, page, limit });
  }

  // =================== MANAGER FINANCIALS ===================

  @Get('manager/stats')
  @Roles(UserRole.GOVERNORATE_MANAGER)
  @ApiOperation({ summary: 'إحصائيات مدير المحافظة المالية' })
  async getManagerFinancialStats(@Request() req) {
    return this.financialService.getManagerFinancialStats(req.user.userId);
  }

  @Put('settlements/:id/approve')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'اعتماد تسوية المندوب' })
  async approveAgentSettlement(
    @Request() req,
    @Param('id') settlementId: string,
    @Body() dto: ApproveSettlementDto,
  ) {
    return this.financialService.approveAgentSettlement(settlementId, req.user.userId, dto);
  }

  @Put('settlements/:id/reject')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'رفض تسوية المندوب' })
  async rejectAgentSettlement(
    @Request() req,
    @Param('id') settlementId: string,
    @Body() dto: RejectSettlementDto,
  ) {
    return this.financialService.rejectAgentSettlement(settlementId, req.user.userId, dto);
  }

  // =================== ADMIN FINANCIAL OVERVIEW ===================

  @Get('admin/overview')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'نظرة عامة مالية للمدراء' })
  async getAdminFinancialOverview() {
    return this.financialService.getAdminFinancialOverview();
  }

  @Get('admin/managers')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'الحصول على أرصدة المدراء' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getManagerBalances(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.financialService.getManagerBalances({ page, limit });
  }

  @Put('admin/managers/:managerId/commission')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'تحديث نسبة عمولة المدير' })
  async updateManagerCommission(
    @Param('managerId') managerId: string,
    @Body() body: { commissionRate: number },
  ) {
    return this.financialService.updateManagerCommission(managerId, body.commissionRate);
  }

  @Post('admin/managers/:managerId/receive-payment')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'استلام دفعة من المدير' })
  async receiveManagerPayment(
    @Request() req,
    @Param('managerId') managerId: string,
    @Body() body: { amount: number; notes?: string },
  ) {
    return this.financialService.receiveManagerPayment(managerId, body.amount, req.user.userId, body.notes);
  }

  // =================== FINANCIAL REPORTS ===================

  @Get('reports')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'تقرير مالي شامل' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'governorateId', required: false, type: String })
  async getFinancialReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('governorateId') governorateId?: string,
  ) {
    return this.financialService.getFinancialReport({ startDate, endDate, governorateId });
  }
}
