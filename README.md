# Subscription Manager

A bare skeleton project using TypeScript, Hono, Zod, OpenAPI, Vite, React, and Drizzle.

## Stack
- **Backend**: Hono, Zod, OpenAPI, Drizzle ORM
- **Frontend**: Vite, React, TypeScript
- **Database**: SQLite (with better-sqlite3)

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Generate database migrations:
```bash
pnpm run db:generate
```

4. Push database schema:
```bash
pnpm run db:push
```

## Development

Run both frontend and backend:
```bash
pnpm run dev
```

Run only backend:
```bash
pnpm run dev:server
```

Run only frontend:
```bash
pnpm run dev:client
```

## Available Scripts

- `pnpm run dev` - Start both frontend and backend
- `pnpm run dev:server` - Start backend only
- `pnpm run dev:client` - Start frontend only
- `pnpm run build` - Build both frontend and backend
- `pnpm run build:client` - Build frontend only
- `pnpm run build:server` - Build backend only
- `pnpm run db:generate` - Generate Drizzle migrations
- `pnpm run db:push` - Push database schema
- `pnpm run db:studio` - Open Drizzle Studio
- `pnpm run openapi` - Generate TypeScript types from OpenAPI spec

## Project Structure

```
src/
├── client/          # React frontend
│   ├── api/        # API client types
│   ├── App.tsx     # Main App component
│   └── main.tsx    # Entry point
└── server/         # Hono backend
    ├── db/         # Database schema and connection
    ├── routes/     # API routes
    ├── index.ts    # Server entry point
    └── openapi.ts  # OpenAPI specifications
```
