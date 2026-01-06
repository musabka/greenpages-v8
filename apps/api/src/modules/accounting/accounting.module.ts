import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AccountingAdminController } from './accounting-admin.controller';
import { AccountingService } from './accounting.service';
import { AccountingPolicyService } from './accounting-policy.service';
import { AccountingReconciliationService } from './accounting-reconciliation.service';

@Module({
  imports: [PrismaModule],
  controllers: [AccountingAdminController],
  providers: [
    AccountingService,
    AccountingPolicyService,
    AccountingReconciliationService,
  ],
  exports: [
    AccountingService,
    AccountingPolicyService,
    AccountingReconciliationService,
  ],
})
export class AccountingModule {}
