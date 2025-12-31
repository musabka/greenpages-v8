import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({ description: 'رقم الهاتف' })
  @IsString()
  @Matches(/^(010|011|012|015)\d{8}$/, {
    message: 'رقم الهاتف يجب أن يكون رقم مصري صحيح (11 رقم يبدأ بـ 010, 011, 012, أو 015)',
  })
  phone: string;
}
