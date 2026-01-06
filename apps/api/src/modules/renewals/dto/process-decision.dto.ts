import { IsUUID, IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { RenewalDecision } from '@prisma/client';

export class ProcessDecisionDto {
  @IsEnum(RenewalDecision)
  decision: RenewalDecision;

  @IsOptional()
  @IsString()
  notes?: string;

  // في حال القبول
  @IsOptional()
  @IsUUID()
  newPackageId?: string;

  @IsOptional()
  @IsDateString()
  customExpiryDate?: string;

  @IsOptional()
  durationDays?: number;

  // في حال التأجيل
  @IsOptional()
  @IsDateString()
  postponeUntil?: string;
}
