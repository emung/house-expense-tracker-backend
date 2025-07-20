import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';

import { ContractorRepository } from './contractor.repository';
import { ContractorDto } from './dto/contractor.dto';
import { CreateContractorDto } from './dto/create-contractor.dto';
import { UpdateContractorDto } from './dto/update-contractor.dto';
import { Contractor } from './entities/contractor.entity';

@Injectable()
export class ContractorService {
  constructor(private repository: ContractorRepository) {}

  async create(createContractorDto: CreateContractorDto): Promise<ContractorDto> {
    const contractor: Contractor = plainToClass(Contractor, createContractorDto);
    const savedContractor: Contractor = await this.repository.createContractor(contractor);
    return plainToClass(ContractorDto, savedContractor, { excludeExtraneousValues: true });
  }

  async update(id: number, updateContractorDto: UpdateContractorDto): Promise<ContractorDto> {
    const contractor: Contractor = await this.repository.getById(id);
    const updatedContractor: Contractor = {
      ...contractor,
      ...updateContractorDto,
    };
    const savedContractor: Contractor = await this.repository.updateContractor(updatedContractor);
    return plainToClass(ContractorDto, savedContractor, { excludeExtraneousValues: true });
  }

  findAll() {
    return `This action returns all contractor`;
  }

  findOne(id: number) {
    return `This action returns a #${id} contractor`;
  }

  remove(id: number) {
    return `This action removes a #${id} contractor`;
  }
}
