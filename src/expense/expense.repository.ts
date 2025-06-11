import { Injectable, NotFoundException } from "@nestjs/common";
import { DataSource, DeleteResult, Repository } from "typeorm";

import { Expense } from "./entities/expense.entity";

@Injectable()
export class ExpenseRepository extends Repository<Expense> {
  constructor(private dataSource: DataSource) {
    super(Expense, dataSource.createEntityManager());
  }

  async getById(id: number): Promise<Expense> {
    const expense = await this.findOne({ where: { id } });
    if (!expense) {
      throw new NotFoundException();
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
}
