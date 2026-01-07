# Supabase Setup Guide for Turbocat

This guide walks you through setting up a Supabase project for Turbocat's backend database.

## Prerequisites

- A Supabase account (free tier available at https://supabase.com)
- Node.js 20+ installed locally

## Step 1: Create a Supabase Project

1. Go to https://supabase.com and sign in (or create an account)
2. Click **"New Project"**
3. Fill in the project details:
   - **Name**: `turbocat-dev` (or your preferred name)
   - **Database Password**: Choose a strong password (save this securely!)
   - **Region**: Select the region closest to you
   - **Pricing Plan**: Free tier is sufficient for development
4. Click **"Create new project"**
5. Wait for the project to be provisioned (usually 1-2 minutes)

## Step 2: Get Your Database Connection Strings

1. In your Supabase project dashboard, go to **Settings** (gear icon) > **Database**
2. Scroll down to **Connection string** section
3. You need TWO connection strings:

### Connection Pooling URL (for DATABASE_URL)
- Click on **"Connection pooling"** tab
- Copy the **URI** connection string
- It should look like:
  ```
  postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
  ```
- **Important**: Add `?pgbouncer=true` at the end if not present

### Direct Connection URL (for DIRECT_URL)
- Click on **"Direct connection"** tab
- Copy the **URI** connection string
- It should look like:
  ```
  postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
  ```

## Step 3: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** (gear icon) > **API**
2. Copy the following values:

### Project URL
- Under **Project URL**, copy the URL
- Example: `https://[PROJECT-REF].supabase.co`

### API Keys
- **anon/public key**: Safe to use in client-side code
- **service_role key**: NEVER expose in client-side code (server-side only)

## Step 4: Update Your .env File

Open `backend/.env` and replace the placeholder values:

```env
# DATABASE (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# SUPABASE
SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="your-actual-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-actual-service-role-key"
```

## Step 5: Verify Connection

Run the following command to verify your database connection:

```bash
cd backend
npx prisma db pull
```

If successful, you should see:
```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database...
```

## Step 6: Generate Prisma Client

After verifying the connection, generate the Prisma client:

```bash
npx prisma generate
```

## Troubleshooting

### Connection Refused
- Ensure your IP is not blocked by Supabase
- Check if the project is paused (free tier projects pause after inactivity)
- Verify the connection string format is correct

### Authentication Failed
- Double-check your database password
- Ensure you're using the correct project reference

### SSL Certificate Issues
- Add `?sslmode=require` to your connection string if needed

### pgBouncer Issues
- Ensure `?pgbouncer=true` is added to DATABASE_URL
- Use DIRECT_URL for migrations (without pgbouncer)

## Security Best Practices

1. **Never commit .env files** - They are already in .gitignore
2. **Rotate secrets regularly** - Especially in production
3. **Use different projects** for development and production
4. **Enable Row Level Security (RLS)** on Supabase tables
5. **Keep service_role key secret** - Only use server-side

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Prisma with Supabase](https://supabase.com/docs/guides/integrations/prisma)
- [Connection Pooling Guide](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)

## Next Steps

Once connected, proceed to run database migrations:

```bash
# Create initial migration (after schema is defined)
npx prisma migrate dev --name init

# Seed the database
npx prisma db seed
```
