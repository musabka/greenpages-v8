import { Module, forwardRef } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { WalletAdminController } from './wallet-admin.controller';
import { WalletAccountingBridge } from './wallet-accounting.bridge';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [forwardRef(() => AccountingModule)],
  controllers: [WalletController, WalletAdminController],
  providers: [WalletService, WalletAccountingBridge],
  exports: [WalletService, WalletAccountingBridge],
})
export class WalletModule {}
