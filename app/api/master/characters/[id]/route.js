import { NextResponse } from "next/server";
import { pool } from "../../../../../lib/db";
import { requireMaster } from "../../../../../lib/master-auth";

export const runtime = "nodejs";

async function getIdFromParams(paramsPromise) {
  const resolved = await paramsPromise;
  const rawId = Array.isArray(resolved?.id) ? resolved.id[0] : resolved?.id;
  const id = Number(rawId);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

export async function GET(req, { params }) {
  try {
    const auth = await requireMaster(req);

    if (auth?.error) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const id = await getIdFromParams(params);

    if (!id) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
      SELECT *
      FROM "Character"
      WHERE id = $1
      LIMIT 1
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Ficha não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (err) {
    console.error("MASTER CHARACTER GET ERROR:", err);

    return NextResponse.json(
      {
        error: "Erro ao buscar ficha",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req, { params }) {
  try {
    const auth = await requireMaster(req);

    if (auth?.error) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const id = await getIdFromParams(params);

    if (!id) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const result = await pool.query(
      `
      UPDATE "Character"
      SET
        name = $1,
        class = $2,
        "classId" = $3,
        "selectedAbility" = $4,
        notes = $5,
        age = $6,
        "heightCm" = $7,
        "weightKg" = $8,
        "staminaBase" = $9,
        "staminaCurrent" = $10,
        "classAttributes" = $11,
        "classSkills" = $12,
        "allocatedAttributes" = $13,
        "allocatedSkills" = $14,
        "levelUpAttributes" = $15,
        "levelUpSkills" = $16,
        "specialTrait" = $17,
        "isAmbidextrous" = $18,
        "progressPoints" = $19,
        "spentAttributeUpgrades" = $20,
        "spentSkillUpgrades" = $21,
        "boughtAbilities" = $22,
        "customAbilities" = $23,
        "updatedAt" = NOW()
      WHERE id = $24
      RETURNING *
      `,
      [
        body.name ?? "",
        body.class ?? "",
        body.classId ?? null,
        body.selectedAbility ?? "",
        body.notes ?? null,
        body.age ?? null,
        body.heightCm ?? null,
        body.weightKg ?? null,
        body.staminaBase ?? null,
        body.staminaCurrent ?? null,
        body.classAttributes ?? {},
        body.classSkills ?? {},
        body.allocatedAttributes ?? {},
        body.allocatedSkills ?? {},
        body.levelUpAttributes ?? {},
        body.levelUpSkills ?? {},
        body.specialTrait ?? null,
        Boolean(body.isAmbidextrous),
        Number(body.progressPoints || 0),
        Number(body.spentAttributeUpgrades || 0),
        Number(body.spentSkillUpgrades || 0),
        JSON.stringify(body.boughtAbilities || []),
        JSON.stringify(body.customAbilities || []),
        id,
      ]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Ficha não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (err) {
    console.error("MASTER CHARACTER PATCH ERROR:", err);

    return NextResponse.json(
      {
        error: "Erro ao atualizar ficha",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}