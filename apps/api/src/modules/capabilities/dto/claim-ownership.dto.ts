import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ClaimOwnershipDto {
  @ApiProperty({
    description: 'رمز المطالبة بالملكية',
    example: 'abc123xyz',
  })
  @IsNotEmpty({ message: 'رمز المطالبة مطلوب' })
  @IsString()
  claimToken: string;
}
