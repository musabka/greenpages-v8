import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdsService } from './ads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole, AdStatus, AdPosition } from '@greenpages/database';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';

@ApiTags('ads')
@Controller('ads')
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'قائمة الإعلانات' })
  @ApiQuery({ name: 'status', required: false, enum: AdStatus })
  @ApiQuery({ name: 'position', required: false, enum: AdPosition })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: AdStatus,
    @Query('position') position?: AdPosition,
  ) {
    const skip = (page - 1) * limit;
    return this.adsService.findAll({ skip, take: limit, status, position });
  }

  @Get('active')
  @Public()
  @ApiOperation({ summary: 'الإعلانات النشطة - مع الاستهداف الجغرافي' })
  @ApiQuery({ name: 'position', required: false, enum: AdPosition })
  @ApiQuery({ name: 'governorateId', required: false, description: 'معرف محافظة المستخدم للاستهداف' })
  @ApiQuery({ name: 'cityId', required: false, description: 'معرف مدينة المستخدم للاستهداف' })
  async findActive(
    @Query('position') position?: AdPosition,
    @Query('governorateId') governorateId?: string,
    @Query('cityId') cityId?: string,
  ) {
    return this.adsService.findActive(position, governorateId, cityId);
  }

  @Get('stats/targeting')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'إحصائيات الاستهداف الجغرافي' })
  async getTargetingStats() {
    return this.adsService.getTargetingStats();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'عرض إعلان' })
  async findOne(@Param('id') id: string) {
    return this.adsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'إضافة إعلان' })
  async create(@Body() createAdDto: CreateAdDto) {
    return this.adsService.create(createAdDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تحديث إعلان' })
  async update(@Param('id') id: string, @Body() updateAdDto: UpdateAdDto) {
    return this.adsService.update(id, updateAdDto);
  }

  @Patch(':id/click')
  @Public()
  @ApiOperation({ summary: 'تسجيل نقرة على إعلان' })
  async click(@Param('id') id: string) {
    await this.adsService.incrementClick(id);
    return { success: true };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'حذف إعلان' })
  async remove(@Param('id') id: string) {
    await this.adsService.delete(id);
    return { message: 'تم حذف الإعلان بنجاح' };
  }
}
