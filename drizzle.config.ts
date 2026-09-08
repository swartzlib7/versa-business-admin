// Drizzle Kit configuration — migration generation + management.
// Run: npx drizzle-kit generate  (creates SQL migration from schema diff)
// Run: npx drizzle-kit migrate   (applies pending migrations to DB)

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://mission:mission@localhost:5432/business_admin',
  },
  verbose: true,
  strict: true,
});
