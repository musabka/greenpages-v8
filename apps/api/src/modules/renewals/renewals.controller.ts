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
import { RenewalsService } from './renewals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RenewalStatus, UserRole } from '@prisma/client';
import {
  CreateRenewalRecordDto,
  UpdateRenewalStatusDto,
  CreateRenewalContactDto,
  ProcessDecisionDto,
  AssignAgentDto,
  BulkAssignAgentDto,
} from './dto';

@Controller('renewals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RenewalsController {
  constructor(private readonly renewalsService: RenewalsService) {}

  // ============================================
  // Admin Endpoints
  // ============================================

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async findAll(
    @Query('status') status?: RenewalStatus,
    @Query('agentId') agentId?: string,
    @Query('priority') priority?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.renewalsService.findAll({
      status,
      agentId,
      priority: priority ? parseInt(priority) : undefined,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async getStatistics(@Query('agentId') agentId?: string) {
    return this.renewalsService.getStatistics(agentId);
  }

  @Get('agent/:agentId/performance')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async getAgentPerformance(
    @Param('agentId') agentId: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.renewalsService.getAgentPerformance(
      agentId,
      fromDate ? new Date(fromDate) : undefined,
      toDate ? new Date(toDate) : undefined,
    );
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async create(@Body() dto: CreateRenewalRecordDto) {
    return this.renewalsService.create(dto);
  }

  @Patch(':id/assign')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async assignAgent(@Param('id') id: string, @Body() dto: AssignAgentDto) {
    return this.renewalsService.assignAgent(id, dto);
  }

  @Patch('bulk-assign')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async bulkAssignAgent(@Body() dto: BulkAssignAgentDto) {
    return this.renewalsService.bulkAssignAgent(dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.AGENT)
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateRenewalStatusDto) {
    return this.renewalsService.updateStatus(id, dto);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.AGENT)
  async findOne(@Param('id') id: string) {
    return this.renewalsService.findOne(id);
  }

  // ============================================
  // Agent Endpoints (Mobile App Ready)
  // ============================================

  @Get('my/assignments')
  @Roles(UserRole.AGENT)
  async getMyAssignments(
    @Request() req: any,
    @Query('status') status?: RenewalStatus,
  ) {
    return this.renewalsService.getMyAssignments(req.user.id, status);
  }

  @Get('my/statistics')
  @Roles('AGENT')
  async getMyStatistics(@Request() req: any) {
    return this.renewalsService.getStatistics(req.user.id);
  }

  @Get('my/performance')
  @Roles('AGENT')
  async getMyPerformance(
    @Request() req: any,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.renewalsService.getAgentPerformance(
      req.user.id,
      fromDate ? new Date(fromDate) : undefined,
      toDate ? new Date(toDate) : undefined,
    );
  }

  // ============================================
  // Contact Management
  // ============================================

  @Post('contacts')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.AGENT)
  async addContact(@Body() dto: CreateRenewalContactDto, @Request() req: any) {
    return this.renewalsService.addContact(dto, req.user.id);
  }

  @Get(':id/contacts')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.AGENT)
  async getContacts(@Param('id') id: string) {
    return this.renewalsService.getContacts(id);
  }

  // ============================================
  // Decision Processing
  // ============================================

  @Post(':id/decision')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.AGENT)
  async processDecision(
    @Param('id') id: string,
    @Body() dto: ProcessDecisionDto,
    @Request() req: any,
  ) {
    return this.renewalsService.processDecision(id, dto, req.user.id);
  }

  // ============================================
  // Manual Trigger (Admin Only)
  // ============================================

  @Post('generate')
  @Roles(UserRole.ADMIN)
  async generateRenewalRecords() {
    await this.renewalsService.generateRenewalRecords();
    return { success: true, message: 'تم إنشاء سجلات التجديد بنجاح' };
  }

  @Post('update-priorities')
  @Roles(UserRole.ADMIN)
  async updatePriorities() {
    await this.renewalsService.updatePriorities();
    return { success: true, message: 'تم تحديث الأولويات بنجاح' };
  }
}
