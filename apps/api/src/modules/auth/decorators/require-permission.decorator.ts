import { SetMetadata } from '@nestjs/common';
import { Resource, Action } from '../constants/rbac.constants';

export const PERMISSION_KEY = 'permission';
export const RequirePermission = (resource: Resource, action: Action) => 
  SetMetadata(PERMISSION_KEY, { resource, action });
