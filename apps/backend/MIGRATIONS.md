# Database Migrations

This project uses **Drizzle ORM** and **Drizzle Kit** for database management and migrations.

## Migration Naming Convention

We use a **timestamp-based** naming convention combined with Drizzle's sequential indexing. 
When generating a new migration, use the following command:

```bash
pnpm db:generate --name YYYYMMDDHHMMSS_description
```

Example:
```bash
pnpm db:generate --name 20260125000000_initial_schema
```

This will result in a file named `0000_20260125000000_initial_schema.sql`.

## Workflow

### 1. Update Schema
Modify the schema definitions in `src/db/schema.ts`.

### 2. Generate Migration
Run the generate command to create a new SQL migration file:
```bash
# From the root directory
pnpm backend:db:generate --name description

# Or from apps/backend
pnpm db:generate --name description
```

### 3. Review Migration
Always review the generated SQL file in the `drizzle/` directory to ensure it matches your expectations.

### 4. Apply Migration
Apply the migrations to your local development database:
```bash
# From the root directory
pnpm backend:db:migrate

# Or from apps/backend
pnpm db:migrate
```

### 5. Drizzle Studio
You can visualize and manage your database using Drizzle Studio:
```bash
pnpm backend:db:studio
```

## Creating the Database
The SQLite database file (`dev.db` by default) will be created automatically when you run migrations for the first time if it doesn't exist. Ensure your `.env` file has the correct `DATABASE_URL`.
