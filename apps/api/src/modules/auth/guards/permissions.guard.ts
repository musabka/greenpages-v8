import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from '../services/permissions.service';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { Resource, Action } from '../constants/rbac.constants';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const permission = this.reflector.getAllAndOverride<{ resource: Resource; action: Action }>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!permission) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!this.permissionsService.hasPermission(user.role, permission.resource, permission.action)) {
      throw new ForbiddenException(
        `Role ${user.role} does not have permission to ${permission.action} ${permission.resource}`,
      );
    }

    return true;
  }
}
