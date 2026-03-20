import { NextResponse } from "next/server";
import { pool } from "../../../lib/db";
import { verifySessionCookie } from "../../../lib/auth";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const userId = await verifySessionCookie(req);

    if (!userId) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const existingCharacter = await pool.query(
      `SELECT id FROM "Character" WHERE "ownerId" = $1`,
      [userId]
    );

    if (existingCharacter.rowCount > 0) {
      return NextResponse.json(
        { error: "Este usuário já possui uma ficha cadastrada" },
        { status: 409 }
      );
    }

    const body = await req.json();

    const {
      name,
      class: characterClass,
      classId,
      selectedAbility,
      age,
      heightCm,
      weightKg,
      staminaBase,
      staminaCurrent,
      classAttributes,
      classSkills,
      allocatedAttributes,
      allocatedSkills,
      notes,
      specialTrait,
      isAmbidextrous,
    } = body;

    if (!name || !characterClass || !classId || !selectedAbility) {
      return NextResponse.json(
        { error: "Nome, classe e habilidade inicial são obrigatórios" },
        { status: 400 }
      );
    }

    const allowedTraits = [null, "genio", "prodigio"];
    if (!allowedTraits.includes(specialTrait ?? null)) {
      return NextResponse.json(
        { error: "Traço especial inválido" },
        { status: 400 }
      );
    }

    const classAlreadyTaken = await pool.query(
      `
      SELECT id, name
      FROM "Character"
      WHERE "classId" = $1
      LIMIT 1
      `,
      [classId]
    );

    if (classAlreadyTaken.rowCount > 0) {
      return NextResponse.json(
        { error: "Essa classe já foi escolhida por outro jogador" },
        { status: 409 }
      );
    }

    const result = await pool.query(
      `
      INSERT INTO "Character" (
        name,
        class,
        "classId",
        "selectedAbility",
        level,
        notes,
        "ownerId",
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
        "specialTrait",
        "isAmbidextrous",
        "updatedAt"
      )
      VALUES (
        $1,$2,$3,$4,
        1,
        $5,$6,$7,$8,$9,$10,$11,
        $12,$13,$14,$15,
        '{}'::jsonb,
        '{}'::jsonb,
        $16,
        $17,
        NOW()
      )
      RETURNING id, name, class
      `,
      [
        name,
        characterClass,
        classId,
        selectedAbility,
        notes ?? null,
        userId,
        age ?? null,
        heightCm ?? null,
        weightKg ?? null,
        staminaBase ?? null,
        staminaCurrent ?? staminaBase ?? null,
        classAttributes ?? null,
        classSkills ?? null,
        allocatedAttributes ?? null,
        allocatedSkills ?? null,
        specialTrait ?? null,
        Boolean(isAmbidextrous),
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error("CREATE CHARACTER ERROR:", err);

    return NextResponse.json(
      {
        error: "Erro ao criar ficha",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}