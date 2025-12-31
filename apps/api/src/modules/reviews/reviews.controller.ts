import { Controller, Get, Post, Delete, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole, ReviewStatus } from '@greenpages/database';
import { CreateReviewDto } from './dto/create-review.dto';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'قائمة المراجعات (للإدارة)' })
  @ApiQuery({ name: 'status', required: false, enum: ReviewStatus })
  @ApiQuery({ name: 'businessId', required: false, type: String })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: ReviewStatus,
    @Query('businessId') businessId?: string,
  ) {
    const skip = (page - 1) * limit;
    return this.reviewsService.findAll({ skip, take: limit, status, businessId });
  }

  @Get('business/:slug')
  @Public()
  @ApiOperation({ summary: 'مراجعات نشاط تجاري' })
  async findByBusiness(@Param('slug') slug: string) {
    return this.reviewsService.findByBusinessSlug(slug);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'مراجعاتي' })
  @ApiQuery({ name: 'status', required: false, enum: ReviewStatus })
  async findMine(
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: ReviewStatus,
  ) {
    const skip = (page - 1) * limit;
    return this.reviewsService.findAll({ skip, take: limit, status, userId: req.user.id });
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'عرض مراجعة' })
  async findOne(@Param('id') id: string) {
    return this.reviewsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'إضافة مراجعة' })
  async create(@Body() createReviewDto: CreateReviewDto, @Request() req: any) {
    return this.reviewsService.create({
      ...createReviewDto,
      userId: req.user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تغيير حالة المراجعة' })
  async updateStatus(@Param('id') id: string, @Body('status') status: ReviewStatus) {
    return this.reviewsService.updateStatus(id, status);
  }

  @Patch(':id/reply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'الرد على مراجعة' })
  async reply(@Param('id') id: string, @Body() body: { replyAr: string; replyEn?: string }) {
    return this.reviewsService.reply(id, body.replyAr, body.replyEn);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'حذف مراجعة' })
  async remove(@Param('id') id: string, @Request() req: any) {
    const isAdmin = [UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(req.user.role);
    await this.reviewsService.delete(id, req.user.id, isAdmin);
    return { message: 'تم حذف المراجعة بنجاح' };
  }
}
