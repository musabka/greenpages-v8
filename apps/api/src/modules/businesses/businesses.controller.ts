import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BusinessesService } from './businesses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole, BusinessStatus } from '@greenpages/database';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@ApiTags('businesses')
@Controller('businesses')
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'قائمة الأنشطة التجارية' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'governorateId', required: false, type: String })
  @ApiQuery({ name: 'cityId', required: false, type: String })
  @ApiQuery({ name: 'districtId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: BusinessStatus })
  @ApiQuery({ name: 'ownerStatus', required: false, enum: ['unclaimed', 'claimed', 'verified'] })
  @ApiQuery({ name: 'featured', required: false, type: Boolean })
  @ApiQuery({ name: 'verified', required: false, type: Boolean })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('governorateId') governorateId?: string,
    @Query('cityId') cityId?: string,
    @Query('districtId') districtId?: string,
    @Query('status') status?: BusinessStatus,
    @Query('ownerStatus') ownerStatus?: 'unclaimed' | 'claimed' | 'verified',
    @Query('featured') featured?: boolean,
    @Query('verified') verified?: boolean,
  ) {
    const skip = (page - 1) * limit;
    return this.businessesService.findAll({
      skip,
      take: limit,
      search,
      categoryId,
      governorateId,
      cityId,
      districtId,
      status,
      ownerStatus,
      featured,
      verified,
    });
  }

  @Get('featured')
  @Public()
  @ApiOperation({ summary: 'الأنشطة المميزة' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getFeatured(@Query('limit') limit: number = 10) {
    return this.businessesService.getFeatured(limit);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'إحصائيات الأنشطة التجارية' })
  async getStats() {
    return this.businessesService.getStats();
  }

  @Get('search')
  @Public()
  @ApiOperation({ summary: 'البحث في الأنشطة التجارية' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiQuery({ name: 'governorateId', required: false, type: String })
  @ApiQuery({ name: 'cityId', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async search(
    @Query('q') query: string,
    @Query('governorateId') governorateId?: string,
    @Query('cityId') cityId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('limit') limit?: number,
  ) {
    return this.businessesService.search(query, { governorateId, cityId, categoryId, limit });
  }

  @Get('map')
  @Public()
  @ApiOperation({ summary: 'الأنشطة التجارية على الخريطة' })
  @ApiQuery({ name: 'governorateId', required: false, type: String })
  @ApiQuery({ name: 'cityId', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'north', required: false, type: Number })
  @ApiQuery({ name: 'south', required: false, type: Number })
  @ApiQuery({ name: 'east', required: false, type: Number })
  @ApiQuery({ name: 'west', required: false, type: Number })
  async getMapBusinesses(
    @Query('governorateId') governorateId?: string,
    @Query('cityId') cityId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('north') north?: number,
    @Query('south') south?: number,
    @Query('east') east?: number,
    @Query('west') west?: number,
  ) {
    const bounds = north && south && east && west ? { north, south, east, west } : undefined;
    return this.businessesService.getMapBusinesses({ governorateId, cityId, categoryId, bounds });
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'عرض نشاط تجاري بالمعرف' })
  async findOne(@Param('id') id: string) {
    return this.businessesService.findById(id);
  }

  @Get('slug/:slug')
  @Public()
  @ApiOperation({ summary: 'عرض نشاط تجاري بالـ slug' })
  async findBySlug(@Param('slug') slug: string) {
    return this.businessesService.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.AGENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'إضافة نشاط تجاري' })
  async create(@Body() createBusinessDto: CreateBusinessDto, @Request() req: any) {
    const data = {
      ...createBusinessDto,
      createdById: req.user.id,
      agentId: req.user.role === UserRole.AGENT ? req.user.id : createBusinessDto.agentId,
    };
    return this.businessesService.create(data);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.AGENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تحديث نشاط تجاري' })
  async update(@Param('id') id: string, @Body() updateBusinessDto: UpdateBusinessDto) {
    return this.businessesService.update(id, updateBusinessDto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تغيير حالة نشاط تجاري' })
  async updateStatus(@Param('id') id: string, @Body('status') status: BusinessStatus) {
    return this.businessesService.updateStatus(id, status);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'حذف نشاط تجاري' })
  async remove(@Param('id') id: string) {
    await this.businessesService.delete(id);
    return { message: 'تم حذف النشاط التجاري بنجاح' };
  }

  @Post(':id/owner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.GOVERNORATE_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ربط نشاط بمالك' })
  async linkOwner(
    @Param('id') businessId: string,
    @Body('userId') userId: string,
    @Request() req: any,
  ) {
    return this.businessesService.linkOwner(businessId, userId, req.user.id);
  }

  @Delete(':id/owner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.GOVERNORATE_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'فصل نشاط عن مالكه' })
  async unlinkOwner(
    @Param('id') businessId: string,
    @Request() req: any,
  ) {
    return this.businessesService.unlinkOwner(businessId, req.user.id);
  }

  @Get(':id/ownership-audit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'سجل تغييرات ملكية النشاط' })
  async getOwnershipAudit(@Param('id') businessId: string) {
    return this.businessesService.getOwnershipAudit(businessId);
  }

  @Post('bulk/link-owner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.GOVERNORATE_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ربط مجموعة أنشطة بمالك واحد' })
  async bulkLinkOwner(
    @Body('businessIds') businessIds: string[],
    @Body('userId') userId: string,
    @Request() req: any,
  ) {
    return this.businessesService.bulkLinkOwner(businessIds, userId, req.user.id);
  }

  @Post('bulk/unlink-owner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.GOVERNORATE_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'فصل مجموعة أنشطة عن مالكيها' })
  async bulkUnlinkOwner(
    @Body('businessIds') businessIds: string[],
    @Request() req: any,
  ) {
    return this.businessesService.bulkUnlinkOwner(businessIds, req.user.id);
  }
}
