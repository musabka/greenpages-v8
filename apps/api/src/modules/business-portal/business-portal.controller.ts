import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BusinessPortalService } from './business-portal.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@greenpages/database';

@ApiTags('business-portal')
@Controller('business-portal')
@UseGuards(JwtAuthGuard, RolesGuard)
// Business access via hasBusinessAccess flag in JWT + CapabilitiesService
@ApiBearerAuth()
export class BusinessPortalController {
  constructor(private readonly portalService: BusinessPortalService) {}

  // =====================
  // Dashboard
  // =====================

  @Get('me')
  @ApiOperation({ summary: 'الحصول على بيانات نشاطي التجاري' })
  async getMyBusiness(@Request() req: any) {
    return this.portalService.getMyBusiness(req.user.id);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'إحصائيات لوحة التحكم' })
  async getDashboardStats(@Request() req: any) {
    return this.portalService.getDashboardStats(req.user.id);
  }

  @Get('analytics/views')
  @ApiOperation({ summary: 'مخطط المشاهدات' })
  @ApiQuery({ name: 'period', required: false, enum: ['week', 'month', 'year'] })
  async getViewsChart(
    @Request() req: any,
    @Query('period') period: 'week' | 'month' | 'year' = 'month',
  ) {
    return this.portalService.getViewsChart(req.user.id, period);
  }

  // =====================
  // Profile
  // =====================

  @Put('profile')
  @ApiOperation({ summary: 'تحديث معلومات النشاط' })
  async updateProfile(@Request() req: any, @Body() data: any) {
    return this.portalService.updateProfile(req.user.id, data);
  }

  @Put('contacts')
  @ApiOperation({ summary: 'تحديث معلومات الاتصال' })
  async updateContacts(@Request() req: any, @Body() contacts: any[]) {
    return this.portalService.updateContacts(req.user.id, contacts);
  }

  @Put('working-hours')
  @ApiOperation({ summary: 'تحديث ساعات العمل' })
  async updateWorkingHours(@Request() req: any, @Body() hours: any[]) {
    return this.portalService.updateWorkingHours(req.user.id, hours);
  }

  // =====================
  // Branches
  // =====================

  @Get('branches')
  @ApiOperation({ summary: 'قائمة الفروع' })
  async getBranches(@Request() req: any) {
    return this.portalService.getBranches(req.user.id);
  }

  @Post('branches')
  @ApiOperation({ summary: 'إضافة فرع جديد' })
  async createBranch(@Request() req: any, @Body() data: any) {
    return this.portalService.createBranch(req.user.id, data);
  }

  @Put('branches/:id')
  @ApiOperation({ summary: 'تحديث فرع' })
  async updateBranch(
    @Request() req: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.portalService.updateBranch(req.user.id, id, data);
  }

  @Delete('branches/:id')
  @ApiOperation({ summary: 'حذف فرع' })
  async deleteBranch(@Request() req: any, @Param('id') id: string) {
    return this.portalService.deleteBranch(req.user.id, id);
  }

  // =====================
  // Products & Services
  // =====================

  @Get('products')
  @ApiOperation({ summary: 'قائمة المنتجات والخدمات' })
  async getProducts(@Request() req: any) {
    return this.portalService.getProducts(req.user.id);
  }

  @Post('products')
  @ApiOperation({ summary: 'إضافة منتج/خدمة' })
  async createProduct(@Request() req: any, @Body() data: any) {
    return this.portalService.createProduct(req.user.id, data);
  }

  @Put('products/:id')
  @ApiOperation({ summary: 'تحديث منتج/خدمة' })
  async updateProduct(
    @Request() req: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.portalService.updateProduct(req.user.id, id, data);
  }

  @Delete('products/:id')
  @ApiOperation({ summary: 'حذف منتج/خدمة' })
  async deleteProduct(@Request() req: any, @Param('id') id: string) {
    return this.portalService.deleteProduct(req.user.id, id);
  }

  // =====================
  // Gallery
  // =====================

  @Get('gallery')
  @ApiOperation({ summary: 'معرض الصور' })
  async getGallery(@Request() req: any) {
    return this.portalService.getGallery(req.user.id);
  }

  @Post('gallery')
  @ApiOperation({ summary: 'إضافة صورة/فيديو' })
  async addMedia(@Request() req: any, @Body() data: any) {
    return this.portalService.addMedia(req.user.id, data);
  }

  @Delete('gallery/:id')
  @ApiOperation({ summary: 'حذف صورة/فيديو' })
  async deleteMedia(@Request() req: any, @Param('id') id: string) {
    return this.portalService.deleteMedia(req.user.id, id);
  }

  @Put('gallery/reorder')
  @ApiOperation({ summary: 'إعادة ترتيب المعرض' })
  async reorderMedia(@Request() req: any, @Body() body: { mediaIds: string[] }) {
    return this.portalService.reorderMedia(req.user.id, body.mediaIds);
  }

  // =====================
  // Reviews
  // =====================

  @Get('reviews')
  @ApiOperation({ summary: 'التقييمات' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'filter', required: false, enum: ['all', 'pending', 'replied'] })
  async getReviews(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('filter') filter: 'all' | 'pending' | 'replied' = 'all',
  ) {
    return this.portalService.getReviews(req.user.id, filter, Number(page), Number(limit));
  }

  @Post('reviews/:id/reply')
  @ApiOperation({ summary: 'الرد على تقييم' })
  async replyToReview(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { reply: string },
  ) {
    return this.portalService.replyToReview(req.user.id, id, body.reply);
  }

  @Put('reviews/:id/reply')
  @ApiOperation({ summary: 'تعديل الرد على تقييم' })
  async updateReviewReply(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { reply: string },
  ) {
    return this.portalService.updateReviewReply(req.user.id, id, body.reply);
  }

  @Delete('reviews/:id/reply')
  @ApiOperation({ summary: 'حذف الرد على تقييم' })
  async deleteReviewReply(@Request() req: any, @Param('id') id: string) {
    return this.portalService.deleteReviewReply(req.user.id, id);
  }

  // =====================
  // Subscription
  // =====================

  @Get('subscription')
  @ApiOperation({ summary: 'معلومات الاشتراك' })
  async getSubscription(@Request() req: any) {
    return this.portalService.getSubscription(req.user.id);
  }

  // =====================
  // Financial
  // =====================

  @Get('financial')
  @ApiOperation({ summary: 'المعلومات المالية والاشتراكات' })
  async getFinancialStats(@Request() req: any) {
    return this.portalService.getFinancialStats(req.user.id);
  }

  // =====================
  // Notifications
  // =====================

  @Get('notifications')
  @ApiOperation({ summary: 'الإشعارات' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getNotifications(
    @Request() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.portalService.getNotifications(req.user.id, page, limit);
  }

  @Patch('notifications/:id/read')
  @ApiOperation({ summary: 'تحديد إشعار كمقروء' })
  async markNotificationAsRead(@Request() req: any, @Param('id') id: string) {
    return this.portalService.markNotificationAsRead(req.user.id, id);
  }

  @Patch('notifications/read-all')
  @ApiOperation({ summary: 'تحديد كل الإشعارات كمقروءة' })
  async markAllNotificationsAsRead(@Request() req: any) {
    return this.portalService.markAllNotificationsAsRead(req.user.id);
  }
}
