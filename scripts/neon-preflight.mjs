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

  const googleSubColumn = await client.query(`
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'googleSub'
    LIMIT 1
  `);

  if (googleSubColumn.rowCount > 0) {
    const duplicates = await client.query(`
      SELECT COUNT(*)::int AS count
      FROM (
        SELECT "googleSub"
        FROM users
        WHERE "googleSub" IS NOT NULL
        GROUP BY "googleSub"
        HAVING COUNT(*) > 1
      ) duplicated_google_accounts
    `);

    if (Number(duplicates.rows[0]?.count || 0) > 0) {
      throw new Error(
        "Existem identificadores Google duplicados; a restrição única não pode ser aplicada com segurança."
      );
    }
  }

  console.log("Verificação concluída: nenhum identificador Google duplicado.");
} finally {
  await client.end();
}
