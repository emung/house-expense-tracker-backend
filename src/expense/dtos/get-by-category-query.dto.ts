import { IsNotEmpty, IsString } from 'class-validator';

export class GetByCategoryQueryDto {
  @IsString()
  @IsNotEmpty()
  category: string;
}
