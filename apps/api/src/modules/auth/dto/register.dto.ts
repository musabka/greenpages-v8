import { IsEmail, IsString, MinLength, MaxLength, IsOptional, Matches, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: 'البريد الإلكتروني' })
  @IsEmail({}, { message: 'يرجى إدخال بريد إلكتروني صحيح' })
  email: string;

  @ApiProperty({ example: '+963999999999', description: 'رقم الهاتف' })
  @IsNotEmpty({ message: 'رقم الهاتف مطلوب' })
  @IsString()
  @Matches(/^\+?[0-9]{10,15}$/, { message: 'رقم هاتف غير صحيح' })
  phone: string;

  @ApiProperty({ example: 'Password123!', description: 'كلمة المرور' })
  @IsString()
  @MinLength(8, { message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' })
  @MaxLength(50, { message: 'كلمة المرور طويلة جداً' })
  password: string;

  @ApiProperty({ example: 'أحمد', description: 'الاسم الأول' })
  @IsNotEmpty({ message: 'الاسم الأول مطلوب' })
  @IsString()
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'محمد', description: 'الاسم الأخير' })
  @IsNotEmpty({ message: 'الاسم الأخير مطلوب' })
  @IsString()
  @MaxLength(50)
  lastName: string;

  @ApiPropertyOptional({ example: 'طبيب', description: 'المهنة' })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'المهنة طويلة جداً' })
  profession?: string;

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

  @ApiPropertyOptional({ description: 'سطر العنوان' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine?: string;
}
