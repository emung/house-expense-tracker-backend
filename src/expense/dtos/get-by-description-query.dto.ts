import { IsNotEmpty, IsString } from 'class-validator';

export class GetByDescriptionQueryDto {
  @IsString()
  @IsNotEmpty()
  description: string;
}
