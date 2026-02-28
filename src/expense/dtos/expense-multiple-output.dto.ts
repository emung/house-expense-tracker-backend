import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import { CurrencySumOutput } from './currency-sum-output.dto';
import { ExpenseOutput } from './expense-output.dto';

export class ExpensesOutput {
  @Expose()
  @ApiProperty({ type: [CurrencySumOutput], isArray: true })
  sums: CurrencySumOutput[];

  @Expose()
  @ApiProperty()
  amount: number;

  @Expose()
  @ApiProperty({ type: [ExpenseOutput], isArray: true })
  expenses: ExpenseOutput[];
}
