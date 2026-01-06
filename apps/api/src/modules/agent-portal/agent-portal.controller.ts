import {
  Controller,
  Get,
  Post,
  Patch,
  Query,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AgentPortalService } from './agent-portal.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, VisitStatus, VisitPurpose } from '@greenpages/database';

@Controller('agent-portal')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.AGENT)
export class AgentPortalController {
  constructor(private readonly agentPortalService: AgentPortalService) {}

  /**
   * لوحة التحكم الرئيسية
   */
  @Get('dashboard')
  getDashboard(@Request() req) {
    return this.agentPortalService.getDashboard(req.user.id);
  }

  /**
   * الأنشطة التي يديرها المندوب
   */
  @Get('businesses')
  getMyBusinesses(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.agentPortalService.getMyBusinesses(req.user.id, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      status,
      search,
    });
  }

  /**
   * التجديدات المخصصة
   */
  @Get('renewals')
  getMyRenewals(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.agentPortalService.getMyRenewals(req.user.id, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      status,
    });
  }

  /**
   * تحديث حالة التجديد
   */
  @Patch('renewals/:renewalId')
  updateRenewalStatus(
    @Request() req,
    @Param('renewalId') renewalId: string,
    @Body() data: { status: string; notes?: string },
  ) {
    return this.agentPortalService.updateRenewalStatus(req.user.id, renewalId, data);
  }

  /**
   * العمولات
   */
  @Get('commissions')
  getMyCommissions(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.agentPortalService.getMyCommissions(req.user.id, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      status,
    });
  }

  /**
   * الزيارات الميدانية
   */
  @Get('visits')
  getMyVisits(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('date') date?: string,
  ) {
    return this.agentPortalService.getMyVisits(req.user.id, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      status,
      date,
    });
  }

  /**
   * إنشاء زيارة جديدة
   */
  @Post('visits')
  createVisit(
    @Request() req,
    @Body() data: {
      purpose: VisitPurpose;
      governorateId: string;
      cityId?: string;
      businessId?: string;
      scheduledAt: Date;
      address?: string;
      notes?: string;
    },
  ) {
    return this.agentPortalService.createVisit(req.user.id, data);
  }

  /**
   * تحديث حالة الزيارة
   */
  @Patch('visits/:visitId')
  updateVisitStatus(
    @Request() req,
    @Param('visitId') visitId: string,
    @Body() data: {
      status: VisitStatus;
      outcome?: string;
      notes?: string;
      photos?: string[];
    },
  ) {
    return this.agentPortalService.updateVisitStatus(req.user.id, visitId, data);
  }

  /**
   * الملف الشخصي
   */
  @Get('profile')
  getProfile(@Request() req) {
    return this.agentPortalService.getProfile(req.user.id);
  }

  /**
   * تحديث الملف الشخصي
   */
  @Patch('profile')
  updateProfile(
    @Request() req,
    @Body() data: { phone?: string; avatar?: string },
  ) {
    return this.agentPortalService.updateProfile(req.user.id, data);
  }
}
