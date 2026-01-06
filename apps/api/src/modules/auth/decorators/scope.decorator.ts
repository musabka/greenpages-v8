import { SetMetadata } from '@nestjs/common';
import { ScopeType } from '../constants/rbac.constants';

export const SCOPE_KEY = 'scope';
export const Scope = (scope: ScopeType) => SetMetadata(SCOPE_KEY, scope);
