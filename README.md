# Fiviko

A gamified financial tracking & purchase-decision PWA. Fiviko helps you track income,
assets, liabilities and daily expenses, set savings goals, and decide **"Can I buy this,
should I buy this, and when?"** — wrapped in a playful, mobile-first experience.

> Fiviko is a financial planning and decision-support tool. It provides educational
> insights based on user-entered data and app-defined scoring models. It does not provide
> licensed financial, investment, tax, or legal advice.

## Stack

| Layer    | Tech                                                                  |
| -------- | --------------------------------------------------------------------- |
| Frontend | React + TypeScript + Vite + Tailwind + Framer Motion + Recharts + PWA |
| Backend  | Node.js + Express + TypeScript + Zod                                  |
| Database | PostgreSQL + Prisma ORM                                                |
| Shared   | `@fiviko/shared` — domain types & enums shared by both ends           |

This is a TypeScript-only codebase (no vanilla JS source).

## Layout

```
fiviko/
├── packages/shared   # Domain types, enums, DTOs shared between FE & BE
├── backend           # Express REST API + Prisma
└── frontend          # React PWA
```

## Getting started

```bash
# 1. Install all workspace deps
npm install

# 2. Start PostgreSQL (Docker)
npm run db:up

# 3. Configure backend env
cp backend/.env.example backend/.env

# 4. Run migrations + seed
npm run prisma:migrate
npm run prisma:seed

# 5. Run backend + frontend together
npm run dev
```

- Backend: http://localhost:4000
- Frontend: http://localhost:5173

## Status

Phase 1 MVP — in active development. See `fiviko.md` for the full product spec.
