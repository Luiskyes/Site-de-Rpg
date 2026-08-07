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
  await client.query("BEGIN");
  await client.query(`INSERT INTO "RankingBoard" (id) VALUES (-2147483648)`);
  const inserted = await client.query(
    `SELECT id FROM "RankingBoard" WHERE id = -2147483648`
  );

  if (inserted.rowCount !== 1) {
    throw new Error("A escrita de validação não pôde ser confirmada.");
  }

  await client.query("ROLLBACK");
  console.log("Leitura, escrita transacional e rollback validados no Neon.");
} catch (error) {
  try {
    await client.query("ROLLBACK");
  } catch {
    // A conexão pode ter falhado antes do início da transação.
  }
  throw error;
} finally {
  await client.end();
}
