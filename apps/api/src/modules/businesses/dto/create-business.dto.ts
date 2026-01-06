import { 
  IsString, IsOptional, IsBoolean, IsNumber, IsArray, 
  IsEnum, MaxLength, IsUUID, ValidateNested, IsUrl 
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BusinessStatus, ContactType, DayOfWeek, MediaType, ProductType } from '@greenpages/database';

// DTO للتواصل
export class BusinessContactDto {
  @ApiProperty({ enum: ContactType })
  @IsEnum(ContactType)
  type: ContactType;

  @ApiProperty({ example: '+963999999999' })
  @IsString()
  value: string;

  @ApiPropertyOptional({ example: 'الهاتف الرئيسي' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

// DTO لساعات العمل
export class WorkingHoursDto {
  @ApiProperty({ enum: DayOfWeek })
  @IsEnum(DayOfWeek)
  dayOfWeek: DayOfWeek;

  @ApiPropertyOptional({ example: '09:00' })
  @IsOptional()
  @IsString()
  openTime?: string;

  @ApiPropertyOptional({ example: '22:00' })
  @IsOptional()
  @IsString()
  closeTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isClosed?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is24Hours?: boolean;
}

// DTO للفروع
export class BusinessBranchDto {
  @ApiProperty({ example: 'الفرع الرئيسي' })
  @IsString()
  nameAr: string;

  @ApiPropertyOptional({ example: 'Main Branch' })
  @IsOptional()
  @IsString()
  nameEn?: string;

  @ApiProperty()
  @IsUUID()
  cityId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  districtId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isMain?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

// DTO للأشخاص
export class BusinessPersonDto {
  @ApiProperty({ example: 'أحمد محمد' })
  @IsString()
  nameAr: string;

  @ApiPropertyOptional({ example: 'Ahmad Mohammad' })
  @IsOptional()
  @IsString()
  nameEn?: string;

  @ApiPropertyOptional({ example: 'المدير العام' })
  @IsOptional()
  @IsString()
  positionAr?: string;

  @ApiPropertyOptional({ example: 'General Manager' })
  @IsOptional()
  @IsString()
  positionEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bioAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bioEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  photo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

// DTO للمنتجات/الخدمات
export class BusinessProductDto {
  @ApiPropertyOptional({ enum: ['PRODUCT', 'SERVICE'], default: 'PRODUCT' })
  @IsOptional()
  @IsEnum(ProductType)
  type?: ProductType;

  @ApiProperty({ example: 'منتج أو خدمة' })
  @IsString()
  nameAr: string;

  @ApiPropertyOptional({ example: 'Product or Service' })
  @IsOptional()
  @IsString()
  nameEn?: string;

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
  image?: string;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({ example: 'SYP' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 'يبدأ من' })
  @IsOptional()
  @IsString()
  priceNote?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

// DTO للوسائط
export class BusinessMediaDto {
  @ApiProperty({ enum: MediaType })
  @IsEnum(MediaType)
  type: MediaType;

  @ApiProperty()
  @IsString()
  url: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  altAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  altEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

// DTO الرئيسي لإنشاء نشاط تجاري
export class CreateBusinessDto {
  // === البيانات الأساسية ===
  @ApiProperty({ example: 'مطعم الشام', description: 'اسم النشاط بالعربية' })
  @IsString()
  @MaxLength(200)
  nameAr: string;

  @ApiPropertyOptional({ example: 'Al-Sham Restaurant', description: 'اسم النشاط بالإنجليزية' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nameEn?: string;

  @ApiPropertyOptional({ description: 'الـ slug (يُولد تلقائياً)' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ description: 'نبذة مختصرة بالعربية' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  shortDescAr?: string;

  @ApiPropertyOptional({ description: 'نبذة مختصرة بالإنجليزية' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  shortDescEn?: string;

  @ApiPropertyOptional({ description: 'وصف تفصيلي بالعربية' })
  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @ApiPropertyOptional({ description: 'وصف تفصيلي بالإنجليزية' })
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  // === الشعار والغلاف ===
  @ApiPropertyOptional({ description: 'رابط الشعار' })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({ description: 'رابط صورة الغلاف' })
  @IsOptional()
  @IsString()
  cover?: string;

  // === الموقع ===
  @ApiProperty({ description: 'معرف المحافظة' })
  @IsUUID()
  governorateId: string;

  @ApiProperty({ description: 'معرف المدينة' })
  @IsUUID()
  cityId: string;

  @ApiPropertyOptional({ description: 'معرف الحي' })
  @IsOptional()
  @IsUUID()
  districtId?: string;

  @ApiPropertyOptional({ description: 'العنوان بالعربية' })
  @IsOptional()
  @IsString()
  addressAr?: string;

  @ApiPropertyOptional({ description: 'العنوان بالإنجليزية' })
  @IsOptional()
  @IsString()
  addressEn?: string;

  @ApiPropertyOptional({ description: 'خط العرض' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'خط الطول' })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  // === الحالة والخصائص ===
  @ApiPropertyOptional({ enum: BusinessStatus, default: BusinessStatus.DRAFT })
  @IsOptional()
  @IsEnum(BusinessStatus)
  status?: BusinessStatus;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  // === SEO ===
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metaKeywordsAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metaKeywordsEn?: string;

  // === العلاقات ===
  @ApiPropertyOptional({ description: 'معرف المالك' })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({ description: 'معرف المندوب' })
  @IsOptional()
  @IsUUID()
  agentId?: string;

  // === التصنيفات ===
  @ApiPropertyOptional({ type: [String], description: 'معرفات التصنيفات' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds?: string[];

  // === بيانات التواصل ===
  @ApiPropertyOptional({ type: [BusinessContactDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BusinessContactDto)
  contacts?: BusinessContactDto[];

  // === ساعات العمل ===
  @ApiPropertyOptional({ type: [WorkingHoursDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkingHoursDto)
  workingHours?: WorkingHoursDto[];

  // === الفروع ===
  @ApiPropertyOptional({ type: [BusinessBranchDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BusinessBranchDto)
  branches?: BusinessBranchDto[];

  // === الأشخاص ===
  @ApiPropertyOptional({ type: [BusinessPersonDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BusinessPersonDto)
  persons?: BusinessPersonDto[];

  // === المنتجات/الخدمات ===
  @ApiPropertyOptional({ type: [BusinessProductDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BusinessProductDto)
  products?: BusinessProductDto[];

  // === الوسائط ===
  @ApiPropertyOptional({ type: [BusinessMediaDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BusinessMediaDto)
  media?: BusinessMediaDto[];
}
