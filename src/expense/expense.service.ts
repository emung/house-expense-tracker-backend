import { format } from '@fast-csv/format';
import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { Readable } from 'stream';
import { DeleteResult } from 'typeorm';

import { AppLogger } from '../shared/logger/logger.service';
import { RequestContext } from '../shared/request-context/request-context.dto';
import { CurrencySumOutput } from './dtos/currency-sum-output.dto';
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

  async exportExpensesToCsv(ctx: RequestContext): Promise<Readable> {
    this.logger.log(ctx, 'Exporting expenses to CSV');
    const expenses: Expense[] = await this.repository.getAllExpenses();

    expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const csvStream = format({
      headers: ['Amount', 'Date', 'Description', 'Category', 'Recipient', 'Currency', 'Type'],
      alwaysWriteHeaders: true,
    });

    for (const expense of expenses) {
      csvStream.write({
        Amount: expense.amount,
        Date: expense.date.toISOString().split('T')[0],
        Description: expense.description,
        Category: expense.category,
        Recipient: expense.recipient,
        Currency: expense.currency,
        Type: expense.isRefund ? 'Refund' : 'Expense',
      });
    }

    csvStream.end();
    return csvStream;
  }

  getExpensesSum(expenses: Expense[]): CurrencySumOutput[] {
    const sumsByCurrency = new Map<string, { nonRefundSum: number; refundSum: number; count: number }>();
    for (const expense of expenses) {
      const current = sumsByCurrency.get(expense.currency) ?? { nonRefundSum: 0, refundSum: 0, count: 0 };
      sumsByCurrency.set(expense.currency, {
        nonRefundSum: expense.isRefund ? current.nonRefundSum : current.nonRefundSum + expense.amount,
        refundSum: expense.isRefund ? current.refundSum + expense.amount : current.refundSum,
        count: current.count + 1,
      });
    }
    return Array.from(sumsByCurrency.entries()).map(([currency, { nonRefundSum, refundSum, count }]) =>
      plainToClass(
        CurrencySumOutput,
        { currency, sum: nonRefundSum - refundSum, refundSum, count },
        { excludeExtraneousValues: true },
      ),
    );
  }

  getExpensesWithSumOrReturnExpensesWhenEmpty(expenses: Expense[]) {
    let expensesOutput: ExpensesOutput = {
      sums: [],
      amount: 0,
      expenses: [],
    };
    if (expenses.length === 0) {
      return expensesOutput;
    }

    expensesOutput = {
      sums: this.getExpensesSum(expenses),
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
