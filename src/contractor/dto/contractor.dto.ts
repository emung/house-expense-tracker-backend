import { Expose } from 'class-transformer';

export class ContractorDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  address: string;

  @Expose()
  phone: string;

  @Expose()
  email: string;

  @Expose()
  website: string;

  @Expose()
  notes: string;
}
