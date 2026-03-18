// backend/app/api/login/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { pool } from "../../../../lib/db";
import { createSessionToken } from "../../../lib/auth";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    const { rows } = await pool.query(
      "SELECT id, email, password FROM users WHERE email = $1",
      [email]
    );
    const user = rows[0];

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 400 }
      );
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return NextResponse.json(
        { error: "Senha incorreta" },
        { status: 400 }
      );
    }

    // gera token JWT e coloca no cookie “session”
    const token = await createSessionToken(user.id);
    const response = NextResponse.json({ message: "Login realizado" });
    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 dias (segundos)
      path: "/",
    });
    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Erro interno no login", detail: err?.message ?? err },
      { status: 500 }
    );
  }
}
