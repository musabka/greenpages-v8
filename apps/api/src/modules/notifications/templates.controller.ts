import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateTemplateDto, UpdateTemplateDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, NotificationType } from '@prisma/client';

@ApiTags('قوالب الإشعارات')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('notifications/templates')
export class NotificationTemplatesController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: 'إنشاء قالب إشعار جديد' })
  @ApiResponse({ status: 201, description: 'تم إنشاء القالب بنجاح' })
  async create(@Body() dto: CreateTemplateDto) {
    return this.notificationsService.createTemplate(dto);
  }

  @Get()
  @ApiOperation({ summary: 'جلب كل قوالب الإشعارات' })
  async findAll(@Query('type') type?: NotificationType) {
    return this.notificationsService.findAllTemplates(type);
  }

  @Get(':id')
  @ApiOperation({ summary: 'جلب قالب محدد' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.findTemplate(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'تحديث قالب' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.notificationsService.updateTemplate(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف قالب' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.notificationsService.deleteTemplate(id);
    return { message: 'تم حذف القالب' };
  }
}
