import { SetMetadata } from '@nestjs/common';

export const SCOPE_ENTITY_KEY = 'scopeEntity';

export interface ScopeEntityMetadata {
  entity: 'business' | 'agent' | 'visit' | 'review' | 'user' | string;
  paramName: string;
  entityResolver?: 'byId' | 'bySlug' | string; // Default: 'byId'
}

/**
 * Decorator to specify which entity and parameter name to validate scope against.
 * 
 * Usage:
 * @ScopeEntity('business', 'id')
 * @Patch(':id')
 * updateBusiness(@Param('id') id: string) { }
 * 
 * The ScopeGuard will:
 * 1. Extract the parameter value from route params
 * 2. Fetch the entity from DB (Business, Agent, etc.)
 * 3. Validate user ownership/scope against the entity's properties
 * 4. Throw 403 if validation fails
 * 
 * Controllers must NOT include any ownership/scope checks - Guard handles it completely.
 */
export const ScopeEntity = (
  entity: 'business' | 'agent' | 'visit' | 'review' | 'user' | string,
  paramName: string,
  entityResolver: 'byId' | 'bySlug' | string = 'byId'
) =>
  SetMetadata(SCOPE_ENTITY_KEY, {
    entity,
    paramName,
    entityResolver,
  } as ScopeEntityMetadata);
