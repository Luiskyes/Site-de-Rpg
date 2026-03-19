import { NextResponse } from "next/server";
import { pool } from "../../../lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        id,
        "attributePointsAtCreation",
        "skillPointsAtCreation",
        "attributeMaxAtCreation",
        "skillMaxAtCreation",
        "levelUpAttributePoints",
        "levelUpSkillPoints"
      FROM "GameConfig"
      ORDER BY id ASC
      LIMIT 1
    `);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Configuração do jogo não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (err) {
    console.error("GAME CONFIG ERROR:", err);

    return NextResponse.json(
      {
        error: "Erro ao buscar configuração do jogo",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}