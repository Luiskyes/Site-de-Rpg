import pg from "pg";

const { Client } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não definida.");
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10_000,
});

try {
  await client.connect();
  const result = await client.query(`
    SELECT
      current_database() AS database,
      COUNT(*) FILTER (WHERE table_schema = 'public')::int AS "tableCount"
    FROM information_schema.tables
    WHERE table_schema = 'public'
    GROUP BY current_database()
  `);

  console.log(
    `Conexão PostgreSQL ativa. Tabelas públicas: ${Number(result.rows[0]?.tableCount || 0)}.`
  );
} finally {
  await client.end();
}
