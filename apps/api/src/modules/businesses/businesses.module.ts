import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { BusinessesService } from './businesses.service';
import { BusinessesController } from './businesses.controller';
import { PackagesModule } from '../packages/packages.module';
import { CommissionsModule } from '../commissions/commissions.module';
import { CapabilitiesModule } from '../capabilities/capabilities.module';

@Module({
  imports: [
    PrismaModule, 
    PackagesModule, 
    CommissionsModule,
    forwardRef(() => CapabilitiesModule),
  ],
  controllers: [BusinessesController],
  providers: [BusinessesService],
  exports: [BusinessesService],
})
export class BusinessesModule {}
