# Per-Currency Sums Design

## Problem

`ExpensesOutput.sum` totals all expense amounts into a single number, ignoring that expenses can be in different currencies (EUR, RON). This produces a meaningless mixed-currency total.

## Decision

Replace the single `sum: number` field with a `sums: CurrencySumOutput[]` array, where each entry holds a currency and its corresponding total.

### Response Shape (after)

```json
{
  "sums": [
    { "currency": "EUR", "sum": 150.00 },
    { "currency": "RON", "sum": 320.50 }
  ],
  "amount": 5,
  "expenses": [...]
}
```

> [!WARNING]
> **Breaking change** — the `sum` field is removed from `ExpensesOutput`. Frontend consumers must migrate to `sums`.

## Files Changed

| File | Change |
|------|--------|
| `dtos/currency-sum-output.dto.ts` | **NEW** — `CurrencySumOutput` DTO |
| `dtos/expense-multiple-output.dto.ts` | Replace `sum: number` → `sums: CurrencySumOutput[]` |
| `expense.service.ts` | Update `getExpensesSum()` and helper method |
