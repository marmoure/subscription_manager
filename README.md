# Subscription Manager

A bare skeleton project using TypeScript, Hono, Zod, OpenAPI, Vite, React, and Drizzle.

## Stack
- **Backend**: Hono, Zod, OpenAPI, Drizzle ORM
- **Frontend**: Vite, React, TypeScript
- **Database**: SQLite (with better-sqlite3)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Generate database migrations:
```bash
npm run db:generate
```

4. Push database schema:
```bash
npm run db:push
```

## Development

Run both frontend and backend:
```bash
npm run dev
```

Run only backend:
```bash
npm run dev:server
```

Run only frontend:
```bash
npm run dev:client
```

## Available Scripts

- `npm run dev` - Start both frontend and backend
- `npm run dev:server` - Start backend only
- `npm run dev:client` - Start frontend only
- `npm run build` - Build both frontend and backend
- `npm run build:client` - Build frontend only
- `npm run build:server` - Build backend only
- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:push` - Push database schema
- `npm run db:studio` - Open Drizzle Studio
- `npm run openapi` - Generate TypeScript types from OpenAPI spec

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
