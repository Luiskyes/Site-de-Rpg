// app/api/login/route.js (ajuste o caminho para o seu)
import { pool } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { SignJWT } from "jose";

export const runtime = "nodejs"; // 'nodejs' é o padrão, mas deixa explícito. [web:110]

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 400 });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return NextResponse.json({ error: "Senha incorreta" }, { status: 400 });
    }

    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ error: "JWT_SECRET não está definido no .env.local" }, { status: 500 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);

    const token = await new SignJWT({ userId: user.id })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret); // SignJWT gera um JWT em formato Compact JWS. [web:99]

    const res = NextResponse.json({ message: "Login realizado com sucesso" });

    res.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // segundos. [web:17]
      path: "/",
    });

    return res;
  } catch (err) {
    return NextResponse.json(
      { error: "Erro interno no login", detail: String(err?.message || err) },
      { status: 500 }
    );
  }
}