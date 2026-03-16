# Design: Add refundSum to CurrencySumOutput

**Date:** 2026-03-16

## Overview

Add a `refundSum` field to `CurrencySumOutput` and change `sum` to be the net amount (non-refund expenses minus refunds) per currency.

## Requirements

- `sum` in `CurrencySumOutput` must represent the net amount: sum of non-refund expenses minus sum of refund expenses, grouped by currency.
- A new `refundSum` field must expose the total amount of refund expenses per currency.
- `count` remains the total number of all expenses (refunds included) for that currency.

## Affected Files

- `src/expense/dtos/currency-sum-output.dto.ts` — add `refundSum` field
- `src/expense/expense.service.ts` — update `getExpensesSum` accumulation logic

## Data Flow

1. `getExpensesSum(expenses: Expense[])` iterates all expenses.
2. Per expense, if `isRefund === true`, accumulate into `refundSum`; otherwise accumulate into a non-refund sum.
3. Final `sum = nonRefundSum - refundSum`.
4. `plainToClass(CurrencySumOutput, { currency, sum, refundSum, count }, ...)` produces the output.

## DTO Shape

```ts
class CurrencySumOutput {
  currency: string;
  sum: number;       // net: non-refund total minus refund total
  refundSum: number; // total of refund expense amounts
  count: number;     // total number of expenses (all, including refunds)
}
```

## Edge Cases

- Currency with no refunds: `refundSum` is `0`, `sum` equals the full non-refund total (unchanged behaviour).
- Currency with only refunds: `sum` will be negative (the negated refund total).

## Out of Scope

- Repository or SQL-level changes
- Controller or `ExpensesOutput` changes
- Changes to `count` semantics
