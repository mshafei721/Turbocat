// Turbocat Backend - Prisma Configuration
// This file configures Prisma for use with Supabase PostgreSQL
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Use the pooled connection URL for general operations
    url: process.env['DATABASE_URL'],
    // Use the direct connection URL for migrations
    directUrl: process.env['DIRECT_URL'],
  },
});
