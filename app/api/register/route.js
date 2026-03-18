// backend/app/api/register/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { pool } from "../lib/db";
import { createSessionToken } from "../../../lib/auth";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "E‑mail e senha são obrigatórios" },
        { status: 400 }
      );
    }

    // verifica e‑mail duplicado
    const { rowCount } = await pool.query(
      "SELECT 1 FROM users WHERE email = $1",
      [email]
    );
    if (rowCount > 0) {
      return NextResponse.json(
        { error: "E‑mail já cadastrado" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email",
      [email, hashedPassword]
    );
    const user = rows[0];

    // gera token JWT e envia cookie
    const token = await createSessionToken(user.id);
    const response = NextResponse.json(user, { status: 201 });
    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Erro ao registrar", detail: err?.message ?? err },
      { status: 500 }
    );
  }
}
