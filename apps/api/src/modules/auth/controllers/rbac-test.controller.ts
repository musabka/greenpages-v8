import { Controller, Get, Post, Patch, UseGuards, Query, Param, Body } from '@nestjs/common';
import { UserRole } from '@greenpages/database';
import { Roles } from '../decorators/roles.decorator';
import { RequirePermission } from '../decorators/require-permission.decorator';
import { Scope } from '../decorators/scope.decorator';
import { ScopeEntity } from '../decorators/scope-entity.decorator';
import { RolesGuard } from '../guards/roles.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { ScopeGuard } from '../guards/scope.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Resource, Action, ScopeType } from '../constants/rbac.constants';

@Controller('rbac-test')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, ScopeGuard)
export class RbacTestController {

  @Get('admin/users')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @RequirePermission(Resource.USERS, Action.READ)
  @Scope(ScopeType.GLOBAL)
  getUsers() {
    return { message: 'Access granted to users list' };
  }

  @Post('admin/users')
  @Roles(UserRole.ADMIN)
  @RequirePermission(Resource.USERS, Action.CREATE)
  @Scope(ScopeType.GLOBAL)
  createUser() {
    return { message: 'Access granted to create user' };
  }

  @Get('manager/businesses')
  @Roles(UserRole.GOVERNORATE_MANAGER)
  @RequirePermission(Resource.BUSINESSES, Action.READ)
  @Scope(ScopeType.GOVERNORATE)
  getManagerBusinesses(@Query('governorateId') governorateId: string) {
    return { message: `Access granted to businesses in governorate ${governorateId}` };
  }

  /**
   * ❌ OLD PATTERN (Legacy):
   * @Patch('agent/businesses/:id')
   * @Roles(UserRole.AGENT)
   * @RequirePermission(Resource.BUSINESSES, Action.UPDATE)
   * @Scope(ScopeType.OWNED)
   * updateAgentBusiness(@Param('id') id: string) {
   *   // Controller must verify ownership - SECURITY RISK!
   *   return { message: `Access granted to update business ${id}` };
   * }
   */

  /**
   * ✅ NEW PATTERN (Entity-Based):
   * ScopeGuard handles ALL ownership checks:
   * 1. Fetches business from DB
   * 2. Validates agent ownership (business.agentId or createdById)
   * 3. Returns 403 if mismatch
   * 4. Controller does NO ownership checks
   */
  @Patch('agent/businesses/:id')
  @Roles(UserRole.AGENT)
  @RequirePermission(Resource.BUSINESSES, Action.UPDATE)
  @ScopeEntity('business', 'id')
  updateAgentBusiness(@Param('id') id: string) {
    return { message: `Access granted to update business ${id}` };
  }

  @Get('business/dashboard')
  // DEPRECATED: Business role removed - use capabilities instead
  @RequirePermission(Resource.BUSINESSES, Action.READ)
  @Scope(ScopeType.OWNED)
  getBusinessDashboard() {
    return { message: 'Access granted to business dashboard' };
  }

  @Post('reviews')
  @Roles(UserRole.USER)
  @RequirePermission(Resource.REVIEWS, Action.CREATE)
  @Scope(ScopeType.OWNED)
  createReview() {
    return { message: 'Access granted to create review' };
  }
}
