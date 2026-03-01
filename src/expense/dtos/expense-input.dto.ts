import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsNotEmpty, IsNumber, IsString } from 'class-validator';

import { Currency } from '../entities/expense.entity';

export class CreateExpenseInput {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  recipient: string;

  @ApiPropertyOptional()
  @IsISO8601()
  date?: Date;

  @ApiProperty({ enum: Currency })
  @IsNotEmpty()
  @IsEnum(Currency)
  currency: Currency;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  userId: number;
}

export class UpdateExpenseInput {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  recipient: string;

  @ApiProperty({ enum: Currency })
  @IsNotEmpty()
  @IsEnum(Currency)
  currency: Currency;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsISO8601()
  date: Date;
}
