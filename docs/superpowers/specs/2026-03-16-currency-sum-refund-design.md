# Design: Add refundSum to CurrencySumOutput

**Date:** 2026-03-16

## Overview

Add a `refundSum` field to `CurrencySumOutput` and change `sum` to be the net amount (non-refund expenses minus refunds) per currency.

## Requirements

- `sum` in `CurrencySumOutput` must represent the net amount: sum of non-refund expenses minus sum of refund expenses, grouped by currency.
- A new `refundSum` field must expose the total amount of refund expenses per currency.
- `count` remains the total number of all expenses (refunds included) for that currency. The `count` increment is unconditional — no `isRefund` guard is added around it.

## Affected Files

- `src/expense/dtos/currency-sum-output.dto.ts` — add `refundSum` field with `@Expose()` and `@ApiProperty()`
- `src/expense/expense.service.ts` — update `getExpensesSum` accumulation logic
- `src/expense/expense.service.spec.ts` — add/update test cases for the new behaviour

## Data Flow

1. `getExpensesSum(expenses: Expense[])` iterates all expenses.
2. The per-currency accumulator map changes from `{ sum, count }` to `{ nonRefundSum, refundSum, count }`.
3. Per expense:
   - If `expense.isRefund === true`: add `expense.amount` to `refundSum`. (`undefined`/`null` is treated as `false` — non-refund.)
   - Otherwise: add `expense.amount` to `nonRefundSum`.
   - Always increment `count` unconditionally.
4. Final output values: `sum = nonRefundSum - refundSum`, `refundSum` as-is.
5. `plainToClass(CurrencySumOutput, { currency, sum, refundSum, count }, { excludeExtraneousValues: true })` produces the output.

## DTO Shape

```ts
class CurrencySumOutput {
  @Expose()
  @ApiProperty()
  currency: string;

  @Expose()
  @ApiProperty()
  sum: number;       // net: non-refund total minus refund total

  @Expose()
  @ApiProperty()
  refundSum: number; // total of refund expense amounts for this currency

  @Expose()
  @ApiProperty()
  count: number;     // total number of expenses (all, including refunds)
}
```

## Test Cases Required

The `makeExpense` helper in `expense.service.spec.ts` does not set `isRefund`; it must accept an optional `isRefund` parameter (defaulting to `false`) to support the new cases. New test cases for `getExpensesSum`:

- **Mixed**: one non-refund expense (e.g. 100 EUR) and one refund (e.g. 30 EUR) → `sum = 70`, `refundSum = 30`, `count = 2`.
- **All refunds**: one refund expense (50 EUR) → `sum = -50`, `refundSum = 50`, `count = 1`.
- **No refunds**: existing case → `refundSum = 0`, `sum` unchanged.

## Edge Cases

- Currency with no refunds: `refundSum` is `0`, `sum` equals the full non-refund total (existing behaviour preserved).
- Currency with only refunds: `sum` will be negative.
- `isRefund` being `undefined` or `null` is treated as `false` (non-refund).

## Side Effects

- Adding `@ApiProperty()` to `refundSum` will update the generated Swagger/OpenAPI schema for all endpoints that return `ExpensesOutput` (which embeds `CurrencySumOutput[]`). This is an intentional, expected consequence of the change.

## Out of Scope

- Repository or SQL-level changes
- Controller or `ExpensesOutput` DTO changes
