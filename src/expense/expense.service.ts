import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { DeleteResult } from 'typeorm';

import { AppLogger } from '../shared/logger/logger.service';
import { RequestContext } from '../shared/request-context/request-context.dto';
import { DeleteExpenseOutput } from './dtos/delete-expense-output.dto';
import { ExpenseOutput } from './dtos/expense-output.dto';
import { Expense } from './entities/expense.entity';
import { ExpenseRepository } from './expense.repository';

@Injectable()
export class ExpenseService {
  constructor(private repository: ExpenseRepository, private readonly logger: AppLogger) {
    this.logger.setContext(ExpenseService.name);
  }

  async getExpenseById(ctx: RequestContext, id: number) {
    this.logger.log(ctx, `Fetching expense with ID: ${id}`);
    const expense: Expense = await this.repository.getById(id);
    return plainToClass(ExpenseOutput, expense, {
      excludeExtraneousValues: true
    });
  }

  async getExpensesByCategory(ctx: RequestContext, category: string) {
    this.logger.log(ctx, `Fetching expenses for category: ${category}`);
    const expenses: Expense[] = await this.repository.getByCategory(category);
    return expenses.map(expense => plainToClass(ExpenseOutput, expense, {
      excludeExtraneousValues: true
    }));
  }

  async getAllExpenses(ctx: RequestContext) {
    this.logger.log(ctx, 'Fetching all expenses');
    const expenses: Expense[] = await this.repository.getAllExpenses();
    return expenses.map(expense => plainToClass(ExpenseOutput, expense, {
      excludeExtraneousValues: true
    }));
  }

  async deleteExpenseById(ctx: RequestContext, id: number): Promise<DeleteExpenseOutput> {
    this.logger.log(ctx, `Deleting expense with ID: ${id}`);
    const result: DeleteResult = await this.repository.deleteExpenseById(id);
    return plainToClass(DeleteExpenseOutput, result, {
      excludeExtraneousValues: true
    });
  }

}
