import { NextResponse } from "next/server";
import { pool } from "../../../lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        description,
        "attributeBonuses",
        "skillBonuses",
        abilities
      FROM "Class"
      ORDER BY name ASC
    `);

    return NextResponse.json(result.rows, { status: 200 });
  } catch (err) {
    console.error("LIST CLASSES ERROR:", err);

    return NextResponse.json(
      {
        error: "Erro ao listar classes",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}