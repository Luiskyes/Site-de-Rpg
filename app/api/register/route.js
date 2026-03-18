// app/api/register/route.js

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

    // Verifica se já existe usuário com esse e-mail
    const existing = await pool.query(
      "SELECT 1 FROM users WHERE email = $1",
      [email]
    );

    if (existing.rowCount > 0) {
      return NextResponse.json(
        { error: "E-mail já cadastrado" },
        { status: 409 }
      );
    }

    // Gera o hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insere o novo usuário no banco
    const result = await pool.query(
      'INSERT INTO users (email, "passwordHash") VALUES ($1, $2) RETURNING id, email',
      [email, hashedPassword]
    );

    const user = result.rows[0];

    // Cria token de sessão
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