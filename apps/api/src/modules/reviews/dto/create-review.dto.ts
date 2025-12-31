import { IsString, IsOptional, IsNumber, IsUUID, Min, Max, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ description: 'معرف النشاط التجاري' })
  @IsUUID()
  businessId: string;

  @ApiProperty({ example: 5, description: 'التقييم من 1 إلى 5' })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ description: 'عنوان المراجعة بالعربية' })
  @IsOptional()
  @IsString()
  titleAr?: string;

  @ApiPropertyOptional({ description: 'عنوان المراجعة بالإنجليزية' })
  @IsOptional()
  @IsString()
  titleEn?: string;

  @ApiPropertyOptional({ description: 'محتوى المراجعة بالعربية' })
  @IsOptional()
  @IsString()
  contentAr?: string;

  @ApiPropertyOptional({ description: 'محتوى المراجعة بالإنجليزية' })
  @IsOptional()
  @IsString()
  contentEn?: string;

  @ApiPropertyOptional({ type: [String], description: 'الإيجابيات' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pros?: string[];

  @ApiPropertyOptional({ type: [String], description: 'السلبيات' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cons?: string[];
}
