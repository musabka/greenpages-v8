import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Query,
  Param,
  Body,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { GovernorateManagerService } from './governorate-manager.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@greenpages/database';

import { CreateAgentDto } from './dto/create-agent.dto';
import { CreateBusinessDto } from '../businesses/dto/create-business.dto';
import { UpdateBusinessDto } from '../businesses/dto/update-business.dto';

@Controller('governorate-manager')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.GOVERNORATE_MANAGER)
export class GovernorateManagerController {
  constructor(private readonly governorateManagerService: GovernorateManagerService) {}

  /**
   * لوحة التحكم الرئيسية
   */
  @Get('dashboard')
  getDashboard(@Request() req) {
    return this.governorateManagerService.getDashboard(req.user.id);
  }

  /**
   * إضافة مندوب جديد
   */
  @Post('agents')
  createAgent(
    @Request() req,
    @Body() dto: CreateAgentDto,
  ) {
    return this.governorateManagerService.createAgent(req.user.id, dto);
  }

  /**
   * الأنشطة التجارية في المحافظات
   */
  @Get('businesses')
  getBusinesses(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('governorateId') governorateId?: string,
    @Query('search') search?: string,
  ) {
    return this.governorateManagerService.getBusinesses(req.user.id, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      status,
      governorateId,
      search,
    });
  }

  /**
   * الأعمال المعلقة (بانتظار الموافقة) - MUST BE BEFORE :businessId route
   */
  @Get('businesses/pending')
  getPendingBusinesses(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.governorateManagerService.getPendingBusinesses(req.user.id, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  /**
   * عرض نشاط تجاري ضمن محافظات المدير
   */
  @Get('businesses/:businessId')
  getBusiness(
    @Request() req,
    @Param('businessId', ParseUUIDPipe) businessId: string,
  ) {
    return this.governorateManagerService.getBusiness(req.user.id, businessId);
  }

  /**
   * إنشاء نشاط تجاري ضمن محافظات المدير
   */
  @Post('businesses')
  createBusiness(
    @Request() req,
    @Body() dto: CreateBusinessDto,
  ) {
    return this.governorateManagerService.createBusiness(req.user.id, dto);
  }

  /**
   * تحديث نشاط تجاري ضمن محافظات المدير
   */
  @Put('businesses/:businessId')
  updateBusiness(
    @Request() req,
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Body() dto: UpdateBusinessDto,
  ) {
    return this.governorateManagerService.updateBusiness(req.user.id, businessId, dto);
  }

  /**
   * المندوبين التابعين
   */
  @Get('agents')
  getAgents(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.governorateManagerService.getAgents(req.user.id, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      isActive: isActive ? isActive === 'true' : undefined,
    });
  }

  /**
   * تقارير أداء المندوبين
   */
  @Get('agents/performance')
  getAgentsPerformance(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('period') period?: 'week' | 'month' | 'year',
    @Query('sortBy') sortBy?: 'businesses' | 'commissions' | 'collections',
  ) {
    return this.governorateManagerService.getAgentsPerformance(req.user.id, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      period: period || 'month',
      sortBy: sortBy || 'businesses',
    });
  }

  /**
   * تفاصيل المندوب
   */
  @Get('agents/:agentProfileId')
  getAgent(
    @Request() req,
    @Param('agentProfileId', ParseUUIDPipe) agentProfileId: string,
  ) {
    return this.governorateManagerService.getAgent(req.user.id, agentProfileId);
  }

  /**
   * تعيين مندوب لمحافظة
   */
  @Post('agents/:agentUserId/assign')
  assignAgentToGovernorate(
    @Request() req,
    @Param('agentUserId', ParseUUIDPipe) agentUserId: string,
    @Body('governorateId') governorateId: string,
  ) {
    return this.governorateManagerService.assignAgentToGovernorate(
      req.user.id,
      agentUserId,
      governorateId,
    );
  }

  /**
   * إزالة مندوب من محافظة
   */
  @Post('agents/:agentProfileId/remove')
  removeAgentFromGovernorate(
    @Request() req,
    @Param('agentProfileId', ParseUUIDPipe) agentProfileId: string,
    @Body('governorateId') governorateId: string,
  ) {
    return this.governorateManagerService.removeAgentFromGovernorate(
      req.user.id,
      agentProfileId,
      governorateId,
    );
  }

  /**
   * التجديدات
   */
  @Get('renewals')
  getRenewals(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.governorateManagerService.getRenewals(req.user.id, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      status,
    });
  }

  /**
   * تعيين مندوب لتجديد
   */
  @Patch('renewals/:renewalId/assign')
  assignRenewalToAgent(
    @Request() req,
    @Param('renewalId', ParseUUIDPipe) renewalId: string,
    @Body('agentUserId') agentUserId: string,
  ) {
    return this.governorateManagerService.assignRenewalToAgent(
      req.user.id,
      renewalId,
      agentUserId,
    );
  }

  /**
   * التقارير
   */
  @Get('reports')
  getReports(
    @Request() req,
    @Query('period') period?: 'day' | 'week' | 'month' | 'year',
  ) {
    return this.governorateManagerService.getReports(req.user.id, period);
  }

  /**
   * التسويات المعلقة ضمن محافظات المدير
   */
  @Get('financial/settlements/pending')
  getPendingSettlements(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.governorateManagerService.getPendingSettlements(req.user.id, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  /**
   * تحديث البيانات المالية للمندوب (الراتب والنسبة)
   */
  @Patch('agents/:agentProfileId/financials')
  updateAgentFinancials(
    @Request() req,
    @Param('agentProfileId', ParseUUIDPipe) agentProfileId: string,
    @Body() body: { baseSalary?: number; commissionRate?: number },
  ) {
    return this.governorateManagerService.updateAgentFinancials(
      req.user.id,
      agentProfileId,
      body,
    );
  }

  /**
   * تحديث المحافظات المخصصة للمندوب
   */
  @Patch('agents/:agentProfileId/governorates')
  updateAgentGovernorates(
    @Request() req,
    @Param('agentProfileId', ParseUUIDPipe) agentProfileId: string,
    @Body() body: { governorateIds: string[] },
  ) {
    return this.governorateManagerService.updateAgentGovernorates(
      req.user.id,
      agentProfileId,
      body.governorateIds,
    );
  }

  /**
   * الموافقة على نشاط تجاري
   */
  @Patch('businesses/:businessId/approve')
  approveBusiness(
    @Request() req,
    @Param('businessId', ParseUUIDPipe) businessId: string,
  ) {
    return this.governorateManagerService.approveBusiness(req.user.id, businessId);
  }

  /**
   * رفض نشاط تجاري
   */
  @Patch('businesses/:businessId/reject')
  rejectBusiness(
    @Request() req,
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Body('reason') reason?: string,
  ) {
    return this.governorateManagerService.rejectBusiness(req.user.id, businessId, reason);
  }
}
