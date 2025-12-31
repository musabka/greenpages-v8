import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: 'البريد الإلكتروني' })
  @IsEmail({}, { message: 'يرجى إدخال بريد إلكتروني صحيح' })
  email: string;

  @ApiProperty({ example: 'Password123!', description: 'كلمة المرور' })
  @IsString()
  @MinLength(1, { message: 'كلمة المرور مطلوبة' })
  password: string;
}
