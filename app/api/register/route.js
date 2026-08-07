import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { pool } from "../../../lib/db";
import { createSessionToken, setSessionCookie } from "../../../lib/auth";
import { validatePassword } from "../../../lib/password-policy";

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

    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const existingUser = await pool.query(
      `SELECT id FROM users WHERE email = $1`,
      [normalizedEmail]
    );

    if (existingUser.rowCount > 0) {
      return NextResponse.json(
        { error: "E-mail já cadastrado" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO users (email, "passwordHash")
      VALUES ($1, $2)
      RETURNING id, email, "createdAt"
      `,
      [normalizedEmail, passwordHash]
    );

    const user = result.rows[0];
    const token = await createSessionToken(user.id);

    const response = NextResponse.json(
      {
        id: user.id,
        email: user.email,
      },
      { status: 201 }
    );

    return setSessionCookie(response, token);
  } catch (err) {
    console.error("REGISTER ERROR:", err);

    return NextResponse.json(
      {
        error: "Erro ao registrar",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
