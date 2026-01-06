import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import {
  CreateNotificationDto,
  UpdateNotificationDto,
  NotificationQueryDto,
  UpdatePreferencesDto,
  RegisterDeviceDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('الإشعارات')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // ==========================================
  // إشعارات المستخدم الحالي
  // ==========================================

  @Get()
  @ApiOperation({ summary: 'جلب إشعارات المستخدم الحالي' })
  @ApiResponse({ status: 200, description: 'قائمة الإشعارات' })
  async getMyNotifications(
    @CurrentUser('id') userId: string,
    @Query() query: NotificationQueryDto,
  ) {
    return this.notificationsService.findUserNotifications(userId, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'عدد الإشعارات غير المقروءة' })
  async getUnreadCount(@CurrentUser('id') userId: string) {
    const stats = await this.notificationsService.getNotificationStats(userId);
    return { unreadCount: stats.unread };
  }

  @Get('stats')
  @ApiOperation({ summary: 'إحصائيات الإشعارات' })
  async getMyStats(@CurrentUser('id') userId: string) {
    return this.notificationsService.getNotificationStats(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'جلب إشعار محدد' })
  async getNotification(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'تحديث إشعار (قراءة/أرشفة)' })
  async updateNotification(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateNotificationDto,
  ) {
    return this.notificationsService.update(id, userId, dto);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'تعليم إشعار كمقروء' })
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.update(id, userId, { isRead: true });
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'تعليم كل الإشعارات كمقروءة' })
  async markAllAsRead(@CurrentUser('id') userId: string) {
    const result = await this.notificationsService.markAllAsRead(userId);
    return { message: 'تم تعليم كل الإشعارات كمقروءة', count: result.count };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف إشعار' })
  async deleteNotification(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.notificationsService.delete(id, userId);
    return { message: 'تم حذف الإشعار' };
  }

  @Delete('read/all')
  @ApiOperation({ summary: 'حذف كل الإشعارات المقروءة' })
  async deleteAllRead(@CurrentUser('id') userId: string) {
    const result = await this.notificationsService.deleteAllRead(userId);
    return { message: 'تم حذف الإشعارات المقروءة', count: result.count };
  }

  // ==========================================
  // تفضيلات الإشعارات
  // ==========================================

  @Get('preferences/my')
  @ApiOperation({ summary: 'جلب تفضيلات الإشعارات' })
  async getMyPreferences(@CurrentUser('id') userId: string) {
    return this.notificationsService.getPreferences(userId);
  }

  @Patch('preferences/my')
  @ApiOperation({ summary: 'تحديث تفضيلات الإشعارات' })
  async updateMyPreferences(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.notificationsService.updatePreferences(userId, dto);
  }

  // ==========================================
  // إدارة الأجهزة (Push Notifications)
  // ==========================================

  @Get('devices/my')
  @ApiOperation({ summary: 'جلب أجهزة المستخدم' })
  async getMyDevices(@CurrentUser('id') userId: string) {
    return this.notificationsService.getUserDevices(userId);
  }

  @Post('devices/register')
  @ApiOperation({ summary: 'تسجيل جهاز جديد' })
  async registerDevice(
    @CurrentUser('id') userId: string,
    @Body() dto: RegisterDeviceDto,
  ) {
    return this.notificationsService.registerDevice(userId, dto);
  }

  @Post('devices/unregister')
  @ApiOperation({ summary: 'إلغاء تسجيل جهاز' })
  async unregisterDevice(
    @CurrentUser('id') userId: string,
    @Body('deviceToken') deviceToken: string,
  ) {
    await this.notificationsService.unregisterDevice(userId, deviceToken);
    return { message: 'تم إلغاء تسجيل الجهاز' };
  }
}
