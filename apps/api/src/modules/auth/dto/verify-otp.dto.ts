import { IsString, Length, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({ description: 'رقم الهاتف' })
  @IsString()
  @MinLength(8, { message: 'رقم الهاتف يجب أن يكون 8 أرقام على الأقل' })
  phone: string;

  @ApiProperty({ description: 'رمز التحقق' })
  @IsString()
  @Length(6, 6, { message: 'رمز التحقق يجب أن يكون 6 أرقام' })
  code: string;
}
