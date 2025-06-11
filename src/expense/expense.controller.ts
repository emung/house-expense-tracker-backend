import { ClassSerializerInterceptor, Controller, Delete, Get, HttpException, HttpStatus, Param, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BaseApiErrorResponse, SwaggerBaseApiResponse } from '../shared/dtos/base-api-response.dto';
import { AppLogger } from '../shared/logger/logger.service';
import { RequestContext } from '../shared/request-context/request-context.dto';
import { DeleteExpenseOutput } from './dtos/delete-expense-output.dto';
import { ExpenseOutput } from './dtos/expense-output.dto';
import { ExpenseService } from './expense.service';

@ApiTags('Expenses')
@Controller('expenses')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService, private readonly logger: AppLogger) {
    this.logger.setContext(ExpenseController.name);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get expense by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(ExpenseOutput),
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
    type: SwaggerBaseApiResponse(ExpenseOutput),
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
  @ApiOperation({ summary: 'Get all expenses by category' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(ExpenseOutput),
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
      throw new HttpException(`An error occured during the operation 'getExpensesByCategory': ${error.message}`, error.status || error.statusCode || 500);
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete expense by id' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(DeleteExpenseOutput)
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
}
