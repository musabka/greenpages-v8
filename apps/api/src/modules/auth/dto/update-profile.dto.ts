import { IsString, IsOptional, MinLength, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: 'الاسم الأول' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'الاسم الأول يجب أن يكون حرفين على الأقل' })
  firstName?: string;

  @ApiPropertyOptional({ description: 'الاسم الأخير' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'الاسم الأخير يجب أن يكون حرفين على الأقل' })
  lastName?: string;

  @ApiPropertyOptional({ description: 'رقم الهاتف' })
  @IsOptional()
  @IsString()
  @Matches(/^(010|011|012|015)\d{8}$/, {
    message: 'رقم الهاتف يجب أن يكون رقم مصري صحيح (11 رقم يبدأ بـ 010, 011, 012, أو 015)',
  })
  phone?: string;

  @ApiPropertyOptional({ description: 'معرف المحافظة' })
  @IsOptional()
  @IsString()
  governorateId?: string;

  @ApiPropertyOptional({ description: 'معرف المدينة' })
  @IsOptional()
  @IsString()
  cityId?: string;

  @ApiPropertyOptional({ description: 'معرف الحي' })
  @IsOptional()
  @IsString()
  districtId?: string;
}
