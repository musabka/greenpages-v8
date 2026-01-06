import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, IsOptional, IsEmail } from 'class-validator';

export class InviteOwnerDto {
  @ApiProperty({
    description: 'معرف النشاط التجاري',
    example: 'uuid',
  })
  @IsNotEmpty({ message: 'معرف النشاط التجاري مطلوب' })
  @IsUUID()
  businessId: string;

  @ApiProperty({
    description: 'رقم الهاتف للمالك',
    example: '0791234567',
  })
  @IsNotEmpty({ message: 'رقم الهاتف مطلوب' })
  @IsString()
  phone: string;

  @ApiProperty({
    description: 'البريد الإلكتروني (اختياري)',
    example: 'owner@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'البريد الإلكتروني غير صحيح' })
  email?: string;

  @ApiProperty({
    description: 'اسم المالك (للعرض فقط)',
    example: 'أحمد محمد',
    required: false,
  })
  @IsOptional()
  @IsString()
  ownerName?: string;
}
