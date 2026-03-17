import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const r = await pool.query("SELECT id, nome FROM classes ORDER BY nome");
  return NextResponse.json(r.rows);
}

export async function POST(req) {
  const body = await req.json();
  const nome = String(body?.nome ?? "").trim();
  if (!nome) return NextResponse.json({ error: "nome obrigatório" }, { status: 400 });

  const r = await pool.query(
    "INSERT INTO classes (nome) VALUES ($1) ON CONFLICT (nome) DO NOTHING RETURNING id, nome",
    [nome]
  );

  // Se já existia, devolve o registro existente
  if (r.rowCount === 0) {
    const existing = await pool.query("SELECT id, nome FROM classes WHERE nome = $1", [nome]);
    return NextResponse.json(existing.rows[0], { status: 200 });
  }

  return NextResponse.json(r.rows[0], { status: 201 });
}
