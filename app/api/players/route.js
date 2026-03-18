// backend/app/api/players/route.js
import { NextResponse } from "next/server";
import { pool } from "../lib/db";
import { verifySessionCookie } from "../../../lib/auth";

export const runtime = "nodejs";

/* -------------------------------------------------
   GET  /api/players
   Público – devolve a lista completa (classe incluída)
   ------------------------------------------------- */
export async function GET() {
  try {
    const r = await pool.query(`
      SELECT
        p.id,
        p.nome,
        p.numero,
        p.altura_cm,
        p.peso_kg,
        c.nome AS classe
      FROM players p
      LEFT JOIN classes c ON p.class_id = c.id
      ORDER BY p.id
    `);
    return NextResponse.json(r.rows);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/* -------------------------------------------------
   POST /api/players
   Protegido – exige cookie “session” válido
   ------------------------------------------------- */
export async function POST(req) {
  // 1️⃣ Autorização
  const userId = await verifySessionCookie(req);
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // 2️⃣ Validação e inserção
  try {
    const body = await req.json();
    const { nome, numero, altura_cm, peso_kg, class_id } = body;

    if (!nome) {
      return NextResponse.json(
        { error: "nome obrigatório" },
        { status: 400 }
      );
    }

    const r = await pool.query(
      `
      INSERT INTO players (nome, numero, altura_cm, peso_kg, class_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, nome, numero, altura_cm, peso_kg, class_id
      `,
      [
        nome,
        numero ?? null,
        altura_cm ?? null,
        peso_kg ?? null,
        class_id ?? null,
      ]
    );

    return NextResponse.json(r.rows[0], { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
