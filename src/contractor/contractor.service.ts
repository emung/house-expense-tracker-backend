import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { DeleteResult } from 'typeorm';

import { ContractorRepository } from './contractor.repository';
import { ContractorDto } from './dto/contractor.dto';
import { CreateContractorDto } from './dto/create-contractor.dto';
import { DeleteContractorDto } from './dto/delete-contractor.dto';
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

  async findAll() {
    const contractors: Contractor[] = await this.repository.getAllContractors();
    return contractors.map((contractor) => plainToClass(ContractorDto, contractor, { excludeExtraneousValues: true }));
  }

  async findOne(name: string) {
    const contractor: Contractor = await this.repository.getByName(name);
    return plainToClass(ContractorDto, contractor, { excludeExtraneousValues: true });
  }

  async remove(id: number) {
    const deleteResult: DeleteResult = await this.repository.deleteContractorById(id);
    return plainToClass(DeleteContractorDto, deleteResult, { excludeExtraneousValues: true });
  }
}
