import { ClassSerializerInterceptor, Controller, Get, HttpStatus, Param, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BaseApiErrorResponse,SwaggerBaseApiResponse } from '../shared/dtos/base-api-response.dto';
import { AppLogger } from '../shared/logger/logger.service';
import { RequestContext } from '../shared/request-context/request-context.dto';
import { ExpenseOutput } from './dtos/expense-output.dto';
import { ExpenseService } from './expense.service';

@ApiTags('Expenses')
@Controller('expenses')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService, private readonly logger: AppLogger) {
    this.logger.setContext(ExpenseController.name);
  }

  @Get(':id')
  @ApiOperation({summary: 'Get expense by ID'})
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(ExpenseOutput),
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: BaseApiErrorResponse,
  })
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getExpenseById(ctx: RequestContext, @Param('id') id: number): Promise<ExpenseOutput> {
    return this.expenseService.getExpenseById(ctx, id);
  }

  @Get()
  @ApiOperation({summary: 'Get all expenses'})
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(ExpenseOutput),
    isArray: true,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: BaseApiErrorResponse,
  })
  // @UseInterceptors(ClassSerializerInterceptor)
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  async getAllExpenses(ctx: RequestContext): Promise<ExpenseOutput[]> {
    return this.expenseService.getAllExpenses(ctx);
  }
}
