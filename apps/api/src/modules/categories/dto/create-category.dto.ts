import { IsString, IsOptional, IsBoolean, IsNumber, MaxLength, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'مطاعم ومقاهي', description: 'اسم التصنيف بالعربية' })
  @IsString()
  @MaxLength(100)
  nameAr: string;

  @ApiPropertyOptional({ example: 'Restaurants & Cafes', description: 'اسم التصنيف بالإنجليزية' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nameEn?: string;

  @ApiPropertyOptional({ example: 'restaurants', description: 'الـ slug' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  slug?: string;

  @ApiPropertyOptional({ description: 'معرف التصنيف الأب' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ description: 'وصف التصنيف بالعربية' })
  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @ApiPropertyOptional({ description: 'وصف التصنيف بالإنجليزية' })
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional({ example: 'utensils', description: 'أيقونة التصنيف' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: 'صورة التصنيف' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ example: '#e74c3c', description: 'لون التصنيف' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'عنوان SEO بالعربية' })
  @IsOptional()
  @IsString()
  metaTitleAr?: string;

  @ApiPropertyOptional({ description: 'عنوان SEO بالإنجليزية' })
  @IsOptional()
  @IsString()
  metaTitleEn?: string;

  @ApiPropertyOptional({ description: 'وصف SEO بالعربية' })
  @IsOptional()
  @IsString()
  metaDescAr?: string;

  @ApiPropertyOptional({ description: 'وصف SEO بالإنجليزية' })
  @IsOptional()
  @IsString()
  metaDescEn?: string;
}
