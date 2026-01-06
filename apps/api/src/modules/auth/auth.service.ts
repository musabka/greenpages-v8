import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserRole, UserStatus } from '@greenpages/database';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('الحساب غير مفعل');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('البريد الإلكتروني مستخدم مسبقاً');
    }

    if (registerDto.phone) {
      const existingPhone = await this.usersService.findByPhone(registerDto.phone);
      if (existingPhone) {
        throw new ConflictException('رقم الهاتف مستخدم مسبقاً');
      }
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    const userData: any = {
      email: registerDto.email,
      password: hashedPassword,
      phone: registerDto.phone,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    };

    // إضافة العلاقات مع المواقع إذا تم تحديدها
    if (registerDto.governorateId) {
      userData.governorate = { connect: { id: registerDto.governorateId } };
    }
    if (registerDto.cityId) {
      userData.city = { connect: { id: registerDto.cityId } };
    }
    if (registerDto.districtId) {
      userData.district = { connect: { id: registerDto.districtId } };
    }
    if (registerDto.addressLine) {
      userData.addressLine = registerDto.addressLine;
    }

    const user = await this.usersService.create(userData);

    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    const tokens = await this.generateTokens(user);

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('جلسة غير صالحة');
      }

      const tokens = await this.generateTokens(user);

      return {
        user: this.sanitizeUser(user),
        ...tokens,
      };
    } catch {
      throw new UnauthorizedException('جلسة منتهية الصلاحية');
    }
  }

  private async generateTokens(user: any) {
    const payload: any = { 
      sub: user.id, 
      email: user.email, 
      role: user.role,
      tokenVersion: user.tokenVersion || 0  // For token invalidation
    };

    // Lightweight capability flag (instead of full array to avoid JWT bloat)
    // Full capabilities are fetched via GET /capabilities/my-capabilities
    const hasCapabilities = await this.prisma.userBusinessCapability.count({
      where: { 
        userId: user.id, 
        status: 'ACTIVE' as any, // CapabilityStatus.ACTIVE
      },
    });

    if (hasCapabilities > 0) {
      payload.hasBusinessAccess = true;
    }

    // Add context based on role
    if (user.role === UserRole.GOVERNORATE_MANAGER) {
      const manager = await this.prisma.governorateManager.findMany({
        where: { userId: user.id, isActive: true },
        select: { governorateId: true },
      });
      payload.managedGovernorateIds = manager.map(m => m.governorateId);
    } else if (user.role === UserRole.AGENT) {
      const agent = await this.prisma.agentProfile.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (agent) {
        payload.agentProfileId = agent.id;
      }
    }

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '30d'),
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private sanitizeUser(user: any) {
    const { password, ...sanitized } = user;
    return sanitized;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    // التحقق من رقم الهاتف إذا تم تغييره
    if (updateProfileDto.phone) {
      const existingPhone = await this.usersService.findByPhone(updateProfileDto.phone);
      if (existingPhone && existingPhone.id !== userId) {
        throw new ConflictException('رقم الهاتف مستخدم مسبقاً');
      }
    }

    const updateData: any = {};

    if (updateProfileDto.firstName) updateData.firstName = updateProfileDto.firstName;
    if (updateProfileDto.lastName) updateData.lastName = updateProfileDto.lastName;
    if (updateProfileDto.phone) updateData.phone = updateProfileDto.phone;

    // تحديث العلاقات مع المواقع
    if (updateProfileDto.governorateId) {
      updateData.governorate = { connect: { id: updateProfileDto.governorateId } };
    } else if (updateProfileDto.governorateId === null) {
      updateData.governorate = { disconnect: true };
    }

    if (updateProfileDto.cityId) {
      updateData.city = { connect: { id: updateProfileDto.cityId } };
    } else if (updateProfileDto.cityId === null) {
      updateData.city = { disconnect: true };
    }

    if (updateProfileDto.districtId) {
      updateData.district = { connect: { id: updateProfileDto.districtId } };
    } else if (updateProfileDto.districtId === null) {
      updateData.district = { disconnect: true };
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        governorate: { select: { id: true, nameAr: true, nameEn: true } },
        city: { select: { id: true, nameAr: true, nameEn: true } },
        district: { select: { id: true, nameAr: true, nameEn: true } },
      },
    });

    return {
      message: 'تم تحديث الملف الشخصي بنجاح',
      user: this.sanitizeUser(updatedUser),
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) {
      throw new UnauthorizedException('المستخدم غير موجود');
    }

    // التحقق من كلمة المرور الحالية
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('كلمة المرور الحالية غير صحيحة');
    }

    // تشفير كلمة المرور الجديدة
    const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return {
      message: 'تم تغيير كلمة المرور بنجاح',
    };
  }

  async markPhoneVerified(userId: string, phone: string) {
    // التحقق من أن الرقم يخص المستخدم أو تحديثه
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true },
    });

    const updateData: any = {
      phoneVerified: true,
      verifiedAt: new Date(),
    };

    // إذا كان الرقم مختلف، نقوم بتحديثه
    if (user && user.phone !== phone) {
      updateData.phone = phone;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }
}
