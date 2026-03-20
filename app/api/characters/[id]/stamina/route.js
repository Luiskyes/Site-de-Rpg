import { NextResponse } from "next/server";
import { pool } from "../../../../../lib/db";
import { verifySessionCookie } from "../../../../../lib/auth";

export const runtime = "nodejs";

export async function PATCH(req, context) {
  try {
    const userId = await verifySessionCookie(req);

    if (!userId) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const { id: rawId } = await context.params;
    const id = Number(rawId);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        {
          error: "ID inválido",
          received: rawId,
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const staminaCurrent = Number(body?.staminaCurrent);

    if (!Number.isFinite(staminaCurrent)) {
      return NextResponse.json(
        { error: "Fôlego inválido" },
        { status: 400 }
      );
    }

    const existing = await pool.query(
      `
      SELECT id, "ownerId", "staminaBase"
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
      RETURNING id, "staminaCurrent", "staminaBase"
      `,
      [clamped, id]
    );

    return NextResponse.json(result.rows[0], { status: 200 });
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