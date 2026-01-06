import { Module, forwardRef } from '@nestjs/common';
import { CommissionsService } from './commissions.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [PrismaModule, forwardRef(() => AccountingModule)],
  providers: [CommissionsService],
  exports: [CommissionsService],
})
export class CommissionsModule {}
