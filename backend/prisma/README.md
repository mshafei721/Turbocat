# Turbocat Database - Prisma Migration Guide

This document provides comprehensive documentation for database migrations, schema management, and best practices for the Turbocat backend.

## Table of Contents

- [Quick Reference](#quick-reference)
- [Environment Setup](#environment-setup)
- [Migration Workflow](#migration-workflow)
- [Creating Migrations](#creating-migrations)
- [Applying Migrations](#applying-migrations)
- [Rollback Procedures](#rollback-procedures)
- [Seed Data](#seed-data)
- [Prisma Studio](#prisma-studio)
- [Production Migrations](#production-migrations)
- [Troubleshooting](#troubleshooting)

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `npm run db:validate` | Validate schema syntax |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:migrate` | Create and apply migration (dev) |
| `npm run db:migrate:prod` | Apply migrations (production) |
| `npm run db:migrate:reset` | Reset database and apply all migrations |
| `npm run db:seed` | Seed database with initial data |
| `npm run db:studio` | Open Prisma Studio GUI |
| `npm run db:push` | Push schema changes without migration (dev only) |

---

## Environment Setup

### Required Environment Variables

Configure these in your `.env` file:

```bash
# Pooled connection (for application queries)
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection (for migrations)
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

**Important Notes:**
- `DATABASE_URL` uses port `6543` with pgBouncer for connection pooling
- `DIRECT_URL` uses port `5432` for direct database access (required for migrations)
- Never commit actual credentials to version control

### Prisma Configuration

Prisma 7+ uses `prisma.config.ts` for datasource configuration:

```typescript
// prisma.config.ts
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
    directUrl: process.env['DIRECT_URL'],
  },
});
```

---

## Migration Workflow

### Development Workflow

1. **Modify the schema** in `prisma/schema.prisma`
2. **Validate the schema**: `npm run db:validate`
3. **Create migration**: `npm run db:migrate`
4. **Generate client**: `npm run db:generate` (usually automatic)
5. **Test changes**: Run your application

### Standard Migration Process

```bash
# 1. Make changes to prisma/schema.prisma

# 2. Validate the schema
npm run db:validate

# 3. Create and apply migration
npm run db:migrate

# 4. Enter a descriptive migration name when prompted
# Example: add_user_preferences_column
```

---

## Creating Migrations

### Interactive Migration (Development)

```bash
npm run db:migrate
# or
npx prisma migrate dev
```

This will:
1. Detect schema changes
2. Generate SQL migration file
3. Apply migration to development database
4. Regenerate Prisma Client

### Create Migration Only (No Apply)

Use `--create-only` to create the migration without applying:

```bash
npx prisma migrate dev --create-only --name descriptive_name
```

This is useful when:
- You want to review/edit the SQL before applying
- You need to add custom SQL (e.g., data migration)
- You want to create migration files for version control before deploying

### Migration Naming Conventions

Use descriptive, lowercase names with underscores:

| Good | Bad |
|------|-----|
| `add_user_preferences` | `update` |
| `create_audit_logs_table` | `change1` |
| `add_index_on_email` | `fix` |
| `remove_deprecated_fields` | `AddUserPreferences` |

---

## Applying Migrations

### Development Environment

```bash
# Apply pending migrations
npm run db:migrate
```

### Production Environment

```bash
# Apply pending migrations (safe for production)
npm run db:migrate:prod
# or
npx prisma migrate deploy
```

**Key Differences:**
- `migrate dev`: Creates new migrations, applies them, regenerates client
- `migrate deploy`: Only applies existing migrations (no schema changes)

### Check Migration Status

```bash
npx prisma migrate status
```

---

## Rollback Procedures

### Understanding Prisma Rollbacks

Prisma does not have a built-in rollback command. Here are the recommended approaches:

### Option 1: Create a Corrective Migration

The safest approach is to create a new migration that reverses the changes:

```bash
# 1. Modify schema to desired state (undo changes)
# 2. Create new migration
npm run db:migrate
# Name it: revert_previous_migration
```

### Option 2: Reset Database (Development Only)

**WARNING: This deletes ALL data!**

```bash
npm run db:migrate:reset
# or
npx prisma migrate reset
```

This will:
1. Drop the database
2. Recreate it
3. Apply all migrations from scratch
4. Run seed script

### Option 3: Manual SQL Rollback

For production emergencies, you may need to manually rollback:

1. **Identify the migration** to rollback in `prisma/migrations/`

2. **Write reverse SQL** based on the migration file

3. **Connect to database** and execute the reverse SQL:

```sql
-- Example: Rollback adding a column
ALTER TABLE users DROP COLUMN IF EXISTS new_column;

-- Example: Rollback creating a table
DROP TABLE IF EXISTS new_table;

-- Example: Rollback adding an index
DROP INDEX IF EXISTS idx_name;
```

4. **Mark migration as rolled back** in `_prisma_migrations` table:

```sql
DELETE FROM _prisma_migrations
WHERE migration_name = '20260106000000_migration_name';
```

5. **Remove the migration folder** from `prisma/migrations/` (if needed)

### Option 4: Restore from Backup

For severe issues:

1. Stop your application
2. Restore database from backup (Supabase provides automatic backups)
3. Remove any migrations that were applied after the backup
4. Restart application

### Rollback Best Practices

1. **Always backup before migrations** in production
2. **Test migrations on staging first**
3. **Keep migrations small and focused**
4. **Have a rollback plan** before applying
5. **Document any custom rollback SQL**

---

## Seed Data

### Running Seed Script

```bash
npm run db:seed
# or
npx prisma db seed
```

### Seed Script Location

The seed script is located at `prisma/seed.ts` and creates:

- Admin user (admin@turbocat.dev)
- Demo user (demo@turbocat.dev)
- 5 sample agents
- 2 sample workflows with 6 steps
- 6 official templates

### Customizing Seed Data

Edit `prisma/seed.ts` to modify seed data. The script uses `upsert` operations, so it's safe to run multiple times.

### Seed in CI/CD

Add to your pipeline:

```yaml
- name: Apply migrations and seed
  run: |
    npx prisma migrate deploy
    npx prisma db seed
```

---

## Prisma Studio

Prisma Studio is a visual database browser:

```bash
npm run db:studio
# Opens at http://localhost:5555
```

Use it to:
- Browse and filter records
- Edit data directly
- View relationships
- Debug issues

---

## Production Migrations

### Pre-Migration Checklist

- [ ] Test migration on staging environment
- [ ] Create database backup
- [ ] Prepare rollback plan
- [ ] Schedule maintenance window (if needed)
- [ ] Notify team members

### Deployment Steps

1. **Deploy code** with new migration files

2. **Apply migrations**:
   ```bash
   npx prisma migrate deploy
   ```

3. **Verify** application is working

4. **Monitor** for errors

### Automated Migration in CI/CD

Example GitHub Actions workflow:

```yaml
- name: Deploy Database Migrations
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    DIRECT_URL: ${{ secrets.DIRECT_URL }}
  run: npx prisma migrate deploy
```

---

## Troubleshooting

### Common Issues

#### "Migration already applied"

The migration exists in `_prisma_migrations` table. Either:
- Reset the database (dev only): `npm run db:migrate:reset`
- Manually delete the record from `_prisma_migrations`

#### "Database connection failed"

Check:
1. Environment variables are set correctly
2. Database server is running
3. IP is whitelisted (if using cloud database)
4. Connection string format is correct

#### "Schema drift detected"

The database schema differs from the migration history:

```bash
# Check drift
npx prisma migrate diff --from-migrations ./prisma/migrations --to-schema-datamodel ./prisma/schema.prisma --shadow-database-url $DIRECT_URL

# Reset if in development
npm run db:migrate:reset
```

#### "Cannot find module '@prisma/client'"

Regenerate the client:

```bash
npm run db:generate
```

#### Migration hangs

May be caused by:
- Database locks (check for active transactions)
- Large data migrations (increase timeout)
- Network issues

### Getting Help

1. Check Prisma documentation: https://www.prisma.io/docs
2. Review migration file in `prisma/migrations/`
3. Check database logs in Supabase dashboard
4. Review application logs

---

## Schema Reference

### Current Models

| Model | Description |
|-------|-------------|
| User | User accounts and authentication |
| Agent | AI agent definitions |
| Workflow | Workflow orchestration |
| WorkflowStep | Individual workflow steps |
| Execution | Workflow execution records |
| ExecutionLog | Detailed execution logs |
| Template | Reusable templates |
| Deployment | Deployed instances |
| ApiKey | API key management |
| AuditLog | System audit trail |

### Enums

| Enum | Values |
|------|--------|
| UserRole | ADMIN, USER, AGENT |
| AgentType | CODE, API, LLM, DATA, WORKFLOW |
| AgentStatus | DRAFT, ACTIVE, INACTIVE, ARCHIVED |
| WorkflowStatus | DRAFT, ACTIVE, INACTIVE, ARCHIVED |
| ExecutionStatus | PENDING, RUNNING, COMPLETED, FAILED, CANCELLED, TIMEOUT |
| TriggerType | MANUAL, SCHEDULED, API, WEBHOOK, EVENT |
| LogLevel | DEBUG, INFO, WARN, ERROR, FATAL |

---

## Version History

| Date | Migration | Description |
|------|-----------|-------------|
| 2026-01-06 | `init` | Initial database schema with all models |

---

**Last Updated:** January 6, 2026
