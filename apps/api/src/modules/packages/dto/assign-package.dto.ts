import { IsUUID, IsBoolean, IsOptional, IsNumber } from 'class-validator';

export class AssignPackageDto {
  @IsUUID()
  businessId: string;

  @IsUUID()
  packageId: string;

  @IsOptional()
  @IsNumber()
  durationDays?: number;

  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;
}
