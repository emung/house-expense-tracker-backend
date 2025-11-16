import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';

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
}
