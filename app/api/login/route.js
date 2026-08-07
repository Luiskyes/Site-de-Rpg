import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { pool } from "../../../lib/db";
import { createSessionToken, setSessionCookie } from "../../../lib/auth";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return NextResponse.json(
        { error: "E-mail e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
      SELECT id, email, "passwordHash"
      FROM users
      WHERE email = $1
      LIMIT 1
      `,
      [normalizedEmail]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "E-mail ou senha inválidos" },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    const passwordOk = user.passwordHash
      ? await bcrypt.compare(password, user.passwordHash)
      : false;

    if (!passwordOk) {
      return NextResponse.json(
        { error: "E-mail ou senha inválidos" },
        { status: 401 }
      );
    }

    const token = await createSessionToken(user.id);

    const response = NextResponse.json(
      {
        id: user.id,
        email: user.email,
      },
      { status: 200 }
    );

    return setSessionCookie(response, token);
  } catch (err) {
    console.error("LOGIN ERROR:", err);

    return NextResponse.json(
      {
        error: "Erro ao fazer login",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
