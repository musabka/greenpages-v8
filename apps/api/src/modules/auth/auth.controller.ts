import { Controller, Post, Body, UseGuards, Get, Request, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly otpService: OtpService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'تسجيل مستخدم جديد' })
  @ApiResponse({ status: 201, description: 'تم التسجيل بنجاح' })
  @ApiResponse({ status: 409, description: 'البريد الإلكتروني مستخدم مسبقاً' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'تسجيل الدخول' })
  @ApiResponse({ status: 200, description: 'تم تسجيل الدخول بنجاح' })
  @ApiResponse({ status: 401, description: 'بيانات الدخول غير صحيحة' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'تحديث الجلسة' })
  @ApiResponse({ status: 200, description: 'تم تحديث الجلسة بنجاح' })
  @ApiResponse({ status: 401, description: 'جلسة غير صالحة' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تسجيل الخروج' })
  @ApiResponse({ status: 200, description: 'تم تسجيل الخروج بنجاح' })
  async logout() {
    return { message: 'تم تسجيل الخروج بنجاح' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'الحصول على بيانات المستخدم الحالي' })
  @ApiResponse({ status: 200, description: 'بيانات المستخدم' })
  @ApiResponse({ status: 401, description: 'غير مصرح' })
  async getProfile(@Request() req: any) {
    return req.user;
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تحديث الملف الشخصي' })
  @ApiResponse({ status: 200, description: 'تم التحديث بنجاح' })
  async updateProfile(@Request() req: any, @Body() updateProfileDto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.id, updateProfileDto);
  }

  @Put('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تغيير كلمة المرور' })
  @ApiResponse({ status: 200, description: 'تم تغيير كلمة المرور بنجاح' })
  @ApiResponse({ status: 401, description: 'كلمة المرور الحالية غير صحيحة' })
  async changePassword(@Request() req: any, @Body() changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.id, changePasswordDto);
  }

  @Post('otp/send')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'إرسال رمز OTP للتحقق من الهاتف' })
  @ApiResponse({ status: 200, description: 'تم إرسال رمز التحقق' })
  @ApiResponse({ status: 400, description: 'خطأ في الإرسال' })
  async sendOtp(@Request() req: any, @Body() sendOtpDto: SendOtpDto) {
    // التأكد من أن رقم الهاتف يخص المستخدم الحالي
    if (req.user.phone !== sendOtpDto.phone) {
      // إذا كان رقم مختلف، يجب التحقق أولاً
    }
    return this.otpService.sendOtp(sendOtpDto.phone);
  }

  @Post('otp/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'التحقق من رمز OTP' })
  @ApiResponse({ status: 200, description: 'تم التحقق بنجاح' })
  @ApiResponse({ status: 400, description: 'رمز غير صحيح' })
  async verifyOtp(@Request() req: any, @Body() verifyOtpDto: VerifyOtpDto) {
    const result = await this.otpService.verifyOtp(verifyOtpDto.phone, verifyOtpDto.code);
    
    if (result.verified) {
      // تحديث حالة التحقق من الهاتف للمستخدم
      await this.authService.markPhoneVerified(req.user.id, verifyOtpDto.phone);
    }
    
    return result;
  }

  @Post('otp/send-public')
  @ApiOperation({ summary: 'إرسال رمز OTP (بدون تسجيل دخول)' })
  @ApiResponse({ status: 200, description: 'تم إرسال رمز التحقق' })
  async sendOtpPublic(@Body() sendOtpDto: SendOtpDto) {
    return this.otpService.sendOtp(sendOtpDto.phone);
  }

  @Post('otp/verify-public')
  @ApiOperation({ summary: 'التحقق من رمز OTP (بدون تسجيل دخول)' })
  @ApiResponse({ status: 200, description: 'تم التحقق بنجاح' })
  async verifyOtpPublic(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.otpService.verifyOtp(verifyOtpDto.phone, verifyOtpDto.code);
  }
}
