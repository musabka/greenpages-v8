import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CitiesService } from './cities.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '@greenpages/database';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';

@ApiTags('cities')
@Controller('cities')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) { }

  @Get()
  @Public()
  @ApiOperation({ summary: 'قائمة المدن' })
  @ApiQuery({ name: 'governorateId', required: false, type: String })
  @ApiQuery({ name: 'includeDistricts', required: false, type: Boolean })
  async findAll(
    @Query('governorateId') governorateId?: string,
    @Query('includeDistricts') includeDistricts?: boolean,
  ) {
    return this.citiesService.findAll({ governorateId, includeDistricts });
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'عرض مدينة' })
  async findOne(@Param('id') id: string) {
    const city = await this.citiesService.findById(id);
    if (!city) {
      throw new NotFoundException('المدينة غير موجودة');
    }
    return city;
  }

  @Get('slug/:slug')
  @Public()
  @ApiOperation({ summary: 'عرض مدينة بالـ slug' })
  async findBySlug(@Param('slug') slug: string) {
    const city = await this.citiesService.findBySlug(slug);
    if (!city) {
      throw new NotFoundException('المدينة غير موجودة');
    }
    return city;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'إضافة مدينة' })
  async create(@Body() createCityDto: CreateCityDto) {
    return this.citiesService.create(createCityDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تحديث مدينة' })
  async update(@Param('id') id: string, @Body() updateCityDto: UpdateCityDto) {
    return this.citiesService.update(id, updateCityDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'حذف مدينة' })
  async remove(@Param('id') id: string) {
    await this.citiesService.delete(id);
    return { message: 'تم حذف المدينة بنجاح' };
  }
}
