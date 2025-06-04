import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class ExpenseSumOutput {

  @Expose()
  @ApiProperty()
  totalAmount: number;
}
