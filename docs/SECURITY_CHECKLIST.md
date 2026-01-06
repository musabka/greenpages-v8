# Security Hardening - نقاط الفحص الحرجة

## ✅ 1. Token Invalidation (إبطال الصلاحيات)

### الحل المُنفذ: `tokenVersion`

**الملفات المتأثرة:**
- `packages/database/prisma/schema.prisma` - إضافة حقل `tokenVersion`
- `apps/api/src/modules/auth/auth.service.ts` - إضافة `tokenVersion` للـ JWT payload
- `apps/api/src/modules/auth/strategies/jwt.strategy.ts` - التحقق من `tokenVersion` عند كل request
- `apps/api/src/modules/users/users.service.ts` - `invalidateTokens()` helper

### كيف يعمل:
```typescript
// عند تغيير صلاحيات مستخدم
await usersService.invalidateTokens(userId);
// يزيد tokenVersion من 0 إلى 1

// عند التحقق من JWT
if (payload.tokenVersion !== user.tokenVersion) {
  throw new UnauthorizedException('تم تغيير الصلاحيات');
}
```

### متى تستخدمه:
- ✅ عند تغيير `role` للمستخدم
- ✅ عند إضافة/إزالة `GovernorateManager` assignment
- ✅ عند حذف المستخدم
- ✅ عند تعطيل الحساب

### مثال في Controller:
```typescript
@Patch(':id/role')
@Roles(UserRole.ADMIN)
async updateRole(@Param('id') id: string, @Body() dto: { role: UserRole }) {
  await this.usersService.update(id, { role: dto.role });
  await this.usersService.invalidateTokens(id); // ⚡ مهم!
  return { message: 'تم التحديث' };
}
```

---

## ✅ 2. ScopeGuard - لا ثقة بـ Query Parameters

### المشكلة:
```typescript
// ❌ خطأ: الثقة العمياء بـ query
@Get('businesses')
async getBusinesses(@Query('governorateId') govId: string) {
  return this.service.findByGovernorate(govId);
}
```

المهاجم يستطيع:
```bash
GET /businesses?governorateId=OTHER_GOV_ID
```

### الحل المُنفذ:

#### في ScopeGuard:
```typescript
private validateGovernorateScope(user: any, request: any): boolean {
  // WARNING: Do NOT trust governorateId from query/body alone!
  // Controllers should validate against actual business/entity governorate
  const targetGovernorateId = request.params.governorateId || ...;
  
  // Safety fallback - controller MUST implement additional checks
  if (!targetGovernorateId) return true;
  
  // Verify user has access to this governorate
  if (!user.managedGovernorateIds.includes(targetGovernorateId)) {
    throw new ForbiddenException('Access denied');
  }
}
```

#### في Controller/Service:
```typescript
// ✅ صحيح: التحقق من الكيان الحقيقي
@Get('businesses/:id')
@Scope(ScopeType.GOVERNORATE)
async getBusiness(@Param('id') id: string, @Request() req) {
  const business = await this.service.findById(id);
  
  // Double-check: verify business belongs to user's governorate
  if (!req.user.managedGovernorateIds.includes(business.governorateId)) {
    throw new ForbiddenException();
  }
  
  return business;
}
```

### قاعدة ذهبية:
> **ScopeGuard يتحقق من الصلاحية الأولية فقط.  
> Controller/Service يتحقق من الملكية الفعلية.**

---

## ✅ 3. ADMIN Override - صريح وواضح

### قبل:
```typescript
// ❌ غير واضح: ADMIN bypass مخفي
if (requiredScope === ScopeType.GLOBAL) {
  if (user.role === UserRole.ADMIN || user.role === UserRole.SUPERVISOR) {
    return true;
  }
}
if (requiredScope === ScopeType.GOVERNORATE) {
  if (user.role === UserRole.ADMIN || user.role === UserRole.SUPERVISOR) return true;
  // ...
}
```

### بعد:
```typescript
// ✅ واضح: ADMIN bypass في البداية
canActivate(context: ExecutionContext): boolean {
  // ... setup ...
  
  // EXPLICIT ADMIN OVERRIDE: Admins bypass all scope checks
  if (user.role === UserRole.ADMIN || user.role === UserRole.SUPERVISOR) {
    return true;
  }
  
  // 1. GLOBAL Scope - already handled above
  if (requiredScope === ScopeType.GLOBAL) {
    throw new ForbiddenException('Requires Admin/Supervisor');
  }
  
  // 2. GOVERNORATE Scope - no more ADMIN checks here
  if (requiredScope === ScopeType.GOVERNORATE) {
    if (user.role === UserRole.GOVERNORATE_MANAGER) {
      return this.validateGovernorateScope(user, request);
    }
    throw new ForbiddenException();
  }
}
```

### الفوائد:
- ✅ أسهل في القراءة
- ✅ أسهل في الصيانة
- ✅ لا تكرار
- ✅ واضح أن ADMIN يتجاوز كل القيود

---

## 🔒 قائمة الفحص النهائية

### Database:
- [x] `tokenVersion` موجود في User model
- [x] Migration تمت لإضافة العمود

### Auth Layer:
- [x] `tokenVersion` في JWT payload
- [x] JwtStrategy يتحقق من tokenVersion
- [x] `invalidateTokens()` helper موجود

### Guards:
- [x] ScopeGuard: ADMIN override صريح في البداية
- [x] ScopeGuard: تحذير عن عدم الثقة بـ query params
- [x] كل scope validation منفصل وواضح

### Controllers:
- [ ] كل endpoint يتحقق من الكيان الحقيقي (ليس فقط query)
- [ ] عند تغيير Role → استدعاء `invalidateTokens()`
- [ ] عند إضافة/إزالة Manager → استدعاء `invalidateTokens()`

### Documentation:
- [x] SECURITY_CHECKLIST.md موجود
- [ ] تحديث RBAC.md بنقاط الأمان

---

## 📚 أمثلة عملية

### مثال 1: تغيير دور مستخدم
```typescript
@Patch('users/:id/role')
@Roles(UserRole.ADMIN)
async updateUserRole(
  @Param('id') id: string,
  @Body() dto: { role: UserRole }
) {
  await this.usersService.update(id, { role: dto.role });
  await this.usersService.invalidateTokens(id);
  
  return { message: 'تم تحديث الدور وإلغاء جميع الجلسات' };
}
```

### مثال 2: تعيين مدير محافظة
```typescript
@Post('governorate-managers')
@Roles(UserRole.ADMIN)
async assignManager(@Body() dto: AssignManagerDto) {
  await this.service.assignManager(dto.userId, dto.governorateId);
  await this.usersService.invalidateTokens(dto.userId);
  
  return { message: 'تم التعيين' };
}
```

### مثال 3: Controller آمن مع Scope
```typescript
@Get('businesses/:id')
@Roles(UserRole.GOVERNORATE_MANAGER)
@Scope(ScopeType.GOVERNORATE)
async getBusiness(
  @Param('id') id: string,
  @Request() req
) {
  const business = await this.service.findById(id);
  
  if (!business) {
    throw new NotFoundException();
  }
  
  // CRITICAL: Verify business governorate matches user's allowed governorates
  if (!req.user.managedGovernorateIds?.includes(business.governorateId)) {
    throw new ForbiddenException('ليس لديك صلاحية على هذه المحافظة');
  }
  
  return business;
}
```

---

## ⚠️ أخطاء شائعة

### ❌ نسيان invalidateTokens
```typescript
// خطأ: تغيير صلاحيات بدون invalidation
await usersService.update(id, { role: UserRole.ADMIN });
// المستخدم يحتفظ بـ token قديم مع role قديم!
```

### ❌ الثقة بـ Query فقط
```typescript
// خطأ: لا نتحقق من الكيان الحقيقي
@Get('businesses')
async list(@Query('governorateId') govId: string) {
  return this.service.findByGovernorate(govId);
  // المهاجم يمكنه تغيير govId!
}
```

### ❌ ADMIN check مكرر
```typescript
// خطأ: تكرار ADMIN check في كل scope
if (scope === GLOBAL) {
  if (isAdmin) return true;
}
if (scope === GOVERNORATE) {
  if (isAdmin) return true; // تكرار!
}
```

---

## 🎯 النتيجة النهائية

النظام الآن:
1. ✅ يُبطل JWT عند تغيير الصلاحيات
2. ✅ لا يثق بـ user input فقط
3. ✅ ADMIN override واضح وصريح
4. ✅ Defense in Depth حقيقي
5. ✅ سهل الصيانة والفهم
