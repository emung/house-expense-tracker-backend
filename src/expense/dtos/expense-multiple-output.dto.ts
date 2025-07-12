import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import { ExpenseOutput } from './expense-output.dto';

export class ExpensesOutput {
  @Expose()
  @ApiProperty()
  sum: number;

  @Expose()
  @ApiProperty()
  amount: number;

  @Expose()
  @ApiProperty({ type: [ExpenseOutput], isArray: true })
  expenses: ExpenseOutput[];
}
