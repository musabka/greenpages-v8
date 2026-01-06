import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

class JournalLineDto {
  @ApiProperty({ example: 'CASH' })
  @IsString()
  @IsNotEmpty()
  accountCode: string;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  @Min(0)
  debit: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  @Min(0)
  credit: number;

  @ApiProperty({ example: 'Wallet top-up bank transfer' })
  @IsString()
  @IsNotEmpty()
  memo: string;
}

export class CreateManualJournalEntryDto {
  @ApiProperty({ example: 'Manual entry' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ type: [JournalLineDto] })
  @IsArray()
  @ArrayMinSize(2)
  lines: JournalLineDto[];
}
