import { NextResponse } from "next/server";
import { pool } from "../../../../lib/db";
import { requireMaster } from "../../../../lib/master-auth";

export const runtime = "nodejs";

export async function GET(req) {
  try {
    const auth = await requireMaster(req);

    if (auth?.error) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const result = await pool.query(`
      SELECT
        c.id,
        c.name,
        c.class,
        c.level,
        c."staminaBase",
        c."staminaCurrent",
        c."ownerId",
        u.email AS "ownerEmail"
      FROM "Character" c
      INNER JOIN users u ON u.id = c."ownerId"
      ORDER BY c.id DESC
    `);

    return NextResponse.json(result.rows || [], { status: 200 });
  } catch (err) {
    console.error("MASTER CHARACTERS ERROR:", err);

    return NextResponse.json(
      {
        error: "Erro ao buscar fichas do mestre",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}