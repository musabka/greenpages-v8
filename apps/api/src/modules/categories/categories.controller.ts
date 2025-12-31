import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '@greenpages/database';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'قائمة التصنيفات' })
  @ApiQuery({ name: 'parentId', required: false, type: String })
  @ApiQuery({ name: 'featured', required: false, type: Boolean })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  async findAll(
    @Query('parentId') parentId?: string,
    @Query('featured') featured?: boolean,
    @Query('active') active?: boolean,
  ) {
    return this.categoriesService.findAll({ parentId, featured, active });
  }

  @Get('tree')
  @Public()
  @ApiOperation({ summary: 'شجرة التصنيفات' })
  async getTree() {
    return this.categoriesService.findAllTree();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'عرض تصنيف' })
  async findOne(@Param('id') id: string) {
    const category = await this.categoriesService.findById(id);
    if (!category) {
      throw new NotFoundException('التصنيف غير موجود');
    }
    return category;
  }

  @Get('slug/:slug')
  @Public()
  @ApiOperation({ summary: 'عرض تصنيف بالـ slug' })
  async findBySlug(@Param('slug') slug: string) {
    const category = await this.categoriesService.findBySlug(slug);
    if (!category) {
      throw new NotFoundException('التصنيف غير موجود');
    }
    return category;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'إضافة تصنيف' })
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تحديث تصنيف' })
  async update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'حذف تصنيف' })
  async remove(@Param('id') id: string) {
    await this.categoriesService.delete(id);
    return { message: 'تم حذف التصنيف بنجاح' };
  }
}
