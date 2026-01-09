import { Controller, Post, Get, Body, Param, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CapabilitiesService } from './capabilities.service';
import { LinkOwnerDto } from './dto/link-owner.dto';
import { InviteOwnerDto } from './dto/invite-owner.dto';
import { ClaimOwnershipDto } from './dto/claim-ownership.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@greenpages/database';

@ApiTags('Capabilities - نظام القدرات')
@Controller('capabilities')
export class CapabilitiesController {
  constructor(private readonly capabilitiesService: CapabilitiesService) { }

  @Post('link-owner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.AGENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ربط مالك موجود بنشاط تجاري' })
  async linkOwner(@Body() dto: LinkOwnerDto, @Request() req: any) {
    // البحث عن المستخدم
    const user = await this.capabilitiesService.findUserByIdentifier(dto.identifier);

    if (!user) {
      return {
        success: false,
        message: 'لم يتم العثور على مستخدم بهذه البيانات',
      };
    }

    // ربط المالك
    const capability = await this.capabilitiesService.linkOwner(
      dto.businessId,
      user.id,
      req.user.id,
      {
        trustLevel: dto.trustLevel,
      },
    );

    return {
      success: true,
      message: 'تم ربط المالك بنجاح',
      data: capability,
    };
  }

  @Post('invite-owner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.AGENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'دعوة مالك جديد (ليس لديه حساب)' })
  async inviteOwner(@Body() dto: InviteOwnerDto, @Request() req: any) {
    const invitation = await this.capabilitiesService.inviteOwner(
      dto.businessId,
      dto.phone,
      req.user.id,
      {
        email: dto.email,
        ownerName: dto.ownerName,
      },
    );

    return {
      success: true,
      message: 'تم إنشاء الدعوة بنجاح',
      data: invitation,
    };
  }

  @Post('claim-ownership')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'المطالبة بملكية نشاط عبر رمز الدعوة' })
  async claimOwnership(@Body() dto: ClaimOwnershipDto, @Request() req: any) {
    const capability = await this.capabilitiesService.claimOwnership(
      dto.claimToken,
      req.user.id,
    );

    return {
      success: true,
      message: 'تم المطالبة بالملكية بنجاح',
      data: capability,
    };
  }

  @Get('my-capabilities')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'الحصول على قدرات المستخدم الحالي' })
  async getMyCapabilities(@Request() req: any) {
    const capabilities = await this.capabilitiesService.getUserCapabilities(req.user.id);

    return {
      success: true,
      data: capabilities,
    };
  }

  @Get('search-user/:identifier')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.AGENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'البحث عن مستخدم بالهاتف أو البريد' })
  async searchUser(@Param('identifier') identifier: string) {
    const user = await this.capabilitiesService.findUserByIdentifier(identifier);

    if (!user) {
      return {
        success: false,
        message: 'لم يتم العثور على مستخدم',
      };
    }

    return {
      success: true,
      data: user,
    };
  }

  @Get('business/:businessId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'التحقق من صلاحية الوصول لنشاط معين' })
  async checkBusinessAccess(@Param('businessId') businessId: string, @Request() req: any) {
    const capability = await this.capabilitiesService.getCapability(req.user.id, businessId);

    return {
      success: true,
      hasAccess: !!capability,
      data: capability,
    };
  }
}
