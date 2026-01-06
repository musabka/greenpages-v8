import { BadRequestException, Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@greenpages/database';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.AGENT, UserRole.GOVERNORATE_MANAGER)
  @ApiOperation({ summary: 'قائمة المستخدمين' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'قائمة المستخدمين' })
  async findAll(
    @Query('page') page?: number | string,
    @Query('limit') limit?: number | string,
    @Query('role') role?: UserRole,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? Number(page) : 1;
    const limitNum = limit ? Number(limit) : 20;
    const skip = (pageNum - 1) * limitNum;
    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    return this.usersService.findAll({ skip, take: limitNum, where });
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'إنشاء مستخدم جديد' })
  @ApiResponse({ status: 201, description: 'تم إنشاء المستخدم بنجاح' })
  @ApiResponse({ status: 400, description: 'بيانات غير صحيحة' })
  async create(@Body() createUserDto: CreateUserDto) {
    if (!createUserDto.phone || !createUserDto.phone.trim()) {
      throw new BadRequestException('رقم الهاتف مطلوب');
    }
    const userData: any = {
      email: createUserDto.email,
      password: createUserDto.password,
      phone: createUserDto.phone.trim(),
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      displayName: createUserDto.displayName,
      role: createUserDto.role,
      // Map DTO fields to Prisma schema fields
      status: createUserDto.isActive ? 'ACTIVE' : 'INACTIVE',
      emailVerified: createUserDto.isEmailVerified ?? false,
      governorateId: createUserDto.governorateId,
      cityId: createUserDto.cityId,
      districtId: createUserDto.districtId,
      addressLine: createUserDto.address,
      managedGovernorateIds: createUserDto.managedGovernorateIds,
      companyCommissionRate: createUserDto.companyCommissionRate,
    };
    return this.usersService.create(userData);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'إحصائيات المستخدمين' })
  @ApiResponse({ status: 200, description: 'إحصائيات المستخدمين حسب الدور' })
  async getStats() {
    return this.usersService.countByRole();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'عرض مستخدم' })
  @ApiResponse({ status: 200, description: 'بيانات المستخدم' })
  @ApiResponse({ status: 404, description: 'المستخدم غير موجود' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'تحديث مستخدم' })
  @ApiResponse({ status: 200, description: 'تم التحديث بنجاح' })
  @ApiResponse({ status: 404, description: 'المستخدم غير موجود' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const updateData: any = {
      ...updateUserDto,
      status: updateUserDto.status ? updateUserDto.status : undefined,
    };
    return this.usersService.update(id, updateData);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'حذف مستخدم' })
  @ApiResponse({ status: 200, description: 'تم الحذف بنجاح' })
  @ApiResponse({ status: 404, description: 'المستخدم غير موجود' })
  async remove(@Param('id') id: string) {
    await this.usersService.delete(id);
    return { message: 'تم حذف المستخدم بنجاح' };
  }
}
