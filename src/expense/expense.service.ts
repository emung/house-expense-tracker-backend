import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { DeleteResult } from 'typeorm';

import { AppLogger } from '../shared/logger/logger.service';
import { RequestContext } from '../shared/request-context/request-context.dto';
import { DeleteExpenseOutput } from './dtos/delete-expense-output.dto';
import { CreateExpenseInput, UpdateExpenseInput } from './dtos/expense-input.dto';
import { ExpensesOutput } from './dtos/expense-multiple-output.dto';
import { ExpenseOutput } from './dtos/expense-output.dto';
import { Expense } from './entities/expense.entity';
import { ExpenseRepository } from './expense.repository';

@Injectable()
export class ExpenseService {
  constructor(
    private repository: ExpenseRepository,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(ExpenseService.name);
  }

  async getExpenseById(ctx: RequestContext, id: number) {
    this.logger.log(ctx, `Fetching expense with ID: ${id}`);
    const expense: Expense = await this.repository.getById(id);
    return plainToClass(ExpenseOutput, expense, {
      excludeExtraneousValues: true,
    });
  }

  async getExpensesByCategory(ctx: RequestContext, category: string) {
    this.logger.log(ctx, `Fetching expenses for category: ${category}`);
    const expenses: Expense[] = await this.repository.getByCategory(category);
    return this.getExpensesWithSumOrReturnExpensesWhenEmpty(expenses);
  }

  async getByDescription(ctx: RequestContext, description: string) {
    this.logger.log(ctx, `Fetching expenses for description: ${description}`);
    const expenses: Expense[] = await this.repository.getByDescription(description);
    return this.getExpensesWithSumOrReturnExpensesWhenEmpty(expenses);
  }

  async getAllExpenses(ctx: RequestContext) {
    this.logger.log(ctx, 'Fetching all expenses');
    const expenses: Expense[] = await this.repository.getAllExpenses();
    return this.getExpensesWithSumOrReturnExpensesWhenEmpty(expenses);
  }

  async deleteExpenseById(ctx: RequestContext, id: number): Promise<DeleteExpenseOutput> {
    this.logger.log(ctx, `Deleting expense with ID: ${id}`);
    const result: DeleteResult = await this.repository.deleteExpenseById(id);
    return plainToClass(DeleteExpenseOutput, result, {
      excludeExtraneousValues: true,
    });
  }

  async createExpense(ctx: RequestContext, input: CreateExpenseInput) {
    this.logger.log(ctx, `Creating expense`);

    const expense: Expense = plainToClass(Expense, input);
    const savedExpense: Expense = await this.repository.createExpense(expense);
    return plainToClass(ExpenseOutput, savedExpense, {
      excludeExtraneousValues: true,
    });
  }

  async updateExpense(ctx: RequestContext, id: number, input: UpdateExpenseInput) {
    this.logger.log(ctx, `Updating expense with ID: ${id}`);
    const expense: Expense = await this.repository.getById(id);
    const updatedExpense: Expense = {
      ...expense,
      ...input,
    };
    const savedExpense: Expense = await this.repository.updateExpense(updatedExpense);
    return plainToClass(ExpenseOutput, savedExpense, {
      excludeExtraneousValues: true,
    });
  }

  async getAllDistinctCategories(ctx: RequestContext): Promise<string[]> {
    this.logger.log(ctx, 'Fetching all distinct categories');
    const categories: string[] = await this.repository.getAllDistinctCategories();
    return categories;
  }

  getExpensesSum(expenses: Expense[]): number {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  }

  getExpensesWithSumOrReturnExpensesWhenEmpty(expenses: Expense[]) {
    let expensesOutput: ExpensesOutput = {
      sum: 0,
      amount: 0,
      expenses: [],
    };
    if (expenses.length === 0) {
      return expensesOutput;
    }

    expensesOutput = {
      sum: this.getExpensesSum(expenses),
      amount: expenses.length,
      expenses: expenses.map((expense) =>
        plainToClass(ExpenseOutput, expense, {
          excludeExtraneousValues: true,
        }),
      ),
    };
    return expensesOutput;
  }
}
