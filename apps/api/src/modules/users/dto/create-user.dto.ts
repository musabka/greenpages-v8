import { IsString, IsEmail, Matches, MaxLength, IsEnum, IsOptional, IsUUID, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@greenpages/database';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'بريد إلكتروني غير صحيح' })
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  password: string;

  @ApiProperty({ example: '+963999999999' })
  @IsString()
  @Matches(/^\+?[0-9]{10,15}$/, { message: 'رقم هاتف غير صحيح' })
  phone: string;

  @ApiProperty({ example: 'أحمد' })
  @IsString()
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'محمد' })
  @IsString()
  @MaxLength(50)
  lastName: string;

  @ApiPropertyOptional({ example: 'أحمد محمد' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.ADMIN })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean;

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
  address?: string;

  @ApiPropertyOptional({ 
    description: 'قائمة المحافظات التي يديرها (لمدير المحافظة أو المندوب)',
    type: [String],
    example: ['uuid1', 'uuid2']
  })
  @IsOptional()
  @IsUUID('4', { each: true, message: 'معرف المحافظة غير صحيح' })
  managedGovernorateIds?: string[];

  @ApiPropertyOptional({ description: 'نسبة الصفحات الخضراء (لمدير المحافظة)' })
  @IsOptional()
  companyCommissionRate?: number;

  @ApiPropertyOptional({ description: 'الراتب الشهري الأساسي للمندوب (ل.س)' })
  @IsOptional()
  agentSalary?: number;

  @ApiPropertyOptional({ description: 'نسبة العمولة للمندوب (%)' })
  @IsOptional()
  agentCommission?: number;
}

