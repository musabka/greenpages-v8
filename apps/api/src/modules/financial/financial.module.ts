import { Module } from '@nestjs/common';
import { FinancialController } from './financial.controller';
import { FinancialService } from './financial.service';
import { FinancialSettlementsController } from './financial-settlements.controller';
import { FinancialSettlementsService } from './financial-settlements.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FinancialController, FinancialSettlementsController],
  providers: [FinancialService, FinancialSettlementsService],
  exports: [FinancialService, FinancialSettlementsService],
})
export class FinancialModule {}
