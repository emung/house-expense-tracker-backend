import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetByCategoryQueryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  category: string;
}
