import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não definida.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  allowExitOnIdle: true,
});

const client = await pool.connect();

try {
  await client.query("BEGIN");
  const existingConfig = await client.query(`SELECT id FROM "GameConfig" LIMIT 1`);
  if (existingConfig.rowCount === 0) {
    await client.query(`INSERT INTO "GameConfig" DEFAULT VALUES`);
  }

  await client.query(`
    INSERT INTO "RankingBoard" (id)
    VALUES (1)
    ON CONFLICT (id) DO NOTHING
  `);

  await client.query("COMMIT");
  console.log("Dados obrigatórios do sistema verificados.");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
