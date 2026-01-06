import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RbacTestController } from './controllers/rbac-test.controller';
import { OtpService } from './otp.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { UsersModule } from '../users/users.module';
import { PermissionsService } from './services/permissions.service';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { ScopeGuard } from './guards/scope.guard';

@Global()
@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '7d'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, RbacTestController],
  providers: [
    AuthService, 
    OtpService, 
    JwtStrategy, 
    LocalStrategy, 
    PermissionsService, 
    RolesGuard,
    PermissionsGuard,
    ScopeGuard
  ],
  exports: [AuthService, OtpService, PermissionsService, RolesGuard, PermissionsGuard, ScopeGuard],
})
export class AuthModule {}
