import { Controller, Get, Put, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '@greenpages/database';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'جميع الإعدادات' })
  @ApiQuery({ name: 'group', required: false, type: String })
  async findAll(@Query('group') group?: string) {
    return this.settingsService.findAll(group);
  }

  @Get('public')
  @Public()
  @ApiOperation({ summary: 'الإعدادات العامة' })
  async getPublic() {
    return this.settingsService.getPublicSettings();
  }

  @Get('colors')
  @Public()
  @ApiOperation({ summary: 'متغيرات الألوان' })
  async getColors() {
    return this.settingsService.getColorVariables();
  }

  @Get('frontend')
  @Public()
  @ApiOperation({ summary: 'إعدادات الواجهة الأمامية' })
  @ApiQuery({ name: 'lang', required: false, type: String })
  async getFrontendSettings(@Query('lang') lang?: 'ar' | 'en') {
    return this.settingsService.getSettingsForFrontend(lang || 'ar');
  }

  @Get('group/:group')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'إعدادات مجموعة محددة' })
  async getByGroup(@Param('group') group: string) {
    return this.settingsService.getSettingsByGroup(group);
  }

  @Get(':key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'إعداد محدد' })
  async findOne(@Param('key') key: string) {
    return this.settingsService.findByKey(key);
  }

  @Put(':key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تحديث إعداد' })
  async update(@Param('key') key: string, @Body() body: { valueAr?: string; valueEn?: string }) {
    return this.settingsService.update(key, body);
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تحديث عدة إعدادات' })
  async bulkUpdate(@Body() body: { settings: { key: string; valueAr?: string; valueEn?: string }[] }) {
    await this.settingsService.bulkUpdate(body.settings);
    return { message: 'تم تحديث الإعدادات بنجاح' };
  }
}
