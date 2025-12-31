import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@greenpages/database';

@ApiTags('Admin Dashboard')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: 'Get dashboard statistics' })
  async getStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('pending-businesses')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: 'Get pending businesses' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getPendingBusinesses(@Query('limit') limit?: number) {
    return this.adminService.getPendingBusinesses(limit);
  }

  @Get('pending-reviews')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: 'Get pending reviews' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getPendingReviews(@Query('limit') limit?: number) {
    return this.adminService.getPendingReviews(limit);
  }

  @Get('recent-activity')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: 'Get recent activity' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getRecentActivity(@Query('limit') limit?: number) {
    return this.adminService.getRecentActivity(limit);
  }
}
