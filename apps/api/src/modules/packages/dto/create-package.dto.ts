import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PackageStatus, FeatureKey, LimitKey } from '@greenpages/database';

class PackageFeatureDto {
  @IsEnum(FeatureKey)
  featureKey: FeatureKey;

  @IsBoolean()
  isEnabled: boolean;
}

class PackageLimitDto {
  @IsEnum(LimitKey)
  limitKey: LimitKey;

  @IsNumber()
  limitValue: number;
}

export class CreatePackageDto {
  @IsString()
  nameAr: string;

  @IsOptional()
  @IsString()
  nameEn?: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @IsNumber()
  price: number;

  @IsNumber()
  durationDays: number;

  @IsOptional()
  @IsEnum(PackageStatus)
  status?: PackageStatus;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageFeatureDto)
  features: PackageFeatureDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageLimitDto)
  limits: PackageLimitDto[];
}
