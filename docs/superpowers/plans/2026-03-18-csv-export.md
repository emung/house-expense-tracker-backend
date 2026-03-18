# CSV Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a GET endpoint that exports all expenses as a downloadable CSV file.

**Architecture:** New `exportExpensesToCsv` method in `ExpenseService` uses `@fast-csv/format` to transform expense entities into a CSV stream. The controller pipes this stream directly to the response with appropriate headers. TDD approach — tests first, then implementation.

**Tech Stack:** NestJS, `@fast-csv/format`, Jest

---

### Task 1: Install `@fast-csv/format` dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the package**

```bash
npm install @fast-csv/format
```

- [ ] **Step 2: Verify installation**

```bash
node -e "require('@fast-csv/format')"
```

Expected: No error output.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "build: add @fast-csv/format dependency"
```

---

### Task 2: Write failing tests for `exportExpensesToCsv`

**Files:**
- Modify: `src/expense/expense.service.spec.ts`

- [ ] **Step 1: Write test for CSV export with multiple expenses**

First, add a `mockedRepository` variable to the test setup. In the existing `beforeEach`, after `service = moduleRef.get(...)`, add:

```typescript
const mockedRepository = moduleRef.get<ExpenseRepository>(ExpenseRepository) as jest.Mocked<ExpenseRepository>;
```

Move `mockedRepository` to the `describe` scope (declare it alongside `service`) so all tests can access it.

Then add a new `describe('exportExpensesToCsv')` block after the existing test blocks:

```typescript
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
});
```

- [ ] **Step 2: Write test for empty dataset (header-only CSV)**

```typescript
it('should return header-only CSV when no expenses exist', async () => {
  mockedRepository.getAllExpenses.mockResolvedValue([]);

  const ctx = { requestID: 'test', url: '', ip: '', user: null } as any;
  const stream = await service.exportExpensesToCsv(ctx);

  const csv = await streamToString(stream);
  const lines = csv.trim().split('\n');

  expect(lines).toHaveLength(1);
  expect(lines[0]).toBe('Amount,Date,Description,Category,Recipient,Currency,Type');
});
```

- [ ] **Step 3: Write test for proper quoting of fields with commas**

```typescript
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
```

- [ ] **Step 4: Add helper functions at the bottom of the test file**

Add these helpers alongside the existing `makeExpense` function:

```typescript
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
```

- [ ] **Step 5: Run tests to verify they fail**

```bash
npx jest src/expense/expense.service.spec.ts
```

Expected: FAIL — `service.exportExpensesToCsv is not a function`.

- [ ] **Step 6: Commit failing tests**

```bash
git add src/expense/expense.service.spec.ts
git commit -m "test: add failing tests for CSV export service"
```

---

### Task 3: Implement `exportExpensesToCsv` in ExpenseService

**Files:**
- Modify: `src/expense/expense.service.ts`

- [ ] **Step 1: Add imports**

Add at the top of `expense.service.ts`:

```typescript
import { Readable } from 'stream';
import { format } from '@fast-csv/format';
```

- [ ] **Step 2: Add the `exportExpensesToCsv` method**

Add this method to `ExpenseService` after `getAllDistinctCategories`:

```typescript
async exportExpensesToCsv(ctx: RequestContext): Promise<Readable> {
  this.logger.log(ctx, 'Exporting expenses to CSV');
  const expenses: Expense[] = await this.repository.getAllExpenses();

  expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const csvStream = format({ headers: true });

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
```

- [ ] **Step 3: Run tests to verify they pass**

```bash
npx jest src/expense/expense.service.spec.ts
```

Expected: All tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/expense/expense.service.ts
git commit -m "feat: add exportExpensesToCsv method to service"
```

---

### Task 4: Add the export endpoint to ExpenseController

**Files:**
- Modify: `src/expense/expense.controller.ts`

- [ ] **Step 1: Add imports**

Add `Res` to the `@nestjs/common` imports. Add the `Response` type import:

```typescript
import { Response } from 'express';
```

- [ ] **Step 2: Add the export endpoint**

Add this method **before** the `@Get(':id')` endpoint (after the `@Get('by-description')` handler) to prevent `:id` from matching "export":

```typescript
@Get('export')
@ApiOperation({ summary: 'Export all expenses as CSV' })
@ApiResponse({
  status: HttpStatus.OK,
  description: 'CSV file download',
})
async exportCsv(@Res() res: Response): Promise<void> {
  try {
    const ctx = new RequestContext();
    const today = new Date().toISOString().split('T')[0];
    const csvStream = await this.expenseService.exportExpensesToCsv(ctx);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="expenses-${today}.csv"`);

    csvStream.pipe(res);
  } catch (error: any) {
    const status = error.status || error.statusCode || 500;
    res.status(status).json({
      statusCode: status,
      message: `An error occured during the operation 'exportCsv': ${error.message}`,
    });
  }
}
```

**Note:** We use `res.status().json()` instead of throwing `HttpException` because `@Res()` puts NestJS in library-specific mode where thrown exceptions won't be automatically serialized.

- [ ] **Step 3: Run all tests to verify nothing is broken**

```bash
npm run test
```

Expected: All tests PASS.

- [ ] **Step 4: Run the linter**

```bash
npm run lint
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/expense/expense.controller.ts
git commit -m "feat: add GET /expenses/export CSV download endpoint"
```

---

### Task 5: Manual verification

- [ ] **Step 1: Start the dev server**

```bash
npm run start:dev
```

- [ ] **Step 2: Test the endpoint with curl**

```bash
curl -o expenses.csv http://localhost:3000/api/v1/expenses/export
```

Expected: A file `expenses.csv` is saved with CSV content. Check headers:

```bash
curl -I http://localhost:3000/api/v1/expenses/export
```

Expected headers include:
- `Content-Type: text/csv`
- `Content-Disposition: attachment; filename="expenses-YYYY-MM-DD.csv"`

- [ ] **Step 3: Inspect the CSV content**

Open `expenses.csv` and verify:
- First line is the header: `Amount,Date,Description,Category,Recipient,Currency,Type`
- Data rows have dates formatted as `YYYY-MM-DD`
- Refund expenses show "Refund" in the Type column
- Fields with commas are properly quoted

- [ ] **Step 4: Clean up test file**

```bash
rm expenses.csv
```
