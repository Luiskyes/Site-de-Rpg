import { NextResponse } from "next/server";
import { pool } from "../../../../../lib/db";
import { verifySessionCookie } from "../../../../../lib/auth";
import { calculateCharacterSheet } from "../../../../../lib/character-calculations";

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

    const body = await req.json();
    const staminaCurrent = Number(body?.staminaCurrent);

    if (!Number.isFinite(staminaCurrent)) {
      return NextResponse.json({ error: "Fôlego inválido" }, { status: 400 });
    }

    const existing = await pool.query(
      `
        SELECT *
        FROM "Character"
        WHERE id = $1
        LIMIT 1
      `,
      [id]
    );

    if (existing.rowCount === 0) {
      return NextResponse.json(
        { error: "Personagem não encontrado" },
        { status: 404 }
      );
    }

    const character = existing.rows[0];

    if (Number(character.ownerId) !== Number(userId)) {
      return NextResponse.json(
        { error: "Sem permissão para alterar este personagem" },
        { status: 403 }
      );
    }

    const staminaBase = Number(character.staminaBase ?? 0);
    const clamped = Math.max(0, Math.min(Math.floor(staminaCurrent), staminaBase));

    const result = await pool.query(
      `
        UPDATE "Character"
        SET "staminaCurrent" = $1,
            "updatedAt" = NOW()
        WHERE id = $2
        RETURNING *
      `,
      [clamped, id]
    );

    const updatedCharacter = result.rows[0];
    const sheet = calculateCharacterSheet(updatedCharacter);

    return NextResponse.json(sheet, { status: 200 });
  } catch (err) {
    console.error("PATCH STAMINA ERROR:", err);

    return NextResponse.json(
      {
        error: "Erro ao atualizar fôlego",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}