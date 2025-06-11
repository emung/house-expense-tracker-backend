import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class DeleteExpenseOutput {

  @Expose()
  @ApiProperty()
  affected: number;

}
