import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { BusinessesService } from './businesses.service';
import { BusinessesController } from './businesses.controller';
import { PackagesModule } from '../packages/packages.module';

@Module({
  imports: [PrismaModule, PackagesModule],
  controllers: [BusinessesController],
  providers: [BusinessesService],
  exports: [BusinessesService],
})
export class BusinessesModule {}
