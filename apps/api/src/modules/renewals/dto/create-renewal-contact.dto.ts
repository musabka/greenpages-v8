import { IsUUID, IsEnum, IsOptional, IsString, IsDateString, IsInt, IsNumber, Min, Max } from 'class-validator';
import { ContactMethod, RenewalDecision } from '@prisma/client';

export class CreateRenewalContactDto {
  @IsUUID()
  renewalRecordId: string;

  @IsEnum(ContactMethod)
  contactMethod: ContactMethod;

  @IsDateString()
  contactDate: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number; // المدة بالدقائق

  @IsOptional()
  @IsEnum(RenewalDecision)
  outcome?: RenewalDecision;

  @IsOptional()
  @IsString()
  notes?: string;

  // في حال الزيارة الميدانية
  @IsOptional()
  @IsString()
  visitAddress?: string;

  @IsOptional()
  @IsNumber()
  visitLatitude?: number;

  @IsOptional()
  @IsNumber()
  visitLongitude?: number;

  @IsOptional()
  @IsDateString()
  nextContactDate?: string;
}
