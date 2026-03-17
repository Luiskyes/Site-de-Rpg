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

// GET /api/players - listar todos (com classe)
export async function GET() {
  try {
    const r = await pool.query(`
      SELECT p.id, p.nome, p.numero, p.altura_cm, p.peso_kg, c.nome as classe
      FROM players p
      LEFT JOIN classes c ON p.class_id = c.id
      ORDER BY p.id
    `);
    return NextResponse.json(r.rows);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// POST /api/players - criar novo
export async function POST(req) {
  const userId = await getUserIdFromCookie();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { nome, numero, altura_cm, peso_kg, class_id } = body;

    if (!nome) {
      return NextResponse.json({ error: "nome obrigatório" }, { status: 400 });
    }

    const r = await pool.query(
      `INSERT INTO players (nome, numero, altura_cm, peso_kg, class_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nome, numero, altura_cm, peso_kg, class_id`,
      [nome, numero || null, altura_cm || null, peso_kg || null, class_id || null]
    );

    return NextResponse.json(r.rows[0], { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
