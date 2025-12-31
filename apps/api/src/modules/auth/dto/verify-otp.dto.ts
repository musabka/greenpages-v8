import { IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({ description: 'رقم الهاتف' })
  @IsString()
  @Matches(/^(010|011|012|015)\d{8}$/, {
    message: 'رقم الهاتف يجب أن يكون رقم مصري صحيح',
  })
  phone: string;

  @ApiProperty({ description: 'رمز التحقق' })
  @IsString()
  @Length(6, 6, { message: 'رمز التحقق يجب أن يكون 6 أرقام' })
  code: string;
}
