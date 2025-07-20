import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource,Repository } from 'typeorm';

import { Contractor } from './entities/contractor.entity';

@Injectable()
export class ContractorRepository extends Repository<Contractor> {
  constructor(private dataSource: DataSource) {
    super(Contractor, dataSource.createEntityManager());
  }

  async getById(id: number): Promise<Contractor> {
    const contractor = await this.findOne({ where: { id } });
    if (!contractor) {
      throw new NotFoundException(`No contractor found with ID=${id}`);
    }
    return contractor;
  }

  async getAllContractors(): Promise<Contractor[]> {
    const contractors = await this.find();
    if (contractors.length === 0) {
      throw new NotFoundException('No contractors found');
    }
    return contractors;
  }

  async getByName(name: string): Promise<Contractor> {
    const contractor = await this.findOne({ where: { name } });
    if (!contractor) {
      throw new NotFoundException(`No contractor found with name: ${name}`);
    }
    return contractor;
  }

  async createContractor(contractor: Contractor): Promise<Contractor> {
    return this.save(contractor);
  }

  async updateContractor(contractor: Contractor): Promise<Contractor> {
    return this.save(contractor);
  }
}
