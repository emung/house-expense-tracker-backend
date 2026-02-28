import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CurrencySumOutput {
  @Expose()
  @ApiProperty()
  currency: string;

  @Expose()
  @ApiProperty()
  sum: number;
}
