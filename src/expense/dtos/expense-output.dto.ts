import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class ExpenseOutput {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  amount: number;

  @Expose()
  @ApiProperty()
  date: Date;

  @Expose()
  @ApiProperty()
  description: string;

  @Expose()
  @ApiProperty()
  category: string;
}
