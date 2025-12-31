import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PackagesService } from '../packages.service';
import { CHECK_FEATURE_KEY, CHECK_LIMIT_KEY } from '../decorators/package.decorator';
import { FeatureKey, LimitKey, UserRole } from '@greenpages/database';

@Injectable()
export class PackageGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private packagesService: PackagesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const feature = this.reflector.get<FeatureKey>(CHECK_FEATURE_KEY, context.getHandler());
    const limit = this.reflector.get<LimitKey>(CHECK_LIMIT_KEY, context.getHandler());

    if (!feature && !limit) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Super Admins bypass package checks
    if (user?.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // This guard expects a businessId in the request (either in params, body, or from the user if they are a BUSINESS owner)
    const businessId = request.params.businessId || request.body.businessId || (user?.role === UserRole.BUSINESS ? await this.getBusinessIdForUser(user.id) : null);

    if (!businessId) {
      // If we can't identify the business, we might allow it if it's not a restricted action, 
      // but usually, if a feature/limit is required, businessId should be present.
      throw new ForbiddenException('لم يتم تحديد النشاط التجاري للتحقق من الصلاحية');
    }

    if (feature) {
      const hasFeature = await this.packagesService.canBusinessUseFeature(businessId, feature);
      if (!hasFeature) {
        throw new ForbiddenException(`هذه الميزة غير متاحة في باقتك الحالية: ${feature}`);
      }
    }

    // Limit check is more complex because it usually requires comparing current count with max limit.
    // Here we just ensure the business HAS a package that defines this limit.
    // The actual count check should happen in the service.
    if (limit) {
      const limitValue = await this.packagesService.getBusinessLimit(businessId, limit);
      if (limitValue <= 0) {
         throw new ForbiddenException(`بناءً على باقتك الحالية، لا يمكنك استخدام: ${limit}`);
      }
    }

    return true;
  }

  private async getBusinessIdForUser(userId: string): Promise<string | null> {
    // Helper to find business owned by this user
    // Implementation depends on PrismaService, but since we are in a Guard, 
    // we might need to inject PrismaService or use PackagesService if it has this method.
    // For now, let's assume the businessId is passed in the request.
    return null; 
  }
}
