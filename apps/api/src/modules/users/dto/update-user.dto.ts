import { IsString, IsOptional, IsEnum, MaxLength, IsEmail, Matches, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserStatus } from '@greenpages/database';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @IsEmail({}, { message: 'بريد إلكتروني غير صحيح' })
  email?: string;

  @ApiPropertyOptional({ example: '+963999999999' })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{10,15}$/, { message: 'رقم هاتف غير صحيح' })
  phone?: string;

  @ApiPropertyOptional({ example: 'أحمد' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({ example: 'محمد' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({ example: 'أحمد محمد' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @ApiPropertyOptional({ description: 'معرف المحافظة' })
  @IsOptional()
  @IsUUID('4', { message: 'معرف المحافظة غير صحيح' })
  governorateId?: string;

  @ApiPropertyOptional({ description: 'معرف المدينة' })
  @IsOptional()
  @IsUUID('4', { message: 'معرف المدينة غير صحيح' })
  cityId?: string;

  @ApiPropertyOptional({ description: 'معرف الحي' })
  @IsOptional()
  @IsUUID('4', { message: 'معرف الحي غير صحيح' })
  districtId?: string;

  @ApiPropertyOptional({ description: 'العنوان التفصيلي' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ description: 'البريد الإلكتروني موثق' })
  @IsOptional()
  emailVerified?: boolean;
}
