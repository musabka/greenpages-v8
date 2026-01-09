import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({ description: 'رقم الهاتف' })
  @IsString()
  @MinLength(8, { message: 'رقم الهاتف يجب أن يكون 8 أرقام على الأقل' })
  phone: string;
}
