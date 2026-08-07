import { NextResponse } from "next/server";
import { pool } from "../../../../../../lib/db";
import { requireMaster } from "../../../../../../lib/master-auth";
import { calculateCharacterSheet } from "../../../../../../lib/character-calculations";

export const runtime = "nodejs";

async function getIdFromParams(paramsPromise) {
  const resolved = await paramsPromise;
  const rawId = Array.isArray(resolved?.id) ? resolved.id[0] : resolved?.id;
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(req, { params }) {
  try {
    const auth = await requireMaster(req);

    if (auth?.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const id = await getIdFromParams(params);
    if (!id) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await req.json();
    const requestedStamina = Number(body?.staminaCurrent);

    if (!Number.isFinite(requestedStamina)) {
      return NextResponse.json({ error: "Fôlego inválido" }, { status: 400 });
    }

    const existing = await pool.query(
      `SELECT * FROM "Character" WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (existing.rowCount === 0) {
      return NextResponse.json({ error: "Ficha não encontrada" }, { status: 404 });
    }

    const staminaBase = Math.max(0, Number(existing.rows[0].staminaBase ?? 0));
    const staminaCurrent = Math.max(
      0,
      Math.min(Math.floor(requestedStamina), staminaBase)
    );

    const result = await pool.query(
      `
        UPDATE "Character"
        SET "staminaCurrent" = $1, "updatedAt" = NOW()
        WHERE id = $2
        RETURNING *
      `,
      [staminaCurrent, id]
    );

    return NextResponse.json(calculateCharacterSheet(result.rows[0]));
  } catch (err) {
    console.error("MASTER STAMINA ERROR:", err);
    return NextResponse.json(
      { error: "Erro ao atualizar fôlego", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
