import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BaseApiErrorResponse } from '../shared/dtos/base-api-response.dto';
import { AppLogger } from '../shared/logger/logger.service';
import { RequestContext } from '../shared/request-context/request-context.dto';
import { DeleteExpenseOutput } from './dtos/delete-expense-output.dto';
import { CreateExpenseInput, UpdateExpenseInput } from './dtos/expense-input.dto';
import { ExpenseOutput } from './dtos/expense-output.dto';
import { ExpenseService } from './expense.service';

@ApiTags('Expenses')
@Controller('expenses')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExpenseController {
  constructor(
    private readonly expenseService: ExpenseService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(ExpenseController.name);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all distinct categories' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: String,
    isArray: true,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: BaseApiErrorResponse,
  })
  async getAllDistinctCategories(ctx: RequestContext): Promise<string[]> {
    try {
      return await this.expenseService.getAllDistinctCategories(ctx);
    } catch (error: any) {
      throw new HttpException(
        `An error occured during the operation 'getAllDistinctCategories': ${error.message}`,
        error.status || error.statusCode || 500,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get expense by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: ExpenseOutput,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: BaseApiErrorResponse,
  })
  async getExpenseById(ctx: RequestContext, @Param('id') id: number): Promise<ExpenseOutput> {
    try {
      return this.expenseService.getExpenseById(ctx, id);
    } catch (error: any) {
      throw new HttpException(`An error occured during the operation 'getExpenseById': ${error.message}`, error.status || error.statusCode || 500);
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all expenses' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: ExpenseOutput,
    isArray: true,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: BaseApiErrorResponse,
  })
  async getAllExpenses(ctx: RequestContext): Promise<ExpenseOutput[]> {
    try {
      return this.expenseService.getAllExpenses(ctx);
    } catch (error: any) {
      throw new HttpException(`An error occured during the operation 'getAllExpenses': ${error.message}`, error.status || error.statusCode || 500);
    }
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get all expenses by category (exact match!)' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: ExpenseOutput,
    isArray: true,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: BaseApiErrorResponse,
  })
  async getExpensesByCategory(ctx: RequestContext, @Param('category') category: string): Promise<ExpenseOutput[]> {
    try {
      return this.expenseService.getExpensesByCategory(ctx, category);
    } catch (error: any) {
      throw new HttpException(
        `An error occured during the operation 'getExpensesByCategory': ${error.message}`,
        error.status || error.statusCode || 500,
      );
    }
  }

  @Get('description/:description')
  @ApiOperation({ summary: 'Get all expenses by description (ILIKE on description)' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: ExpenseOutput,
    isArray: true,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: BaseApiErrorResponse,
  })
  async getByDescription(ctx: RequestContext, @Param('description') description: string): Promise<ExpenseOutput[]> {
    try {
      return this.expenseService.getByDescription(ctx, description);
    } catch (error: any) {
      throw new HttpException(`An error occured during the operation 'getByDescription': ${error.message}`, error.status || error.statusCode || 500);
    }
  }

  @Get('category/:category/description/:description')
  @ApiOperation({ summary: 'Get all expenses by category and description (ILIKE on description)' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: ExpenseOutput,
    isArray: true,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: BaseApiErrorResponse,
  })
  async getByCategoryAndDescription(
    ctx: RequestContext,
    @Param('category') category: string,
    @Param('description') description: string,
  ): Promise<ExpenseOutput[]> {
    try {
      return this.expenseService.getByCategoryAndDescription(ctx, category, description);
    } catch (error: any) {
      throw new HttpException(
        `An error occured during the operation 'getByCategoryAndDescription': ${error.message}`,
        error.status || error.statusCode || 500,
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete expense by id' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: DeleteExpenseOutput,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: BaseApiErrorResponse,
  })
  async deleteExpenseById(ctx: RequestContext, @Param('id') id: number): Promise<DeleteExpenseOutput> {
    try {
      return await this.expenseService.deleteExpenseById(ctx, id);
    } catch (error: any) {
      throw new HttpException(`An error occured during the operation 'deleteExpenseById': ${error.message}`, error.status || error.statusCode || 500);
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create expense' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: ExpenseOutput,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: BaseApiErrorResponse,
  })
  async createExpense(ctx: RequestContext, @Body() input: CreateExpenseInput): Promise<ExpenseOutput> {
    try {
      return await this.expenseService.createExpense(ctx, input);
    } catch (error: any) {
      throw new HttpException(`An error occured during the operation 'createExpense': ${error.message}`, error.status || error.statusCode || 500);
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update expense by id' })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    type: ExpenseOutput,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: BaseApiErrorResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    type: BaseApiErrorResponse,
  })
  async updateExpense(ctx: RequestContext, @Param('id') id: number, @Body() input: UpdateExpenseInput): Promise<ExpenseOutput> {
    try {
      return await this.expenseService.updateExpense(ctx, id, input);
    } catch (error: any) {
      throw new HttpException(`An error occured during the operation 'updateExpense': ${error.message}`, error.status || error.statusCode || 500);
    }
  }
}
