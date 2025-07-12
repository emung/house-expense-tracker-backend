import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, DeleteResult, ILike, Repository } from 'typeorm';

import { Expense } from './entities/expense.entity';

@Injectable()
export class ExpenseRepository extends Repository<Expense> {
  constructor(private dataSource: DataSource) {
    super(Expense, dataSource.createEntityManager());
  }

  async getById(id: number): Promise<Expense> {
    const expense = await this.findOne({ where: { id } });
    if (!expense) {
      throw new NotFoundException(`No expense found with ID=${id}`);
    }
    return expense;
  }

  async getByCategory(category: string): Promise<Expense[]> {
    const expenses = await this.find({ where: { category } });
    if (expenses.length === 0) {
      throw new NotFoundException(`No expenses found for category: ${category}`);
    }
    return expenses;
  }

  async getByDescription(description: string): Promise<Expense[]> {
    const expenses = await this.find({ where: { description: ILike(`%${description}%`) } });
    if (expenses.length === 0) {
      throw new NotFoundException(`No expenses found for description: ${description}`);
    }
    return expenses;
  }

  async getAllExpenses(): Promise<Expense[]> {
    const expenses = await this.find();
    if (expenses.length === 0) {
      throw new NotFoundException('No expenses found');
    }
    return expenses;
  }

  async deleteExpenseById(id: number): Promise<DeleteResult> {
    const expenseExists = await this.existsBy({ id });
    if (!expenseExists) {
      throw new NotFoundException(`No expense found with ID=${id}`);
    }

    return await this.delete({ id });
  }

  async createExpense(expense: Expense): Promise<Expense> {
    return await this.save(expense);
  }

  async updateExpense(expense: Expense): Promise<Expense> {
    return await this.save(expense);
  }

  async getAllDistinctCategories(): Promise<string[]> {
    const expenses = await this.createQueryBuilder('expense').select('expense.category').distinct(true).getRawMany();
    return expenses.map((expense) => expense.expense_category);
  }
}
