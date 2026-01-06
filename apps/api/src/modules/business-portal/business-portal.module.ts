import { Module } from '@nestjs/common';
import { BusinessPortalController } from './business-portal.controller';
import { BusinessPortalService } from './business-portal.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { PackagesModule } from '../packages/packages.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, PackagesModule, NotificationsModule],
  controllers: [BusinessPortalController],
  providers: [BusinessPortalService],
  exports: [BusinessPortalService],
})
export class BusinessPortalModule {}
