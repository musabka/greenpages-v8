import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserDashboardService } from './user-dashboard.service';
import { UserDashboardController } from './user-dashboard.controller';

@Module({
  controllers: [UsersController, UserDashboardController],
  providers: [UsersService, UserDashboardService],
  exports: [UsersService, UserDashboardService],
})
export class UsersModule {}
