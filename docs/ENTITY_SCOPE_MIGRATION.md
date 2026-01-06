# Entity-Based Scope Enforcement - Migration Guide

> **للمطورين**: كيفية تحديث endpoints قائمة للاستفادة من @ScopeEntity

---

## 📋 Step-by-Step Migration

### Step 1: تحديد الـ Endpoints التي تحتاج تحديث

البحث عن endpoints التي تستخدم `@Scope(ScopeType.OWNED)` أو `@Scope(ScopeType.GOVERNORATE)`:

```bash
# البحث عن patterns
grep -r "@Scope(ScopeType" apps/api/src/modules --include="*.controller.ts"
```

### Step 2: لكل endpoint...

#### BEFORE (Old Pattern)
```typescript
@Patch('agent/businesses/:id')
@Roles(UserRole.AGENT)
@RequirePermission(Resource.BUSINESSES, Action.UPDATE)
@Scope(ScopeType.OWNED)
async updateBusiness(
  @Param('id') id: string, 
  @Body() dto: UpdateBusinessDto,
  @Request() req: any
) {
  // Double-check ownership
  const business = await this.businessesService.findById(id);
  if (business.agentId !== req.user.agentProfileId) {
    throw new ForbiddenException('Not your business');
  }
  return this.businessesService.update(id, dto);
}
```

#### AFTER (New Pattern)
```typescript
@Patch('agent/businesses/:id')
@Roles(UserRole.AGENT)
@RequirePermission(Resource.BUSINESSES, Action.UPDATE)
@ScopeEntity('business', 'id')  // ← Replace @Scope with @ScopeEntity
async updateBusiness(
  @Param('id') id: string, 
  @Body() dto: UpdateBusinessDto
) {
  // No ownership checks needed - Guard already verified!
  return this.businessesService.update(id, dto);
}
```

**Changes**:
1. ✅ Remove `@Scope(ScopeType.OWNED)`
2. ✅ Add `@ScopeEntity('business', 'id')`
3. ✅ Remove ownership validation code from controller
4. ✅ Remove `@Request() req` parameter if not used elsewhere

---

## 🎯 Real Examples by Entity Type

### Business Entity
```typescript
// GET - View specific business
@Get(':id')
@Roles(UserRole.AGENT)
@ScopeEntity('business', 'id')
async getBusiness(@Param('id') id: string) {
  return this.businessesService.findById(id);
}

// PATCH - Update business
@Patch(':id')
@Roles(UserRole.AGENT)
@ScopeEntity('business', 'id')
async updateBusiness(@Param('id') id: string, @Body() dto: UpdateBusinessDto) {
  return this.businessesService.update(id, dto);
}

// DELETE - Delete business
@Delete(':id')
@Roles(UserRole.AGENT)
@ScopeEntity('business', 'id')
async deleteBusiness(@Param('id') id: string) {
  await this.businessesService.delete(id);
  return { message: 'Deleted' };
}

// GET by slug
@Get('slug/:slug')
@Public()
@ScopeEntity('business', 'slug', 'bySlug')
async getBySlug(@Param('slug') slug: string) {
  return this.businessesService.findBySlug(slug);
}
```

### Visit Entity (AgentVisit)
```typescript
// GET - Agent view own visit
@Get('visits/:id')
@Roles(UserRole.AGENT)
@ScopeEntity('visit', 'id')
async getVisit(@Param('id') id: string) {
  return this.visitsService.findById(id);
}

// PATCH - Update visit
@Patch('visits/:id/status')
@Roles(UserRole.AGENT)
@ScopeEntity('visit', 'id')
async updateVisitStatus(@Param('id') id: string, @Body() dto: UpdateVisitDto) {
  return this.visitsService.updateStatus(id, dto.status);
}
```

### Review Entity
```typescript
// GET - View specific review
@Get('reviews/:id')
@Roles(UserRole.USER)
@ScopeEntity('review', 'id')
async getReview(@Param('id') id: string) {
  return this.reviewsService.findById(id);
}

// PATCH - Edit own review
@Patch('reviews/:id')
@Roles(UserRole.USER)
@ScopeEntity('review', 'id')
async updateReview(@Param('id') id: string, @Body() dto: UpdateReviewDto) {
  return this.reviewsService.update(id, dto);
}

// DELETE - Delete own review
@Delete('reviews/:id')
@Roles(UserRole.USER)
@ScopeEntity('review', 'id')
async deleteReview(@Param('id') id: string) {
  await this.reviewsService.delete(id);
  return { message: 'Deleted' };
}
```

---

## 🚫 DO NOT Migrate (Keep Using @Scope)

### List Endpoints
```typescript
// ❌ These should NOT use @ScopeEntity
// Why? No specific entity ID in params - manager gets ALL their governorates

@Get('businesses')
@Roles(UserRole.GOVERNORATE_MANAGER)
@RequirePermission(Resource.BUSINESSES, Action.READ)
@Scope(ScopeType.GOVERNORATE)  // ← Keep @Scope for list endpoints
async list(@Query('governorateId') govId: string) {
  return this.businessesService.findByGovernorate(govId);
}
```

### Public Endpoints
```typescript
// ❌ These should NOT use @ScopeEntity
// Why? No security check needed

@Get()
@Public()
async list() {
  return this.businessesService.findAll();
}
```

### GLOBAL Scope Endpoints
```typescript
// ❌ These should NOT use @ScopeEntity
// Why? ADMIN only - no entity-level validation needed

@Get('stats')
@Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
@Scope(ScopeType.GLOBAL)
async getStats() {
  return this.businessesService.getStats();
}
```

---

## ✅ Checklist for Each Endpoint

Before migrating an endpoint, verify:

- [ ] Endpoint has `@Param('id')` or similar (targets specific entity)
- [ ] Endpoint uses `@Scope(ScopeType.OWNED)` or `.GOVERNORATE`
- [ ] Controller has double-check code (ownership validation)
- [ ] Service method doesn't need user context
- [ ] Not a list/filter endpoint (those don't get @ScopeEntity)

---

## 🔧 Technical Details

### What the Guard Does
```typescript
// When you add @ScopeEntity('business', 'id'):

1. Extract param:      const id = request.params.id
2. Fetch entity:       const business = prisma.business.findUnique({ id })
3. Check ownership:    
   if (user.role === AGENT && business.agentId !== user.agentProfileId) {
     throw 403
   }
4. Allow request:      return true (next guard/handler)
```

### Performance Consideration
- Guard makes ONE database query to fetch entity
- This is expected and acceptable
- Entity queries are indexed (id, slug)
- Use `.select()` to minimize data transfer

---

## 📊 Migration Status Tracking

Track migration progress:

```typescript
// controllers/businesses.controller.ts

// ✅ MIGRATED (using @ScopeEntity)
@Patch(':id')
@ScopeEntity('business', 'id')
async update() { }

// ⏳ PENDING (still using @Scope)
@Get(':id')
@Scope(ScopeType.OWNED)
async getOne() { }

// ✅ MIGRATED
@Delete(':id')
@ScopeEntity('business', 'id')
async delete() { }
```

---

## 🆘 Troubleshooting

### Error: "Missing required parameter: id"
```
Cause: ParamName mismatch
@ScopeEntity('business', 'businessId')  but param is :id
                        ↑ wrong
Solution: Match param name exactly
```

### Error: "business not found"
```
Cause: ID doesn't exist in database
Check: Is ID valid? Does business exist?
```

### Error: "Access denied: not agent owner"
```
Cause: User doesn't own the entity
Check: Is request.user correct? Does business belong to user?
```

---

## ❓ Questions?

See:
- [ENTITY_BASED_SCOPE.md](./ENTITY_BASED_SCOPE.md) - Full documentation
- [RBAC.md](./RBAC.md) - System architecture
- [rbac-test.controller.ts](../apps/api/src/modules/auth/controllers/rbac-test.controller.ts) - Example
