import { Module, forwardRef } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController, UserAccountingCompatController } from './billing.controller';
import { BillingAdminController, AdminAccountingCompatController } from './billing-admin.controller';
import { PrismaModule } from '../../prisma/prisma.module';

/**
 * Billing Module - نظام الفوترة المبسط
 * 
 * يحل محل نظام المحاسبة المعقد ويركز فقط على:
 * - إنشاء وإدارة الفواتير
 * - تسجيل المدفوعات
 * - عرض الفواتير للمستخدمين والإدارة
 * 
 * يوفر أيضًا controllers للتوافق مع الـ endpoints القديمة:
 * - /user/accounting/* (UserAccountingCompatController)
 * - /admin/accounting/* (AdminAccountingCompatController)
 */
@Module({
  imports: [PrismaModule],
  controllers: [
    BillingController,
    UserAccountingCompatController,
    BillingAdminController,
    AdminAccountingCompatController,
  ],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
