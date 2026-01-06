import { IsString, IsOptional, IsEnum, IsBoolean, IsArray, IsUUID, IsObject, IsDateString, Min, Max, IsInt, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

// ==========================================
// إنشاء إشعار
// ==========================================
export class CreateNotificationDto {
  @ApiProperty({ description: 'معرف المستخدم المستلم' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'نوع الإشعار' })
  @IsString()
  type: string;

  @ApiPropertyOptional({ description: 'أولوية الإشعار', default: 'MEDIUM' })
  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority?: string;

  @ApiProperty({ description: 'العنوان بالعربية' })
  @IsString()
  titleAr: string;

  @ApiPropertyOptional({ description: 'العنوان بالإنجليزية' })
  @IsOptional()
  @IsString()
  titleEn?: string;

  @ApiProperty({ description: 'الرسالة بالعربية' })
  @IsString()
  messageAr: string;

  @ApiPropertyOptional({ description: 'الرسالة بالإنجليزية' })
  @IsOptional()
  @IsString()
  messageEn?: string;

  @ApiPropertyOptional({ description: 'بيانات إضافية' })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiPropertyOptional({ description: 'رابط الإجراء' })
  @IsOptional()
  @IsString()
  actionUrl?: string;

  @ApiPropertyOptional({ description: 'رابط الصورة' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'قنوات الإرسال', default: ['IN_APP'] })
  @IsOptional()
  @IsArray()
  @IsIn(['IN_APP', 'PUSH', 'EMAIL', 'SMS'], { each: true })
  channels?: string[];

  @ApiPropertyOptional({ description: 'وقت الإرسال المجدول' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ description: 'نوع المرجع (business, review, renewal, etc.)' })
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiPropertyOptional({ description: 'معرف المرجع' })
  @IsOptional()
  @IsUUID()
  referenceId?: string;
}

// ==========================================
// تحديث إشعار
// ==========================================
export class UpdateNotificationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}

// ==========================================
// استعلام الإشعارات
// ==========================================
export class NotificationQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'نوع الإشعار' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isRead?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isArchived?: boolean;

  @ApiPropertyOptional({ description: 'الأولوية' })
  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority?: string;
}

// ==========================================
// قالب الإشعار
// ==========================================
export class CreateTemplateDto {
  @ApiProperty({ description: 'كود القالب الفريد' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'اسم القالب' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'وصف القالب' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'نوع الإشعار' })
  @IsString()
  type: string;

  @ApiPropertyOptional({ description: 'الأولوية', default: 'MEDIUM' })
  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority?: string;

  @ApiProperty({ description: 'العنوان بالعربية' })
  @IsString()
  titleAr: string;

  @ApiPropertyOptional({ description: 'العنوان بالإنجليزية' })
  @IsOptional()
  @IsString()
  titleEn?: string;

  @ApiProperty({ description: 'الرسالة بالعربية' })
  @IsString()
  messageAr: string;

  @ApiPropertyOptional({ description: 'الرسالة بالإنجليزية' })
  @IsOptional()
  @IsString()
  messageEn?: string;

  @ApiPropertyOptional({ description: 'قنوات الإرسال', default: ['IN_APP'] })
  @IsOptional()
  @IsArray()
  @IsIn(['IN_APP', 'PUSH', 'EMAIL', 'SMS'], { each: true })
  channels?: string[];

  @ApiPropertyOptional({ description: 'عنوان البريد بالعربية' })
  @IsOptional()
  @IsString()
  emailSubjectAr?: string;

  @ApiPropertyOptional({ description: 'عنوان البريد بالإنجليزية' })
  @IsOptional()
  @IsString()
  emailSubjectEn?: string;

  @ApiPropertyOptional({ description: 'محتوى البريد بالعربية' })
  @IsOptional()
  @IsString()
  emailBodyAr?: string;

  @ApiPropertyOptional({ description: 'محتوى البريد بالإنجليزية' })
  @IsOptional()
  @IsString()
  emailBodyEn?: string;

  @ApiPropertyOptional({ description: 'قالب SMS بالعربية' })
  @IsOptional()
  @IsString()
  smsTemplateAr?: string;

  @ApiPropertyOptional({ description: 'قالب SMS بالإنجليزية' })
  @IsOptional()
  @IsString()
  smsTemplateEn?: string;
}

export class UpdateTemplateDto extends CreateTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ==========================================
// الإشعار الجماعي
// ==========================================
export class TargetCriteriaDto {
  @ApiPropertyOptional({ description: 'الأدوار المستهدفة' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];

  @ApiPropertyOptional({ description: 'المحافظات المستهدفة' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  governorates?: string[];

  @ApiPropertyOptional({ description: 'المدن المستهدفة' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  cities?: string[];

  @ApiPropertyOptional({ description: 'الأحياء المستهدفة' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  districts?: string[];

  @ApiPropertyOptional({ description: 'المهن المستهدفة' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  professions?: string[];

  @ApiPropertyOptional({ description: 'النشط خلال آخر X يوم' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  activeLastDays?: number;
}

export class CreateBulkNotificationDto {
  @ApiProperty({ description: 'العنوان بالعربية' })
  @IsString()
  titleAr: string;

  @ApiPropertyOptional({ description: 'العنوان بالإنجليزية' })
  @IsOptional()
  @IsString()
  titleEn?: string;

  @ApiProperty({ description: 'الرسالة بالعربية' })
  @IsString()
  messageAr: string;

  @ApiPropertyOptional({ description: 'الرسالة بالإنجليزية' })
  @IsOptional()
  @IsString()
  messageEn?: string;

  @ApiPropertyOptional({ description: 'رابط الإجراء' })
  @IsOptional()
  @IsString()
  actionUrl?: string;

  @ApiPropertyOptional({ description: 'رابط الصورة' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'الأولوية', default: 'MEDIUM' })
  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority?: string;

  @ApiPropertyOptional({ description: 'قنوات الإرسال', default: ['IN_APP'] })
  @IsOptional()
  @IsArray()
  @IsIn(['IN_APP', 'PUSH', 'EMAIL', 'SMS'], { each: true })
  channels?: string[];

  @ApiProperty({ description: 'معايير الاستهداف', type: TargetCriteriaDto })
  @IsObject()
  targetCriteria: TargetCriteriaDto;

  @ApiPropertyOptional({ description: 'وقت الإرسال المجدول' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}

// ==========================================
// تفضيلات الإشعارات
// ==========================================
export class UpdatePreferencesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  smsEnabled?: boolean;

  @ApiPropertyOptional({ description: 'تفضيلات حسب النوع' })
  @IsOptional()
  @IsObject()
  typePreferences?: Record<string, boolean>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  quietHoursEnabled?: boolean;

  @ApiPropertyOptional({ example: '22:00' })
  @IsOptional()
  @IsString()
  quietHoursStart?: string;

  @ApiPropertyOptional({ example: '08:00' })
  @IsOptional()
  @IsString()
  quietHoursEnd?: string;
}

// ==========================================
// تسجيل الجهاز
// ==========================================
export class RegisterDeviceDto {
  @ApiProperty({ enum: ['IOS', 'ANDROID', 'WEB'] })
  @IsIn(['IOS', 'ANDROID', 'WEB'])
  deviceType: 'IOS' | 'ANDROID' | 'WEB';

  @ApiProperty({ description: 'FCM Token' })
  @IsString()
  deviceToken: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceModel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  osVersion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  appVersion?: string;
}
