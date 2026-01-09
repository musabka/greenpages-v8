import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DistrictsService } from './districts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '@greenpages/database';
import { CreateDistrictDto } from './dto/create-district.dto';
import { UpdateDistrictDto } from './dto/update-district.dto';

@ApiTags('districts')
@Controller('districts')
export class DistrictsController {
  constructor(private readonly districtsService: DistrictsService) { }

  @Get()
  @Public()
  @ApiOperation({ summary: 'قائمة الأحياء' })
  @ApiQuery({ name: 'cityId', required: false, type: String })
  async findAll(@Query('cityId') cityId?: string) {
    return this.districtsService.findAll({ cityId });
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'عرض حي' })
  async findOne(@Param('id') id: string) {
    const district = await this.districtsService.findById(id);
    if (!district) {
      throw new NotFoundException('الحي غير موجود');
    }
    return district;
  }

  @Get('slug/:slug')
  @Public()
  @ApiOperation({ summary: 'عرض حي بالـ slug' })
  async findBySlug(@Param('slug') slug: string) {
    const district = await this.districtsService.findBySlug(slug);
    if (!district) {
      throw new NotFoundException('الحي غير موجود');
    }
    return district;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'إضافة حي' })
  async create(@Body() createDistrictDto: CreateDistrictDto) {
    return this.districtsService.create(createDistrictDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تحديث حي' })
  async update(@Param('id') id: string, @Body() updateDistrictDto: UpdateDistrictDto) {
    return this.districtsService.update(id, updateDistrictDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'حذف حي' })
  async remove(@Param('id') id: string) {
    await this.districtsService.delete(id);
    return { message: 'تم حذف الحي بنجاح' };
  }
}
