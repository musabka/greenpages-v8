import { IsString, IsOptional, IsBoolean, IsNumber, MaxLength, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDistrictDto {
  @ApiProperty({ description: 'معرف المدينة' })
  @IsUUID()
  cityId: string;

  @ApiProperty({ example: 'المزة', description: 'اسم الحي بالعربية' })
  @IsString()
  @MaxLength(100)
  nameAr: string;

  @ApiPropertyOptional({ example: 'Mazzeh', description: 'اسم الحي بالإنجليزية' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nameEn?: string;

  @ApiPropertyOptional({ example: 'mazzeh', description: 'الـ slug' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  slug?: string;

  @ApiPropertyOptional({ description: 'وصف الحي' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
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
