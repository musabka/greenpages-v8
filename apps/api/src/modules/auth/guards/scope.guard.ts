import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SCOPE_KEY } from '../decorators/scope.decorator';
import { SCOPE_ENTITY_KEY, ScopeEntityMetadata } from '../decorators/scope-entity.decorator';
import { ScopeType } from '../constants/rbac.constants';
import { UserRole } from '@greenpages/database';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ScopeGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Optional() @Inject('PrismaService') private prisma?: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredScope = this.reflector.getAllAndOverride<ScopeType>(SCOPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const scopeEntity = this.reflector.getAllAndOverride<ScopeEntityMetadata>(
      SCOPE_ENTITY_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredScope && !scopeEntity) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // EXPLICIT ADMIN OVERRIDE: Admins and Supervisors bypass all scope checks
    if (user.role === UserRole.ADMIN || user.role === UserRole.SUPERVISOR) {
      return true;
    }

    // Entity-based scope enforcement (NEW)
    if (scopeEntity) {
      return await this.validateEntityScope(user, request, scopeEntity);
    }

    // Legacy scope validation (backward compatibility)
    if (!requiredScope) {
      return true;
    }

    // 1. GLOBAL Scope (Admin/Supervisor only - already checked above)
    if (requiredScope === ScopeType.GLOBAL) {
      throw new ForbiddenException('Requires GLOBAL scope - Admin or Supervisor role');
    }

    // 2. GOVERNORATE Scope
    if (requiredScope === ScopeType.GOVERNORATE) {
      if (user.role === UserRole.GOVERNORATE_MANAGER) {
        return this.validateGovernorateScope(user, request);
      }

      throw new ForbiddenException('Role does not support GOVERNORATE scope');
    }

    // 3. OWNED Scope
    if (requiredScope === ScopeType.OWNED) {
      // For Managers, they can access "Owned" in the sense of "Managed"
      if (user.role === UserRole.GOVERNORATE_MANAGER) return true;

      if (user.role === UserRole.AGENT) {
        return this.validateAgentScope(user, request);
      }
      // Business access is now via hasBusinessAccess flag in JWT + capabilities
      if ((user as any).hasBusinessAccess) {
        return this.validateBusinessScope(user, request);
      }
      if (user.role === UserRole.USER) {
        return this.validateUserScope(user, request);
      }
    }

    return true;
  }

  /**
   * Entity-Based Scope Validation
   * 
   * ✅ Guards FULLY responsibility:
   * - Fetch entity from DB (with request-level cache)
   * - Check ownership/governorate
   * - Reject with 403 if mismatch
   * 
   * ❌ Controllers responsibility: NOTHING (Guard handles it all)
   */
  private async validateEntityScope(
    user: any,
    request: any,
    metadata: ScopeEntityMetadata,
  ): Promise<boolean> {
    if (!this.prisma) {
      throw new ForbiddenException('Prisma service not available');
    }

    const { entity, paramName, entityResolver = 'byId' } = metadata;
    const paramValue = request.params[paramName];

    if (!paramValue) {
      throw new ForbiddenException(`Missing required parameter: ${paramName}`);
    }

    // Request-level cache: avoid fetching same entity twice in same request
    const cacheKey = `scopeEntity:${entity}:${paramValue}:${entityResolver}`;
    if (!request.scopeEntityCache) {
      request.scopeEntityCache = {};
    }

    let fetchedEntity = request.scopeEntityCache[cacheKey];

    if (!fetchedEntity) {
      // Fetch from database
      fetchedEntity = await this.fetchEntity(entity, paramValue, entityResolver);
      request.scopeEntityCache[cacheKey] = fetchedEntity;
    }

    if (!fetchedEntity) {
      throw new ForbiddenException(`${entity} not found`);
    }

    // Validate scope based on entity properties
    this.validateEntityOwnership(user, fetchedEntity, entity);

    return true;
  }

  /**
   * Fetch entity from database by resolver type
   */
  private async fetchEntity(
    entity: string,
    value: string,
    resolver: string,
  ): Promise<any> {
    switch (entity.toLowerCase()) {
      case 'business':
        return this.fetchBusiness(value, resolver);
      case 'agent':
        return this.fetchAgent(value, resolver);
      case 'visit':
        return this.fetchVisit(value, resolver);
      case 'review':
        return this.fetchReview(value, resolver);
      case 'user':
        return this.fetchUser(value, resolver);
      default:
        throw new ForbiddenException(`Unknown entity type: ${entity}`);
    }
  }

  private async fetchBusiness(id: string, resolver: string): Promise<any> {
    if (resolver === 'bySlug') {
      return this.prisma?.business.findUnique({
        where: { slug: id },
        select: {
          id: true,
          governorateId: true,
          agentId: true,
          createdById: true,
        },
      });
    }
    return this.prisma?.business.findUnique({
      where: { id },
      select: {
        id: true,
        governorateId: true,
        agentId: true,
        createdById: true,
      },
    });
  }

  private async fetchAgent(id: string, resolver: string): Promise<any> {
    return this.prisma?.agentProfile.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
      },
    });
  }

  private async fetchVisit(id: string, resolver: string): Promise<any> {
    return this.prisma?.agentVisit.findUnique({
      where: { id },
      select: {
        id: true,
        agentProfileId: true,
        businessId: true,
        governorateId: true,
      },
    });
  }

  private async fetchReview(id: string, resolver: string): Promise<any> {
    return this.prisma?.review.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        businessId: true,
        business: {
          select: { governorateId: true },
        },
      },
    });
  }

  private async fetchUser(id: string, resolver: string): Promise<any> {
    return this.prisma?.user.findUnique({
      where: { id },
      select: {
        id: true,
      },
    });
  }

  /**
   * Validate entity ownership based on user role and entity type
   * 
   * Rules:
   * - GOVERNORATE_MANAGER: Must own governorateId
   * - AGENT: Must be agentProfileId or createdById
   * - BUSINESS: Must be createdById (business owner)
   * - USER: Must be userId or createdById
   */
  private validateEntityOwnership(user: any, entity: any, entityType: string): void {
    switch (user.role) {
      case UserRole.GOVERNORATE_MANAGER:
        // For visits: check governorateId
        if (entityType.toLowerCase() === 'visit') {
          if (entity.governorateId && !user.managedGovernorateIds?.includes(entity.governorateId)) {
            throw new ForbiddenException('Access denied: governorate mismatch');
          }
          return;
        }
        // For other entities: check governorateId
        if (entity.governorateId && !user.managedGovernorateIds?.includes(entity.governorateId)) {
          throw new ForbiddenException('Access denied: governorate mismatch');
        }
        break;

      case UserRole.AGENT:
        if (entityType.toLowerCase() === 'visit') {
          if (entity.agentProfileId !== user.agentProfileId) {
            throw new ForbiddenException('Access denied: not visit owner');
          }
          return;
        }
        if (entity.agentId && entity.agentId !== user.agentProfileId) {
          if (entity.createdById && entity.createdById !== user.id) {
            throw new ForbiddenException('Access denied: not agent owner');
          }
        }
        break;

      // Business capabilities handled by CapabilitiesService
      case UserRole.USER:
        if (entity.createdById && entity.createdById !== user.businessId) {
          throw new ForbiddenException('Access denied: not business owner');
        }
        break;

      case UserRole.USER:
        if (entity.userId && entity.userId !== user.id) {
          if (entity.createdById && entity.createdById !== user.id) {
            throw new ForbiddenException('Access denied: not user owner');
          }
        }
        break;
    }
  }

  private validateGovernorateScope(user: any, request: any): boolean {
    const targetGovernorateId =
      request.params.governorateId ||
      request.query.governorateId ||
      request.body.governorateId;

    if (!targetGovernorateId) {
      return true;
    }

    const allowedIds = user.managedGovernorateIds || [];
    if (!allowedIds.includes(targetGovernorateId)) {
      throw new ForbiddenException('Access to this governorate is denied');
    }
    return true;
  }

  private validateAgentScope(user: any, request: any): boolean {
    const targetAgentId = request.body.agentId || request.query.agentId;
    if (targetAgentId && targetAgentId !== user.agentProfileId) {
      throw new ForbiddenException('Cannot act on behalf of another agent');
    }
    return true;
  }

  private validateBusinessScope(user: any, request: any): boolean {
    const targetBusinessId = request.params.businessId || request.body.businessId;
    if (targetBusinessId && targetBusinessId !== user.businessId) {
      throw new ForbiddenException('Cannot access another business');
    }
    return true;
  }

  private validateUserScope(user: any, request: any): boolean {
    const targetUserId = request.params.userId;
    if (targetUserId && targetUserId !== user.id) {
      throw new ForbiddenException('Cannot access another user profile');
    }
    return true;
  }
}
