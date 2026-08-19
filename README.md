# Fedha — Personal Financial Operating System

Phase 2 (Foundation) build: authentication, accounts, the transaction ledger,
and a basic dashboard. This is a real, runnable app — not a mockup — built as
the base for everything in the Phase 1 architecture document.

## Stack

- **Frontend**: Next.js (React) + TypeScript + Tailwind CSS — `apps/web`
- **Backend**: NestJS + Prisma — `apps/api`
- **Database**: PostgreSQL

## 1. Prerequisites

- Node.js 20+ (`node -v`)
- npm 10+
- Docker (for local Postgres) — or a Postgres connection string from Railway/Neon/Supabase

## 2. First-time setup

```bash
# from the repo root
npm install

# start a local Postgres (skip this if you already have a DATABASE_URL)
docker compose up -d

# copy env files
cp .env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local
```

Open `apps/api/.env` and set real random values for `JWT_ACCESS_SECRET` and
`JWT_REFRESH_SECRET` — for example:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Run that twice and paste the two outputs in as the secrets.

## 3. Create the database schema

```bash
npm run prisma:migrate --workspace=apps/api
```

## 4. Run it

```bash
npm run dev:api    # http://localhost:4000/api/v1
npm run dev:web    # http://localhost:3000
```

## 5. Deploying

**Database**: Railway/Neon/Supabase Postgres, connection string into `DATABASE_URL`.

**API (`apps/api`)**: deploy to Railway.
- Root directory: `apps/api`
- Build command: `npm install && npx prisma generate && npm run build`
- Start command: `npx prisma migrate deploy && node dist/main.js`
- Set all env vars from `.env.example`.

**Frontend (`apps/web`)**: deploy to Vercel.
- Root directory: `apps/web`
- Set `NEXT_PUBLIC_API_URL` to your deployed API URL.
- Set `WEB_ORIGIN` on the API side to your Vercel URL for CORS.

## What's implemented (Phase 2)

- User registration/login with hashed passwords and JWT auth
- Accounts: Bank / Mobile Money / Cash / Savings / Investment / Business
- Transactions: income, expense, transfer, atomic balance updates, audit log, soft-delete only
- Dashboard: total balance, this month's income/expenses, net cash flow

## What's next

- Phase 3: budgets, savings goals, debts, receivables
- Phase 4: forecasting, health score, affordability calculator, AI assistant
- Phase 5: investments, net worth, scenario simulator, receipt OCR, reports
- Phase 6: security hardening, full test coverage, production polish
