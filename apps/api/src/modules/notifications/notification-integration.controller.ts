import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { NotificationIntegrationService } from './notification-integration.service';

@ApiTags('Notification Integration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('notifications/integration')
export class NotificationIntegrationController {
  constructor(
    private readonly integrationService: NotificationIntegrationService,
  ) {}

  @Post('test/fcm')
  @ApiOperation({ summary: 'اختبار اتصال Firebase Cloud Messaging' })
  async testFcm(@Body() body: { serverKey: string; senderId: string; projectId: string }) {
    return this.integrationService.testFcm(body);
  }

  @Post('test/smtp')
  @ApiOperation({ summary: 'اختبار اتصال SMTP' })
  async testSmtp(@Body() body: {
    host: string;
    port: string;
    user: string;
    password: string;
    secure: boolean;
    fromEmail: string;
    testEmail: string;
  }) {
    return this.integrationService.testSmtp(body);
  }

  @Post('test/sms')
  @ApiOperation({ summary: 'اختبار اتصال SMS Gateway' })
  async testSms(@Body() body: {
    provider: string;
    apiKey: string;
    apiSecret: string;
    fromNumber: string;
    testNumber: string;
    accountSid?: string;
  }) {
    return this.integrationService.testSms(body);
  }
}
