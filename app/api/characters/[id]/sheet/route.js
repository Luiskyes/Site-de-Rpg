import { NextResponse } from "next/server";
import { pool } from "../../../../../lib/db";
import { calculateCharacterSheet } from "../../../../../lib/character-calculations";

export const runtime = "nodejs";

export async function GET(req, context) {
  try {
    const { id: rawId } = await context.params;
    const id = Number(rawId);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        {
          error: "ID de personagem inválido",
          received: rawId,
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
      SELECT
        id,
        name,
        class,
        "classId",
        "selectedAbility",
        "specialTrait",
        "isAmbidextrous",
        level,
        notes,
        age,
        "heightCm",
        "weightKg",
        "staminaBase",
        "staminaCurrent",
        "classAttributes",
        "classSkills",
        "allocatedAttributes",
        "allocatedSkills",
        "levelUpAttributes",
        "levelUpSkills",
        "ownerId",
        "createdAt",
        "updatedAt"
      FROM "Character"
      WHERE id = $1
      LIMIT 1
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Personagem não encontrado" },
        { status: 404 }
      );
    }

    const character = result.rows[0];

    const sheet = calculateCharacterSheet(character, {
      isGoalkeeper: false,
    });

    return NextResponse.json(sheet, { status: 200 });
  } catch (err) {
    console.error("CHARACTER SHEET ERROR:", err);

    return NextResponse.json(
      {
        error: "Erro ao gerar ficha do personagem",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}