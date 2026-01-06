import { IsString, IsUUID, IsOptional, IsInt, IsDateString, IsEnum, Min, Max } from 'class-validator';
import { RenewalStatus } from '@prisma/client';

export class CreateRenewalRecordDto {
  @IsUUID()
  businessId: string;

  @IsOptional()
  @IsUUID()
  assignedAgentId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3)
  priority?: number;

  @IsOptional()
  @IsString()
  internalNotes?: string;
}

export class AssignAgentDto {
  @IsUUID()
  agentId: string;
}

export class UpdateRenewalStatusDto {
  @IsEnum(RenewalStatus)
  status: RenewalStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  nextFollowUpDate?: string;
}

export class BulkAssignAgentDto {
  @IsUUID('4', { each: true })
  renewalRecordIds: string[];

  @IsUUID()
  agentId: string;
}
