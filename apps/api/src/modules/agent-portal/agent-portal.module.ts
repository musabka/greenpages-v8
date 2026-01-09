import { Module, forwardRef } from '@nestjs/common';
import { AgentPortalService } from './agent-portal.service';
import { AgentPortalController } from './agent-portal.controller';
import { WalletModule } from '../wallet/wallet.module';
import { PackagesModule } from '../packages/packages.module';

@Module({
  imports: [forwardRef(() => WalletModule), PackagesModule],
  controllers: [AgentPortalController],
  providers: [AgentPortalService],
  exports: [AgentPortalService],
})
export class AgentPortalModule {}
