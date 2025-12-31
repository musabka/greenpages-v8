import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ description: 'كلمة المرور الحالية' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ description: 'كلمة المرور الجديدة' })
  @IsString()
  @MinLength(8, { message: 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل' })
  newPassword: string;
}
