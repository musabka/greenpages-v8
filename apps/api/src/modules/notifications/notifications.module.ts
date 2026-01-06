import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationTemplatesController } from './templates.controller';
import { BulkNotificationsController } from './bulk.controller';
import { NotificationIntegrationController } from './notification-integration.controller';
import { NotificationSchedulerService } from './scheduler.service';
import { NotificationIntegrationService } from './notification-integration.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [
    NotificationsController,
    NotificationTemplatesController,
    BulkNotificationsController,
    NotificationIntegrationController,
  ],
  providers: [
    NotificationsService,
    NotificationSchedulerService,
    NotificationIntegrationService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
