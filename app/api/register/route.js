import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { pool } from "../../../lib/db";
import { createSessionToken } from "../../../lib/auth";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-mail e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const existingUser = await pool.query(
      `SELECT id FROM users WHERE email = $1`,
      [email]
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
      [email, passwordHash]
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

    response.cookies.set("session", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
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