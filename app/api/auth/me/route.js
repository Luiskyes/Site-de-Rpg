// app/api/auth/me/route.js

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
      'SELECT id, email, "createdAt" FROM users WHERE id = $1',
      [userId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (err) {
    console.error("AUTH /ME ERROR:", err);

    return NextResponse.json(
      {
        error: "Erro ao verificar sessão",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}