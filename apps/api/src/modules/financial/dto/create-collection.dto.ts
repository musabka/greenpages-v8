import { IsString, IsOptional, IsUUID, IsDecimal, IsArray, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCollectionDto {
  @ApiPropertyOptional({ description: 'معرف الشركة' })
  @IsOptional()
  @IsUUID('4')
  businessId?: string;

  @ApiProperty({ description: 'المبلغ المحصل', example: 50000 })
  @IsDecimal()
  amount: number;

  @ApiPropertyOptional({ description: 'وصف التحصيل' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'رقم الإيصال' })
  @IsOptional()
  @IsString()
  receiptNumber?: string;

  @ApiPropertyOptional({ description: 'مرفقات (صور الإيصالات)', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @ApiPropertyOptional({ description: 'ملاحظات' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'تاريخ التحصيل' })
  @IsOptional()
  @IsDateString()
  collectedAt?: string;
}
