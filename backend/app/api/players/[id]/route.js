// backend/app/api/players/[id]/route.js
import { NextResponse } from "next/server";
import { pool } from "../../../../../lib/db";
import { verifySessionCookie } from "../../../../lib/auth";

export const runtime = "nodejs";

/* -------------------------------------------------
   GET /api/players/:id
   Público – devolve detalhes de um player
   ------------------------------------------------- */
export async function GET(_req, { params }) {
  try {
    const id = params.id;
    const r = await pool.query(
      `
      SELECT
        p.id,
        p.nome,
        p.numero,
        p.altura_cm,
        p.peso_kg,
        c.nome AS classe,
        p.class_id
      FROM players p
      LEFT JOIN classes c ON p.class_id = c.id
      WHERE p.id = $1
      `,
      [id]
    );

    if (r.rowCount === 0) {
      return NextResponse.json(
        { error: "Player não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(r.rows[0]);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/* -------------------------------------------------
   PUT /api/players/:id
   Protegido – só quem está autenticado pode atualizar
   ------------------------------------------------- */
export async function PUT(req, { params }) {
  // 1️⃣ Autorização
  const userId = await verifySessionCookie(req);
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // 2️⃣ Atualiza
  try {
    const id = params.id;
    const body = await req.json();
    const { nome, numero, altura_cm, peso_kg, class_id } = body;

    const r = await pool.query(
      `
      UPDATE players
      SET nome = $2,
          numero = $3,
          altura_cm = $4,
          peso_kg = $5,
          class_id = $6
      WHERE id = $1
      RETURNING id, nome, numero, altura_cm, peso_kg, class_id
      `,
      [
        id,
        nome,
        numero ?? null,
        altura_cm ?? null,
        peso_kg ?? null,
        class_id ?? null,
      ]
    );

    if (r.rowCount === 0) {
      return NextResponse.json(
        { error: "Player não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(r.rows[0]);
  } catch (err) {
    return NextResponse.json(
      { error: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------
   DELETE /api/players/:id
   Protegido – só quem está autenticado pode remover
   ------------------------------------------------- */
export async function DELETE(req, { params }) {
  // 1️⃣ Autorização
  const userId = await verifySessionCookie(req);
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // 2️⃣ Deleta
  try {
    const id = params.id;
    const r = await pool.query(
      "DELETE FROM players WHERE id = $1 RETURNING id",
      [id]
    );

    if (r.rowCount === 0) {
      return NextResponse.json(
        { error: "Player não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, id: r.rows[0].id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
