import pg from "pg";
import { CLASS_BOOK } from "../lib/class-book.js";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

function normalizeName(name) {
  return String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "");
}

async function main() {
  console.log("🔄 Sincronizando classes...");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const dbClasses = await client.query(`SELECT id, name FROM "Class"`);

    const normalizedMap = new Map();

    for (const row of dbClasses.rows) {
      const normalized = normalizeName(row.name);

      if (!normalizedMap.has(normalized)) {
        normalizedMap.set(normalized, row.id);
      } else {
        console.log("🗑 Removendo duplicada:", row.name);

        await client.query(
          `DELETE FROM "Class" WHERE id = $1`,
          [row.id]
        );
      }
    }

    for (const [name, data] of Object.entries(CLASS_BOOK)) {
      const normalized = normalizeName(name);

      const existingRows = await client.query(
        `SELECT id, name FROM "Class"`
      );

      const existing = existingRows.rows.find(
        (row) => normalizeName(row.name) === normalized
      );

      const attributeBonuses =
        data.attributes && typeof data.attributes === "object"
          ? data.attributes
          : {};

      const skillBonuses =
        data.skills && typeof data.skills === "object"
          ? data.skills
          : {};

      const abilities = Array.isArray(data.abilities)
        ? data.abilities.map((a) =>
            typeof a === "string" ? { name: a } : a
          )
        : [];

      if (!existing) {
        console.log("➕ Criando classe:", name);

        await client.query(
          `INSERT INTO "Class" (name, "attributeBonuses", "skillBonuses", abilities)
           VALUES ($1, $2::jsonb, $3::jsonb, $4::jsonb)`,
          [
            name,
            JSON.stringify(attributeBonuses),
            JSON.stringify(skillBonuses),
            JSON.stringify(abilities),
          ]
        );
      } else {
        console.log("🔧 Atualizando classe:", name);

        await client.query(
          `UPDATE "Class"
           SET name = $1,
               "attributeBonuses" = $2::jsonb,
               "skillBonuses" = $3::jsonb,
               abilities = $4::jsonb
           WHERE id = $5`,
          [
            name,
            JSON.stringify(attributeBonuses),
            JSON.stringify(skillBonuses),
            JSON.stringify(abilities),
            existing.id,
          ]
        );
      }
    }

    await client.query("COMMIT");
    console.log("✅ Sincronização concluída com sucesso!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Erro na sincronização:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();