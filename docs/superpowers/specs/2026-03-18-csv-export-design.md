# CSV Export Design Spec

## Overview

Add a CSV export endpoint to the expense module that allows users to download all tracked expenses as a CSV file for analysis in external spreadsheet tools or personal backup.

## Endpoint

**`GET /api/v1/expenses/export`**

- No query parameters
- No request body
- No user filtering (all expenses exported)
- Response headers:
  - `Content-Type: text/csv`
  - `Content-Disposition: attachment; filename="expenses-YYYY-MM-DD.csv"` (date = export date)
- Response body: streamed CSV content

## CSV Structure

Header row followed by data rows, ordered by date descending (most recent first).

| CSV Column  | Entity Field | Transformation                              |
|-------------|--------------|---------------------------------------------|
| Amount      | `amount`     | Raw number (e.g., `125.50`)                 |
| Date        | `date`       | Formatted as `YYYY-MM-DD`                   |
| Description | `description`| As-is                                       |
| Category    | `category`   | As-is                                       |
| Recipient   | `recipient`  | As-is                                       |
| Currency    | `currency`   | As-is (EUR/RON)                             |
| Type        | `isRefund`   | `true` → "Refund", `false` → "Expense"     |

`@fast-csv/format` handles quoting and escaping for fields containing commas or quotes.

## Dependencies

- `@fast-csv/format` — lightweight write/format-only CSV package

## Implementation Structure

### Service Layer

New method in `ExpenseService`:

```typescript
exportExpensesToCsv(ctx: RequestContext): Readable
```

- Fetches all expenses via the existing `ExpenseRepository.getAllExpenses()` method
- Maps each `Expense` entity to a row object with the column transformations defined above
- Creates a `@fast-csv/format` stream, writes all rows, ends the stream
- Returns the readable stream

### Controller Layer

New endpoint in `ExpenseController`:

```typescript
@Get('export')
async exportCsv(@Res() res: Response, ctx: RequestContext): Promise<void>
```

- Placed **above** `GET /expenses/:id` to avoid the `:id` param matching "export"
- Sets `Content-Type: text/csv` and `Content-Disposition: attachment; filename="expenses-YYYY-MM-DD.csv"` headers
- Pipes the service stream to the response

## Error Handling

- **Empty dataset:** Returns a valid CSV file with only the header row. An empty CSV is a valid export.
- **Repository failure:** NestJS's existing exception filter catches the error and returns a standard error response before any CSV data is written.

No custom error handling beyond what the framework provides.

## Testing

Unit test in `expense.service.spec.ts`:

- Mock the repository to return a known set of expenses
- Verify the stream produces correct CSV output:
  - Header row present with correct column names
  - Date formatted as `YYYY-MM-DD`
  - `isRefund: true` mapped to "Refund", `isRefund: false` mapped to "Expense"
  - Proper quoting for fields containing commas
  - Empty dataset produces header-only CSV
