import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { GovernoratesService } from './governorates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '@greenpages/database';
import { CreateGovernorateDto } from './dto/create-governorate.dto';
import { UpdateGovernorateDto } from './dto/update-governorate.dto';

@ApiTags('governorates')
@Controller('governorates')
export class GovernoratesController {
  constructor(private readonly governoratesService: GovernoratesService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'قائمة المحافظات' })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiQuery({ name: 'includeCities', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'قائمة المحافظات' })
  async findAll(
    @Query('active') active?: boolean,
    @Query('includeCities') includeCities?: boolean,
  ) {
    if (active) {
      return this.governoratesService.findAllActive();
    }
    return this.governoratesService.findAll({ includeCities });
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'عرض محافظة' })
  @ApiResponse({ status: 200, description: 'بيانات المحافظة' })
  @ApiResponse({ status: 404, description: 'المحافظة غير موجودة' })
  async findOne(@Param('id') id: string) {
    const governorate = await this.governoratesService.findById(id);
    if (!governorate) {
      throw new NotFoundException('المحافظة غير موجودة');
    }
    return governorate;
  }

  @Get('slug/:slug')
  @Public()
  @ApiOperation({ summary: 'عرض محافظة بالـ slug' })
  @ApiResponse({ status: 200, description: 'بيانات المحافظة' })
  @ApiResponse({ status: 404, description: 'المحافظة غير موجودة' })
  async findBySlug(@Param('slug') slug: string) {
    const governorate = await this.governoratesService.findBySlug(slug);
    if (!governorate) {
      throw new NotFoundException('المحافظة غير موجودة');
    }
    return governorate;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'إضافة محافظة' })
  @ApiResponse({ status: 201, description: 'تم الإضافة بنجاح' })
  async create(@Body() createGovernorateDto: CreateGovernorateDto) {
    return this.governoratesService.create(createGovernorateDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تحديث محافظة' })
  @ApiResponse({ status: 200, description: 'تم التحديث بنجاح' })
  async update(@Param('id') id: string, @Body() updateGovernorateDto: UpdateGovernorateDto) {
    return this.governoratesService.update(id, updateGovernorateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'حذف محافظة' })
  @ApiResponse({ status: 200, description: 'تم الحذف بنجاح' })
  async remove(@Param('id') id: string) {
    await this.governoratesService.delete(id);
    return { message: 'تم حذف المحافظة بنجاح' };
  }
}
