import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, IsOptional, IsEnum } from 'class-validator';
import { TrustLevel } from '@greenpages/database';

export class LinkOwnerDto {
  @ApiProperty({
    description: 'رقم الهاتف أو البريد الإلكتروني للمالك',
    example: '0791234567',
  })
  @IsNotEmpty({ message: 'رقم الهاتف أو البريد الإلكتروني مطلوب' })
  @IsString()
  identifier: string; // phone or email

  @ApiProperty({
    description: 'معرف النشاط التجاري',
    example: 'uuid',
  })
  @IsNotEmpty({ message: 'معرف النشاط التجاري مطلوب' })
  @IsUUID()
  businessId: string;

  @ApiProperty({
    description: 'مستوى الثقة',
    enum: TrustLevel,
    required: false,
    default: TrustLevel.FIELD_VERIFIED,
  })
  @IsOptional()
  @IsEnum(TrustLevel)
  trustLevel?: TrustLevel;
}
