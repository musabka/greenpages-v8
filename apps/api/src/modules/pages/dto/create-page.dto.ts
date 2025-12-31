import { IsString, IsOptional, IsBoolean, IsNumber, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePageDto {
  @ApiProperty({ example: 'من نحن' })
  @IsString()
  @MaxLength(200)
  titleAr: string;

  @ApiPropertyOptional({ example: 'About Us' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  titleEn?: string;

  @ApiPropertyOptional({ example: 'about' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  slug?: string;

  @ApiProperty({ description: 'المحتوى بالعربية' })
  @IsString()
  contentAr: string;

  @ApiPropertyOptional({ description: 'المحتوى بالإنجليزية' })
  @IsOptional()
  @IsString()
  contentEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metaTitleAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metaTitleEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metaDescAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metaDescEn?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
