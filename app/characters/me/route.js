import { NextResponse } from "next/server";
import { pool } from "../../../../lib/db";
import { verifySessionCookie } from "../../../../lib/auth";

export const runtime = "nodejs";

export async function GET(req) {
  try {
    const userId = await verifySessionCookie(req);

    if (!userId) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const result = await pool.query(
      `
      SELECT id, name, class, level
      FROM "Character"
      WHERE "ownerId" = $1
      LIMIT 1
      `,
      [userId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Ficha não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (err) {
    console.error("GET MY CHARACTER ERROR:", err);

    return NextResponse.json(
      {
        error: "Erro ao buscar ficha do usuário",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}