import { IsString, IsOptional, IsBoolean, IsNumber, MaxLength, IsDecimal } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGovernorateDto {
  @ApiProperty({ example: 'دمشق', description: 'اسم المحافظة بالعربية' })
  @IsString()
  @MaxLength(100)
  nameAr: string;

  @ApiPropertyOptional({ example: 'Damascus', description: 'اسم المحافظة بالإنجليزية' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nameEn?: string;

  @ApiProperty({ example: 'damascus', description: 'الـ slug' })
  @IsString()
  @MaxLength(100)
  slug: string;

  @ApiPropertyOptional({ description: 'وصف المحافظة' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 33.5138, description: 'خط العرض' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 36.2765, description: 'خط الطول' })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: 1, description: 'ترتيب العرض' })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional({ example: true, description: 'مفعلة' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
