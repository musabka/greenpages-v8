# Entity-Based Scope Enforcement

> **تاريخ التحديث**: يناير 2026  
> **التحسين**: نقل فرض Scope من Controllers إلى ScopeGuard

---

## 📌 ما هي المشكلة القديمة؟

### ❌ OLD PATTERN
```typescript
@Patch('agent/businesses/:id')
@Roles(UserRole.AGENT)
@RequirePermission(Resource.BUSINESSES, Action.UPDATE)
@Scope(ScopeType.OWNED)
async update(@Param('id') id: string, @Body() dto: UpdateBusinessDto, @Request() req) {
  const business = await this.businessesService.findById(id);
  
  // ⚠️ PROBLEM 1: Double-check in Controller (should be in Guard)
  if (business.agentId !== req.user.agentProfileId) {
    throw new ForbiddenException('Not your business');
  }
  
  // ⚠️ PROBLEM 2: Trust query/body parameters elsewhere
  // ⚠️ PROBLEM 3: Inconsistent validation across endpoints
  
  return this.businessesService.update(id, dto);
}
```

**الأخطار**:
- منطق الصلاحيات موزعة في Controller و Guard
- سهل نسيان الفحوصات
- عدم اتساق في التطبيق
- Guard لا يعرف entity الحقيقية

---

## ✅ ما هو الحل الجديد؟

### NEW PATTERN: Entity-Based Scope Enforcement
```typescript
@Patch('agent/businesses/:id')
@Roles(UserRole.AGENT)
@RequirePermission(Resource.BUSINESSES, Action.UPDATE)
@ScopeEntity('business', 'id')  // ← Tell Guard: fetch business by :id param
async update(@Param('id') id: string, @Body() dto: UpdateBusinessDto) {
  // ✅ Guard already verified ownership
  // ✅ No double-checks needed here
  // ✅ Clean business logic
  return this.businessesService.update(id, dto);
}
```

**المزايا**:
- ✅ Guard مسؤول بالكامل عن صلاحيات
- ✅ Controllers نظيفة (بدون شيكات أمان)
- ✅ Single source of truth: ScopeGuard
- ✅ Consistent across all endpoints
- ✅ Entity validation من قاعدة البيانات (not query params)

---

## 🔧 كيف تستخدم @ScopeEntity؟

### Syntax
```typescript
@ScopeEntity(entity: string, paramName: string, entityResolver?: string)
```

### Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `entity` | string | - | نوع الكيان: `'business'`, `'agent'`, `'visit'`, `'review'`, `'user'` |
| `paramName` | string | - | اسم route parameter المحتوي على معرف الكيان (مثلاً: `'id'`) |
| `entityResolver` | string | `'byId'` | طريقة الجلب: `'byId'` أو `'bySlug'` |

### Examples

#### مثال 1: تحديث business بـ ID
```typescript
@Patch(':id')
@Roles(UserRole.AGENT)
@ScopeEntity('business', 'id')  // Fetch business by route param :id
async update(@Param('id') id: string) { }
```

**ScopeGuard سيفعل**:
1. استخراج `id` من `request.params.id`
2. جلب business من قاعدة البيانات
3. التحقق من `business.agentId === req.user.agentProfileId`
4. إرجاع 403 عند عدم التطابق

#### مثال 2: جلب business بـ slug
```typescript
@Get('slug/:slug')
@Public()
@ScopeEntity('business', 'slug', 'bySlug')
async getBySlug(@Param('slug') slug: string) { }
```

#### مثال 3: تحديث visit بـ ID
```typescript
@Patch('visits/:id/status')
@Roles(UserRole.AGENT)
@ScopeEntity('visit', 'id')  // Validate visit belongs to agent
async updateVisit(@Param('id') id: string) { }
```

#### مثال 4: جلب review بـ ID
```typescript
@Get('reviews/:id')
@Roles(UserRole.USER)
@ScopeEntity('review', 'id')  // Validate user owns review
async getReview(@Param('id') id: string) { }
```

---

## 📋 Supported Entities

### Business
```typescript
@ScopeEntity('business', 'id')
```
**Guard Validation Rules**:
- **GOVERNORATE_MANAGER**: `business.governorateId` in `user.managedGovernorateIds`
- **AGENT**: `business.agentId === user.agentProfileId` OR `business.createdById === user.id`
- **BUSINESS**: (business owner) - checks `createdById`

### Agent (AgentProfile)
```typescript
@ScopeEntity('agent', 'id')
```
**Guard Validation Rules**:
- **AGENT**: Must be their own profile

### Visit (AgentVisit)
```typescript
@ScopeEntity('visit', 'id')
```
**Guard Validation Rules**:
- **AGENT**: `visit.agentProfileId === user.agentProfileId`
- **GOVERNORATE_MANAGER**: `visit.governorateId` in `user.managedGovernorateIds`

### Review
```typescript
@ScopeEntity('review', 'id')
```
**Guard Validation Rules**:
- **USER**: `review.userId === user.id`
- **GOVERNORATE_MANAGER**: Can access via governorate

### User
```typescript
@ScopeEntity('user', 'id')
```
**Guard Validation Rules**:
- **USER**: Can only access own profile

---

## 🚨 Common Mistakes

### ❌ Mistake 1: Still Adding Ownership Checks in Controller
```typescript
@ScopeEntity('business', 'id')
async update(@Param('id') id: string) {
  const business = await this.service.findById(id);
  
  // ❌ WRONG! Guard already checked ownership
  if (business.agentId !== req.user.agentProfileId) {
    throw new ForbiddenException();
  }
  
  return this.service.update(id, dto);
}
```

**✅ الصحيح**:
```typescript
@ScopeEntity('business', 'id')
async update(@Param('id') id: string) {
  // Guard already verified - trust it!
  return this.service.update(id, dto);
}
```

### ❌ Mistake 2: Wrong Parameter Name
```typescript
@Patch(':businessId')
@ScopeEntity('business', 'id')  // ❌ param is :businessId not :id
async update(@Param('businessId') id: string) { }
```

**✅ الصحيح**:
```typescript
@Patch(':businessId')
@ScopeEntity('business', 'businessId')  // Match actual param name
async update(@Param('businessId') id: string) { }
```

### ❌ Mistake 3: Missing Decorator on Entity Endpoint
```typescript
@Patch(':id')
@Roles(UserRole.AGENT)
// ❌ MISSING: @ScopeEntity
async update(@Param('id') id: string) {
  // Anyone with AGENT role can update ANY business!
  return this.service.update(id, dto);
}
```

**✅ الصحيح**:
```typescript
@Patch(':id')
@Roles(UserRole.AGENT)
@ScopeEntity('business', 'id')  // Always specify which entity to validate
async update(@Param('id') id: string) {
  return this.service.update(id, dto);
}
```

---

## 🔐 Guard Implementation Details

### Fetch Flow
```
1. @ScopeEntity metadata read from decorator
2. Extract parameter from route (e.g., request.params.id)
3. Fetch entity from database
4. Validate ownership based on role:
   - GOVERNORATE_MANAGER: governorateId check
   - AGENT: agentId or createdById check
   - BUSINESS: createdById check
   - USER: userId check
5. Return true (allow) or throw 403 (deny)
```

### Entity Resolution
```typescript
// Guard handles parameter-to-entity mapping:
@ScopeEntity('business', 'id')     // → prisma.business.findUnique({ where: { id } })
@ScopeEntity('business', 'slug', 'bySlug')  // → prisma.business.findUnique({ where: { slug } })
@ScopeEntity('visit', 'id')        // → prisma.agentVisit.findUnique({ where: { id } })
@ScopeEntity('review', 'id')       // → prisma.review.findUnique({ where: { id } })
```

---

## ✨ Benefits Summary

| Aspect | OLD | NEW |
|--------|-----|-----|
| **Where checks happen** | Controller + Guard | Guard ONLY ✅ |
| **Entity source** | Query params | Database ✅ |
| **Double-checks needed** | YES ⚠️ | NO ✅ |
| **Consistency** | Variable | Enforced ✅ |
| **Controller code** | Complex | Clean ✅ |
| **Security** | Fragile | Strong ✅ |

---

## 📚 Related Documentation
- [RBAC.md](./RBAC.md) - System architecture
- [SECURITY_CHECKLIST.md](./SECURITY_CHECKLIST.md) - All security hardening
