import { IsUUID, IsBoolean, IsOptional, IsNumber, IsDateString } from 'class-validator';

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

  @IsOptional()
  @IsDateString()
  customExpiryDate?: string; // تاريخ انتهاء صلاحية مخصص (له الأولوية على durationDays)
}
