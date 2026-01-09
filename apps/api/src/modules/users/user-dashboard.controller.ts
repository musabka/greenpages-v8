/**
 * User Dashboard Controller
 * واجهة API للوحة تحكم المستخدم
 */

import {
  Controller,
  Get,
  Param,
  Request,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserDashboardService } from './user-dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@greenpages/database';

@ApiTags('user-dashboard')
@Controller('user/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.USER, UserRole.AGENT)
@ApiBearerAuth()
export class UserDashboardController {
  constructor(private readonly dashboardService: UserDashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'ملخص لوحة تحكم المستخدم' })
  async getDashboardSummary(@Request() req: any) {
    return this.dashboardService.getUserDashboardSummary(req.user.id);
  }

  @Get('business-stats')
  @ApiOperation({ summary: 'إحصائيات الأنشطة التجارية للمستخدم' })
  async getBusinessStats(@Request() req: any) {
    return this.dashboardService.getBusinessStats(req.user.id);
  }

  @Get('packages-details')
  @ApiOperation({ summary: 'تفاصيل باقات جميع أنشطة المستخدم التجارية' })
  async getUserPackagesDetails(@Request() req: any) {
    return this.dashboardService.getUserPackagesDetails(req.user.id);
  }

  @Get('available-packages')
  @ApiOperation({ summary: 'الباقات المتاحة للشراء/التجديد/الترقية' })
  async getAvailablePackages() {
    return this.dashboardService.getAvailablePackages();
  }

  @Get('business/:businessId/subscription')
  @ApiOperation({ summary: 'معلومات اشتراك نشاط تجاري' })
  async getBusinessSubscription(
    @Request() req: any,
    @Param('businessId') businessId: string,
  ) {
    const result = await this.dashboardService.getBusinessSubscription(
      req.user.id,
      businessId,
    );

    if (!result) {
      throw new BadRequestException(
        'ليس لديك صلاحية الوصول لهذا النشاط التجاري'
      );
    }

    return result;
  }

  @Get('business/:businessId/financial')
  @ApiOperation({ summary: 'الملخص المالي لنشاط تجاري' })
  async getBusinessFinancial(
    @Request() req: any,
    @Param('businessId') businessId: string,
  ) {
    const result = await this.dashboardService.getBusinessFinancialSummary(
      req.user.id,
      businessId,
    );

    if (!result) {
      throw new BadRequestException(
        'ليس لديك صلاحية الوصول لهذا النشاط التجاري'
      );
    }

    return result;
  }

  @Get('local-offers')
  @ApiOperation({ summary: 'عروض وإعلانات محلية حسب موقع المستخدم' })
  async getLocalOffers(@Request() req: any) {
    return this.dashboardService.getLocalOffers(req.user.id);
  }
}
