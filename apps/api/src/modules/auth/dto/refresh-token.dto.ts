import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ description: 'رمز التحديث' })
  @IsString()
  refreshToken: string;
}
