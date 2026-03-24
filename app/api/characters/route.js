import { NextResponse } from "next/server";
import { pool } from "../../../lib/db";
import { verifySessionCookie } from "../../../lib/auth";

export const runtime = "nodejs";

function toObject(value, fallback = {}) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : fallback;
}

function toNullableNumber(value) {
  if (value === "" || value === null || value === undefined) return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function sumValues(obj) {
  return Object.values(obj || {}).reduce(
    (acc, value) => acc + Number(value || 0),
    0
  );
}

const EMPTY_ATTRIBUTES = {
  potencia: 0,
  tecnica: 0,
  agilidade: 0,
  velocidade: 0,
  ego: 0,
};

const EMPTY_SKILLS = {
  corpoACorpo: 0,
  cabecio: 0,
  chute: 0,
  pontaria: 0,
  dominio: 0,
  passe: 0,
  drible: 0,
  rouboDeBola: 0,
  acrobacias: 0,
  defesa: 0,
  reflexos: 0,
  furtividade: 0,
  corridaLongaDistancia: 0,
  explosao: 0,
  ritmoDeJogo: 0,
  intuicao: 0,
  intimidacao: 0,
  presenca: 0,
  lideranca: 0,
  enganacao: 0,
};

function normalizeNumberObject(input, template) {
  const result = { ...template };

  for (const key of Object.keys(template)) {
    const value = Number(input?.[key] || 0);
    result[key] = Number.isFinite(value) ? value : 0;
  }

  return result;
}

export async function POST(req) {
  try {
    const userId = await verifySessionCookie(req);

    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await req.json();

    const name = String(body?.name || "").trim();
    const className = String(body?.class || "").trim();
    const selectedAbility = String(body?.selectedAbility || "").trim();

    const classId = Number(body?.classId);

    if (!name) {
      return NextResponse.json(
        { error: "Nome é obrigatório." },
        { status: 400 }
      );
    }

    if (!className) {
      return NextResponse.json(
        { error: "Classe é obrigatória." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(classId) || classId <= 0) {
      return NextResponse.json(
        { error: "Classe inválida." },
        { status: 400 }
      );
    }

    if (!selectedAbility) {
      return NextResponse.json(
        { error: "Selecione uma habilidade inicial." },
        { status: 400 }
      );
    }

    const classAttributes = normalizeNumberObject(
      toObject(body?.classAttributes, {}),
      EMPTY_ATTRIBUTES
    );

    const classSkills = normalizeNumberObject(
      toObject(body?.classSkills, {}),
      EMPTY_SKILLS
    );

    const allocatedAttributes = normalizeNumberObject(
      toObject(body?.allocatedAttributes, {}),
      EMPTY_ATTRIBUTES
    );

    const allocatedSkills = normalizeNumberObject(
      toObject(body?.allocatedSkills, {}),
      EMPTY_SKILLS
    );

    const age = toNullableNumber(body?.age);
    const heightCm = toNullableNumber(body?.heightCm);
    const weightKg = toNullableNumber(body?.weightKg);

    const staminaBase = toNullableNumber(body?.staminaBase) ?? 100;
    const staminaCurrent =
      toNullableNumber(body?.staminaCurrent) ?? staminaBase;

    const notes =
      body?.notes && String(body.notes).trim()
        ? String(body.notes).trim()
        : null;

    const specialTrait =
      body?.specialTrait === "genio" || body?.specialTrait === "prodigio"
        ? body.specialTrait
        : null;

    const isAmbidextrous = Boolean(body?.isAmbidextrous);

    if (staminaBase <= 0) {
      return NextResponse.json(
        { error: "Fôlego base inválido." },
        { status: 400 }
      );
    }

    if (staminaCurrent < 0) {
      return NextResponse.json(
        { error: "Fôlego atual inválido." },
        { status: 400 }
      );
    }

    const classResult = await pool.query(
      `
        SELECT id, name, abilities
        FROM "Class"
        WHERE id = $1
        LIMIT 1
      `,
      [classId]
    );

    if (classResult.rowCount === 0) {
      return NextResponse.json(
        { error: "Classe não encontrada." },
        { status: 404 }
      );
    }

    const classRow = classResult.rows[0];

    if (String(classRow.name || "").trim() !== className) {
      return NextResponse.json(
        { error: "Classe informada não corresponde ao banco." },
        { status: 400 }
      );
    }

    const classAbilities = Array.isArray(classRow.abilities)
      ? classRow.abilities
          .map((item) =>
            typeof item === "string"
              ? item.trim()
              : String(item?.name || "").trim()
          )
          .filter(Boolean)
      : [];

    if (!classAbilities.includes(selectedAbility)) {
      return NextResponse.json(
        { error: "A habilidade inicial não pertence à classe selecionada." },
        { status: 400 }
      );
    }

    const allocatedAttributePoints = sumValues(allocatedAttributes);
    const allocatedSkillPoints = sumValues(allocatedSkills);

    const baseAttributePoints = 7;
    const baseSkillPoints = 15;

    const extraAttributePoints = specialTrait === "prodigio" ? 6 : 0;
    const extraSkillPoints = specialTrait === "genio" ? 6 : 0;

    const expectedAttributePoints = baseAttributePoints + extraAttributePoints;
    const expectedSkillPoints = baseSkillPoints + extraSkillPoints;

    if (allocatedAttributePoints !== expectedAttributePoints) {
      return NextResponse.json(
        {
          error: `Você precisa gastar exatamente ${expectedAttributePoints} pontos em atributos.`,
        },
        { status: 400 }
      );
    }

    if (allocatedSkillPoints !== expectedSkillPoints) {
      return NextResponse.json(
        {
          error: `Você precisa gastar exatamente ${expectedSkillPoints} pontos em perícias.`,
        },
        { status: 400 }
      );
    }

    const existingCharacter = await pool.query(
      `
        SELECT id
        FROM "Character"
        WHERE "ownerId" = $1
        LIMIT 1
      `,
      [userId]
    );

    if (existingCharacter.rowCount > 0) {
      return NextResponse.json(
        { error: "Você já possui uma ficha criada." },
        { status: 400 }
      );
    }

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
          $14, $15, $16, $17,
          0, 0, 0,
          $18::jsonb, $19::jsonb, $20::jsonb, $21::jsonb,
          NOW(), NOW()
        )
        RETURNING id
      `,
      [
        name,
        className,
        classId,
        selectedAbility,
        age,
        heightCm,
        weightKg,
        staminaBase,
        staminaCurrent,
        JSON.stringify(classAttributes),
        JSON.stringify(classSkills),
        JSON.stringify(allocatedAttributes),
        JSON.stringify(allocatedSkills),
        notes,
        specialTrait,
        isAmbidextrous,
        userId,
        JSON.stringify([]),
        JSON.stringify([]),
        JSON.stringify(EMPTY_ATTRIBUTES),
        JSON.stringify(EMPTY_SKILLS),
      ]
    );

    return NextResponse.json(
      { id: result.rows[0].id },
      { status: 201 }
    );
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