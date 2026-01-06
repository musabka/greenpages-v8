import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ApproveSettlementDto {
  @ApiPropertyOptional({ description: 'رقم الإيصال' })
  @IsOptional()
  @IsString()
  receiptNumber?: string;

  @ApiPropertyOptional({ description: 'ملاحظات' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectSettlementDto {
  @ApiPropertyOptional({ description: 'سبب الرفض' })
  @IsString()
  rejectionReason: string;
}
