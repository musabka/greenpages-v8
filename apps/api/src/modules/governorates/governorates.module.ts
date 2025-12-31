import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { GovernoratesService } from './governorates.service';
import { GovernoratesController } from './governorates.controller';

@Module({
  imports: [PrismaModule],
  controllers: [GovernoratesController],
  providers: [GovernoratesService],
  exports: [GovernoratesService],
})
export class GovernoratesModule {}
