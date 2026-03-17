# Currency Sum Refund Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `refundSum` to `CurrencySumOutput` and change `sum` to be the net amount (non-refund total minus refund total) per currency.

**Architecture:** Update the in-memory accumulator in `getExpensesSum` to separately track refund and non-refund amounts per currency, then expose both via the DTO. No repository or controller changes needed.

**Tech Stack:** NestJS, TypeORM, class-transformer (`@Expose`, `plainToClass`), `@nestjs/swagger` (`@ApiProperty`), Jest.

---

## Chunk 1: Tests and Implementation

### Task 1: Write failing tests

**Files:**
- Modify: `src/expense/expense.service.spec.ts`

- [ ] **Step 1: Update the `makeExpense` helper to accept an optional `isRefund` parameter**

Replace the existing `makeExpense` function at the bottom of `src/expense/expense.service.spec.ts`:

```ts
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
```

- [ ] **Step 2: Update existing `getExpensesSum` tests to also assert `refundSum: 0`**

In the `should return single sum for one currency` test, change the assertion:

```ts
expect(result[0]).toMatchObject({ currency: 'EUR', sum: 150, refundSum: 0 });
```

In the `should return separate sums for each currency` test, add assertions:

```ts
expect(eurSum?.refundSum).toBe(0);
expect(ronSum?.refundSum).toBe(0);
```

- [ ] **Step 3: Add new test cases inside the `getExpensesSum` describe block**

```ts
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
```

- [ ] **Step 4: Run the tests to confirm they fail**

```bash
npm run test -- --testPathPattern=expense.service.spec
```

Expected: FAIL — `refundSum` is `undefined` on the current output.

---

### Task 2: Update the DTO

**Files:**
- Modify: `src/expense/dtos/currency-sum-output.dto.ts`

- [ ] **Step 5: Add the `refundSum` field**

Replace the entire file content:

```ts
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CurrencySumOutput {
  @Expose()
  @ApiProperty()
  currency: string;

  @Expose()
  @ApiProperty()
  sum: number;

  @Expose()
  @ApiProperty()
  refundSum: number;

  @Expose()
  @ApiProperty()
  count: number;
}
```

---

### Task 3: Update the service

**Files:**
- Modify: `src/expense/expense.service.ts:87-99`

- [ ] **Step 6: Update `getExpensesSum` to track `nonRefundSum` and `refundSum` separately**

Replace the `getExpensesSum` method:

```ts
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
```

- [ ] **Step 7: Run the tests and confirm they pass**

```bash
npm run test -- --testPathPattern=expense.service.spec
```

Expected: all tests PASS.

- [ ] **Step 8: Run the full test suite to confirm no regressions**

```bash
npm run test
```

Expected: all tests PASS.

- [ ] **Step 9: Commit**

```bash
git add src/expense/dtos/currency-sum-output.dto.ts \
        src/expense/expense.service.ts \
        src/expense/expense.service.spec.ts
git commit -m "feat: add refundSum to CurrencySumOutput and make sum net amount"
```
