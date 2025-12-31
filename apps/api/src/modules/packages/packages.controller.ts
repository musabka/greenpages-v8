import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PackagesService } from './packages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole, FeatureKey } from '@greenpages/database';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { AssignPackageDto } from './dto/assign-package.dto';

@ApiTags('packages')
@Controller('packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'قائمة الباقات المتاحة' })
  async findAll() {
    return this.packagesService.findAllPackages();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'عرض تفاصيل باقة معينة' })
  async findOne(@Param('id') id: string) {
    return this.packagesService.findPackageById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'إنشاء باقة جديدة (مدير النظام فقط)' })
  async create(@Body() createPackageDto: CreatePackageDto) {
    return this.packagesService.createPackage(createPackageDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تحديث بيانات باقة (مدير النظام فقط)' })
  async update(@Param('id') id: string, @Body() updatePackageDto: UpdatePackageDto) {
    return this.packagesService.updatePackage(id, updatePackageDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'حذف باقة (مدير النظام فقط)' })
  async remove(@Param('id') id: string) {
    await this.packagesService.deletePackage(id);
    return { message: 'تم حذف الباقة بنجاح' };
  }

  @Post('assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تعيين باقة لنشاط تجاري (إداري فقط)' })
  async assign(@Body() assignPackageDto: AssignPackageDto) {
    return this.packagesService.assignPackage(assignPackageDto);
  }

  @Get('business/:businessId')
  @Public()
  @ApiOperation({ summary: 'الحصول على الباقة الحالية لنشاط تجاري' })
  async getBusinessPackage(@Param('businessId') businessId: string) {
    return this.packagesService.getBusinessPackage(businessId);
  }

  @Get('check-feature/:businessId')
  @Public()
  @ApiOperation({ summary: 'التحقق من توفر ميزة معينة لنشاط تجاري' })
  async checkFeature(
    @Param('businessId') businessId: string,
    @Query('featureKey') featureKey: FeatureKey,
  ) {
    const isEnabled = await this.packagesService.canBusinessUseFeature(businessId, featureKey);
    return { isEnabled };
  }
}
