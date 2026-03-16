import { Test, TestingModule } from '@nestjs/testing';

import { AppLogger } from '../shared/logger/logger.service';
import { Currency, Expense } from './entities/expense.entity';
import { ExpenseRepository } from './expense.repository';
import { ExpenseService } from './expense.service';

describe('ExpenseService', () => {
  let service: ExpenseService;
  const mockedLogger = { setContext: jest.fn(), log: jest.fn() };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ExpenseService,
        {
          provide: ExpenseRepository,
          useValue: {
            getAllExpenses: jest.fn(),
            getById: jest.fn(),
            getByCategory: jest.fn(),
            getByDescription: jest.fn(),
          },
        },
        { provide: AppLogger, useValue: mockedLogger },
      ],
    }).compile();

    service = moduleRef.get<ExpenseService>(ExpenseService);
  });

  describe('getExpensesSum', () => {
    it('should return empty array for no expenses', () => {
      const result = service.getExpensesSum([]);
      expect(result).toEqual([]);
    });

    it('should return single sum for one currency', () => {
      const expenses = [
        makeExpense(100, Currency.EUR),
        makeExpense(50, Currency.EUR),
      ];

      const result = service.getExpensesSum(expenses);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ currency: 'EUR', sum: 150, refundSum: 0 });
    });

    it('should return separate sums for each currency', () => {
      const expenses = [
        makeExpense(100, Currency.EUR),
        makeExpense(200, Currency.RON),
        makeExpense(50, Currency.EUR),
        makeExpense(300, Currency.RON),
      ];

      const result = service.getExpensesSum(expenses);

      expect(result).toHaveLength(2);
      const eurSum = result.find((s) => s.currency === 'EUR');
      const ronSum = result.find((s) => s.currency === 'RON');
      expect(eurSum?.sum).toBe(150);
      expect(eurSum?.refundSum).toBe(0);
      expect(ronSum?.sum).toBe(500);
      expect(ronSum?.refundSum).toBe(0);
    });

    it('should subtract refund from sum and expose refundSum', () => {
      const expenses = [
        makeExpense(100, Currency.EUR),
        makeExpense(30, Currency.EUR, true),
      ];

      const result = service.getExpensesSum(expenses);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ currency: 'EUR', sum: 70, refundSum: 30, count: 2 });
    });

    it('should return negative sum when all expenses are refunds', () => {
      const expenses = [makeExpense(50, Currency.EUR, true)];

      const result = service.getExpensesSum(expenses);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ currency: 'EUR', sum: -50, refundSum: 50, count: 1 });
    });
  });

  describe('getExpensesWithSumOrReturnExpensesWhenEmpty', () => {
    it('should return empty sums array when no expenses', () => {
      const result = service.getExpensesWithSumOrReturnExpensesWhenEmpty([]);

      expect(result.sums).toEqual([]);
      expect(result.amount).toBe(0);
      expect(result.expenses).toEqual([]);
    });

    it('should return per-currency sums with mixed expenses', () => {
      const expenses = [
        makeExpense(100, Currency.EUR),
        makeExpense(200, Currency.RON),
      ];

      const result = service.getExpensesWithSumOrReturnExpensesWhenEmpty(expenses);

      expect(result.sums).toHaveLength(2);
      expect(result.amount).toBe(2);
      expect(result.expenses).toHaveLength(2);

      const eurSum = result.sums.find((s) => s.currency === 'EUR');
      const ronSum = result.sums.find((s) => s.currency === 'RON');
      expect(eurSum?.sum).toBe(100);
      expect(ronSum?.sum).toBe(200);
    });
  });
});

function makeExpense(amount: number, currency: Currency, isRefund = false): Expense {
  const expense = new Expense();
  expense.id = Math.floor(Math.random() * 1000);
  expense.amount = amount;
  expense.currency = currency;
  expense.date = new Date();
  expense.description = 'Test';
  expense.category = 'Test';
  expense.recipient = 'Test';
  expense.userId = 1;
  expense.isRefund = isRefund;
  return expense;
}
