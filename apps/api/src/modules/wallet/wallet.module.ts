import { Module, forwardRef } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { WalletAdminController } from './wallet-admin.controller';
import { WalletBillingBridge } from './wallet-billing.bridge';
import { BillingModule } from '../billing/billing.module';
import { PackagesModule } from '../packages/packages.module';

@Module({
  imports: [
    forwardRef(() => BillingModule),
    forwardRef(() => PackagesModule),
  ],
  controllers: [WalletController, WalletAdminController],
  providers: [WalletService, WalletBillingBridge],
  exports: [WalletService, WalletBillingBridge],
})
export class WalletModule {}
