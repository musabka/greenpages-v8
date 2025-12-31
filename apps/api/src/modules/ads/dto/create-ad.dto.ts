import { IsString, IsOptional, IsEnum, IsNumber, IsUUID, IsDateString, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdType, AdPosition, AdStatus } from '@greenpages/database';

export class CreateAdDto {
  @ApiPropertyOptional({ description: 'معرف النشاط التجاري المرتبط' })
  @IsOptional()
  @IsUUID()
  businessId?: string;

  @ApiProperty({ enum: AdType })
  @IsEnum(AdType)
  type: AdType;

  @ApiProperty({ enum: AdPosition })
  @IsEnum(AdPosition)
  position: AdPosition;

  @ApiProperty({ example: 'عرض خاص' })
  @IsString()
  titleAr: string;

  @ApiPropertyOptional({ example: 'Special Offer' })
  @IsOptional()
  @IsString()
  titleEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageDesktop?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageMobile?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  linkUrl?: string;

  @ApiPropertyOptional({ enum: AdStatus })
  @IsOptional()
  @IsEnum(AdStatus)
  status?: AdStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiProperty({ description: 'تاريخ البدء' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'تاريخ الانتهاء' })
  @IsDateString()
  endDate: string;

  // حقول الاستهداف الجغرافي
  @ApiPropertyOptional({ description: 'استهداف كل المواقع (إذا false يجب تحديد المحافظات/المدن)', default: true })
  @IsOptional()
  @IsBoolean()
  targetAllLocations?: boolean;

  @ApiPropertyOptional({ description: 'قائمة معرفات المحافظات المستهدفة', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  targetGovernorateIds?: string[];

  @ApiPropertyOptional({ description: 'قائمة معرفات المدن المستهدفة', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  targetCityIds?: string[];
}
