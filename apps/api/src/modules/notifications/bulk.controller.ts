import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateBulkNotificationDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('الإشعارات الجماعية')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
@Controller('notifications/bulk')
export class BulkNotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('estimate')
  @ApiOperation({ summary: 'تقدير عدد المستخدمين المستهدفين' })
  async estimate(@Body() body: { targetCriteria: any }) {
    const count = await this.notificationsService.estimateTargetedUsers(body.targetCriteria);
    return { count };
  }

  @Post()
  @ApiOperation({ summary: 'إنشاء إشعار جماعي جديد' })
  @ApiResponse({ status: 201, description: 'تم إنشاء الإشعار الجماعي' })
  async create(
    @Body() dto: CreateBulkNotificationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.createBulkNotification(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'جلب كل الإشعارات الجماعية' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.notificationsService.findAllBulkNotifications(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'جلب إشعار جماعي محدد' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.findBulkNotification(id);
  }

  @Post(':id/send')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'إرسال إشعار جماعي' })
  async send(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.notificationsService.sendBulkNotification(id);
    return {
      message: 'تم إرسال الإشعار الجماعي بنجاح',
      ...result,
    };
  }

  @Post(':id/cancel')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'إلغاء إشعار جماعي مجدول' })
  async cancel(@Param('id', ParseUUIDPipe) id: string) {
    await this.notificationsService.cancelBulkNotification(id);
    return { message: 'تم إلغاء الإشعار الجماعي' };
  }
}
