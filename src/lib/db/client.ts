// Drizzle ORM client — connection/pool from DATABASE_URL.
// Instantiated when DATA_SOURCE is postgres (the shipped default).

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * Lazily create the postgres-js + Drizzle client.
 * Only instantiated when DATA_SOURCE is postgres.
 * Throws if DATABASE_URL is missing — caller must handle gracefully.
 */
let _client: ReturnType<typeof postgres> | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (_db) return _db;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set. Required when DATA_SOURCE=postgres.');
  }

  _client = postgres(databaseUrl, {
    max: parseInt(process.env.DB_POOL_SIZE ?? '10', 10),
  });
  _db = drizzle(_client, { schema });
  return _db;
}

/**
 * Close the database connection pool.
 * Safe to call multiple times — no-op if already closed.
 */
export async function closeDb() {
  if (_client) {
    await _client.end();
    _client = null;
    _db = null;
  }
}

/**
 * Health check — verify DB connectivity.
 * Returns { connected: boolean; latencyMs?: number; error?: string }.
 */
export async function healthCheck(): Promise<{
  connected: boolean;
  latencyMs?: number;
  error?: string;
}> {
  try {
    const start = Date.now();
    const db = getDb();
    // Simple connectivity probe — SELECT 1
    await db.execute('SELECT 1');
    return { connected: true, latencyMs: Date.now() - start };
  } catch (err) {
    return {
      connected: false,
      error: err instanceof Error ? err.message : 'Unknown DB error',
    };
  }
}
