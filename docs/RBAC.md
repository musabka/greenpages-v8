# Role-Based Access Control (RBAC) & Scope System

> **آخر تحديث**: يناير 2026  
> **الإصدار**: 2.0 (بعد التنظيف الجذري)  
> **الميزة الجديدة**: Entity-Based Scope Enforcement

---

## 📚 Documentation Map
- **[ENTITY_SCOPE_README.md](./ENTITY_SCOPE_README.md)** - 📍 Start here (Quick overview)
- **[RBAC.md](./RBAC.md)** ← You are here (System overview + Governance rules)
- **[ENTITY_BASED_SCOPE.md](./ENTITY_BASED_SCOPE.md)** - @ScopeEntity decorator & usage
- **[ENTITY_SCOPE_MIGRATION.md](./ENTITY_SCOPE_MIGRATION.md)** - Migration guide & examples
- **[OPTIONAL_ENHANCEMENTS_SUMMARY.md](./OPTIONAL_ENHANCEMENTS_SUMMARY.md)** - Caching, tests & improvements
- **[SECURITY_CHECKLIST.md](./SECURITY_CHECKLIST.md)** - Token invalidation & security hardening

---

## ⚠️ التنظيف الجذري - ما تم حذفه

### الأدوار القديمة (محذوفة)
- ❌ `SUPER_ADMIN` → تم استبداله بـ `ADMIN`
- ❌ `MODERATOR` → تم استبداله بـ `SUPERVISOR`

### الأنماط القديمة (محذوفة)
- ❌ **God Guard**: كان guard واحد يحتوي كل المنطق
- ❌ **governorateIds Arrays**: كانت تُمرر يدوياً
- ❌ **منطق صلاحيات في Services**: كان يُستخدم `if (user.role === 'ADMIN')`
- ❌ **Legacy role mapping**: كان RolesGuard يدعم الأدوار القديمة

### الملفات المُنظفة
- `apps/api/src/modules/auth/guards/roles.guard.ts`
- `apps/api/src/modules/auth/decorators/roles.decorator.ts`
- `apps/api/src/modules/packages/guards/package.guard.ts`
- `apps/api/src/modules/notifications/notifications.service.ts`
- `apps/admin/src/components/sidebar.tsx`
- `apps/admin/src/components/auth-provider.tsx`

---

## Overview
This system implements a strict RBAC model with additional Scope guards to ensure data isolation.

## Roles
- **ADMIN**: Full system access (Global Scope).
- **SUPERVISOR**: Operational access (Global Scope).
- **GOVERNORATE_MANAGER**: Access restricted to specific governorates (Governorate Scope).
- **AGENT**: Access restricted to assigned/created data (Owned Scope).
- **BUSINESS**: Access restricted to own business data (Owned Scope).
- **USER**: Public access + own profile/reviews (Owned Scope).

## Resources & Actions
Defined in `apps/api/src/modules/auth/constants/rbac.constants.ts`.

### Standard Resources
- `users`, `businesses`, `governorates`, `geography`, `packages`, `settings`, `reports`, `agents`, `commissions`, `visits`, `renewals`, `reviews`.

### Standard Actions
- `create`, `read`, `update`, `delete`, `approve`, `reject`, `assign`, `pay`, `export`.

## Security Layers (Guards)

1.  **JwtAuthGuard**: Validates the token.
2.  **RolesGuard**: Checks if the user has the required Role.
3.  **PermissionsGuard**: Checks if the user has the specific Permission (Resource + Action).
4.  **ScopeGuard**: Checks if the user has access to the specific Data Scope (Global, Governorate, or Owned).

---

## 📋 Governance Rules

### Rule: Entity-Level Scope Declaration
**🔒 Any endpoint that reads or mutates a specific entity MUST declare it with `@ScopeEntity`.**

```typescript
// ✅ GOOD: Declares entity scope
@Get(':id')
@ScopeEntity('business', 'id')
getBusiness(@Param('id') id: string) { }

// ❌ BAD: No entity declaration
@Get(':id')
@Scope(ScopeType.OWNED)
getBusiness(@Param('id') id: string) { }  // Which entity? Ambiguous!

// ✅ GOOD: List endpoint (no entity ID param)
@Get()
@Scope(ScopeType.GOVERNORATE)
list(@Query('governorateId') govId: string) { }

// ❌ BAD: Endpoint targeting entity but no guard
@Patch(':id')
async update(@Param('id') id: string) { }  // Security hole!
```

**Enforcement**:
- Code review must verify `@ScopeEntity` on single-entity endpoints
- Linting: Consider adding ESLint rule to catch missing decorators
- Testing: Include scope validation in integration tests

---

## Usage Examples

### 1. Admin Only Endpoint
```typescript
@Get('admin/users')
@Roles(UserRole.ADMIN)
@RequirePermission(Resource.USERS, Action.READ)
@Scope(ScopeType.GLOBAL)
getUsers() { ... }
```

### 2. Manager Endpoint (Governorate Scope)
```typescript
@Get('manager/businesses')
@Roles(UserRole.GOVERNORATE_MANAGER)
@RequirePermission(Resource.BUSINESSES, Action.READ)
@Scope(ScopeType.GOVERNORATE)
getManagerBusinesses(@Query('governorateId') governorateId: string) { ... }
```
*Note: The ScopeGuard validates that `governorateId` is in the user's `managedGovernorateIds`.*

### 3. Agent Endpoint (Owned Scope)
```typescript
@Patch('agent/businesses/:id')
@Roles(UserRole.AGENT)
@RequirePermission(Resource.BUSINESSES, Action.UPDATE)
@Scope(ScopeType.OWNED)
updateAgentBusiness(@Param('id') id: string) { ... }
```
*Note: The ScopeGuard validates that the target business is assigned to the agent.*

## Frontend Applications
- **Admin Panel** (3001): `@greenpages/admin`
- **Public Web** (3002): `@greenpages/web`
- **Manager Panel** (3003): `@greenpages/manager`
- **Agent Panel** (3004): `@greenpages/agent`

---

## 🔒 Security Hardening

### 1. Token Invalidation
**Problem**: JWT يحتفظ بصلاحيات قديمة حتى انتهاء مدته.

**Solution**: `tokenVersion` field في User model:
```typescript
// عند تغيير صلاحيات
await usersService.invalidateTokens(userId);

// JwtStrategy يتحقق تلقائياً
if (payload.tokenVersion !== user.tokenVersion) {
  throw new UnauthorizedException('تم تغيير الصلاحيات');
}
```

**متى تستخدمه**:
- تغيير role
- إضافة/إزالة governorate manager
- حذف أو تعطيل المستخدم

### 2. Entity-Based Scope Enforcement (NEW)
**Problem**: Query parameters تُثق عليها دون التحقق من entity الحقيقية.

**Solution**: ScopeGuard يجلب entity من DB ويتحقق من ownership:

```typescript
// ❌ OLD: Guard يثق بـ query
@Get('manager/businesses')
@Roles(UserRole.GOVERNORATE_MANAGER)
@Scope(ScopeType.GOVERNORATE)
getManagerBusinesses(@Query('governorateId') govId: string) {
  // governorateId from query - لا يُثق عليه
  return this.service.find(govId);
}

// ✅ NEW: Guard يجلب entity ويتحقق
@Patch('agent/businesses/:id')
@Roles(UserRole.AGENT)
@ScopeEntity('business', 'id')
updateAgentBusiness(@Param('id') id: string) {
  // ScopeGuard automatically:
  // 1. يجلب business من DB
  // 2. يتحقق من agentId
  // 3. يرفع 403 عند عدم التطابق
  return { message: 'Updated' };
}
```

**المسؤوليات**:
- **ScopeGuard**: Entity fetching + ownership validation + 403 errors
- **Controller**: ZERO scope checks (Trust the guard)

### 3. Explicit ADMIN Override
ADMIN و SUPERVISOR يتجاوزون جميع فحوصات Scope:

```typescript
// في ScopeGuard - أول شيء
if (user.role === UserRole.ADMIN || user.role === UserRole.SUPERVISOR) {
  return true; // Bypass all scope checks
}
```

---

## 📋 Endpoint Example: Updating a Business

### ❌ OLD PATTERN (Trust Query Parameters)
```typescript
@Controller('businesses')
export class BusinessesController {
  constructor(private businessesService: BusinessesService) {}

  @Patch(':id')
  @Roles(UserRole.AGENT)
  @RequirePermission(Resource.BUSINESSES, Action.UPDATE)
  @Scope(ScopeType.OWNED) // Generic scope check, no entity knowledge
  async update(@Param('id') id: string, @Body() dto: UpdateBusinessDto) {
    // ⚠️ PROBLEM: Controller must verify ownership
    // ⚠️ This is error-prone and easily forgotten
    const business = await this.businessesService.findById(id);
    if (business.agentId !== req.user.agentProfileId) {
      throw new ForbiddenException();
    }
    return this.businessesService.update(id, dto);
  }
}
```

**Risks**:
- Developers might forget ownership checks
- Inconsistent validation across endpoints
- Business logic mixed with security logic

### ✅ NEW PATTERN (ScopeGuard Handles Everything)
```typescript
@Controller('businesses')
export class BusinessesController {
  constructor(private businessesService: BusinessesService) {}

  @Patch(':id')
  @Roles(UserRole.AGENT)
  @RequirePermission(Resource.BUSINESSES, Action.UPDATE)
  @ScopeEntity('business', 'id') // Guard knows to fetch & validate business
  async update(@Param('id') id: string, @Body() dto: UpdateBusinessDto) {
    // ✅ ScopeGuard already verified ownership
    // ✅ No need for ownership checks here
    // ✅ If we reach here, user owns the business
    return this.businessesService.update(id, dto);
  }
}
```

**Benefits**:
- Guard owns ALL ownership validation
- Controllers are clean (security-free)
- Single source of truth: ScopeGuard
- Consistent across all endpoints

---

**انظر**: `docs/SECURITY_CHECKLIST.md` للمزيد
