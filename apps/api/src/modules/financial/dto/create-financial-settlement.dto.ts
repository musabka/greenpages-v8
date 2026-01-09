import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsUUID, IsNumber, Min } from 'class-validator';

export class CreateAgentFinancialSettlementDto {
  @ApiProperty({ description: 'معرف ملف المندوب' })
  @IsUUID()
  agentProfileId: string;

  @ApiPropertyOptional({ description: 'ملاحظات التسوية' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ConfirmAgentSettlementDto {
  @ApiPropertyOptional({ description: 'ملاحظات التأكيد' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'التوقيع (base64 أو رابط)' })
  @IsOptional()
  @IsString()
  signature?: string;
}

export class CreateManagerFinancialSettlementDto {
  @ApiProperty({ description: 'تاريخ بداية الفترة' })
  @IsString()
  periodStart: string;

  @ApiProperty({ description: 'تاريخ نهاية الفترة' })
  @IsString()
  periodEnd: string;

  @ApiPropertyOptional({ description: 'ملاحظات التسوية' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ConfirmManagerSettlementDto {
  @ApiPropertyOptional({ description: 'ملاحظات التأكيد' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'التوقيع (base64 أو رابط)' })
  @IsOptional()
  @IsString()
  signature?: string;
}
