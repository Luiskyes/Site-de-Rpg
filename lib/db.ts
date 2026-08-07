// backend/lib/db.ts
import { Pool } from "pg";

const globalForDatabase = globalThis as typeof globalThis & {
  postgresPool?: Pool;
};

const databaseUrl = process.env.DATABASE_URL ?? "";
const configuredPoolSize = Number(process.env.DATABASE_POOL_MAX);
const defaultPoolSize = databaseUrl.includes(".neon.tech") ? 5 : 10;
const poolSize =
  Number.isInteger(configuredPoolSize) && configuredPoolSize > 0
    ? configuredPoolSize
    : defaultPoolSize;

export const pool =
  globalForDatabase.postgresPool ??
  new Pool({
    connectionString: databaseUrl,
    max: poolSize,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    query_timeout: 15_000,
    statement_timeout: 15_000,
    keepAlive: true,
    allowExitOnIdle: true,
  });

// Reutilizar o pool evita conexões duplicadas tanto no hot reload local quanto
// em instâncias serverless reaproveitadas pela hospedagem.
globalForDatabase.postgresPool = pool;
