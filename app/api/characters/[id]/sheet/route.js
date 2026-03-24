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

export async function GET(req, { params }) {
  try {
    const userId = await verifySessionCookie(req);

    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const id = await getIdFromParams(params);

    if (!id) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
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

    const character = result.rows[0];

    if (Number(character.ownerId) !== Number(userId)) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const sheet = calculateCharacterSheet(character);

    return NextResponse.json(sheet, { status: 200 });
  } catch (err) {
    console.error("CHARACTER SHEET ERROR:", err);

    return NextResponse.json(
      {
        error: "Erro ao buscar ficha",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}