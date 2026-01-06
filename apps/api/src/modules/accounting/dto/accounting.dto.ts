import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  IsEnum,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AccAccountType, AccNormalBalance } from '@greenpages/database';

// ==========================================================================
// CURRENCY DTOs
// ==========================================================================

export class CreateCurrencyDto {
  @ApiProperty({ example: 'USD', description: 'رمز العملة ISO' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'الدولار الأمريكي' })
  @IsString()
  nameAr: string;

  @ApiProperty({ example: 'US Dollar' })
  @IsString()
  nameEn: string;

  @ApiProperty({ example: '$' })
  @IsString()
  symbol: string;

  @ApiPropertyOptional({ example: 2, description: 'عدد الخانات العشرية' })
  @IsNumber()
  @IsOptional()
  decimals?: number;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isBase?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// ==========================================================================
// ACCOUNT DTOs
// ==========================================================================

export class CreateAccountDto {
  @ApiProperty({ example: '1110', description: 'رمز الحساب الفريد' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'البنك الأهلي' })
  @IsString()
  nameAr: string;

  @ApiProperty({ example: 'National Bank' })
  @IsString()
  nameEn: string;

  @ApiProperty({ enum: AccAccountType })
  @IsEnum(AccAccountType)
  accountType: AccAccountType;

  @ApiProperty({ enum: AccNormalBalance })
  @IsEnum(AccNormalBalance)
  normalBalance: AccNormalBalance;

  @ApiPropertyOptional({ description: 'رمز الحساب الأب' })
  @IsString()
  @IsOptional()
  parentCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  currencyCode?: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isSystemAccount?: boolean;
}

// ==========================================================================
// JOURNAL ENTRY DTOs
// ==========================================================================

export class JournalLineDto {
  @ApiProperty({ example: '1100', description: 'رمز الحساب' })
  @IsString()
  accountCode: string;

  @ApiProperty({ description: 'المبلغ المدين' })
  @IsNumber()
  @Min(0)
  debit: number;

  @ApiProperty({ description: 'المبلغ الدائن' })
  @IsNumber()
  @Min(0)
  credit: number;

  @ApiPropertyOptional({ description: 'وصف السطر' })
  @IsString()
  @IsOptional()
  memo?: string;
}

export class CreateManualJournalEntryDto {
  @ApiProperty({ description: 'وصف القيد' })
  @IsString()
  descriptionAr: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  descriptionEn?: string;

  @ApiProperty({ type: [JournalLineDto], description: 'أسطر القيد' })
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => JournalLineDto)
  lines: JournalLineDto[];

  @ApiPropertyOptional({ description: 'معرف فريد لمنع التكرار' })
  @IsString()
  @IsOptional()
  idempotencyKey?: string;
}

export class VoidJournalEntryDto {
  @ApiProperty({ description: 'سبب الإلغاء' })
  @IsString()
  reason: string;
}

// ==========================================================================
// TAX DTOs
// ==========================================================================

export class CreateTaxDto {
  @ApiProperty({ example: 'VAT' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'ضريبة القيمة المضافة' })
  @IsString()
  nameAr: string;

  @ApiProperty({ example: 'Value Added Tax' })
  @IsString()
  nameEn: string;

  @ApiProperty({ example: 15 })
  @IsNumber()
  ratePercent: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  liabilityAccountId?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// ==========================================================================
// INVOICE DTOs (للمستقبل)
// ==========================================================================

export class InvoiceLineDto {
  @ApiProperty()
  @IsString()
  descriptionAr: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  descriptionEn?: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  taxId?: string;
}

export class CreateInvoiceDto {
  @ApiProperty()
  @IsString()
  customerId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  currencyId?: string;

  @ApiProperty({ type: [InvoiceLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineDto)
  lines: InvoiceLineDto[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  noteAr?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  noteEn?: string;
}
