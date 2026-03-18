import { Test, TestingModule } from '@nestjs/testing';

import { AppLogger } from '../shared/logger/logger.service';
import { Currency, Expense } from './entities/expense.entity';
import { ExpenseRepository } from './expense.repository';
import { ExpenseService } from './expense.service';

describe('ExpenseService', () => {
  let service: ExpenseService;
  let mockedRepository: jest.Mocked<ExpenseRepository>;
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
    mockedRepository = moduleRef.get<ExpenseRepository>(ExpenseRepository) as jest.Mocked<ExpenseRepository>;
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

  describe('exportExpensesToCsv', () => {
    it('should return CSV with header and data rows ordered by date descending', async () => {
      const expenses = [
        makeExpenseWithDetails(100.5, Currency.EUR, false, new Date('2025-06-15'), 'Groceries', 'Food', 'Lidl'),
        makeExpenseWithDetails(30, Currency.RON, true, new Date('2025-07-20'), 'Return item', 'Shopping', 'Amazon'),
      ];

      mockedRepository.getAllExpenses.mockResolvedValue(expenses);

      const ctx = { requestID: 'test', url: '', ip: '', user: null } as any;
      const stream = await service.exportExpensesToCsv(ctx);

      const csv = await streamToString(stream);
      const lines = csv.trim().split('\n');

      expect(lines[0]).toBe('Amount,Date,Description,Category,Recipient,Currency,Type');
      // Date descending: 2025-07-20 first, then 2025-06-15
      expect(lines[1]).toBe('30,2025-07-20,Return item,Shopping,Amazon,RON,Refund');
      expect(lines[2]).toBe('100.5,2025-06-15,Groceries,Food,Lidl,EUR,Expense');
    });

    it('should return header-only CSV when no expenses exist', async () => {
      mockedRepository.getAllExpenses.mockResolvedValue([]);

      const ctx = { requestID: 'test', url: '', ip: '', user: null } as any;
      const stream = await service.exportExpensesToCsv(ctx);

      const csv = await streamToString(stream);
      const lines = csv.trim().split('\n');

      expect(lines).toHaveLength(1);
      expect(lines[0]).toBe('Amount,Date,Description,Category,Recipient,Currency,Type');
    });

    it('should quote fields containing commas', async () => {
      const expenses = [
        makeExpenseWithDetails(50, Currency.EUR, false, new Date('2025-08-01'), 'Apples, bananas', 'Food, Drink', 'Store'),
      ];

      mockedRepository.getAllExpenses.mockResolvedValue(expenses);

      const ctx = { requestID: 'test', url: '', ip: '', user: null } as any;
      const stream = await service.exportExpensesToCsv(ctx);

      const csv = await streamToString(stream);
      const lines = csv.trim().split('\n');

      expect(lines[1]).toBe('50,2025-08-01,"Apples, bananas","Food, Drink",Store,EUR,Expense');
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
  expense.isRefund = isRefund;
  return expense;
}

function makeExpenseWithDetails(
  amount: number,
  currency: Currency,
  isRefund: boolean,
  date: Date,
  description: string,
  category: string,
  recipient: string,
): Expense {
  const expense = new Expense();
  expense.id = Math.floor(Math.random() * 1000);
  expense.amount = amount;
  expense.currency = currency;
  expense.date = date;
  expense.description = description;
  expense.category = category;
  expense.recipient = recipient;
  expense.isRefund = isRefund;
  return expense;
}

function streamToString(stream: import('stream').Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    stream.on('error', reject);
  });
}
