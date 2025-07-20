import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ContractorService } from './contractor.service';
import { ContractorDto } from './dto/contractor.dto';
import { CreateContractorDto } from './dto/create-contractor.dto';
import { UpdateContractorDto } from './dto/update-contractor.dto';

@ApiTags('Contractors')
@Controller('contractors')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContractorController {
  constructor(private readonly contractorService: ContractorService) {}

  @Post()
  create(@Body() createContractorDto: CreateContractorDto): Promise<ContractorDto> {
    return this.contractorService.create(createContractorDto);
  }

  @Get()
  findAll() {
    return this.contractorService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.contractorService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateContractorDto: UpdateContractorDto) {
    return this.contractorService.update(id, updateContractorDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.contractorService.remove(id);
  }
}
