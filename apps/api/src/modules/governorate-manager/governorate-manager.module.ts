import { Module } from '@nestjs/common';
import { GovernorateManagerService } from './governorate-manager.service';
import { GovernorateManagerController } from './governorate-manager.controller';
import { BusinessesModule } from '../businesses/businesses.module';
import { CommissionsModule } from '../commissions/commissions.module';

@Module({
  imports: [BusinessesModule, CommissionsModule],
  controllers: [GovernorateManagerController],
  providers: [GovernorateManagerService],
  exports: [GovernorateManagerService],
})
export class GovernorateManagerModule {}
