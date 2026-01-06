import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsUUID,
  Min,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';
import { TopUpMethod, WithdrawalMethod } from '@greenpages/database';

// ==========================================
// طلب شحن المحفظة
// ==========================================
export class CreateTopUpDto {
  @ApiProperty({ description: 'المبلغ المراد شحنه', example: 50000 })
  @IsNumber()
  @Min(1000, { message: 'الحد الأدنى للشحن 1000 ل.س' })
  amount: number;

  @ApiProperty({ description: 'طريقة الشحن', enum: TopUpMethod })
  @IsEnum(TopUpMethod)
  method: TopUpMethod;

  @ApiPropertyOptional({ description: 'رقم الإيصال' })
  @IsOptional()
  @IsString()
  receiptNumber?: string;

  @ApiPropertyOptional({ description: 'صورة إثبات الدفع' })
  @IsOptional()
  @IsString()
  proofImage?: string;

  @ApiPropertyOptional({ description: 'ملاحظات' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

// ==========================================
// طلب سحب من المحفظة
// ==========================================
export class CreateWithdrawalDto {
  @ApiProperty({ description: 'المبلغ المراد سحبه', example: 100000 })
  @IsNumber()
  @Min(5000, { message: 'الحد الأدنى للسحب 5000 ل.س' })
  amount: number;

  @ApiProperty({ description: 'طريقة السحب', enum: WithdrawalMethod })
  @IsEnum(WithdrawalMethod)
  method: WithdrawalMethod;

  @ApiPropertyOptional({ description: 'اسم البنك (للتحويل البنكي)' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ description: 'رقم الحساب البنكي' })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({ description: 'اسم صاحب الحساب' })
  @IsOptional()
  @IsString()
  accountHolderName?: string;

  @ApiPropertyOptional({ description: 'رقم المحفظة الإلكترونية' })
  @IsOptional()
  @IsString()
  mobileWalletNumber?: string;

  @ApiPropertyOptional({ description: 'ملاحظات' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

// ==========================================
// دفع من المحفظة (اشتراك)
// ==========================================
export class WalletPaymentDto {
  @ApiProperty({ description: 'معرف النشاط التجاري' })
  @IsUUID()
  @IsNotEmpty()
  businessId: string;

  @ApiProperty({ description: 'معرف الباقة' })
  @IsUUID()
  @IsNotEmpty()
  packageId: string;

  @ApiPropertyOptional({ description: 'ملاحظات' })
  @IsOptional()
  @IsString()
  notes?: string;
}

// ==========================================
// DTO للإدارة
// ==========================================
export class AdminTopUpDto {
  @ApiProperty({ description: 'معرف المستخدم' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'المبلغ', example: 100000 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({ description: 'سبب الإضافة' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class AdminAdjustBalanceDto {
  @ApiProperty({ description: 'معرف المستخدم' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'المبلغ (موجب للإضافة، سالب للخصم)' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'سبب التعديل' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class ProcessTopUpDto {
  @ApiPropertyOptional({ description: 'ملاحظات' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectTopUpDto {
  @ApiProperty({ description: 'سبب الرفض' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class ProcessWithdrawalDto {
  @ApiPropertyOptional({ description: 'رقم الإيصال' })
  @IsOptional()
  @IsString()
  receiptNumber?: string;

  @ApiPropertyOptional({ description: 'ملاحظات' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectWithdrawalDto {
  @ApiProperty({ description: 'سبب الرفض' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

// ==========================================
// Query DTOs
// ==========================================
export class WalletTransactionsQueryDto {
  @ApiPropertyOptional({ description: 'رقم الصفحة', default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'عدد العناصر في الصفحة', default: 20 })
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'نوع المعاملة' })
  @IsOptional()
  @IsString()
  type?: string;
}

export class AdminWalletsQueryDto {
  @ApiPropertyOptional({ description: 'رقم الصفحة', default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'عدد العناصر', default: 20 })
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'البحث بالاسم أو الإيميل' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'حالة المحفظة' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'الحد الأدنى للرصيد' })
  @IsOptional()
  @IsNumber()
  minBalance?: number;
}

export class AdminTopUpsQueryDto {
  @ApiPropertyOptional({ description: 'رقم الصفحة', default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'عدد العناصر', default: 20 })
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'الحالة' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'طريقة الشحن' })
  @IsOptional()
  @IsString()
  method?: string;
}

export class AdminWithdrawalsQueryDto {
  @ApiPropertyOptional({ description: 'رقم الصفحة', default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'عدد العناصر', default: 20 })
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'الحالة' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'طريقة السحب' })
  @IsOptional()
  @IsString()
  method?: string;
}
