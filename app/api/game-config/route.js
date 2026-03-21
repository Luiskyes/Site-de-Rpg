import { NextResponse } from "next/server";
import { pool } from "../../../lib/db";
import { requireMaster } from "../../../lib/master-auth";

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

export async function PATCH(req) {
  try {
    const auth = await requireMaster(req);

    if (auth.error) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const body = await req.json();

    const attributePointsAtCreation = Number(body.attributePointsAtCreation);
    const skillPointsAtCreation = Number(body.skillPointsAtCreation);
    const attributeMaxAtCreation = Number(body.attributeMaxAtCreation);
    const skillMaxAtCreation = Number(body.skillMaxAtCreation);
    const levelUpAttributePoints = Number(body.levelUpAttributePoints);
    const levelUpSkillPoints = Number(body.levelUpSkillPoints);

    const values = [
      attributePointsAtCreation,
      skillPointsAtCreation,
      attributeMaxAtCreation,
      skillMaxAtCreation,
      levelUpAttributePoints,
      levelUpSkillPoints,
    ];

    if (values.some((value) => Number.isNaN(value) || value < 0)) {
      return NextResponse.json(
        { error: "Todos os valores devem ser números válidos maiores ou iguais a 0." },
        { status: 400 }
      );
    }

    const existing = await pool.query(`
      SELECT id
      FROM "GameConfig"
      ORDER BY id ASC
      LIMIT 1
    `);

    if (existing.rowCount === 0) {
      return NextResponse.json(
        { error: "Configuração do jogo não encontrada" },
        { status: 404 }
      );
    }

    const configId = existing.rows[0].id;

    const result = await pool.query(
      `
        UPDATE "GameConfig"
        SET
          "attributePointsAtCreation" = $1,
          "skillPointsAtCreation" = $2,
          "attributeMaxAtCreation" = $3,
          "skillMaxAtCreation" = $4,
          "levelUpAttributePoints" = $5,
          "levelUpSkillPoints" = $6
        WHERE id = $7
        RETURNING
          id,
          "attributePointsAtCreation",
          "skillPointsAtCreation",
          "attributeMaxAtCreation",
          "skillMaxAtCreation",
          "levelUpAttributePoints",
          "levelUpSkillPoints"
      `,
      [
        attributePointsAtCreation,
        skillPointsAtCreation,
        attributeMaxAtCreation,
        skillMaxAtCreation,
        levelUpAttributePoints,
        levelUpSkillPoints,
        configId,
      ]
    );

    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (err) {
    console.error("GAME CONFIG PATCH ERROR:", err);

    return NextResponse.json(
      {
        error: "Erro ao atualizar configuração do jogo",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}