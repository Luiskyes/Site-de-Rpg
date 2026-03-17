import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

async function getUserIdFromCookie() {
  const token = (await cookies()).get("session")?.value;
  if (!token) return null;

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);

  try {
    const { payload } = await jwtVerify(token, secret);
    return payload.userId ?? null;
  } catch {
    return null;
  }
}

// GET /api/players/:id
export async function GET(req, { params }) {
  try {
    const id = params.id;
    const r = await pool.query(
      `SELECT p.id, p.nome, p.numero, p.altura_cm, p.peso_kg, c.nome as classe, p.class_id
       FROM players p
       LEFT JOIN classes c ON p.class_id = c.id
       WHERE p.id = $1`,
      [id]
    );

    if (r.rowCount === 0) {
      return NextResponse.json({ error: "Player não encontrado" }, { status: 404 });
    }

    return NextResponse.json(r.rows[0]);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// PUT /api/players/:id - editar
export async function PUT(req, { params }) {
  const userId = await getUserIdFromCookie();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = params.id;
    const body = await req.json();
    const { nome, numero, altura_cm, peso_kg, class_id } = body;

    const r = await pool.query(
      `UPDATE players SET nome = $2, numero = $3, altura_cm = $4, peso_kg = $5, class_id = $6
       WHERE id = $1
       RETURNING id, nome, numero, altura_cm, peso_kg, class_id`,
      [id, nome, numero || null, altura_cm || null, peso_kg || null, class_id || null]
    );

    if (r.rowCount === 0) {
      return NextResponse.json({ error: "Player não encontrado" }, { status: 404 });
    }

    return NextResponse.json(r.rows[0]);
  } catch (err) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

// DELETE /api/players/:id
export async function DELETE(req, { params }) {
  const userId = await getUserIdFromCookie();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = params.id;
    const r = await pool.query("DELETE FROM players WHERE id = $1 RETURNING id", [id]);

    if (r.rowCount === 0) {
      return NextResponse.json({ error: "Player não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, id: r.rows[0].id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
