import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ContractorController } from './contractor.controller';
import { ContractorService } from './contractor.service';
import { ContractorDto } from './dto/contractor.dto';
import { CreateContractorDto } from './dto/create-contractor.dto';
import { DeleteContractorDto } from './dto/delete-contractor.dto';
import { UpdateContractorDto } from './dto/update-contractor.dto';

describe('ContractorController', () => {
  let controller: ContractorController;
  let service: ContractorService;

  const mockContractorService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockContractorDto: ContractorDto = {
    id: 1,
    name: 'ABC Construction',
    address: '123 Main St, City, State 12345',
    phone: '+1-555-123-4567',
    email: 'contact@abcconstruction.com',
    website: 'https://www.abcconstruction.com',
    notes: 'Specialized in kitchen renovations',
  };

  const mockCreateContractorDto: CreateContractorDto = {
    name: 'ABC Construction',
    address: '123 Main St, City, State 12345',
    phone: '+1-555-123-4567',
    email: 'contact@abcconstruction.com',
    website: 'https://www.abcconstruction.com',
    notes: 'Specialized in kitchen renovations',
  };

  const mockUpdateContractorDto: UpdateContractorDto = {
    name: 'Updated Construction Co',
    phone: '+1-555-999-8888',
  };

  const mockDeleteContractorDto: DeleteContractorDto = {
    affected: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContractorController],
      providers: [
        {
          provide: ContractorService,
          useValue: mockContractorService,
        },
      ],
    }).compile();

    controller = module.get<ContractorController>(ContractorController);
    service = module.get<ContractorService>(ContractorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a contractor successfully', async () => {
      mockContractorService.create.mockResolvedValue(mockContractorDto);

      const result = await controller.create(mockCreateContractorDto);

      expect(service.create).toHaveBeenCalledWith(mockCreateContractorDto);
      expect(service.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockContractorDto);
    });

    it('should handle service errors during creation', async () => {
      const error = new Error('Database error');
      mockContractorService.create.mockRejectedValue(error);

      await expect(controller.create(mockCreateContractorDto)).rejects.toThrow('Database error');
      expect(service.create).toHaveBeenCalledWith(mockCreateContractorDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of contractors', async () => {
      const mockContractors = [mockContractorDto];
      mockContractorService.findAll.mockResolvedValue(mockContractors);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockContractors);
    });

    it('should return empty array when no contractors exist', async () => {
      mockContractorService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });

    it('should handle service errors during findAll', async () => {
      const error = new Error('Database connection failed');
      mockContractorService.findAll.mockRejectedValue(error);

      await expect(controller.findAll()).rejects.toThrow('Database connection failed');
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a contractor by name', async () => {
      const contractorName = 'ABC Construction';
      mockContractorService.findOne.mockResolvedValue(mockContractorDto);

      const result = await controller.findOne(contractorName);

      expect(service.findOne).toHaveBeenCalledWith(contractorName);
      expect(service.findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockContractorDto);
    });

    it('should handle not found contractor', async () => {
      const contractorName = 'NonExistent Contractor';
      const notFoundError = new NotFoundException(`No contractor found with name: ${contractorName}`);
      mockContractorService.findOne.mockRejectedValue(notFoundError);

      await expect(controller.findOne(contractorName)).rejects.toThrow(NotFoundException);
      expect(service.findOne).toHaveBeenCalledWith(contractorName);
    });

    it('should handle special characters in contractor name', async () => {
      const contractorName = "O'Reilly & Sons";
      mockContractorService.findOne.mockResolvedValue({
        ...mockContractorDto,
        name: contractorName,
      });

      const result = await controller.findOne(contractorName);

      expect(service.findOne).toHaveBeenCalledWith(contractorName);
      expect(result.name).toEqual(contractorName);
    });
  });

  describe('update', () => {
    it('should update a contractor successfully', async () => {
      const contractorId = 1;
      const updatedContractor = { ...mockContractorDto, ...mockUpdateContractorDto };
      mockContractorService.update.mockResolvedValue(updatedContractor);

      const result = await controller.update(contractorId, mockUpdateContractorDto);

      expect(service.update).toHaveBeenCalledWith(contractorId, mockUpdateContractorDto);
      expect(service.update).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedContractor);
    });

    it('should handle not found contractor during update', async () => {
      const contractorId = 999;
      const notFoundError = new NotFoundException(`No contractor found with ID=${contractorId}`);
      mockContractorService.update.mockRejectedValue(notFoundError);

      await expect(controller.update(contractorId, mockUpdateContractorDto)).rejects.toThrow(NotFoundException);
      expect(service.update).toHaveBeenCalledWith(contractorId, mockUpdateContractorDto);
    });

    it('should update with partial data', async () => {
      const contractorId = 1;
      const partialUpdate = { phone: '+1-555-111-2222' };
      const updatedContractor = { ...mockContractorDto, phone: partialUpdate.phone };
      mockContractorService.update.mockResolvedValue(updatedContractor);

      const result = await controller.update(contractorId, partialUpdate);

      expect(service.update).toHaveBeenCalledWith(contractorId, partialUpdate);
      expect(result.phone).toEqual(partialUpdate.phone);
    });

    it('should handle empty update object', async () => {
      const contractorId = 1;
      const emptyUpdate = {};
      mockContractorService.update.mockResolvedValue(mockContractorDto);

      const result = await controller.update(contractorId, emptyUpdate);

      expect(service.update).toHaveBeenCalledWith(contractorId, emptyUpdate);
      expect(result).toEqual(mockContractorDto);
    });
  });

  describe('remove', () => {
    it('should delete a contractor successfully', async () => {
      const contractorId = 1;
      mockContractorService.remove.mockResolvedValue(mockDeleteContractorDto);

      const result = await controller.remove(contractorId);

      expect(service.remove).toHaveBeenCalledWith(contractorId);
      expect(service.remove).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockDeleteContractorDto);
      expect(result.affected).toBe(1);
    });

    it('should handle not found contractor during deletion', async () => {
      const contractorId = 999;
      const notFoundError = new NotFoundException(`No contractor found with ID=${contractorId}`);
      mockContractorService.remove.mockRejectedValue(notFoundError);

      await expect(controller.remove(contractorId)).rejects.toThrow(NotFoundException);
      expect(service.remove).toHaveBeenCalledWith(contractorId);
    });

    it('should handle deletion of already deleted contractor', async () => {
      const contractorId = 1;
      const deleteResult = { affected: 0 };
      mockContractorService.remove.mockResolvedValue(deleteResult);

      const result = await controller.remove(contractorId);

      expect(service.remove).toHaveBeenCalledWith(contractorId);
      expect(result.affected).toBe(0);
    });

    it('should handle database errors during deletion', async () => {
      const contractorId = 1;
      const error = new Error('Foreign key constraint violation');
      mockContractorService.remove.mockRejectedValue(error);

      await expect(controller.remove(contractorId)).rejects.toThrow('Foreign key constraint violation');
      expect(service.remove).toHaveBeenCalledWith(contractorId);
    });
  });
});
