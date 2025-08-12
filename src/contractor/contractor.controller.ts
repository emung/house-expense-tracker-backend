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
import { DeleteContractorDto } from './dto/delete-contractor.dto';
import { UpdateContractorDto } from './dto/update-contractor.dto';

@ApiTags('Contractors')
@Controller('contractors')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContractorController {
  constructor(private readonly contractorService: ContractorService) {}

  @Post()
  async create(@Body() createContractorDto: CreateContractorDto): Promise<ContractorDto> {
    return this.contractorService.create(createContractorDto);
  }

  @Get()
  async findAll(): Promise<ContractorDto[]> {
    return this.contractorService.findAll();
  }

  @Get(':name')
  async findOne(@Param('name') name: string): Promise<ContractorDto> {
    return this.contractorService.findOne(name);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateContractorDto: UpdateContractorDto,
  ): Promise<ContractorDto> {
    return this.contractorService.update(id, updateContractorDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<DeleteContractorDto> {
    return this.contractorService.remove(id);
  }
}
