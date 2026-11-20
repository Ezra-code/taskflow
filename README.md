# TaskFlow Backend – Prisma 7 Setup Guide

## 1. Overview

TaskFlow uses **Prisma ORM 7** with PostgreSQL hosted on **Neon**.

The setup uses Prisma's PostgreSQL driver adapter (`@prisma/adapter-pg`) with the `pg` driver to establish database connections.

### Technology stack

| Technology | Version |
|---|---|
| Node.js | 22.23.4 |
| Prisma CLI | 7.10.1 |
| @prisma/client | 7.10.0 |
| @prisma/adapter-pg | 7.10.0 |
| pg | 8.23.1 |
| PostgreSQL | 18.7 |
| Database hosting | Neon |
| Operating system | Linux x64 |

## 2. Install dependencies

Install Prisma CLI and Prisma Client:

```bash
npm install @prisma/client@7.10.0
npm install -D prisma@7.10.1
```

Install the PostgreSQL driver and Prisma adapter:

```bash
npm install pg@8.23.1 @prisma/adapter-pg@7.10.0
```

The PostgreSQL adapter allows Prisma to use the Node.js PostgreSQL driver for database connections.

## 3. Configure environment variables

Create a `.env` file in the backend root directory.

```env
PORT=5000
NODE_ENV=development

DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"

JWT_ACCESS_SECRET="your-access-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
```

Replace the database connection details with your Neon connection string.

**Important:**

- Use the appropriate Neon connection string for your environment.
- Keep credentials out of source control.
- Never commit `.env` to Git.

Add the following to `.gitignore`:

```gitignore
node_modules/
.env
```

## 4. Configure Prisma 7

Prisma 7 separates database configuration from the Prisma schema.

### 4.1 Create `prisma.config.ts`

Create this file in the backend root directory:

```ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
```

This configuration defines:

- The Prisma schema location.
- The migrations directory.
- The database connection URL.

The database URL is loaded from the environment rather than hardcoded in the schema.

### 4.2 Configure `schema.prisma`

Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}
```

**Why `prisma-client-js`?**

We retained the legacy JavaScript Prisma Client generator instead of the newer `prisma-client` TypeScript generator.

This allowed the project to use the conventional generated Prisma Client without requiring Node.js experimental TypeScript execution.

## 5. Initialize Prisma Client

Create:

`src/config/prisma.js`

```js
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

export default prisma;
```

### Understanding the connection architecture

The connection flow is:

```text
Application
    |
    v
Prisma Client
    |
    v
Prisma PostgreSQL Adapter
    |
    v
Node PostgreSQL Driver (pg)
    |
    v
Neon PostgreSQL Database
```

**Why use the adapter?**

Prisma 7 uses driver adapters for this PostgreSQL connection setup. The adapter bridges Prisma Client and the underlying PostgreSQL driver.

The `Pool` manages database connections, avoiding the need to establish an entirely new connection for every query.

Import this shared Prisma instance wherever database access is required:

```js
import prisma from "../config/prisma.js";
```

## 6. Define database models

Add your application models to `prisma/schema.prisma`.

For example:

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  fullName  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  todos         Todo[]
  authAccounts  AuthAccount[]
}
```

TaskFlow uses Prisma models to represent database entities and their relationships.

Keep database ownership and relationships explicit. For example, Todo records belong to users through `userId`.

## 7. Run migrations

After defining or changing your Prisma schema, create a migration.

```bash
npx prisma migrate dev --name init
```

This command:

1. Compares the Prisma schema with the current database structure.
2. Generates a migration.
3. Applies the migration to the configured database.
4. Updates the migration history.

For subsequent schema changes, use a descriptive migration name:

```bash
npx prisma migrate dev --name add_refresh_tokens
```

### Generate Prisma Client

After adding or changing models, regenerate the client:

```bash
npx prisma generate
```

This is important because Prisma Client needs to be regenerated to expose newly added models and fields in application code.

For example, after adding a `RefreshToken` model, regenerate Prisma Client before accessing:

```js
prisma.refreshToken
```

### Validate the schema

Run:

```bash
npx prisma validate
```

This checks whether the Prisma schema is valid.

## 8. Useful Prisma commands

| Command | Purpose |
|---|---|
| `npx prisma init` | Initialize Prisma |
| `npx prisma validate` | Validate schema |
| `npx prisma generate` | Generate Prisma Client |
| `npx prisma migrate dev` | Create and apply development migrations |
| `npx prisma migrate status` | Check migration status |
| `npx prisma migrate deploy` | Apply pending migrations in deployment |
| `npx prisma studio` | Open the Prisma database browser |

## 9. Neon PostgreSQL considerations

TaskFlow uses Neon as its PostgreSQL hosting provider.

### Local development

The local environment must be able to establish a network connection to the Neon database.

During initial setup, we encountered connection timeouts (`ETIMEDOUT`).

The issue was resolved by changing the network environment and verifying connectivity.

A successful TCP connection to the Neon host was established, and migrations were subsequently applied successfully.

### Connection pooling

Neon provides pooled and direct connection options.

During troubleshooting, we temporarily disabled pooling to test a direct PostgreSQL connection using `psql`.

For normal application operation, use the appropriate Neon connection string and ensure that the application driver and connection configuration are compatible with it.

### CI/CD considerations

Database migrations should be handled explicitly in the deployment pipeline.

Development and production have different migration requirements:

**Development:**

```bash
npx prisma migrate dev
```

**CI/CD or production deployment:**

```bash
npx prisma migrate deploy
```

Avoid running `migrate dev` against production databases.

The production pipeline should use the production database connection securely through environment variables or CI/CD secrets.

## 10. Common issues and solutions

### Issue 1: Prisma Client does not recognize a newly added model

Example:

```text
Cannot read properties of undefined (reading 'create')
```

**Cause:**

Prisma Client may not have been regenerated after adding a new model.

**Solution:**

```bash
npx prisma generate
```

### Issue 2: Neon connection timeout

Example:

```text
ETIMEDOUT
```

**Possible causes:**

- Network connectivity problems.
- Firewall restrictions.
- Incorrect database hostname.
- Connection configuration problems.

**Troubleshooting:**

1. Verify the Neon connection string.
2. Confirm that the database is reachable from the current network.
3. Test the connection using `psql`.
4. Check whether the connection string uses pooled or direct connectivity.
5. Retry the migration after connectivity is restored.

### Issue 3: Prisma schema validation errors

Run:

```bash
npx prisma validate
```

Review the reported schema location and correct the model, relation or field definitions.

### Issue 4: Migration changes are not reflected in Prisma Client

Run:

```bash
npx prisma generate
```

Then restart the application if necessary.

## 11. Recommended workflow

For normal development, follow this sequence whenever you modify the Prisma schema:

```text
1. Modify prisma/schema.prisma
             |
             v
2. Validate the schema
             |
             v
3. Create and apply migration
             |
             v
4. Generate Prisma Client
             |
             v
5. Test application queries
```

Commands:

```bash
npx prisma validate
npx prisma migrate dev --name descriptive_migration_name
npx prisma generate
```

## 12. Important project decisions

The following decisions were made during TaskFlow's Prisma setup:

- Prisma 7 is retained rather than upgrading to Prisma 8.
- PostgreSQL is hosted on Neon.
- The project uses `@prisma/adapter-pg` and `pg`.
- Database configuration is managed through `prisma.config.ts`.
- The Prisma schema uses the `prisma-client-js` generator.
- Prisma Client is initialized once and exported as a shared instance.
- Environment variables are used for database credentials.
- Development migrations use `migrate dev`.
- Deployment migrations use `migrate deploy`.
- Functional-first architecture is preferred throughout the application.

---

**Project:** TaskFlow

**Database:** PostgreSQL (Neon)

**ORM:** Prisma 7

**Runtime:** Node.js 22

**Status:** Prisma configured, database connected, and migrations successfully applied.
