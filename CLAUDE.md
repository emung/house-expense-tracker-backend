# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run start:dev       # Hot-reload dev server
npm run build           # Compile TypeScript to dist/

# Testing
npm run test            # Unit tests (runs serially with --runInBand)
npm run test:watch      # Unit tests in watch mode
npm run test:cov        # Unit tests with coverage
npm run test:e2e        # End-to-end tests
npx jest src/expense/expense.service.spec.ts   # Run a single test file

# Code quality
npm run lint            # ESLint check
npm run lint:fix        # ESLint with auto-fix
npm run format          # Prettier formatting

# Database migrations
npm run migration:generate --name=MigrationName   # Generate from entity changes
npm run migration:run                              # Apply pending migrations
npm run migration:revert                           # Revert last migration

# Production
npm run start:prod      # Run compiled dist/src/main
```

## Architecture

NestJS REST API with PostgreSQL via TypeORM. API prefix: `/api/v1`. Swagger UI at `/swagger`.

**Module structure** — each domain module follows Controllers → Services → Repositories → TypeORM Entities:
- **Auth** — JWT (RS256) + Passport strategies (jwt, local). Tokens issued at `/api/v1/auth/login`
- **Users** — User management with RBAC; passwords hashed with bcrypt
- **Expenses** — Core feature: amount, date, description, category, recipient, currency (EUR/RON), `is_refund` flag, user FK. List endpoints return `{ expenses[], sums: CurrencySumOutput[], amount }` where `sum` is net (non-refund minus refund) and `refundSum` is the raw refund total per currency.
- **Contractors** — Name, address, phone, email, website, notes
- **Articles** — Content management (from upstream starter kit)
- **Shared** — Global config, Winston logging, exception filters, request/response interceptors, ACL, request-ID middleware

**Key patterns:**
- `SharedModule` bootstraps all cross-cutting concerns and is imported globally
- ACL (Access Control List) is in `src/shared/acl/` — defines which roles can perform which actions
- Migrations live in `migrations/` with numeric timestamps; `synchronize: false` — always use migrations, never rely on auto-sync
- DTOs use `class-validator` decorators; `class-transformer` handles serialization/deserialization

## Database

PostgreSQL with TypeORM. ORM config in `ormconfig.ts`. Entities in `src/**/entities/*.entity.ts`.

Always create a migration when changing entity schemas — never enable `synchronize: true`.

## Commit Convention

From `CONTRIBUTING.md`: conventional commits with **74 character max** subject line.

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`

Branch naming: `{type}/{GithubIssueNo}-issue-one-liner`
