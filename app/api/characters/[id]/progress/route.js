import { NextResponse } from "next/server";
import { pool } from "../../../../../lib/db";
import { verifySessionCookie } from "../../../../../lib/auth";
import {
  EMPTY_ATTRIBUTES,
  EMPTY_SKILLS,
  calculateProgressSpent,
} from "../../../../../lib/character-rules";
import { calculateCharacterSheet } from "../../../../../lib/character-calculations";
import { getAbilitiesByClass } from "../../../../../lib/ability-book";

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

function normalizeObject(input, template) {
  const result = { ...template };

  for (const key of Object.keys(template)) {
    result[key] = Math.max(0, Number(input?.[key] || 0));
  }

  return result;
}

function sumValues(obj) {
  return Object.values(obj || {}).reduce((acc, value) => acc + Number(value || 0), 0);
}

function sanitizeAbilityArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

function everyValueAtLeast(nextObj, currentObj, template) {
  return Object.keys(template).every(
    (key) => Number(nextObj?.[key] || 0) >= Number(currentObj?.[key] || 0)
  );
}

function includesAllSavedAbilities(nextList, savedList) {
  return savedList.every((item) => nextList.includes(item));
}

export async function PATCH(req, { params }) {
  try {
    const userId = await verifySessionCookie(req);

    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const id = await getIdFromParams(params);

    if (!id) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const existingResult = await pool.query(
      `
      SELECT *
      FROM "Character"
      WHERE id = $1
      LIMIT 1
      `,
      [id]
    );

    if (existingResult.rowCount === 0) {
      return NextResponse.json({ error: "Ficha não encontrada" }, { status: 404 });
    }

    const character = existingResult.rows[0];

    if (Number(character.ownerId) !== Number(userId)) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await req.json();

    const nextLevelUpAttributes = normalizeObject(body.levelUpAttributes, EMPTY_ATTRIBUTES);
    const nextLevelUpSkills = normalizeObject(body.levelUpSkills, EMPTY_SKILLS);
    const nextBoughtAbilities = sanitizeAbilityArray(body.boughtAbilities);
    const nextCustomAbilities = sanitizeAbilityArray(body.customAbilities);

    const savedLevelUpAttributes = normalizeObject(character.levelUpAttributes, EMPTY_ATTRIBUTES);
    const savedLevelUpSkills = normalizeObject(character.levelUpSkills, EMPTY_SKILLS);
    const savedBoughtAbilities = sanitizeAbilityArray(character.boughtAbilities);
    const savedCustomAbilities = sanitizeAbilityArray(character.customAbilities);

    if (!everyValueAtLeast(nextLevelUpAttributes, savedLevelUpAttributes, EMPTY_ATTRIBUTES)) {
      return NextResponse.json(
        { error: "Você não pode reduzir atributos de progressão já salvos." },
        { status: 400 }
      );
    }

    if (!everyValueAtLeast(nextLevelUpSkills, savedLevelUpSkills, EMPTY_SKILLS)) {
      return NextResponse.json(
        { error: "Você não pode reduzir perícias de progressão já salvas." },
        { status: 400 }
      );
    }

    if (!includesAllSavedAbilities(nextBoughtAbilities, savedBoughtAbilities)) {
      return NextResponse.json(
        { error: "Você não pode remover habilidades compradas já salvas." },
        { status: 400 }
      );
    }

    if (!includesAllSavedAbilities(nextCustomAbilities, savedCustomAbilities)) {
      return NextResponse.json(
        { error: "Você não pode remover habilidades criadas já salvas." },
        { status: 400 }
      );
    }

    const allowedClassAbilities = getAbilitiesByClass(character.class);

    const hasInvalidBoughtAbility = nextBoughtAbilities.some(
      (ability) => !allowedClassAbilities.includes(ability)
    );

    if (hasInvalidBoughtAbility) {
      return NextResponse.json(
        { error: "Você só pode comprar habilidades da sua própria classe." },
        { status: 400 }
      );
    }

    const spentAttributeUpgrades = sumValues(nextLevelUpAttributes);
    const spentSkillUpgrades = sumValues(nextLevelUpSkills);

    if (spentSkillUpgrades > spentAttributeUpgrades) {
      return NextResponse.json(
        {
          error: "Perícias compradas não podem ultrapassar atributos comprados.",
        },
        { status: 400 }
      );
    }

    const progressPoints = Number(character.progressPoints || 0);

    const totalSpent = calculateProgressSpent({
      spentAttributeUpgrades,
      spentSkillUpgrades,
      boughtAbilities: nextBoughtAbilities,
      customAbilities: nextCustomAbilities,
      specialTrait: character.specialTrait ?? null,
    });

    if (totalSpent > progressPoints) {
      return NextResponse.json(
        { error: "Os gastos ultrapassam os pontos disponíveis." },
        { status: 400 }
      );
    }

    const updateResult = await pool.query(
      `
      UPDATE "Character"
      SET
        "levelUpAttributes" = $1,
        "levelUpSkills" = $2,
        "spentAttributeUpgrades" = $3,
        "spentSkillUpgrades" = $4,
        "boughtAbilities" = $5,
        "customAbilities" = $6,
        "updatedAt" = NOW()
      WHERE id = $7
      RETURNING *
      `,
      [
        nextLevelUpAttributes,
        nextLevelUpSkills,
        spentAttributeUpgrades,
        spentSkillUpgrades,
        JSON.stringify(nextBoughtAbilities),
        JSON.stringify(nextCustomAbilities),
        id,
      ]
    );

    const updatedCharacter = updateResult.rows[0];
    const sheet = calculateCharacterSheet(updatedCharacter);

    return NextResponse.json(sheet, { status: 200 });
  } catch (err) {
    console.error("PLAYER PROGRESS PATCH ERROR:", err);

    return NextResponse.json(
      {
        error: "Erro ao atualizar progressão",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}