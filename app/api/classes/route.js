import { NextResponse } from "next/server";
import { pool } from "../../../lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        c.id,
        c.name,
        c.description,
        c."attributeBonuses",
        c."skillBonuses",
        c.abilities,
        CASE
          WHEN ch.id IS NOT NULL THEN true
          ELSE false
        END AS "isTaken"
      FROM "Class" c
      LEFT JOIN "Character" ch
        ON ch."classId" = c.id
      ORDER BY c.id ASC
    `);

    return NextResponse.json(result.rows, { status: 200 });
  } catch (err) {
    console.error("GET CLASSES ERROR:", err);

    return NextResponse.json(
      {
        error: "Erro ao buscar classes",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}