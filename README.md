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

This creates all tables from `apps/api/prisma/schema.prisma` in your Postgres
database and generates the Prisma client.

## 4. Run it

In two terminals:

```bash
npm run dev:api    # http://localhost:4000/api/v1
npm run dev:web    # http://localhost:3000
```

Open `http://localhost:3000`, create an account, add your accounts (Bank,
Mobile Money, Cash), and start logging income/expenses.

## 5. Inspecting the database (optional)

```bash
npm run prisma:studio --workspace=apps/api
```

Opens a browser UI over your database — useful for sanity-checking data
while developing.

## 6. Deploying

**Database**: create a managed Postgres instance (Railway, Neon, or
Supabase all have free/cheap tiers). Copy the connection string into
`DATABASE_URL`.

**API (`apps/api`)**: deploy to Railway or Render.
- Build command: `npm install && npm run build --workspace=apps/api && npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma`
- Start command: `node apps/api/dist/main.js`
- Set all the env vars from `.env.example` in the platform's dashboard —
  never commit real secrets to git.

**Frontend (`apps/web`)**: deploy to Vercel.
- Root directory: `apps/web`
- Set `NEXT_PUBLIC_API_URL` to your deployed API's URL, e.g.
  `https://fedha-api.up.railway.app/api/v1`
- Set `WEB_ORIGIN` on the API side to your deployed frontend URL, so CORS
  allows it.

## What's implemented (Phase 2)

- User registration/login with hashed passwords and JWT auth
- Accounts: Bank / Mobile Money / Cash / Savings / Investment / Business,
  each with a live balance
- Transactions: income, expense, and transfer, with atomic balance updates
  and a full audit log — nothing is ever hard-deleted, only soft-deleted
  ("voided"), so your history stays intact
- Dashboard: total balance, this month's income/expenses, net cash flow

## What's next (per the Phase 1 roadmap)

- **Phase 3**: budgets, savings goals, debts, receivables
- **Phase 4**: cash-flow forecasting, financial health score, the
  "Can I afford this?" calculator, the AI assistant
- **Phase 5**: investments, net worth, scenario simulator, receipt OCR,
  reports, notifications
- **Phase 6**: security hardening, full test coverage, performance and
  accessibility passes, production deployment polish
