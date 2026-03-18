// backend/app/api/auth/me/route.js
import { NextResponse } from "next/server";
import { verifySessionCookie } from "../../../../lib/auth";
import { pool } from "../../lib/db";

export const runtime = "nodejs";

export async function GET(req) {
  const userId = await verifySessionCookie(req);
  if (!userId) {
    return NextResponse.json(
      { error: "Não autenticado" },
      { status: 401 }
    );
  }

  const { rows } = await pool.query(
    "SELECT id, email FROM users WHERE id = $1",
    [userId]
  );
  const user = rows[0];

  if (!user) {
    return NextResponse.json(
      { error: "Usuário não encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json(user);
}
