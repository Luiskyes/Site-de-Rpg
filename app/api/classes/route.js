// backend/app/api/classes/route.js
import { NextResponse } from "next/server";
import { pool } from "../../../../lib/db";

export const runtime = "nodejs";

/* -------------------------------------------------
   GET /api/classes
   Público – lista todas as classes
   ------------------------------------------------- */
export async function GET() {
  try {
    const r = await pool.query("SELECT id, nome FROM classes ORDER BY nome");
    return NextResponse.json(r.rows);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/* -------------------------------------------------
   POST /api/classes
   Cria nova classe (sem proteção; adicione verifySessionCookie se precisar)
   ------------------------------------------------- */
export async function POST(req) {
  try {
    const body = await req.json();
    const nome = String(body?.nome ?? "").trim();

    if (!nome) {
      return NextResponse.json(
        { error: "nome obrigatório" },
        { status: 400 }
      );
    }

    // tenta inserir; em caso de conflito devolve o registro já existente
    const r = await pool.query(
      `INSERT INTO classes (nome) VALUES ($1)
       ON CONFLICT (nome) DO NOTHING
       RETURNING id, nome`,
      [nome]
    );

    if (r.rowCount === 0) {
      const existing = await pool.query(
        "SELECT id, nome FROM classes WHERE nome = $1",
        [nome]
      );
      return NextResponse.json(existing.rows[0], { status: 200 });
    }

    return NextResponse.json(r.rows[0], { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
