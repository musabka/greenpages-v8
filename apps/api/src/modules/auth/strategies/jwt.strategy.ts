import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { UserStatus } from '@greenpages/database';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findById(payload.sub);
    
    if (!user) {
      throw new UnauthorizedException('المستخدم غير موجود');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('الحساب غير مفعل');
    }

    // TOKEN INVALIDATION CHECK: Verify tokenVersion matches
    if (payload.tokenVersion !== undefined && user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('تم تغيير صلاحيات الحساب، يرجى تسجيل الدخول مجدداً');
    }

    const { password, ...result } = user;
    
    // Merge context from payload
    return {
      ...result,
      managedGovernorateIds: payload.managedGovernorateIds,
      agentProfileId: payload.agentProfileId,
      businessId: payload.businessId,
    };
  }
}
