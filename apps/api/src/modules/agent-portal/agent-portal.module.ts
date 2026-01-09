import { Module, forwardRef } from '@nestjs/common';
import { AgentPortalService } from './agent-portal.service';
import { AgentPortalController } from './agent-portal.controller';
import { WalletModule } from '../wallet/wallet.module';
import { PackagesModule } from '../packages/packages.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [forwardRef(() => WalletModule), PackagesModule, BillingModule],
  controllers: [AgentPortalController],
  providers: [AgentPortalService],
  exports: [AgentPortalService],
})
export class AgentPortalModule {}
