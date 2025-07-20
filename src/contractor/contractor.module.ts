import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SharedModule } from '../shared/shared.module';
import { ContractorController } from './contractor.controller';
import { ContractorRepository } from './contractor.repository';
import { ContractorService } from './contractor.service';
import { Contractor } from './entities/contractor.entity';

@Module({
  imports: [SharedModule, TypeOrmModule.forFeature([Contractor])],
  controllers: [ContractorController],
  providers: [ContractorService, ContractorRepository],
})
export class ContractorModule {}
