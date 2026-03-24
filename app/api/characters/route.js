import { NextResponse } from "next/server";
import { pool } from "../../../lib/db";
import { verifySessionCookie } from "../../../lib/auth";

export const runtime = "nodejs";

function toObject(value, fallback = {}) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : fallback;
}

export async function POST(req) {
  try {
    const userId = await verifySessionCookie(req);

    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await req.json();

    const {
      name,
      class: className,
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

    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 });
    }

    if (!className || !String(className).trim()) {
      return NextResponse.json({ error: "Classe é obrigatória." }, { status: 400 });
    }

    if (!classId) {
      return NextResponse.json({ error: "ClassId é obrigatório." }, { status: 400 });
    }

    if (!selectedAbility || !String(selectedAbility).trim()) {
      return NextResponse.json(
        { error: "Selecione uma habilidade inicial." },
        { status: 400 }
      );
    }

    const safeClassAttributes = toObject(classAttributes, {});
    const safeClassSkills = toObject(classSkills, {});
    const safeAllocatedAttributes = toObject(allocatedAttributes, {});
    const safeAllocatedSkills = toObject(allocatedSkills, {});

    const staminaBaseValue =
      staminaBase === null || staminaBase === undefined || staminaBase === ""
        ? 100
        : Number(staminaBase);

    const staminaCurrentValue =
      staminaCurrent === null || staminaCurrent === undefined || staminaCurrent === ""
        ? staminaBaseValue
        : Number(staminaCurrent);

    const result = await pool.query(
      `
        INSERT INTO "Character" (
          name,
          class,
          "classId",
          "selectedAbility",
          age,
          "heightCm",
          "weightKg",
          "staminaBase",
          "staminaCurrent",
          "classAttributes",
          "classSkills",
          "allocatedAttributes",
          "allocatedSkills",
          notes,
          "specialTrait",
          "isAmbidextrous",
          "ownerId",
          "progressPoints",
          "spentAttributeUpgrades",
          "spentSkillUpgrades",
          "boughtAbilities",
          "customAbilities",
          "levelUpAttributes",
          "levelUpSkills",
          "createdAt",
          "updatedAt"
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10::jsonb, $11::jsonb, $12::jsonb, $13::jsonb,
          $14, $15, $16, $17, 0, 0, 0,
          $18::jsonb, $19::jsonb, $20::jsonb, $21::jsonb,
          NOW(), NOW()
        )
        RETURNING id
      `,
      [
        String(name).trim(),
        String(className).trim(),
        Number(classId),
        String(selectedAbility).trim(),
        age === "" || age === null || age === undefined ? null : Number(age),
        heightCm === "" || heightCm === null || heightCm === undefined
          ? null
          : Number(heightCm),
        weightKg === "" || weightKg === null || weightKg === undefined
          ? null
          : Number(weightKg),
        Number(staminaBaseValue),
        Number(staminaCurrentValue),
        JSON.stringify(safeClassAttributes),
        JSON.stringify(safeClassSkills),
        JSON.stringify(safeAllocatedAttributes),
        JSON.stringify(safeAllocatedSkills),
        notes ? String(notes).trim() : null,
        specialTrait ?? null,
        Boolean(isAmbidextrous),
        Number(userId),
        JSON.stringify([]),
        JSON.stringify([]),
        JSON.stringify({}),
        JSON.stringify({}),
      ]
    );

    return NextResponse.json({ id: result.rows[0].id }, { status: 201 });
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