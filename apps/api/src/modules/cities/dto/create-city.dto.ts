import { IsString, IsOptional, IsBoolean, IsNumber, MaxLength, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCityDto {
  @ApiProperty({ description: 'معرف المحافظة' })
  @IsUUID()
  governorateId: string;

  @ApiProperty({ example: 'مدينة دمشق', description: 'اسم المدينة بالعربية' })
  @IsString()
  @MaxLength(100)
  nameAr: string;

  @ApiPropertyOptional({ example: 'Damascus City', description: 'اسم المدينة بالإنجليزية' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nameEn?: string;

  @ApiPropertyOptional({ example: 'damascus-city', description: 'الـ slug' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  slug?: string;

  @ApiPropertyOptional({ description: 'وصف المدينة' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 33.5138 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 36.2765 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
