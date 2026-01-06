import { Injectable } from '@nestjs/common';
import { UserRole } from '@greenpages/database';
import { PERMISSIONS_MATRIX, Resource, Action, ScopeType } from '../constants/rbac.constants';

@Injectable()
export class PermissionsService {
  /**
   * Check if a role has permission to perform an action on a resource
   */
  hasPermission(role: UserRole, resource: Resource, action: Action): boolean {
    // 1. Check if role exists in matrix
    // @ts-ignore - Types are compatible but TS might complain about string vs enum
    const rolePermissions = PERMISSIONS_MATRIX[role];
    if (!rolePermissions) {
      return false;
    }

    // 2. Check if resource exists for role
    const resourceActions = rolePermissions[resource];
    if (!resourceActions) {
      return false;
    }

    // 3. Check if action is allowed
    return resourceActions.includes(action);
  }

  /**
   * Returns the default scope for a given role
   */
  getRoleDefaultScope(role: UserRole): ScopeType {
    switch (role) {
      case UserRole.ADMIN:
      case UserRole.SUPERVISOR:
        return ScopeType.GLOBAL;
      case UserRole.GOVERNORATE_MANAGER:
        return ScopeType.GOVERNORATE;
      case UserRole.AGENT:
      // Business capabilities are now managed via UserBusinessCapability
      // Use CapabilitiesService.canAccessBusiness() instead
      case UserRole.USER:
      case UserRole.USER:
        return ScopeType.OWNED;
      default:
        return ScopeType.OWNED;
    }
  }
}

