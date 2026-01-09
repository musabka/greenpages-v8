import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { FinancialSettlementsService } from './financial-settlements.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@greenpages/database';
import { 
  CreateAgentFinancialSettlementDto, 
  ConfirmAgentSettlementDto,
  CreateManagerFinancialSettlementDto,
  ConfirmManagerSettlementDto 
} from './dto/create-financial-settlement.dto';

@ApiTags('financial-settlements')
@Controller('financial-settlements')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FinancialSettlementsController {
  constructor(private readonly settlementsService: FinancialSettlementsService) {}

  // =================== AGENT SETTLEMENTS ===================

  @Post('agent')
  @Roles(UserRole.GOVERNORATE_MANAGER)
  @ApiOperation({ summary: 'إنشاء تسوية مالية جديدة للمندوب' })
  @ApiResponse({ status: 201, description: 'تم إنشاء التسوية بنجاح' })
  async createAgentSettlement(@Request() req, @Body() dto: CreateAgentFinancialSettlementDto) {
    return this.settlementsService.createAgentSettlement(req.user.userId, dto);
  }

  @Put('agent/:id/confirm')
  @Roles(UserRole.GOVERNORATE_MANAGER)
  @ApiOperation({ summary: 'تأكيد التسوية من قبل مدير المحافظة' })
  @ApiParam({ name: 'id', description: 'معرف التسوية' })
  async confirmAgentSettlement(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: ConfirmAgentSettlementDto,
  ) {
    return this.settlementsService.confirmAgentSettlementByManager(id, req.user.userId, dto);
  }

  @Get('agent/my-settlements')
  @Roles(UserRole.AGENT)
  @ApiOperation({ summary: 'الحصول على تسوياتي كمندوب' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getMyAgentSettlements(
    @Request() req,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.settlementsService.getAgentSettlements(req.user.userId, { status, page, limit });
  }

  @Get('agent/my-summary')
  @Roles(UserRole.AGENT)
  @ApiOperation({ summary: 'ملخص تسوياتي كمندوب' })
  async getMyAgentSettlementsSummary(@Request() req) {
    return this.settlementsService.getAgentSettlementsSummary(req.user.userId);
  }

  @Get('agent/manager-view')
  @Roles(UserRole.GOVERNORATE_MANAGER)
  @ApiOperation({ summary: 'الحصول على تسويات المندوبين (لمدير المحافظة)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAgentSettlementsByManager(
    @Request() req,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.settlementsService.getAgentSettlementsByManager(req.user.userId, { status, page, limit });
  }

  @Get('agent/:id')
  @Roles(UserRole.AGENT, UserRole.GOVERNORATE_MANAGER, UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'تفاصيل تسوية المندوب' })
  @ApiParam({ name: 'id', description: 'معرف التسوية' })
  async getAgentSettlementById(@Param('id') id: string) {
    return this.settlementsService.getSettlementById(id);
  }

  @Delete('agent/:id')
  @Roles(UserRole.GOVERNORATE_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'إلغاء تسوية المندوب' })
  @ApiParam({ name: 'id', description: 'معرف التسوية' })
  async cancelAgentSettlement(@Request() req, @Param('id') id: string) {
    return this.settlementsService.cancelSettlement(id, 'agent', req.user.userId);
  }

  // =================== MANAGER SETTLEMENTS ===================

  @Post('manager/:managerId')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'إنشاء تسوية مالية لمدير المحافظة' })
  @ApiParam({ name: 'managerId', description: 'معرف ملف مدير المحافظة' })
  @ApiResponse({ status: 201, description: 'تم إنشاء التسوية بنجاح' })
  async createManagerSettlement(
    @Request() req,
    @Param('managerId') managerId: string,
    @Body() dto: CreateManagerFinancialSettlementDto,
  ) {
    return this.settlementsService.createManagerSettlement(req.user.userId, managerId, dto);
  }

  @Put('manager/:id/confirm')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'تأكيد تسوية المدير من قبل المدير العام' })
  @ApiParam({ name: 'id', description: 'معرف التسوية' })
  async confirmManagerSettlement(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: ConfirmManagerSettlementDto,
  ) {
    return this.settlementsService.confirmManagerSettlementByAdmin(id, req.user.userId, dto);
  }

  @Get('manager/my-settlements')
  @Roles(UserRole.GOVERNORATE_MANAGER)
  @ApiOperation({ summary: 'الحصول على تسوياتي كمدير محافظة' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getMyManagerSettlements(
    @Request() req,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.settlementsService.getManagerSettlements(req.user.userId, { status, page, limit });
  }

  @Get('manager/all')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'الحصول على جميع تسويات المدراء' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAllManagerSettlements(
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.settlementsService.getAllManagerSettlements({ status, page, limit });
  }

  @Get('manager/:id')
  @Roles(UserRole.GOVERNORATE_MANAGER, UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'تفاصيل تسوية المدير' })
  @ApiParam({ name: 'id', description: 'معرف التسوية' })
  async getManagerSettlementById(@Param('id') id: string) {
    return this.settlementsService.getManagerSettlementById(id);
  }

  @Delete('manager/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'إلغاء تسوية المدير' })
  @ApiParam({ name: 'id', description: 'معرف التسوية' })
  async cancelManagerSettlement(@Request() req, @Param('id') id: string) {
    return this.settlementsService.cancelSettlement(id, 'manager', req.user.userId);
  }
}
