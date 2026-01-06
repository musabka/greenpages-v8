import { IsString, IsEmail, Matches, MaxLength, IsOptional, IsUUID, IsNumber, Min, Max, IsArray, IsBoolean } from 'class-validator';

export class CreateAgentDto {
  @IsEmail({}, { message: 'بريد إلكتروني غير صحيح' })
  email: string;

  @IsString()
  @Matches(/^\+?[0-9]{10,15}$/, { message: 'رقم هاتف غير صحيح' })
  phone: string;

  @IsString()
  @MaxLength(50)
  firstName: string;

  @IsString()
  @MaxLength(50)
  lastName: string;

  @IsString()
  password: string;

  @IsUUID()
  governorateId: string;

  @IsOptional()
  @IsUUID()
  cityId?: string;

  @IsOptional()
  @IsUUID()
  districtId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  managedGovernorateIds?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  baseSalary?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate?: number;

  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;
}
